"use client";

import ModeratorWaitingPanel from "components/meeting/waitingRoom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks,
  useRoomContext,
  ControlBar,
  useParticipants,
  ScreenShareIcon,
} from "@livekit/components-react";
import { Track, RoomEvent } from "livekit-client";
import api from "lib/api";
import { ApiResponse } from "@shared/interface/ApiResponseInterface";
import "@livekit/components-styles";
import "./meeting.css";
import { useGlobalContext } from "context/GlobalContext";

import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "constant/socket";
import { Button } from "../../../components/ui/button";

declare global {
  interface Window {
    __meetingSocket?: Socket; // already created elsewhere in your app
  }
}

type UiRole = "admin" | "moderator" | "participant" | "observer";
type ServerRole = "Admin" | "Moderator" | "Participant" | "Observer";
/** Enables cam (muted mic) once connected for admin/moderator */
function AutoPublishOnConnect({ role }: { role: UiRole }) {
  const room = useRoomContext();

  useEffect(() => {
    if (!room) return;

    const enableNow = async () => {
      if (role === "admin" || role === "moderator") {
        await room.localParticipant.setCameraEnabled(true);
        await room.localParticipant.setMicrophoneEnabled(false);
      }
    };

    if (room.state === "connected") {
      void enableNow();
      return; // ensure the effect returns void here
    }

    const onConnected = () => {
      room.off(RoomEvent.Connected, onConnected);
      void enableNow();
    };
    room.on(RoomEvent.Connected, onConnected);

    // ✅ cleanup returns void
    return () => {
      room.off(RoomEvent.Connected, onConnected);
    };
  }, [room, role]);

  return null;
}

/** Video grid that safely uses useTracks inside LiveKitRoom context */
function VideoGrid() {
  const trackRefs = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: true },
  ]);

  return (
    <div className="flex-1 min-h-0">
      <GridLayout tracks={trackRefs}>
        {/* IMPORTANT: exactly ONE child element; no map() here */}
        <ParticipantTile />
      </GridLayout>
    </div>
  );
}

async function fetchLiveKitToken(sessionId: string, role: ServerRole) {
  const res = await api.post<ApiResponse<{ token: string }>>(
    "/api/v1/livekit/token",
    {
      roomName: sessionId,
      role, // NOTE: capitalized per backend type
    }
  );

  // Your codebase typically nests data under data.data
  return res.data.data.token;
}

/** --- helpers --- */
/** --- helpers --- */
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

function emailFromIdentity(identity?: string): string | null {
  if (!identity) return null;
  const hit = identity.match(EMAIL_RE);
  return hit ? hit[0].toLowerCase() : null;
}

/** Try both identity and metadata for an email */
function emailFromParticipant(p: {
  identity?: string;
  metadata?: string | null;
}) {
  const fromId = emailFromIdentity(p.identity);
  if (fromId) return fromId;
  if (!p?.metadata) return null;
  try {
    const meta = JSON.parse(p.metadata);
    const e = (meta?.email || meta?.userEmail || meta?.e || "").toString();
    return EMAIL_RE.test(e) ? e.toLowerCase() : null;
  } catch {
    return null;
  }
}

