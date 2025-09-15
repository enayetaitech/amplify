export type ChatScope = "waiting_dm" | "meeting_group" | "meeting_dm" | "meeting_mod_dm" | "observer_wait_group" | "observer_wait_dm" | "stream_group" | "stream_dm_obs_obs" | "stream_dm_obs_mod";
export interface IWaitingRoomChat {
    _id: string;
    sessionId: string;
    email: string;
    senderName: string;
    role: "Participant" | "Observer" | "Moderator";
    content: string;
    timestamp: Date;
    scope: ChatScope;
    toEmail?: string;
}
//# sourceMappingURL=WaitingRoomChatInterface.d.ts.map