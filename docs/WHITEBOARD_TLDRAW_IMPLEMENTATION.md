### Whiteboard (tldraw) - End‑to‑End Implementation Guide

Purpose: This document is the single source of truth to implement a collaborative whiteboard using tldraw, synchronized over our existing Socket.IO hub, persisted in Mongo (optional phase), and visible to observers via HLS by publishing a canvas mirror as a LiveKit screen-share track.

Outcome requirements

- Moderator/Admin can open/close the whiteboard for a session.
- Participants and moderators draw together live; observers are view‑only.
- Observers see the board in the livestream (HLS room composite).
- All payloads validated with zod on the backend; no `any` types.
- Fit our monorepo conventions and path aliases.

## 0) High‑level architecture

- Real‑time sync: Socket.IO room `wb::<sessionId>` (piggyback on existing socket connection and rooms).
- Contracts: Types live in `shared` and are imported by frontend and backend.
- Persistence (Phase 2): Mongo collection storing patches (append‑only with `seq`). Optional snapshotting later.
- Observer view in HLS: A hidden canvas mirrors the tldraw scene; mods/admins publish its stream as a LiveKit `SCREEN_SHARE` track named "Whiteboard" whenever the board is open.
- Role gating: Observer cannot draw; Participant/Moderator/Admin can draw. Open/close controlled by Moderator/Admin only.

## 1) Dependencies

Frontend

- Add tldraw: `@tldraw/tldraw`
- Ensure styles are available: `@tldraw/tldraw/tldraw.css`

Backend

- No extra runtime deps beyond existing stack. We will add a small route module.

Shared

- No new runtime deps. We add TypeScript types for whiteboard contracts.

## 2) Shared contracts (types only)

Create `shared/src/whiteboard/types.ts` and export the following minimal contracts:

```ts
// shared/src/whiteboard/types.ts
export type WbRole = "Participant" | "Observer" | "Moderator" | "Admin";

// Server pushes room state
export interface WbState {
  open: boolean;
  sessionKey: string; // logical key for the current whiteboard session (changes after hard clear or reopen)
  rolesAllowed: ReadonlyArray<Exclude<WbRole, "Observer">>; // draw‑allowed roles
}

// We keep patch schema opaque to remain decoupled from tldraw internals.
// It must be JSON‑serializable and versioned.
export interface WbPatchEnvelope {
  v: 1; // version
  sessionKey: string; // client must ignore if sessionKey mismatches current
  seq?: number; // server may stamp an increasing sequence when persisting (phase 2)
  patch: unknown; // tldraw store patch (opaque JSON)
}

export interface WbOpenCloseRequest {
  sessionId: string; // Session _id string (room name uses this)
  role: WbRole;
}

export interface WbHistoryResponse {
  ok: true;
  sessionKey: string;
  patches: ReadonlyArray<WbPatchEnvelope>;
}
```

Update `shared/tsconfig.json` references if needed and rebuild shared before backend/frontend (`cd shared && npx tsc -b`).

## 3) Backend – Socket.IO whiteboard channel

File: `backend/socket/index.ts`

1. Join a whiteboard room on connect:

   - Compute `const wbRoom = `wb::${sessionId}`;`
   - `socket.join(wbRoom)`.

2. Keep an in‑memory state per session (module‑level Map):

```ts
// module globals (top of file)
type WbMemState = {
  open: boolean;
  sessionKey: string; // non‑empty when at least one open occurred; change if needed on hard reset
  seq: number; // last assigned sequence
  rolesAllowed: Set<"Participant" | "Moderator" | "Admin">;
};
const wbStateBySession = new Map<string, WbMemState>();

function getOrInitWb(sessionId: string): WbMemState {
  let s = wbStateBySession.get(sessionId);
  if (!s) {
    s = {
      open: false,
      sessionKey: "",
      seq: 0,
      rolesAllowed: new Set(["Participant", "Moderator", "Admin"]),
    };
    wbStateBySession.set(sessionId, s);
  }
  return s;
}
```

3. On client connect, emit current state:

```ts
const wb = getOrInitWb(sessionId);
socket.emit("wb:state", {
  open: wb.open,
  sessionKey: wb.sessionKey,
  rolesAllowed: Array.from(wb.rolesAllowed),
} satisfies import("@shared/whiteboard/types").WbState);
```

4. Handle incoming patches (draw events):

```ts
socket.on(
  "wb:patch",
  (env: import("@shared/whiteboard/types").WbPatchEnvelope) => {
    const wb = getOrInitWb(sessionId);
    // Only allow if board open and role permitted to draw
    if (!wb.open) return;
    if (!["Participant", "Moderator", "Admin"].includes(role)) return;
    if (!wb.rolesAllowed.has(role as any)) return;
    // Enforce sessionKey match; ignore mismatched
    if (!env || env.sessionKey !== wb.sessionKey) return;
    // Assign sequence if persisting (phase 2). For now sequence can be transient.
    // Broadcast to room (including sender for idempotent UI)
    io.to(wbRoom).emit("wb:patch", env);
  }
);
```

