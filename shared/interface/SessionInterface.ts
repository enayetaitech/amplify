
export interface ISession {
  _id: string;
  title: string;
  projectId: string;
  date: Date;
  startTime: string; 
  duration: number; 
  moderators: string[];
  timeZone: string;  
  breakoutRoom: boolean;
}
