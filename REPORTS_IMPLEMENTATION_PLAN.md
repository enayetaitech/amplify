## Reports Implementation Plan (Frontend + Backend)

This plan reflects your confirmed decisions for implementing the Reports section under each project. It references existing code and models and removes prior assumptions.

### Decisions (confirmed)

- Access: Moderators cannot access reports. Only Admin can see basic features. IP/Location columns are strictly for SuperAdmin.
- External Admin maps to the `Admin` role in `backend/constants/roles.ts`. All `Amplify*` roles have no access to Reports.
- Close Date: Infer from `Project.status === "Closed"` (we will also add a `closedAt` field and populate it on status change).
- Unique Counts: Exclude Amplify logins from counts. Do not count moderators as participants.
- Device/Location Source: Use `UserActivity.deviceInfo` as source of truth; fall back only if missing.
- Top Section Scope: Always reflect entire project (ignore filters/search).
- Observer Detail: If no `userId`, key by `email`; do not merge multiple sessions even if email matches.
- Moderator Names (Top): Union of all `Session.moderators` across the project.
- Time Zone: Render timestamps in `Project.defaultTimeZone`.
- APIs: Provide dedicated `/reports/*` endpoints (do not reuse sessions endpoint).
- Pagination default: 10.
- Search scope: Sessions, moderators, participant names, and observer names.
- Observer company: Leave blank if no `userId`.
- UI behavior for unauthorized roles: Keep the Reports tab visible; show an access-denied state when the user lacks access.

---

## Data Sources (Existing Models/Endpoints)

- `Project` (backend/model/ProjectModel.ts)
- `Session` (backend/model/SessionModel.ts)
- `LiveSession` (backend/model/LiveSessionModel.ts)
- `Presence` (backend/model/Presence.ts)
- `UserActivity` (backend/model/UserActivityModel.ts)
- `LiveUsageLog` (backend/model/LiveUsageLog.ts)
- `User` (backend/model/UserModel.ts)
- Existing helpful endpoints (for context):
  - Sessions by project (not reused directly for reports): `GET /api/v1/sessions/project/:projectId`
  - Project by id: `GET /api/v1/projects/get-project-by-id/:projectId`

---

## Backend Implementation

### 1) Authorization

- Use `authenticateJwt` and `authorizeRoles`.
- Access:
  - SuperAdmin: full access, including IP/Location columns.
  - Admin (External Admin): access to reports basic features; IP/Location columns hidden.
  - Moderators: no access.
  - Amplify roles (AmplifyAdmin/AmplifyModerator/AmplifyObserver/AmplifyParticipant/AmplifyTechHost): no access to Reports, and excluded from counts.

### 2) New Endpoints (Dedicated Reports API)

Add `backend/routes/reports/ReportsRoutes.ts` mounted under `/api/v1/reports`.

- `GET /api/v1/reports/project/:projectId/summary`

  - Returns the TOP SECTION cumulative data for the entire project (ignores filters):
    - projectName
    - allModeratorNames (unique union from all `Session.moderators` for the project)
    - startDateTime (from `Project.startDate`)
    - totalCreditsUsed (sum `LiveUsageLog.creditsUsed` across project)
    - closeDate (if `Project.status === "Closed"`; prefer `closedAt` when available, else infer/omit)
    - totalParticipantCount (unique participants across project; exclude moderators and Amplify logins)
    - totalObserverCount (unique observers across project; exclude Amplify logins)

- `GET /api/v1/reports/project/:projectId/sessions`

  - Returns SESSION DETAILS LIST with pagination (default 10), sorting, and filters (search across session title, moderator name, participant and observer names):
    - sessionId, sessionName
    - moderators (names)
    - startDateTime, endDateTime
    - totalCreditsUsed (from `LiveUsageLog` for session)
    - participantCount (unique per session; exclude moderators and Amplify logins)
    - observerCount (unique per session; exclude Amplify logins)

- `GET /api/v1/reports/session/:sessionId/participants`

  - Participant Grid items:
    - name: "FirstName LastInitial" if derivable; otherwise display available name
    - sessionName
    - deviceType (from `UserActivity.deviceInfo.deviceType`)
    - joinTime, leaveTime (from `UserActivity.joinTime/leaveTime`; fallback to `Presence` if missing)
    - SuperAdmin only: ip, location (from `UserActivity.deviceInfo`)

- `GET /api/v1/reports/session/:sessionId/observers`

  - Observer Grid items:
    - observerName (clickable)
    - email
    - companyName (from `User.companyName` if `userId`; else blank)
    - joinTime, leaveTime (same as above)
    - SuperAdmin only: ip, location

- `GET /api/v1/reports/observer/:observerId/summary?projectId=...`
  - For Observer detail click: list of sessions they joined in the project with durations.
  - If no `userId`, support `observerEmail` param as lookup key; do not merge across sessions even if email matches.

Implementation guidance:

