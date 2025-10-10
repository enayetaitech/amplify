## In‑Meeting Polls v1 – Full Implementation Plan

This document specifies the complete v1 plan to run polls during a live meeting (similar to Zoom) using the existing stack.

Goals for v1

- Include all existing question types in your schema: SINGLE_CHOICE, MULTIPLE_CHOICE, SHORT_ANSWER, LONG_ANSWER, FILL_IN_BLANK, MATCHING, RANK_ORDER, RATING_SCALE.
- Host can launch/stop/relaunch a poll during a session; participants answer in real time.
- Bind launches to a specific `sessionId`.
- Show live/aggregate results; host can choose to share results with participants.
- Anonymous mode toggle supported.
- Handle up to ~20 concurrent participants comfortably.
- Simple Tailwind bar charts for results (no external chart libs).
- Backend validation with zod; replace `any` with appropriate typing (never use `any`).
- Fix issues in `PollResponse` as noted below.

Architecture Overview

- Data persistence: MongoDB (Mongoose). New `PollRun` model; keep `PollModel` and `PollResponse` with adjustments.
- Transport: REST endpoints for idempotent actions and late-join fetch; Socket events for real-time updates.
- Frontend: Next.js 15, React 19, shadcn/ui, `lucide-react`, Axios instance (`frontend/lib/api.ts`), sockets via `SOCKET_URL`.
- Validation: `zod` at controller boundary; safeParse + consistent error shape.

Data Model

1. PollModel (existing – extend)

   - Keep: `projectId`, `sessionId?`, `title`, `questions[]`, `createdBy`, `createdByRole`, `lastModified`, `responsesCount`, `isRun`.
   - Add (new settings used as defaults when launching):
     - `anonymous: boolean` (default false)
     - `shareResults: 'never' | 'onStop' | 'immediate'` (default 'onStop')
     - `timeLimitSec?: number` (optional)

2. PollRun (new – Option B)

   - Fields:
     - `pollId: ObjectId` (ref: Poll)
     - `sessionId: ObjectId` (ref: Session) – required, binds to live session
     - `runNumber: number` (monotonic per poll; e.g., latestRun + 1)
     - `status: 'OPEN' | 'CLOSED'`
     - `launchedAt: Date`
     - `closedAt?: Date`
     - `anonymous: boolean`
     - `shareResults: 'never' | 'onStop' | 'immediate'`
     - `timeLimitSec?: number`
   - Indexes: `{ pollId: 1, sessionId: 1, status: 1 }`, `{ pollId: 1, runNumber: -1 }`.

3. PollResponse (adjust existing)
   - Keep: `pollId`, `sessionId`, `answers[]`, `submittedAt`, `responder { userId?, name?, email? }`.
   - Add: `runId: ObjectId` (ref: PollRun) – required; one submission per responder per run.
   - Update `answers[]` shape to match subdocuments:
     - `questionId: ObjectId` (ID of question subdocument from PollModel)
     - For choice questions, store `value` as number or number[] of selected indices; for text store string; for rating store number; for matching store array of pairs (see Validation below).
     - Remove invalid `ref`s: do not reference non-existent `PollQuestion` or `PollOption` models.
   - Indexes: `{ pollId: 1, runId: 1, 'responder.userId': 1 }` (unique sparse), `{ pollId: 1, runId: 1, submittedAt: 1 }`.

Validation (zod)

- Define shared zod schemas in `backend/schemas/poll.ts`:
  - `zPollQuestion` for each question type, mirroring `PollModel` fields (including `image`, `answers`, `rows/columns`, `scoreFrom/scoreTo`, etc.).
  - `zCreatePollPayload` and `zUpdatePollPayload` (title, questions array).
  - `zLaunchPayload`: `{ sessionId: string, settings?: { anonymous?: boolean; shareResults?: 'never'|'onStop'|'immediate'; timeLimitSec?: number } }`.
  - `zStopPayload`: `{ sessionId: string }`.
  - `zRespondPayload`: `{ sessionId: string, runId: string, answers: z.array(z.union([...])) }` with per-type answer validators:
    - SINGLE_CHOICE: `value: z.number().int().min(0)`
    - MULTIPLE_CHOICE: `value: z.array(z.number().int().min(0)).nonempty()`
    - SHORT_ANSWER/LONG_ANSWER: `value: z.string().min(min).max(max)`
    - RATING_SCALE: `value: z.number().int().min(scoreFrom).max(scoreTo)`
    - FILL_IN_BLANK: `value: z.array(z.string())` (length equals blanks)
    - MATCHING: `value: z.array(z.tuple([z.number().int(), z.number().int()]))` (row->answer index mapping)
    - RANK_ORDER: `value: z.array(z.number().int())` or per-row selection depending on UI (single per row)

Endpoints (REST)

- Base: `/api/v1/polls`

1. POST `/polls/:pollId/launch`

   - Body: `zLaunchPayload`.
   - AuthZ: role in {Admin, Moderator} for that project/session.
   - Behavior:
     - Ensure no other OPEN run exists for the same `pollId`+`sessionId`.
     - Compute `runNumber` (latest + 1), create `PollRun` with status OPEN.
     - Optionally increment a per-poll “launch count”.
     - Emit socket `poll:started` to room `session:<sessionId>` with payload `{ poll, run }` (exclude correct answers in payload to participants).
     - Return `{ data: { poll, run } }`.

