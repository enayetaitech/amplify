export interface IObserverGroupMessage {
  _id: string;
  meetingId: string;
  senderEmail: string;
  name: string;
  content: string;
  timestamp: Date;
}
