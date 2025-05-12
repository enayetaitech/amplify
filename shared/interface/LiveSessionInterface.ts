// shared/interfaces/LiveSessionInterface.ts
export interface ILiveSession {
  _id: string;
  sessionId: string; // ref to ISession._id
  ongoing: boolean; // toggled when moderator clicks “Start”
  startTime?: Date;
  endTime?: Date;
  participantWaitingRoom: Array<{
    name: string;
    email: string;
    role: "Participant" | "Moderator";
    joinedAt: Date;
  }>;
  observerWaitingRoom: Array<{
    userId?: string;
    name: string;
    email: string;
    role: "Observer" | "Moderator";
    joinedAt: Date;
  }>;
  participantsList: Array<{
    name: string;
    email: string;
    role: "Participant" | "Moderator";
    joinedAt: Date;
  }>;
  observerList: Array<{
    userId?: string;
    name: string;
    email: string;
    role: "Observer" | "Moderator";
    joinedAt: Date;
  }>;
  // add any other runtime flags here (e.g. breakRooms, currentPollId, etc.)
}
