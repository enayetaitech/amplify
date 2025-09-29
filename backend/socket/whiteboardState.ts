export type WbRole = "Participant" | "Observer" | "Moderator" | "Admin";

export type WbMemState = {
  open: boolean;
  sessionKey: string;
  seq: number;
  rolesAllowed: Set<Exclude<WbRole, "Observer">>;
};

const wbStateBySession = new Map<string, WbMemState>();

export function getOrInitWb(sessionId: string): WbMemState {
  let s = wbStateBySession.get(sessionId);
  if (!s) {
    s = {
      open: false,
      sessionKey: "",
      seq: 0,
      rolesAllowed: new Set(["Participant", "Moderator", "Admin"]),
    };
    wbStateBySession.set(sessionId, s);
  }
  return s;
}

export function setOpen(sessionId: string, open: boolean): WbMemState {
  const s = getOrInitWb(sessionId);
  s.open = open;
  return s;
}

export function ensureSessionKey(sessionId: string): string {
  const s = getOrInitWb(sessionId);
  if (!s.sessionKey) {
    s.sessionKey = `${sessionId}_${Date.now()}`;
  }
  return s.sessionKey;
}
