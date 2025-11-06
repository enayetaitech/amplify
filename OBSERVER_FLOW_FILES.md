# Observer Flow - Complete File List

This document lists all frontend pages, components, utils, and backend routes, controllers, services, models, and utilities used for the observer flow.

## Flow Overview

1. **Observer Join Meeting Page** → Observer enters details and passcode
2. **Observer Waiting Room** → Observer waits for stream to start (with chat)
3. **Meeting** → Observer watches live stream (HLS/WebRTC)
4. **Back to Waiting Room** → When stream stops, observer returns to waiting room

---

## Frontend Pages

### 1. Observer Join Meeting Page

- `frontend/app/(before-meeting)/join/observer/[sessionId]/page.tsx`

### 2. Observer Waiting Room Page

- `frontend/app/(before-meeting)/waiting-room/observer/[sessionId]/page.tsx`

### 3. Meeting Page (Observer View)

- `frontend/app/meeting/[id]/page.tsx` (renders ObserverMeetingView when role=Observer)

---

## Frontend Components

### Observer-Specific Components

- `frontend/components/meeting/observer/ObserverMeetingView.tsx` - Main observer meeting view
- `frontend/components/meeting/observer/ObserverHlsLayout.tsx` - HLS video layout
- `frontend/components/meeting/observer/ObserverHlsLayoutImproved.tsx` - Improved HLS layout
- `frontend/components/meeting/observer/ObserverWebRTCLayout.tsx` - WebRTC video layout
- `frontend/components/meeting/observer/ObserverMessageComponent.tsx` - Observer chat component
- `frontend/components/meeting/observer/ObserverBreakoutSelect.tsx` - Breakout room selector
- `frontend/components/meeting/observer/ParticipantMessageInObserverLeftSidebar.tsx` - Participant messages in sidebar

### Chat Components

- `frontend/components/meeting/ObserverWaitingRoomChat.tsx` - Chat component for waiting room
- `frontend/components/meeting/chat/ChatWindow.tsx` - Reusable chat window component

### Sidebar Components

- `frontend/components/meeting/rightSideBar/MainRightSidebar.tsx` - Main right sidebar wrapper
- `frontend/components/meeting/rightSideBar/ObservationRoom.tsx` - Observation room (observer list & chat)
- `frontend/components/meeting/rightSideBar/DocumentHub.tsx` - Document hub for observers
- `frontend/components/meeting/rightSideBar/Backroom.tsx` - Backroom component (moderator view)

### Shared UI Components

- `frontend/components/shared/LogoComponent.tsx` - Logo component
- `frontend/components/shared/FooterComponent.tsx` - Footer component
- `frontend/components/ui/button.tsx` - Button component (shadcn)
- `frontend/components/ui/form.tsx` - Form component (shadcn)
- `frontend/components/ui/input.tsx` - Input component (shadcn)
- `frontend/components/ui/sheet.tsx` - Sheet component (shadcn)
- `frontend/components/ui/tabs.tsx` - Tabs component (shadcn)
- `frontend/components/ui/badge.tsx` - Badge component (shadcn)
- `frontend/components/createAccount/TextInputField.tsx` - Text input field
- `frontend/components/createAccount/PasswordField.tsx` - Password input field

---

## Frontend Hooks

- `frontend/hooks/useResolveObserverSession.ts` - Resolves session/project to latest observer session
- `frontend/hooks/useEnqueueWaitingRoom.ts` - Enqueues observer to waiting room
- `frontend/hooks/useChat.ts` - Chat hook for sending/receiving messages

---

## Frontend Schemas

- `frontend/schemas/observerJoinSchema.ts` - Zod schema for observer join form validation

---

## Frontend Utils

- `frontend/utils/storage.ts` - localStorage/sessionStorage utilities (safeLocalGet, safeLocalSet)
- `frontend/lib/utils.ts` - Utility functions (formatDisplayName, cn)
- `frontend/lib/api.ts` - Axios instance with interceptors
- `frontend/constant/socket.ts` - Socket URL constant
- `frontend/constant/roles.ts` - Role constants and utilities

---

## Backend Routes

### Waiting Room Routes

- `backend/routes/waitingRoom/WaitingRoomRoutes.ts`
  - `POST /api/v1/waiting-room/enqueue` - Enqueue observer

### Session Routes