5. Clear board (admin/moderator only):

```ts
socket.on("wb:clear", () => {
  if (!["Moderator", "Admin"].includes(role)) return;
  const wb = getOrInitWb(sessionId);
  if (!wb.open) return;
  io.to(wbRoom).emit("wb:clear");
});
```

## 4) Backend – REST endpoints (open/close/history)

Create `backend/routes/whiteboard/WhiteboardRoutes.ts` and mount it under `/api/v1/wb` in your main routes tree.

Contracts

- POST `/open` with `WbOpenCloseRequest` → flips state `open=true` and assigns a `sessionKey` if empty.
- POST `/close` with `WbOpenCloseRequest` → flips state `open=false`.
- GET `/history?sessionId=...` → return `{ ok, sessionKey, patches }`. For Phase 1, return empty list. Phase 2 will load from Mongo.

Validation

- Use `zod.safeParse` for body/query and return `{ message }` via centralized error middleware.

Open handler sketch

```ts
const OpenSchema = z.object({
  sessionId: z.string().min(1),
  role: z.enum(["Participant", "Observer", "Moderator", "Admin"]),
});

router.post("/open", async (req, res, next) => {
  const p = OpenSchema.safeParse(req.body);
  if (!p.success) return next(badRequest(p.error));
  const { sessionId, role } = p.data;
  if (!(role === "Moderator" || role === "Admin")) return next(forbidden());
  const wb = getOrInitWb(sessionId);
  if (!wb.sessionKey) wb.sessionKey = `${sessionId}_${Date.now()}`;
  wb.open = true;
  io.to(`wb::${sessionId}`).emit("wb:state", {
    open: true,
    sessionKey: wb.sessionKey,
    rolesAllowed: Array.from(wb.rolesAllowed),
  } satisfies WbState);
  res.json({ ok: true, sessionKey: wb.sessionKey });
});
```

Close handler is symmetric (set `open=false`, broadcast `wb:state`).

History (Phase 1)

- Return `{ ok: true, sessionKey: wb.sessionKey || "", patches: [] }`.

Mount routes

- Import and `app.use("/api/v1/wb", WhiteboardRoutes);`

## 5) Frontend – Whiteboard overlay with tldraw

Create `frontend/components/meeting/WhiteboardOverlay.tsx` (client component).

Responsibilities

- Render `<Tldraw />` full‑screen overlay within the meeting view when `wb.open === true`.
- Create a `TLStore` and wire two bridges:
  1. Local → Socket: on store changes, compute a tldraw patch envelope and emit `wb:patch` over Socket.IO.
  2. Socket → Local: on incoming `wb:patch`, apply it to the store.
- On mount or `wb.sessionKey` change: fetch `/api/v1/wb/history?sessionId=...` and apply patches (Phase 2).
- Respect role: in read‑only for Observer (don’t emit), otherwise editable.

Implementation notes

- Import CSS once in this component: `import "@tldraw/tldraw/tldraw.css";`
- Get session context (sessionId, role, name/email) from existing meeting page props/hooks.
- Use existing meeting Socket.IO instance in `window.__meetingSocket` or create a scoped one if not available.
- Keep the patch envelope schema opaque; tldraw provides helpers to compute patches via the `TLStore` change events.

## 6) Frontend – LiveKit canvas publisher (HLS visibility)

Create `frontend/components/meeting/WhiteboardMirrorPublisher.tsx` (client component).

Responsibilities

- Accept a ref to a `<canvas>` that mirrors the tldraw scene (or render and paint the scene into an offscreen canvas).
- When the board is open and the user is a Moderator/Admin, call `canvas.captureStream(30)` and publish its video track:
  - Get room from `useRoomContext()`.
  - `await room.localParticipant.publishTrack(track, { name: "Whiteboard", source: Track.Source.ScreenShare })`.
- On close/unmount, `unpublishTrack` and `track.stop()`.
- Add a 1px heartbeat pixel per second to avoid the stream becoming static.

Notes

- This track appears in the room composite used by HLS, so observers will see the board in the stream automatically.
- Ensure your LiveKit grants for Moderator/Admin include `SCREEN_SHARE` sources (they do in our backend service).

## 7) Frontend – Wire into meeting page

File: `frontend/app/meeting/[id]/page.tsx`

1. Replace the current placeholder Whiteboard button to:

   - If `role` is Moderator/Admin: call `POST /api/v1/wb/open` when closed and `POST /api/v1/wb/close` when open.
   - Others: no‑op (they follow `wb:state`).

