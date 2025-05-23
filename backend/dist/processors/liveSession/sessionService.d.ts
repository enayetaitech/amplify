import { ClientSession } from "mongoose";
export interface EnqueueUserData {
    userId?: string;
    name: string;
    email: string;
    role: "Participant" | "Observer" | "Moderator" | "Admin";
}
/**
 * Ensure there is a LiveSession for the given scheduled session.
 * If none exists, create it with ongoing=false.
 */
export declare function createLiveSession(sessionId: string, options?: {
    session?: ClientSession;
}): Promise<import("mongoose").Document<unknown, {}, import("../../model/LiveSessionModel").ILiveSessionDocument> & import("../../model/LiveSessionModel").ILiveSessionDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
/**
 * Add a user to the waiting room and record their join in UserActivity.
 */
export declare function enqueueUser(sessionId: string, userData: EnqueueUserData): Promise<{
    participantsWaitingRoom: import("../../../shared/interface/LiveSessionInterface").IWaitingUser[];
    observersWaitingRoom: import("../../../shared/interface/LiveSessionInterface").IObserverWaitingUser[];
    participantList: import("../../../shared/interface/LiveSessionInterface").IParticipant[];
    observerList: import("../../../shared/interface/LiveSessionInterface").IObserver[];
}>;
/**
 * Mark the LiveSession as started.
 */
export declare function startSession(sessionId: string): Promise<import("mongoose").Document<unknown, {}, import("../../model/LiveSessionModel").ILiveSessionDocument> & import("../../model/LiveSessionModel").ILiveSessionDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
/**
 * Mark the LiveSession as ended and record endTime.
 */
export declare function endSession(sessionId: string): Promise<import("mongoose").Document<unknown, {}, import("../../model/LiveSessionModel").ILiveSessionDocument> & import("../../model/LiveSessionModel").ILiveSessionDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
/**
 * Fetch consolidated session history:
 *  • liveSession metadata
 *  • all join/leave activities
 *  • all waiting-room chats
 *  • all in-meeting direct and group chats
 */
export declare function getSessionHistory(sessionId: string): Promise<{
    liveSession: import("../../model/LiveSessionModel").ILiveSessionDocument & Required<{
        _id: unknown;
    }> & {
        __v: number;
    };
    activities: (import("mongoose").FlattenMaps<import("../../model/UserActivityModel").IUserActivityDocument> & Required<{
        _id: import("mongoose").FlattenMaps<unknown>;
    }> & {
        __v: number;
    })[];
    waitingRoomChats: (import("mongoose").FlattenMaps<import("../../model/ParticipantWaitingRoomChatModel").IParticipantWaitingRoomChatDocument> & Required<{
        _id: import("mongoose").FlattenMaps<unknown>;
    }> & {
        __v: number;
    })[];
    directChats: (import("mongoose").FlattenMaps<import("../../model/ChatModel").IChatMessageDoc> & Required<{
        _id: import("mongoose").FlattenMaps<unknown>;
    }> & {
        __v: number;
    })[];
    groupChats: (import("mongoose").FlattenMaps<import("../../model/GroupMessage").IGroupMessageDoc> & Required<{
        _id: import("mongoose").FlattenMaps<unknown>;
    }> & {
        __v: number;
    })[];
    observerChats: (import("mongoose").FlattenMaps<import("../../model/ObserverGroupMessage").IObserverGroupMessageDoc> & Required<{
        _id: import("mongoose").FlattenMaps<unknown>;
    }> & {
        __v: number;
    })[];
}>;
export declare function logLeave(sessionId: string, userId: string): Promise<void>;
//# sourceMappingURL=sessionService.d.ts.map