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
    joinedAt: Date;
}
export interface IObserver {
    userId?: string;
    name: string;
    email: string;
    role: Extract<UserRole, "Observer" | "Moderator" | "Admin">;
    joinedAt: Date;
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
}
//# sourceMappingURL=LiveSessionInterface.d.ts.map