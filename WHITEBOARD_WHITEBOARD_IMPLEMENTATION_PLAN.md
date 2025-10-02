### Whiteboard V2 – Implementation Plan (Backend + Frontend)

This plan integrates a collaborative whiteboard into the existing meeting flow, using the current Socket.IO infrastructure. Admins, Moderators, and Participants can draw; Observers have read-only access. Tools: pencil, eraser, shapes (line, rectangle, circle), text, color/size picker, undo/redo, clear, export PNG/PDF, and snapshots saved as deliverables.

---

### Goals and Scope

- **Collaborators**: Admin, Moderator, Participant can draw and control whiteboard.
- **Observers**: View-only, receive live updates, no emission of drawing events.
- **Tools**: Pencil, eraser, line, rect, circle, text; color, stroke size.
- **Persistence**: Server assigns monotonic `seq` per whiteboard session; strokes persisted in DB.
- **Deliverables**: Save PNG snapshots (and optional PDF export) and list under Session Deliverables as `WHITEBOARD`.
- **Reuse**: Use existing models `backend/model/WhiteboardStroke.ts` and `backend/model/WhiteboardSnapshot.ts`, current socket, meeting rooms, and S3 upload util.

---

### Architecture Overview

- **Session/Rooming**: Use existing `meeting` Socket room per `sessionId`. Whiteboard events are namespaced under `whiteboard:*` and emitted to the same meeting room for participants and to observers as read-only.
- **Auth & Roles**: Rely on role info attached in socket handshake (`role` in `socket.handshake.query`). Enforce on server: only Admin/Moderator/Participant can emit drawing mutations; Observers are blocked at the handler.
- **State Model**:
  - `WhiteboardStroke` (already present) stores all strokes with `(roomName, sessionId, seq)` unique index, author, tool, shape, color, size, points, optional text, timestamp, and `revoked`.
  - `WhiteboardSnapshot` (already present) stores PNG S3 key and metadata.
  - Server is the source of truth for `seq`. Clients send draw intents; server assigns `seq`, persists, then broadcasts.
- **Transport**: Socket.IO for real-time strokes, cursors, and moderation controls. REST endpoint for snapshot upload to S3 (binary/large payloads), returning deliverable info.

---

### Backend Work

#### Socket events (in `backend/socket/index.ts`)

Add/extend handlers under existing `attachSocket` within the per-connection scope, using the existing room join logic and role checks.

1. `whiteboard:join`

   - Params: `{ sessionId: string; wbSessionId?: string }`
   - Behavior: Joins the `meeting` room if not already; returns `{ nextSeq: number, recentStrokes: WhiteboardStroke[] }` (server-selectable window, e.g., last 200 strokes) to seed clients.

2. `whiteboard:stroke:add`

   - Guard: role ∈ { Admin, Moderator, Participant }.
   - Params: `{ sessionId: string; tool: string; shape: "free"|"line"|"rect"|"circle"|"text"; color: string; size: number; points?: {x:number;y:number}[]; text?: string }`
   - Validate with `zod` and coerce to a service input.
   - Behavior: Assign `seq = lastSeq + 1` (use atomic increment per `(roomName, sessionId)`), save to `WhiteboardStroke`, broadcast `whiteboard:stroke:new` with saved stroke including `seq` to `rooms.meeting` (participants + observers).

3. `whiteboard:stroke:revoke`

   - Guard: role ∈ { Admin, Moderator } (optionally allow author to undo own recent strokes).
   - Params: `{ sessionId: string; seqs: number[] }`
   - Behavior: Mark `revoked=true` for listed strokes, emit `whiteboard:stroke:revoked` with `{ seqs }`.

4. `whiteboard:clear`

   - Guard: role ∈ { Admin, Moderator }.
   - Params: `{ sessionId: string }`
   - Behavior: Mark all strokes for that session as `revoked=true`, emit `whiteboard:cleared`.

