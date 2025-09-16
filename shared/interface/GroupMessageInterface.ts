import type { ChatScope } from "./WaitingRoomChatInterface";

export interface IGroupMessage {
  _id: string;
  sessionId: string;
  senderEmail: string;
  name: string;
  content: string;
  timestamp: Date;
  scope: ChatScope; // e.g., 'meeting_group', 'observer_wait_group', 'stream_group'
}
