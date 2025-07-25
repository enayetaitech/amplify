// shared/interfaces/WaitingRoomChatInterface.ts
export interface IWaitingRoomChat {
  _id: string;
  sessionId: string; 
  email: string;
  senderName: string;
  role: 'Participant' | 'Observer' | 'Moderator';
  content: string;
  timestamp: Date;
}