2. POST `/polls/:pollId/stop`

   - Body: `zStopPayload`.
   - Finds OPEN run for poll+session, mark CLOSED (`closedAt`), return `{ data: { run } }`.
   - Emit `poll:stopped` to `session:<sessionId>`.
   - If `shareResults` is 'onStop', also emit `poll:results` to `session:<sessionId>` with aggregated results.

3. GET `/liveSessions/:sessionId/active-poll`

   - Returns `{ data: { poll, run } }` of the currently OPEN run in that session or 204 if none.

4. POST `/polls/:pollId/respond`

   - Body: `zRespondPayload`.
   - Validate run is OPEN and bound to `sessionId`.
   - Enforce single submission per responder (by `responder.userId` if logged-in; else by socket connection id or a temporary participant id provided by your session layer).
   - Persist `PollResponse`.
   - Emit `poll:partialResults` (throttled) to host-only room `session:<sessionId>:host` or include aggregate in `poll:submission:ack` to the host.
   - Respond `{ message: 'ok' }`.

5. GET `/polls/:pollId/results?runId=...`
   - Returns aggregated results for a run. Host-only; participant access only if `run.shareResults` permits.

Socket Events

- Client → Server (host):
  - `poll:launch` { pollId, sessionId, settings? } → same behavior as REST launch; emit `poll:started`.
  - `poll:stop` { pollId, sessionId } → mark CLOSED; emit `poll:stopped` (+`poll:results` if share == 'onStop').
- Client → Server (participant):
  - `poll:respond` { pollId, runId, sessionId, answers } → persist; ack with `poll:submission:ack`.
- Server → Clients:
  - `poll:started` { poll, run }
  - `poll:stopped` { pollId, runId }
  - `poll:partialResults` { pollId, runId, aggregates } (host-only or all if share == 'immediate')
  - `poll:results` { pollId, runId, aggregates }

Aggregation

- For SINGLE_CHOICE / MULTIPLE_CHOICE / RATING_SCALE:
  - `$unwind: '$answers'` then `$group` by `{ questionId, value }` to count.
  - Map counts to option indices to compute percentages: `count / totalResponses`.
- SHORT_ANSWER / LONG_ANSWER / FILL_IN_BLANK:
  - Return arrays of texts; optionally top-K or length-limited for UI.
- MATCHING:
  - Count frequency of chosen pairs per row.
- RANK_ORDER:
  - Count selections per row/column; or compute rank distributions.
- Store nothing denormalized for v1; compute on demand to keep correctness.

Frontend Implementation
Files (new)

- `frontend/components/meeting/PollsPanel.tsx`: host controls list + actions (Launch/Stop/Relaunch/Share Results/View Results).
- `frontend/components/meeting/ActivePoll.tsx`: participant view for active poll + submission UI.
- `frontend/components/meeting/PollResults.tsx`: shared results view (tailwind bars per question/option).

Meeting Host Controls (PollsPanel)

- List project polls via `GET /polls/project/:projectId` (existing).
- Launch: open dialog to configure `anonymous`, `shareResults`, `timeLimitSec`; call REST or emit socket.
- Stop: stop current run.
- Relaunch: same as Launch (creates new runNumber).
- View Results: fetch via `GET /polls/:pollId/results?runId=...` or show live aggregates via socket.

Participant View (ActivePoll)

- On join or panel mount, call `GET /liveSessions/:sessionId/active-poll`; or subscribe to `poll:started`.
- Render question components for all types already present in your builder/editor, but stripped to response controls.
- Submit once. Show confirmation. If results shared: render `PollResults` view.

Results UI (Tailwind bar chart)

- For each question with options or numeric scale, compute percent = `count / max(1, total)`.
- Bars using Tailwind classes, e.g. a gray bg with an inner colored div whose width is `${percent * 100}%`.
- For text answers, simple list with truncation.

Authorization & Roles

- Only `Admin` or `Moderator` can launch/stop (project/session-bound check).
- Participants can only submit when run is OPEN and they are part of the session.

Error Handling

- Use centralized error middleware with `{ message }`.
- Convert zod errors into message strings.

Fixes to Apply Before/While Implementing

1. PollResponse bad refs

   - Remove `ref: 'PollQuestion'` and `ref: 'PollOption'` in `questionId`/`optionId`.
   - Add required `runId: ObjectId (ref PollRun)` and a unique constraint per user/run.

2. Add zod validation for all new controllers and existing create/update poll controllers.

3. Replace `any` and implicit `any` with appropriate typings (never use `any`).

4. Launch binding
   - Launch endpoints and socket flows require `sessionId` and will create `PollRun` rows bound to that session.

Testing Plan (manual; ~20 participants)

- Single poll per session active at a time.
- Submit once per participant; relaunch allows another submission under new run.
- Late joiner sees active poll.
- Anonymous mode: responses saved without `userId`.
- Share results modes: never / immediate / onStop.

Milestones

1. Backend data & validation: PollRun model; zod schemas; PollResponse fix.
2. Endpoints + sockets: launch/stop/respond/results/active-poll.
3. Frontend host panel + participant UI + results view.
4. QA across all question types, relaunch, and share modes.

Notes

- Keep payloads small; avoid sending correct answers to participants.
- Throttle `poll:partialResults` to avoid socket spam (e.g., 300–500ms).
- Use existing `frontend/lib/api.ts` and `SOCKET_URL` as per workspace rules.
