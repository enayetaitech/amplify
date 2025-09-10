"use client";

import ModeratorWaitingPanel from "components/meeting/waitingRoom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  ControlBar,
} from "@livekit/components-react";
//
import api from "lib/api";
import { ApiResponse } from "@shared/interface/ApiResponseInterface";
import "@livekit/components-styles";
import "./meeting.css";
import { useGlobalContext } from "context/GlobalContext";
import { flagsFromSearchParams } from "constant/featureFlags";
import { safeLocalGet } from "utils/storage";

import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "constant/socket";
import BreakoutsPanel from "components/meeting/BreakoutsPanel";
import AutoPublishOnConnect from "components/meeting/AutoPublishOnConnect";
import VideoGrid from "components/meeting/VideoGrid";
import SubscribeCameraBridge from "components/meeting/SubscribeCameraBridge";
import ParticipantsPanel from "components/meeting/ParticipantsPanel";
import ForceMuteSelfBridge from "components/meeting/ForceMuteSelfBridge";
import ForceCameraOffSelfBridge from "components/meeting/ForceCameraOffSelfBridge";
import RegisterIdentityBridge from "components/meeting/RegisterIdentityBridge";
import ScreenshareControl from "components/meeting/ScreenshareControl";
import ObserverBreakoutSelect from "components/meeting/ObserverBreakoutSelect";

declare global {
  interface Window {
    __meetingSocket?: Socket;
  }
}
import {
  UiRole,
  ServerRole,
  toServerRole,
  normalizeUiRole,
  normalizeServerRole,
} from "constant/roles";

type LocalJoinUser = {
  name?: string;
  email?: string;
  role?: ServerRole | string;
};

async function fetchLiveKitToken(sessionId: string, role: ServerRole) {
  const res = await api.post<ApiResponse<{ token: string }>>(
    "/api/v1/livekit/token",
    {
      roomName: sessionId,
      role,
    }
  );
  return res.data.data.token;
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
  const { user } = useGlobalContext();

  const role: UiRole = useMemo(() => {
    const dashboardServer = normalizeServerRole(user?.role);
    if (dashboardServer)
      return dashboardServer === "Observer"
        ? "observer"
        : dashboardServer === "Moderator"
        ? "moderator"
        : dashboardServer === "Admin"
        ? "admin"
        : "participant";

    const qp = searchParams?.get("role");
    const qpUi = normalizeUiRole(qp);
    if (qpUi) return qpUi;

    const u = safeLocalGet<LocalJoinUser>("liveSessionUser");
    if (u) {
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
    const u = safeLocalGet<LocalJoinUser>("liveSessionUser") || {};
    return {
      name: u?.name || "",
      email: (u?.email as string) || "",
      role: (u?.role as ServerRole) || "Participant",
    };
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

    if (role === "participant") {
      const saved =
        typeof window !== "undefined"
          ? sessionStorage.getItem(`lk:${sessionId as string}`)
          : null;

      if (!saved) {
        router.replace(`/waiting-room/participant/${sessionId}`);
        return;
      }
      setToken(saved);
      setWsUrl(url);
      return;
    }

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
    s.on("meeting:force-mute", (payload: { email?: string }) => {
      if (
        payload?.email &&
        payload.email.toLowerCase() !== (my.email || "").toLowerCase()
      )
        return;
      window.dispatchEvent(new CustomEvent("amplify:force-mute-self"));
    });

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

  // Observer view
  if (role === "observer") {
    return (
      <ObserverBreakoutSelect
        sessionId={String(sessionId)}
        initialMainUrl={hlsUrl}
      />
    );
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
          <div data-breakouts={featureFlags.breakoutsEnabled ? "1" : "0"} />
        </aside>

        {/* MIDDLE: LiveKit room visuals */}
        <main className="col-span-6 border rounded p-3 flex flex-col min-h-0">
          <div className="flex flex-col h-full lk-scope">
            <AutoPublishOnConnect role={role} />
            <SubscribeCameraBridge />
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
            {(role === "admin" || role === "moderator") &&
              featureFlags.breakoutsEnabled && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Breakouts</h4>
                  <BreakoutsPanel sessionId={String(sessionId)} role={role} />
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