- `backend/routes/session/SessionRoutes.ts`
  - `GET /api/v1/sessions/:id` - Get session
  - `GET /api/v1/sessions/project/:projectId/latest` - Get latest session for observer

### LiveKit Routes

- `backend/routes/livekit/livekit.routes.ts`
  - `GET /api/v1/livekit/:sessionId/hls` - Get HLS URL
  - `POST /api/v1/livekit/public/:sessionId/token` - Get public WebRTC token
  - `GET /api/v1/livekit/public/:sessionId/breakouts` - Get breakout rooms

---

## Backend Controllers

- `backend/controllers/WaitingRoomController.ts`

  - `enqueue()` - Enqueues observer (validates passcode, creates LiveSession if needed)

- `backend/controllers/SessionController.ts` - Session controller

- `backend/controllers/LivekitController.ts` - LiveKit controller (HLS, tokens, breakouts)

- `backend/controllers/LiveSessionController.ts` - Live session management

---

## Backend Services/Processors

- `backend/processors/liveSession/sessionService.ts`

  - `enqueueUser()` - Enqueues user to waiting room
  - `createLiveSession()` - Creates LiveSession document

- `backend/processors/waiting/waitingService.ts` - Waiting room service

---

## Backend Socket/Index

- `backend/socket/index.ts` - Socket.IO server
  - Observer connection handling
  - Observer room management (`observer::${sessionId}`)
  - Observer list events (`observer:list`, `observer:count`)
  - Chat events:
    - `chat:send` - Send messages (scopes: `observer_wait_group`, `observer_wait_dm`, `stream_group`, `stream_dm_obs_obs`, `stream_dm_obs_mod`)
    - `chat:history:get` - Get chat history
    - `chat:new` - New message broadcast
  - Observer stream events:
    - `observer:stream:started` - Stream started
    - `observer:stream:stopped` - Stream stopped
  - Participant admission events:
    - `announce:participant:admitted` - Single participant admitted
    - `announce:participants:admitted` - Multiple participants admitted

---

## Backend Models

- `backend/model/LiveSessionModel.ts` - Live session model
- `backend/model/SessionModel.ts` - Session model
- `backend/model/ProjectModel.ts` - Project model (for passcode validation)
- `backend/model/ObserverWaitingRoomChatModel.ts` - Observer waiting room chat messages
- `backend/model/ObserverGroupMessage.ts` - Observer group messages (stream_group)
- `backend/model/ModeratorModel.ts` - Moderator model (auto-added observers)
- `backend/model/UserModel.ts` - User model

---

## Shared Interfaces

- `shared/interface/LiveSessionInterface.ts` - Live session interface
- `shared/interface/ObserverGroupMessageInterface.ts` - Observer group message interface
- `shared/interface/WaitingRoomChatInterface.ts` - Waiting room chat interface

---

## Flow Summary

1. **Join Page** → `ObserverJoinMeeting` → validates form → calls `enqueue` API
2. **Waiting Room** → `ObserverWaitingRoom` → socket connection → chat functionality → waits for stream
3. **Meeting** → `Meeting` page → renders `ObserverMeetingView` → HLS/WebRTC streaming → sidebars with chat
4. **Back to Waiting Room** → when stream stops → redirects to waiting room

---

## Key Features

### Chat Scopes

- `observer_wait_group` - Observer group chat in waiting room
- `observer_wait_dm` - Direct messages between observers in waiting room
- `stream_group` - Observer group chat during meeting
- `stream_dm_obs_obs` - Direct messages between observers during meeting
- `stream_dm_obs_mod` - Direct messages between observer and moderator during meeting

### Socket Events

- `observer:stream:started` - Navigates observer from waiting room to meeting
- `observer:stream:stopped` - Navigates observer from meeting back to waiting room
- `observer:list` - List of all observers
- `observer:count` - Count of observers
- `moderator:list` - List of moderators
- `chat:new` - New chat message
- `chat:history:get` - Get chat history
- `chat:send` - Send chat message
- `announce:participant:admitted` - Participant admitted notification

### API Endpoints

- `POST /api/v1/waiting-room/enqueue` - Join as observer
- `GET /api/v1/sessions/project/:projectId/latest` - Get latest session for observer
- `GET /api/v1/livekit/:sessionId/hls` - Get HLS stream URL
- `POST /api/v1/livekit/public/:sessionId/token` - Get WebRTC token
- `GET /api/v1/livekit/public/:sessionId/breakouts` - Get breakout rooms