5. `whiteboard:cursor:update` (ephemeral)

   - Guard: role ∈ { Admin, Moderator, Participant }.
   - Params: `{ sessionId: string; x:number; y:number; color?: string }`
   - Behavior: Broadcast to room without persistence, throttle on server (e.g., 20 Hz per socket).

6. `whiteboard:lock`
   - Guard: role ∈ { Admin, Moderator }.
   - Params: `{ sessionId: string; locked: boolean }`
   - Behavior: Maintain in-memory `lockedBySessionId` flag and emit `whiteboard:lock:changed`. When locked, server rejects `stroke:add` for all except Admin/Moderator (configurable).

Implementation details:

- Add minimal `zod` schemas for each event payload; use `safeParse`. If invalid, reply with error via ack or emit error with consistent error middleware style.
- Use `ensureLiveIdFor` pattern if needed for auditing; primary persistence is `WhiteboardStroke`.
- For atomic `seq`, either: (a) query newest stroke and increment; (b) store a `nextSeq` counter in-memory per `(sessionId)` and backstop with unique index retry; (c) store a counter in a dedicated collection. Start with (b) + retry on duplication.

#### REST endpoint for snapshots (PNG) (in `backend/routes` + controller)

Route: `POST /whiteboard/:sessionId/snapshot`

- Auth: use existing auth middleware; roles ∈ { Admin, Moderator, Participant }.
- Body: binary PNG or data URL (prefer binary); width, height.
- Controller flow: validate with `zod`, upload to S3 via `utils/uploadToS3.ts`, create `WhiteboardSnapshot`, and register a `WHITEBOARD` deliverable entry via existing Session Deliverable flow. Return `{ key, width, height, deliverableId }`.

Optional: `POST /whiteboard/:sessionId/export-pdf` (if server-side PDF bundling is desired later). Initial phase can keep PDF export client-side.

---

### Frontend Work

#### Components

- `frontend/components/whiteboard/WhiteboardCanvas.tsx`: Canvas rendering and interaction (Konva or FabricJS; prefer Konva for React). Maintains local layer of shapes/strokes, handles drawing tools, and renders remote updates.
- `frontend/components/whiteboard/WhiteboardToolbar.tsx`: shadcn/ui `Button`, `Toggle`, `DropdownMenu`, color picker, size slider; icons from `lucide-react` (`Pencil`, `Eraser`, `Type`, `Square`, `Circle`, `Minus` for line, `Undo`, `Redo`, `Trash`, `Lock`, `Download`).
- `frontend/components/whiteboard/WhiteboardPanel.tsx`: Container with toolbar + canvas; props `{ socket, sessionId, role, locked }`.

#### Meeting Integration

- In `frontend/app/meeting/[id]/page.tsx`, replace the current Whiteboard placeholder button with a panel toggle that renders `WhiteboardPanel` within the main layout. Respect existing layout patterns and responsive behavior.
- Observers: Render `WhiteboardPanel` in read-only mode (no toolbar actions that mutate) and do not emit mutation events.

#### Socket client

- Connect using existing `SOCKET_URL` and session-level join, then emit `whiteboard:join` to fetch `{ nextSeq, recentStrokes }`.
- Emit `whiteboard:stroke:add` on pointer up for atomic shapes, and per-sampled segment for freehand (client-side throttling to ~60–120 pts/sec).
- Listen for `whiteboard:stroke:new`, `whiteboard:stroke:revoked`, `whiteboard:cleared`, `whiteboard:lock:changed`, `whiteboard:cursor:update` and update canvas.
- Handle reconnects by re-joining and requesting a catch-up range (`fromSeq` if desired in a v2).

#### Export & Deliverables

- PNG Export: Use canvas `.toDataURL()` and call `POST /whiteboard/:sessionId/snapshot` to persist to S3 and create a `WHITEBOARD` deliverable. Show a success toast.
- PDF Export: Initially client-side using the saved PNG(s) or direct canvas image(s). Bundle via a lightweight client PDF library; keep optional to avoid bundling bloat. Alternatively, generate a single-page PDF from the current canvas.

