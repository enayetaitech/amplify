// shared/interfaces/LiveSessionInterface.ts

export type UserRole = "Participant" | "Observer" | "Moderator" | "Admin";

export interface IWaitingUser {
  name: string;
  email: string;
  role: Extract<UserRole, "Participant" | "Moderator" | "Admin">;
  joinedAt: Date;
}

export interface IObserverWaitingUser {
  userId?: string;
  name: string;
  email: string;
  role: Extract<UserRole, "Observer" | "Moderator" | "Admin">;
  joinedAt: Date;
}

export interface IParticipant {
  name: string;
  email: string;
  role: Extract<UserRole, "Participant" | "Moderator" | "Admin">;
  joinedAt?: Date | null;
}

export interface IObserver {
  userId?: string;
  name: string;
  email: string;
  role: Extract<UserRole, "Observer" | "Moderator" | "Admin">;
  joinedAt?: Date | null;
}

export interface IParticipantHistoryItem {
  id: string; // ref to participant entry
  name: string;
  email: string;
  joinedAt?: Date | null;
  leaveAt?: Date | null;

  reason:
    | "Left"
    | "Meeting Ended"
    | "Removed by the moderator"
    | "Transferred to waiting room";
}

export interface IObserverHistoryItem {
  id: string; // ref to User
  name: string;
  email: string;
  role: Extract<UserRole, "Observer" | "Moderator" | "Admin">;
  joinedAt?: Date | null;
  leaveAt?: Date | null;
}

export interface ILiveSession {
  _id: string;
  sessionId: string;
  ongoing: boolean;
  startTime?: Date;
  endTime?: Date;
  participantWaitingRoom: IWaitingUser[];
  observerWaitingRoom: IObserverWaitingUser[];
  participantsList: IParticipant[];
  observerList: IObserver[];
  participantHistory: IParticipantHistoryItem[];
  observerHistory: IObserverHistoryItem[];
  hlsPlaybackUrl: string | null;
  hlsEgressId: string | null;
  hlsPlaylistName: string | null;
  fileEgressId: string | null;
  streaming?: boolean; // HLS currently live?
  hlsStartedAt?: Date | null;
  hlsStoppedAt?: Date | null;
  startedBy: string;
  endedBy: string;
}

// export interface ILiveSession {
//   _id: string;
//   sessionId: string; // ref to ISession._id
//   ongoing: boolean; // toggled when moderator clicks “Start”
//   startTime?: Date;
//   endTime?: Date;
//   participantWaitingRoom: Array<{
//     name: string;
//     email: string;
//     role: "Participant" | "Moderator";
//     joinedAt: Date;
//   }>;
//   observerWaitingRoom: Array<{
//     userId?: string;
//     name: string;
//     email: string;
//     role: "Observer" | "Moderator";
//     joinedAt: Date;
//   }>;
//   participantsList: Array<{
//     name: string;
//     email: string;
//     role: "Participant" | "Moderator";
//     joinedAt: Date;
//   }>;
//   observerList: Array<{
//     userId?: string;
//     name: string;
//     email: string;
//     role: "Observer" | "Moderator";
//     joinedAt: Date;
//   }>;
//   // add any other runtime flags here (e.g. breakRooms, currentPollId, etc.)
// }
