import type { ChatScope } from "./WaitingRoomChatInterface";
export interface IObserverGroupMessage {
  _id: string;
  sessionId: string;
  senderEmail: string;
  name: string;
  content: string;
  timestamp: Date;
  scope: ChatScope;
}
//# sourceMappingURL=ObserverGroupMessageInterface.d.ts.map
