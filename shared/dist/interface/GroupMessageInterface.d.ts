import type { ChatScope } from "./WaitingRoomChatInterface";
export interface IGroupMessage {
    _id: string;
    sessionId: string;
    senderEmail: string;
    name: string;
    content: string;
    timestamp: Date;
    scope: ChatScope;
}
//# sourceMappingURL=GroupMessageInterface.d.ts.map