#### Validation & UX

- Validate tool settings locally; avoid invalid emits when `locked=true`.
- Show lock state for non-moderators with a banner/disabled toolbar controls.
- Use shadcn/ui for all controls and `lucide-react` for icons.

---

### Shared Types (add later when wiring)

- Add `shared/interface/Whiteboard.ts` for payloads without Node-only constructs. Example (illustrative, not code):
  - `WhiteboardStrokePayload` with `shape`, `color`, `size`, `points?`, `text?`.
  - `WhiteboardStrokeBroadcast` extends payload with `seq`, `author`.
  - `WhiteboardJoinAck` with `nextSeq`, `recentStrokes`.

Ensure frontend imports from `@shared/*` (browser-safe only) and backend from compiled `shared/dist` per repo rules.

---

### Data and Performance Considerations

- Use sampling/throttling for freehand strokes to limit event volume; batch points in short bursts (e.g., every 16–32 ms) and rely on server ack for final `seq`.
- Avoid sending full history on every join for long sessions: seed with last N strokes and optionally expose a REST `GET /whiteboard/:sessionId/strokes?fromSeq=` to page in older history when needed.
- Cursor updates are ephemeral; throttle on client and server.

---

### Role & Permission Matrix

- Admin/Moderator: draw, revoke, clear, lock/unlock, export, snapshot.
- Participant: draw (when unlocked), export, snapshot.
- Observer: view-only; receives all broadcast events; cannot emit mutations.

Server enforces via role checks in each socket handler and in snapshot REST controller.

---

### Step-by-Step Checklist

1. Backend – sockets

   - [ ] Add zod schemas for whiteboard payloads.
   - [ ] Implement `whiteboard:join` with seeding strategy.
   - [ ] Implement `whiteboard:stroke:add` with server-assigned `seq` and broadcast.
   - [ ] Implement `whiteboard:stroke:revoke` and `whiteboard:clear`.
   - [ ] Implement `whiteboard:cursor:update` (throttled, no persistence).
   - [ ] Implement `whiteboard:lock` and enforce in mutation handlers.

2. Backend – REST

   - [ ] Add `POST /whiteboard/:sessionId/snapshot` using S3 upload and `WhiteboardSnapshot` creation; return deliverable metadata.

3. Frontend – UI/Canvas

   - [ ] Create `WhiteboardCanvas.tsx` with tools: pencil, eraser, line, rect, circle, text.
   - [ ] Create `WhiteboardToolbar.tsx` (shadcn/ui + lucide icons) with color and size pickers, undo/redo, clear, lock (moderators).
   - [ ] Create `WhiteboardPanel.tsx` to compose toolbar + canvas.
   - [ ] Wire socket client: join, send strokes, handle broadcasts, reconnection.
   - [ ] Implement PNG export calling snapshot endpoint; optional client-side PDF.

4. Meeting Integration

   - [ ] Replace Whiteboard placeholder in `frontend/app/meeting/[id]/page.tsx` with toggleable panel.
   - [ ] Respect observer read-only mode.

5. Deliverables & Dashboard

   - [ ] Ensure snapshots appear as `WHITEBOARD` under Session Deliverables list.

6. Testing
   - [ ] Unit tests for payload validators and socket services.
   - [ ] Manual E2E flow: multi-role drawing, lock, revoke, clear, observer view, snapshot export.

---

### Risks / Follow-ups

- Long-running sessions can accumulate many strokes: consider pagination, snapshotting, and pruning.
- Sequence assignment must be contention-safe under concurrency; retry on unique index violations.
- PDF export size vs. performance trade-offs; keep optional.

---

### Notes

- Follow repo conventions: no `any` types, zod validation at boundaries, centralized error responses, CORS with credentials, and path aliases (`@shared/*`).
- Use shadcn/ui components and `lucide-react` only for UI/icons.