2. Track `wb:state` via Socket.IO:

   - On socket connect, listen to `"wb:state"` and store `{ open, sessionKey }` in local component state.
   - Show `WhiteboardOverlay` when `open === true`.
   - Render `WhiteboardMirrorPublisher` only when `open === true` and user is Moderator/Admin.

3. Pass the meeting socket and `sessionId` into `WhiteboardOverlay` props.

## 8) Phase 2 – Persistence (replay and undo/redo)

Mongo model

- Create `backend/model/WhiteboardPatch.ts` with fields:
  - `sessionId: ObjectId` (index)
  - `sessionKey: string` (index)
  - `seq: number` (index, increasing)
  - `patch: unknown`
  - `author: { email: string; name: string; role: WbRole }`
  - `ts: Date`

Socket changes

- On `wb:patch`, increment `wb.seq`, persist `{ seq }`, then broadcast the same envelope (with `seq`).

History endpoint

- Query by `sessionId + sessionKey`, sort by `seq` ascending, return as `WbHistoryResponse`.

Undo/redo (optional)

- Store an additional boolean `revoked` and add socket events `wb:undo` / `wb:redo` similar to the reference design, and on success emit `wb:refresh` so clients rehydrate.

## 9) Validation, security, and conventions

- Validate all request bodies/queries with `zod.safeParse`.
- Use centralized error middleware returning `{ message }` consistently.
- Keep imports via path aliases (`@shared/*`, `@frontend/*`, `@backend/*`).
- Do not use `any`; prefer `unknown` or specific interfaces.
- Respect CORS and `credentials: true` in Socket.IO; keep origin in sync with frontend base URL.
- Do not import Node‑only code into the frontend from `@shared/*`.

## 10) UI conventions

- Use shadcn/ui components for buttons/surfaces and `lucide-react` icons.
- Minimal client components; keep tldraw overlay as a focused client island.

## 11) Step‑by‑step checklist

1. Shared

   - [ ] Create `shared/src/whiteboard/types.ts` with the contracts above.
   - [ ] Rebuild shared: `cd shared && npx tsc -b`.

2. Backend – sockets

   - [ ] In `backend/socket/index.ts`, join `wb::<sessionId>` on connect.
   - [ ] Add `wbStateBySession` Map and `getOrInitWb` helper.
   - [ ] Emit `wb:state` on connect and whenever state changes.
   - [ ] Handle `wb:patch` (role gate, open check, sessionKey check, broadcast).
   - [ ] Handle `wb:clear` (Moderator/Admin only → broadcast).

3. Backend – routes

   - [ ] Create `backend/routes/whiteboard/WhiteboardRoutes.ts` (open/close/history) with zod validation.
   - [ ] Mount it under `/api/v1/wb` in your main router.

4. Frontend – deps & overlay

   - [ ] Install `@tldraw/tldraw` in `frontend`.
   - [ ] Create `frontend/components/meeting/WhiteboardOverlay.tsx`:
     - Render `<Tldraw />` overlay; import `@tldraw/tldraw/tldraw.css`.
     - Bridge TLStore changes to socket `wb:patch`.
     - Apply incoming `wb:patch` to store.
     - Read‑only for Observer.
   - [ ] Create `frontend/components/meeting/WhiteboardMirrorPublisher.tsx`:
     - Capture canvas stream and publish/unpublish as LiveKit `SCREEN_SHARE` track.

5. Frontend – meeting page wiring

   - [ ] Replace the Whiteboard button to call `/api/v1/wb/open|close` (role‑gated).
   - [ ] Listen to `wb:state` on the meeting socket.
   - [ ] Conditionally render overlay and mirror publisher.

6. QA
   - [ ] Two browsers as Participant & Moderator → draw latency < 200ms.
   - [ ] Observer cannot draw; sees updates live via HLS when stream running.
   - [ ] Open/close toggles reliably and cleans up published track.
   - [ ] Socket reconnect restores state and pull history (Phase 2).

## 12) Rollout strategy

- Phase 1 (socket‑only): Implement steps without DB persistence; ship.
- Phase 2 (history): Add patch persistence and hydration.
- Phase 3 (undo/redo, snapshots): Optional enhancements.

## 13) Notes and pitfalls

- Keep the patch payload opaque (`unknown`) to avoid coupling to tldraw internal schema.
- Always enforce `sessionKey` to avoid cross‑session replay.
- Publish the mirror canvas only for Moderator/Admin; auto‑stop on close or permission change.
- For large rooms, consider throttling patch emissions (e.g., 30–60 Hz cap) on the client.

## 14) Follow‑ups (ask before implementing)

- Persist patches and implement history hydration.
- Add undo/redo with soft‑delete and `wb:refresh` hydration.
- Add “Download PNG” from the mirror canvas or tldraw export.
