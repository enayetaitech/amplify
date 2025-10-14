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
    id: string;
    name: string;
    email: string;
    joinedAt?: Date | null;
    leaveAt?: Date | null;
    reason: "Left" | "Meeting Ended" | "Removed by the moderator" | "Transferred to waiting room";
}
export interface IObserverHistoryItem {
    id: string;
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
    streaming?: boolean;
    hlsStartedAt?: Date | null;
    hlsStoppedAt?: Date | null;
    startedBy: string;
    endedBy: string;
}
//# sourceMappingURL=LiveSessionInterface.d.ts.map