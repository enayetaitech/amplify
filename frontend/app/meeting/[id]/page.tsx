"use client";

import ModeratorWaitingPanel from "components/meeting/waitingRoom";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks,
  useRoomContext,
  ControlBar,
} from "@livekit/components-react";
import { Track, RoomEvent } from "livekit-client";
import api from "lib/api";
import { ApiResponse } from "@shared/interface/ApiResponseInterface";
import "@livekit/components-styles";
import "./meeting.css";
import { useGlobalContext } from "context/GlobalContext";


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

  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

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
        const saved = typeof window !== "undefined"
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
      role === "admin" ? "Admin" :
      role === "moderator" ? "Moderator" : "Observer";

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

  return (
    <div className="grid grid-cols-12 gap-4 h-[calc(100vh-80px)] p-4">
      {/* LEFT: your moderator/participant sidebar */}
      <aside className="col-span-3 border rounded p-3 overflow-y-auto">
        <h3 className="font-semibold mb-2">Controls & Waiting Room</h3>
        <ModeratorWaitingPanel />
        {/* your admit/remove/move/mute/screen-share/whiteboard/stream controls go here */}
      </aside>

      {/* MIDDLE: LiveKit room */}
      <main className="col-span-6 border rounded p-3 flex flex-col min-h-0">
        {!token || !wsUrl ? (
          <div className="m-auto text-gray-500">Connecting…</div>
        ) : (
          <LiveKitRoom token={token} serverUrl={wsUrl}>
            <div className="flex flex-col h-full lk-scope">
              <AutoPublishOnConnect role={role} />
              <RoomAudioRenderer />
              <VideoGrid />
              <div className="pt-2">
                <ControlBar variation="minimal" />
              </div>
            </div>
          </LiveKitRoom>
        )}
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
  );
}