- Use `Presence` and `UserActivity` together: prefer `UserActivity.deviceInfo` for device/IP/location and join/leave; fill gaps from `Presence` when needed.
- Counts:
  - Unique participant/observer across project: aggregate in `Presence` by `role` with `$addToSet` on identifier (prefer `userId`; fallback `email`), excluding Amplify\* roles and moderators.
  - Per-session counts similarly filtered.
- Credits: use `LiveUsageLog` per session; sum for project totals.
- Validation: `zod.safeParse` for all params/queries.
- Responses: `sendResponse` from `backend/utils/responseHelpers.ts`.

### 3) Performance & Indexes

- Add/ensure indexes on `Presence`:
  - `{ projectId: 1, role: 1 }`
  - `{ sessionId: 1, role: 1 }`
  - `{ sessionId: 1, joinedAt: -1 }` (exists), plus `{ projectId: 1, joinedAt: -1 }` if needed.
- Use lean queries and aggregation pipelines with pagination.

### 4) Project `closedAt`

- Add optional `closedAt: Date` to `Project` schema.
- Update controller/service to set `closedAt` when status transitions to `Closed` (do not clear if status changes away unless explicitly required).
- In `/project/:projectId/summary`, prefer `closedAt` when present; otherwise infer/omit.

---

## Frontend Implementation

Location: `frontend/app/(dashboard)/projects/[projectId]/reports/page.tsx`.

### 1) Top Filter/Search Bar

- shadcn/ui components; lucide-react icons.
- Filters:
  - search (session title, moderator name, participant name, observer name)
  - date range
  - moderator multi-select
- Persist filter state in URL query params.

### 2) Project Details (Top Section)

- Fetch `GET /api/v1/reports/project/:projectId/summary` (always unfiltered, all-time).
- Display:
  - Project Name
  - All Moderator Names (union across sessions)
  - Start Date & Time
  - Total Credits Used
  - Close Date (only if closed)
  - Total Participant Count (clickable to show complete list across project)
  - Total Observer Count (clickable to show complete list across project)
- Click actions: open modal dialogs for full participant/observer lists across the project (optional endpoints can be added if required later).

### 3) Session Details List (Grid)

- Fetch `GET /api/v1/reports/project/:projectId/sessions` with filters, search, sorting, pagination (default 10).
- Columns:
  - Session Name (expand on click)
  - Moderator(s)
  - Start Date & Time
  - Total Credits Used
  - End Date & Time
  - Participant Count (clickable to open participant list modal)
  - Observer Count (clickable to open observer list modal)

### 4) Expanded Session View

- Collapsible row/side panel; shadcn/ui `Tabs` for "Participants" and "Observers".

Participant Grid columns:

- First Name Last Initial (as named in group)
- Session Name
- Device Type
- Join Time
- Leave Time
- Super Admin only: IP Address, Location

Observer Grid columns:

- Observer Name (clickable to show session count and durations)
- Email Address
- Company Name
- Join Time
- Leave Time
- Super Admin only: IP Address, Location

- Data sources:
  - `GET /api/v1/reports/session/:sessionId/participants`
  - `GET /api/v1/reports/session/:sessionId/observers`
  - `GET /api/v1/reports/observer/:observerId/summary?projectId=...`

### 5) Access Control in UI

- Read logged-in user. Keep the Reports tab visible for all users; if unauthorized, render an access-denied state within the tab.
- Only show IP/Location columns when role is SuperAdmin.

### 6) Time Zone

- Render all timestamps using `Project.defaultTimeZone`.

---

## Minimal Backend Tasks

- Create `backend/routes/reports/ReportsRoutes.ts` and mount in `backend/routes/index.ts`.
- Implement controllers with `zod` validation:
  - `getProjectSummary(projectId)` (all-time)
  - `getProjectSessions(projectId, pagination, sorting, filters)`
  - `getSessionParticipants(sessionId, pagination, sorting)`
  - `getSessionObservers(sessionId, pagination, sorting)`
  - `getObserverSummary(observerId or email, projectId)`
- Add `closedAt` to `Project` and set on status change to Closed.
- Add indexes on `Presence` for project/session aggregations.

## Minimal Frontend Tasks

- Build filter/search bar (shadcn/ui) at `projects/[projectId]/reports/page.tsx`.
- Render Project Details box (unfiltered summary endpoint).
- Render sessions table (reports sessions endpoint).
- Implement expanded session view with tabs and grids.
- Implement modals for participant/observer lists.
- Gate SuperAdmin-only columns.

---

## Testing & Validation

- Unit tests for aggregations, unique counts, and filters.
- RBAC tests: access denied to Moderators and Amplify roles.
- Verify IP/Location columns only for SuperAdmin.
- Validate time rendering in `Project.defaultTimeZone`.

---

## Approved follow-ups

- Add `project.closedAt` and set it on status change to Closed.
- Add/confirm required `Presence` indexes for report queries.
- After this doc is approved, proceed to implement the backend endpoints and frontend UI per above.
