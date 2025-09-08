"use client";

import ModeratorWaitingPanel from "components/meeting/waitingRoom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
import Hls from "hls.js";
import api from "lib/api";
import { ApiResponse } from "@shared/interface/ApiResponseInterface";
import "@livekit/components-styles";
import "./meeting.css";
import { useGlobalContext } from "context/GlobalContext";
import { flagsFromSearchParams } from "constant/featureFlags";

import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "constant/socket";
import { Button } from "../../../components/ui/button";
import { toast } from "sonner";

declare global {
  interface Window {
    __meetingSocket?: Socket; // already created elsewhere in your app
  }
}

import {
  UiRole,
  ServerRole,
  toServerRole,
  normalizeUiRole,
  normalizeServerRole,
} from "constant/roles";
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
  const [busy, setBusy] = useState<null | "start" | "stop">(null);
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

  const canControlStream = role === "admin" || role === "moderator";

  const onStartStream = () => {
    if (!socket) return;
    setBusy("start");
    socket.emit(
      "meeting:stream:start",
      {},
      (ack?: { ok?: boolean; error?: string }) => {
        setBusy(null);
        if (ack?.ok) toast.success("Streaming started");
        else toast.error(ack?.error || "Failed to start streaming");
      }
    );
  };

  const onStopStream = () => {
    if (!socket) return;
    setBusy("stop");
    socket.emit(
      "meeting:stream:stop",
      {},
      (ack?: { ok?: boolean; error?: string }) => {
        setBusy(null);
        if (ack?.ok) toast.success("Streaming stopped");
        else toast.error(ack?.error || "Failed to stop streaming");
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
        {canControlStream && (
          <div className="mb-3 flex items-center gap-2">
            <Button onClick={onStartStream} disabled={busy === "start"}>
              Start Stream
            </Button>
            <Button
              variant="destructive"
              onClick={onStopStream}
              disabled={busy === "stop"}
            >
              Stop Stream
            </Button>
          </div>
        )}
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
  const [sharing, setSharing] = useState(false);

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

  useEffect(() => {
    const lp = room.localParticipant;
    if (!lp) return;

    const compute = () => {
      const hasShare =
        lp
          .getTrackPublications()
          .some((pub) => pub.source === Track.Source.ScreenShare) ||
        lp
          .getTrackPublications()
          .some((pub) => pub.source === Track.Source.ScreenShareAudio);
      setSharing(hasShare);
    };

    compute();

    const onPub = () => compute();
    const onUnpub = () => compute();

    room.on(RoomEvent.LocalTrackPublished, onPub);
    room.on(RoomEvent.LocalTrackUnpublished, onUnpub);
    return () => {
      room.off(RoomEvent.LocalTrackPublished, onPub);
      room.off(RoomEvent.LocalTrackUnpublished, onUnpub);
    };
  }, [room]);

  const toggle = async () => {
    await room.localParticipant.setScreenShareEnabled(!sharing);
  };

  if (!allowed) return null;

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
  const searchParams = useSearchParams();
  const featureFlags = useMemo(
    () => flagsFromSearchParams(searchParams),
    [searchParams]
  );

  const { id: sessionId } = useParams();

  // 1) derive role
  const { user } = useGlobalContext(); // dashboard user, if logged in

  const role: UiRole = useMemo(() => {
    // dashboard users
    const dashboardServer = normalizeServerRole(user?.role);
    if (dashboardServer)
      return dashboardServer === "Observer"
        ? "observer"
        : dashboardServer === "Moderator"
        ? "moderator"
        : dashboardServer === "Admin"
        ? "admin"
        : "participant";

    // honor query param role when provided (e.g., from observer join flow)
    const qp = searchParams?.get("role");
    const qpUi = normalizeUiRole(qp);
    if (qpUi) return qpUi;

    // participant from join flow
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("liveSessionUser");
      if (raw) {
        const u = JSON.parse(raw);
        const storedServer = normalizeServerRole(u?.role);
        if (storedServer)
          return storedServer === "Observer"
            ? "observer"
            : storedServer === "Moderator"
            ? "moderator"
            : storedServer === "Admin"
            ? "admin"
            : "participant";
      }
    }
    // default to participant (or you can redirect)
    return "participant";
  }, [user, searchParams]);

  const serverRole: ServerRole = useMemo(() => toServerRole(role), [role]);

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
  const [hlsUrl, setHlsUrl] = useState<string | null>(null);

  // 🔌 single meeting socket for this page
  const socketRef = useRef<Socket | null>(null);

  // 1) fetch start/join token (participants/admin/mod) OR HLS url (observers)
  useEffect(() => {
    if (!sessionId) return;

    const url = process.env.NEXT_PUBLIC_LIVEKIT_URL!;
    if (!url) {
      console.error("Missing NEXT_PUBLIC_LIVEKIT_URL");
      return;
    }

    // participants: use token from waiting-room exchange
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

    // observers: fetch HLS url (no LiveKit token needed)
    if (role === "observer") {
      (async () => {
        try {
          const res = await api.get<ApiResponse<{ url: string }>>(
            `/api/v1/livekit/${sessionId as string}/hls`
          );
          const u = res.data?.data?.url || null;
          if (!u) {
            router.replace(`/waiting-room/observer/${sessionId}`);
            return;
          }
          setHlsUrl(u);
        } catch {
          router.replace(`/waiting-room/observer/${sessionId}`);
        }
      })();
      return;
    }

    // admin/moderator: call cookie-auth /token
    (async () => {
      const lkToken = await fetchLiveKitToken(sessionId as string, serverRole);
      if (!lkToken) {
        console.error("Failed to get LiveKit token");
        return;
      }
      setToken(lkToken);
      setWsUrl(url);
    })();
  }, [sessionId, role, serverRole, router]);

  // Connect socket (once we know session)
  useEffect(() => {
    if (!sessionId) return;

    const s = io(SOCKET_URL, {
      path: "/socket.io",
      withCredentials: true,
      query: {
        sessionId: String(sessionId),
        role: serverRole,
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
  }, [sessionId, my?.email, my?.name, serverRole]);

  // If observer and stream stops, route back to observer waiting room
  useEffect(() => {
    if (role !== "observer") return;
    const s = window.__meetingSocket;
    if (!s) return;
    const onStopped = () => {
      router.replace(`/waiting-room/observer/${sessionId}`);
    };
    s.on("observer:stream:stopped", onStopped);
    return () => {
      s.off("observer:stream:stopped", onStopped);
    };
  }, [role, router, sessionId]);

  // Observer view: render HLS player when URL is available
  if (role === "observer") {
    if (!hlsUrl) {
      return (
        <div className="grid grid-cols-12 gap-4 h-[calc(100vh-80px)] p-4">
          <div className="col-span-12 m-auto text-gray-500">
            Loading stream…
          </div>
        </div>
      );
    }

    // HLS player with warmup (like full_livekit_code.md)
    return <ObserverHlsLayout hlsUrl={hlsUrl} />;
  }

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
          {/* Example data attr to confirm flags available */}
          <div data-breakouts={featureFlags.breakoutsEnabled ? "1" : "0"} />
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
            {(role === "admin" || role === "moderator") &&
              featureFlags.breakoutsEnabled && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Breakouts</h4>
                  {/* You can render your BreakoutsPanel component here when available */}
                  {/* <BreakoutsPanel parentRoom={String(sessionId)} role={role} /> */}
                  <Button size="sm">Create Breakout</Button>
                </div>
              )}
          </aside>
        ) : (
          <div className="col-span-3" />
        )}
      </div>
    </LiveKitRoom>
  );
}

