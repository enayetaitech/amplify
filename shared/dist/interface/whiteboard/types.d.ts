export type WbRole = "Participant" | "Observer" | "Moderator" | "Admin";
export interface WbState {
    open: boolean;
    sessionKey: string;
    rolesAllowed: ReadonlyArray<Exclude<WbRole, "Observer">>;
}
export interface WbPatchEnvelope {
    v: 1;
    sessionKey: string;
    seq?: number;
    patch: unknown;
}
export interface WbOpenCloseRequest {
    sessionId: string;
    role: WbRole;
}
export interface WbHistoryResponse {
    ok: true;
    sessionKey: string;
    patches: ReadonlyArray<WbPatchEnvelope>;
}
//# sourceMappingURL=types.d.ts.map