/** Participants (Live) list + per-row "Mute mic" for Admin/Moderator */
function ParticipantsPanel({
  role,
  socket,
  myEmail,
}: {
  role: UiRole;
  socket: Socket | null;
  myEmail?: string | null;
}) {
  const all = useParticipants(); // from LiveKit context
  const remotes = all.filter((p) => !p.isLocal); // don't show a mute button for self

  if (!(role === "admin" || role === "moderator")) return null;

  const bulk = (allow: boolean) => {
    if (!socket) return;
    socket.emit(
      "meeting:screenshare:allow-all",
      { allow },
      (ack: { ok: boolean; updated: number; error?: string }) => {
        if (!ack?.ok) console.error(ack?.error || "Bulk screenshare failed");
      }
    );
  };

  return (
    <div className="mt-4">
      <div className="font-semibold mb-2">Participants (Live)</div>

      {/* Bulk controls */}
      <div className="flex items-center gap-2 mb-3">
        <Button
          size="sm"
          onClick={() => bulk(true)}
          disabled={!socket}
          className="bg-neutral-200 hover:bg-neutral-300 text-black"
        >
          Allow screenshare for all
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => bulk(false)}
          disabled={!socket}
        >
          Revoke all
        </Button>
      </div>

      <div className="space-y-2">
        {remotes.length === 0 && (
          <div className="text-sm text-gray-500">
            No remote participants yet.
          </div>
        )}

        {remotes.map((p) => {
          const identity: string = p.identity || "";
          const name: string = p.name || "";
          const email = emailFromParticipant(p);
          const label = name || email || identity;

          const isMe = !!myEmail && email === myEmail.toLowerCase();
          const canAct = !isMe && !!socket; 
          const canMute = !isMe && !!socket; 
          const targetPayload = email
            ? { targetEmail: email }
            : { targetIdentity: identity };

          return (
            <div
              key={identity}
              className="flex items-center justify-between gap-2 border rounded px-2 py-1"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{label}</div>
                {email && (
                  <div className="text-[11px] text-gray-500 truncate">
                    {email}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Mute mic */}
                <button
                  className={`px-2 py-1 rounded text-sm ${
                    canMute
                      ? "bg-neutral-200 hover:bg-neutral-300"
                      : "bg-neutral-100 text-gray-400 cursor-not-allowed"
                  }`}
                  disabled={!canMute}
                  onClick={() => {
                    if (!socket) return;
                    const payload = email
                      ? { targetEmail: email }
                      : { targetIdentity: identity };
                    socket.emit(
                      "meeting:mute-mic",
                      payload,
                      (ack: { ok: boolean; error?: string }) => {
                        if (!ack?.ok)
                          console.error("Mute mic failed:", ack?.error);
                      }
                    );
                  }}
                >
                  Mute mic
                </button>
                {/* Turn off camera */}
                <button
                  className={`px-2 py-1 rounded text-sm ${
                    canMute
                      ? "bg-neutral-200 hover:bg-neutral-300"
                      : "bg-neutral-100 text-gray-400 cursor-not-allowed"
                  }`}
                  disabled={!canMute}
                  onClick={() => {
                    if (!socket) return;
                    const payload = email
                      ? { targetEmail: email }
                      : { targetIdentity: identity };
                    socket.emit(
                      "meeting:camera-off",
                      payload,
                      (ack: { ok: boolean; error?: string }) => {
                        if (!ack?.ok)
                          console.error("Camera off failed:", ack?.error);
                      }
                    );
                  }}
                >
                  Turn off cam
                </button>
                {/* Allow screenshare */}
                <Button
                  size="sm"
                  className="bg-neutral-200 hover:bg-neutral-300 text-black"
                  disabled={!canAct}
                  onClick={() => {
                    if (!socket) return;
                    socket.emit(
                      "meeting:screenshare:allow",
                      { ...targetPayload, allow: true },
                      (ack: { ok: boolean; error?: string }) => {
                        if (!ack?.ok)
                          console.error(
                            "Allow screenshare failed:",
                            ack?.error
                          );
                      }
                    );
                  }}
                >
                  Allow share
                </Button>

                {/* Revoke screenshare */}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!canAct}
                  onClick={() => {
                    if (!socket) return;
                    socket.emit(
                      "meeting:screenshare:allow",
                      { ...targetPayload, allow: false },
                      (ack: { ok: boolean; error?: string }) => {
                        if (!ack?.ok)
                          console.error(
                            "Revoke screenshare failed:",
                            ack?.error
                          );
                      }
                    );
                  }}
                >
                  Revoke
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Bridge: inside LiveKitRoom (where useRoomContext works), disable mic on server push. */
function ForceMuteSelfBridge() {
  const room = useRoomContext();
  useEffect(() => {
    const handler = async () => {
      try {
        if (room?.localParticipant) {
          await room.localParticipant.setMicrophoneEnabled(false);
        }
      } catch (e) {
        console.error("Failed to self force-mute:", e);
      }
    };
    window.addEventListener("amplify:force-mute-self", handler);
    return () => window.removeEventListener("amplify:force-mute-self", handler);
  }, [room]);
  return null;
}

function ForceCameraOffSelfBridge() {
  const room = useRoomContext();
  useEffect(() => {
    const handler = async () => {
      try {
        if (room?.localParticipant) {
          await room.localParticipant.setCameraEnabled(false);
        }
      } catch (e) {
        console.error("Failed to self force-camera-off:", e);
      }
    };
    window.addEventListener("amplify:force-camera-off", handler);
    return () =>
      window.removeEventListener("amplify:force-camera-off", handler);
  }, [room]);
  return null;
}

function RegisterIdentityBridge({
  socket,
  email,
}: {
  socket: Socket | null;
  email?: string;
}) {
  const room = useRoomContext();
  useEffect(() => {
    if (!room || !socket) return;

    const send = () => {
      const id = room.localParticipant?.identity;
      if (id) socket.emit("meeting:register-identity", { identity: id, email });
    };

    if (room.state === "connected") send();
    room.on(RoomEvent.Connected, send);
    return () => {
      room.off(RoomEvent.Connected, send);
    };
  }, [room, socket, email]);
  return null;
}

function ScreenshareControl({
  role,
}: {
  role: "admin" | "moderator" | "participant" | "observer";
}) {
  const room = useRoomContext();
  const [allowed, setAllowed] = useState<boolean>(false);
  const [sharing] = useState(false);

  // compute allowance: moderators/admins always; participants only if canPublishSources includes SCREEN_SHARE(_AUDIO)
  useEffect(() => {
    const lp = room.localParticipant;

    const compute = () => {
      if (role === "admin" || role === "moderator") {
        setAllowed(true);
        return;
      }

      // ✅ make sure this is typed as client-side Track.Source[]
      const sources = (lp.permissions?.canPublishSources ??
        []) as unknown as Track.Source[];

      const can =
        sources.length === 0 || // empty means "all sources allowed"
        sources.includes(Track.Source.ScreenShare) ||
        sources.includes(Track.Source.ScreenShareAudio);

      setAllowed(can);
    };

    compute();
    const onPerms = () => compute();
    room.on(RoomEvent.ParticipantPermissionsChanged, onPerms);
    return () => {
      room.off(RoomEvent.ParticipantPermissionsChanged, onPerms);
    };
  }, [room, role]);

  // listen to server nudge to force-stop local capture
  useEffect(() => {
    const sock = window.__meetingSocket;
    if (!sock) return; // ok: returns void, not a cleanup

    const stop = async () => {
      try {
        await room.localParticipant.setScreenShareEnabled(false);
      } catch {
        // no-op
      }
    };

    // add listener
    sock.on("meeting:force-stop-screenshare", stop);

    // ✅ proper cleanup: remove the listener (returns void)
    return () => {
      sock.off("meeting:force-stop-screenshare", stop);
    };
  }, [room]);

  if (!allowed) return null;

  const toggle = async () => {
    await room.localParticipant.setScreenShareEnabled(!sharing);
  };

  return (
    <Button
      size="sm"
      onClick={toggle}
      title={sharing ? "Stop share" : "Share screen"}
    >
      <ScreenShareIcon />
      <span className="ml-1">{sharing ? "Stop" : "Share"}</span>
    </Button>
  );
}


export default function Meeting() {
  const router = useRouter();

  const { id: sessionId } = useParams();

  // 1) derive role
  const { user } = useGlobalContext(); // dashboard user, if logged in

  const role: UiRole = useMemo(() => {
    // dashboard users
    if (user?.role === "Admin") return "admin";
    if (user?.role === "Moderator") return "moderator";
    if (user?.role === "Observer") return "observer";

    // participant from join flow
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("liveSessionUser");
      if (raw) {
        const u = JSON.parse(raw);
        if (u?.role === "Participant") return "participant";
      }
    }
    // default to participant (or you can redirect)
    return "participant";
  }, [user]);

  // current user's name/email (dashboard or join flow)
  const my = useMemo(() => {
    if (user?.email) {
      return {
        name: user?.firstName || user?.lastName || "",
        email: user.email as string,
        role: (user.role as ServerRole) || "Observer",
      };
    }
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("liveSessionUser");
        const u = raw ? JSON.parse(raw) : {};
        return {
          name: u?.name || "",
          email: (u?.email as string) || "",
          role: (u?.role as ServerRole) || "Participant",
        };
      } catch {
        // ignore
      }
    }
    return { name: "", email: "", role: "Participant" as ServerRole };
  }, [user]);

  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // 🔌 single meeting socket for this page
  const socketRef = useRef<Socket | null>(null);

  // 1) fetch your existing start/join token (reuse your current API)
  useEffect(() => {
    if (!sessionId) return;

    const url = process.env.NEXT_PUBLIC_LIVEKIT_URL!;
    if (!url) {
      console.error("Missing NEXT_PUBLIC_LIVEKIT_URL");
      return;
    }

    // 2) participant branch: use token from waiting-room exchange
    if (role === "participant") {
      const saved =
        typeof window !== "undefined"
          ? sessionStorage.getItem(`lk:${sessionId as string}`)
          : null;

      if (!saved) {
        // they came straight to the meeting (new tab/incognito) → send back
        router.replace(`/waiting-room/participant/${sessionId}`);
        return;
      }
      setToken(saved);
      setWsUrl(url);
      return; // ⛔ do NOT call /token
    }

    // 3) dashboard roles: call cookie-auth /token
    const serverRole: ServerRole =
      role === "admin"
        ? "Admin"
        : role === "moderator"
        ? "Moderator"
        : "Observer";

    (async () => {
      const lkToken = await fetchLiveKitToken(sessionId as string, serverRole); // your axios helper to /token
      if (!lkToken) {
        // if 401, send to login/dashboard as appropriate
        console.error("Failed to get LiveKit token");
        return;
      }
      setToken(lkToken);
      setWsUrl(url);
    })();
  }, [sessionId, role, router]);

  // Connect socket (once we know session + my email)
  useEffect(() => {
    if (!sessionId || !my?.email) return;

    const s = io(SOCKET_URL, {
      path: "/socket.io",
      withCredentials: true,
      query: {
        sessionId: String(sessionId),
        role:
          (user?.role as ServerRole) ||
          (my?.role as ServerRole) ||
          (role === "participant" ? "Participant" : "Observer"),
        name: my?.name || "",
        email: my?.email || "",
      },
    });
    socketRef.current = s;
    window.__meetingSocket = s;
    // When server enforces mute, dispatch event that the bridge listens for
    s.on("meeting:force-mute", (payload: { email?: string }) => {
      // If payload has email and it's not me, ignore; otherwise act.
      if (
        payload?.email &&
        payload.email.toLowerCase() !== (my.email || "").toLowerCase()
      )
        return;
      window.dispatchEvent(new CustomEvent("amplify:force-mute-self"));
    });

    // When server enforces camera off, dispatch event that the bridge listens for
    s.on("meeting:force-camera-off", (payload: { email?: string }) => {
      if (
        payload?.email &&
        payload.email.toLowerCase() !== (my.email || "").toLowerCase()
      )
        return;
      window.dispatchEvent(new CustomEvent("amplify:force-camera-off"));
    });

    return () => {
      s.off("meeting:force-mute");
      s.off("meeting:force-camera-off");
      s.disconnect();
    };
  }, [sessionId, my?.email, my?.name, my?.role, role, user?.role]);

  if (!token || !wsUrl) {
    return (
      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-80px)] p-4">
        <div className="col-span-12 m-auto text-gray-500">Connecting…</div>
      </div>
    );
  }

  // show loader until we have token & wsUrl
  if (!token || !wsUrl) {
    return (
      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-80px)] p-4">
        <div className="col-span-12 m-auto text-gray-500">Connecting…</div>
      </div>
    );
  }

  return (
    <LiveKitRoom token={token} serverUrl={wsUrl}>
      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-80px)] p-4">
        {/* LEFT: moderator/participant sidebar (now inside room context) */}
        <aside className="col-span-3 border rounded p-3 overflow-y-auto">
          <h3 className="font-semibold mb-2">Controls & Waiting Room</h3>
          <ModeratorWaitingPanel />
          <ParticipantsPanel
            role={role}
            socket={socketRef.current}
            myEmail={my?.email || null}
          />
        </aside>

        {/* MIDDLE: LiveKit room visuals */}
        <main className="col-span-6 border rounded p-3 flex flex-col min-h-0">
          <div className="flex flex-col h-full lk-scope">
            <AutoPublishOnConnect role={role} />
            <RegisterIdentityBridge
              socket={socketRef.current}
              email={my?.email || ""}
            />
            <ForceMuteSelfBridge />
            <ForceCameraOffSelfBridge />
            <RoomAudioRenderer />
            <VideoGrid />
            <div className="pt-2 flex items-center justify-between gap-2">
              <ControlBar variation="minimal" />
              <ScreenshareControl role={role} />
            </div>
          </div>
        </main>

        {/* RIGHT: observer chat/media hub — hide for participants */}
        {role !== "participant" ? (
          <aside className="col-span-3 border rounded p-3 overflow-y-auto">
            <h3 className="font-semibold mb-2">Observers</h3>
            {/* observer group chat, names, counts, media hub */}
          </aside>
        ) : (
          <div className="col-span-3" />
        )}
      </div>
    </LiveKitRoom>
  );
}