function ObserverHlsLayout({ hlsUrl }: { hlsUrl: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hlsUrl) return;

    let cleanup: (() => void) | null = null;

    const ping = async (src: string) => {
      for (let i = 0; i < 10; i++) {
        try {
          const r = await fetch(src, { method: "HEAD", cache: "no-store" });
          if (r.ok) return true;
        } catch {}
        await new Promise((r) => setTimeout(r, 1000));
      }
      return false;
    };

    (async () => {
      await ping(hlsUrl);
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = hlsUrl;
        try {
          await video.play();
        } catch {}
        return;
      }
      if (Hls.isSupported()) {
        const hls = new Hls({
          liveDurationInfinity: true,
          liveSyncDurationCount: 3,
          maxLiveSyncPlaybackRate: 1.2,
        });
        hls.loadSource(hlsUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (data.fatal) {
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
            if (data.type === Hls.ErrorTypes.MEDIA_ERROR)
              hls.recoverMediaError();
          }
        });
        try {
          await video.play();
        } catch {}
        cleanup = () => hls.destroy();
      }
    })();

    return () => {
      if (cleanup) cleanup();
    };
  }, [hlsUrl]);

  return (
    <div className="grid grid-cols-12 gap-4 h-[calc(100vh-80px)] p-4">
      <div className="col-span-9 border rounded p-3 flex flex-col min-h-0">
        <video
          ref={videoRef}
          controls
          playsInline
          autoPlay
          crossOrigin="anonymous"
          className="w-full h-full"
        />
      </div>
      <aside className="col-span-3 border rounded p-3 overflow-y-auto">
        <h3 className="font-semibold mb-2">Observers</h3>
      </aside>
    </div>
  );
}
