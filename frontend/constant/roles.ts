export type UiRole = "admin" | "moderator" | "participant" | "observer";
export type ServerRole = "Admin" | "Moderator" | "Participant" | "Observer";

export const UI_TO_SERVER_ROLE: Record<UiRole, ServerRole> = {
  admin: "Admin",
  moderator: "Moderator",
  participant: "Participant",
  observer: "Observer",
};

export const SERVER_TO_UI_ROLE: Record<ServerRole, UiRole> = {
  Admin: "admin",
  Moderator: "moderator",
  Participant: "participant",
  Observer: "observer",
};

export function normalizeUiRole(input: unknown): UiRole | null {
  if (typeof input !== "string") return null;
  const v = input.trim().toLowerCase();
  if (
    v === "admin" ||
    v === "moderator" ||
    v === "participant" ||
    v === "observer"
  )
    return v;
  return null;
}

export function normalizeServerRole(input: unknown): ServerRole | null {
  if (typeof input !== "string") return null;
  const v = input.trim();
  if (
    v === "Admin" ||
    v === "Moderator" ||
    v === "Participant" ||
    v === "Observer"
  )
    return v;
  return null;
}

export function toServerRole(ui: UiRole): ServerRole {
  return UI_TO_SERVER_ROLE[ui];
}

export function toUiRole(server: ServerRole): UiRole {
  return SERVER_TO_UI_ROLE[server];
}
