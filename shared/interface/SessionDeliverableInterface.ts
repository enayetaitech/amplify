export type DeliverableType =
  | "AUDIO"
  | "VIDEO"
  | "TRANSCRIPT"
  | "BACKROOM_CHAT"
  | "SESSION_CHAT"
  | "WHITEBOARD"
  | "POLL_RESULT";

export interface ISessionDeliverable {
  _id: string; 
  sessionId: string;  
  projectId: string;   
  type: DeliverableType;
  displayName: string;  
  size: number; 
  storageKey: string;
  uploadedBy: string; 
  createdAt: Date;
  updatedAt: Date;
}
