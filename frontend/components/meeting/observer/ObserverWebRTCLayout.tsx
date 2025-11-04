"use client";

import { useEffect, useRef, useState } from "react";
import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  useTracks,
  RoomAudioRenderer,
  useRoomContext,
} from "@livekit/components-react";
import { Track, RoomEvent, ConnectionQuality } from "livekit-client";
import { DisconnectReason } from "livekit-client";
import "@livekit/components-styles";
import Logo from "components/shared/LogoComponent";

// Component that subscribes to all video tracks (inside LiveKitRoom context)
function ObserverVideoGrid() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState<{ w: number; h: number }>({
    w: 0,
    h: 0,
  });
  const room = useRoomContext();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (!cr) return;
      setContainerSize({ w: Math.floor(cr.width), h: Math.floor(cr.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Ensure we subscribe to all published tracks when participants join
  useEffect(() => {
    if (!room) return;

    const ensureSubscriptions = () => {
      try {
        for (const participant of room.remoteParticipants.values()) {
          for (const publication of participant.trackPublications.values()) {
            if (
              (publication.source === Track.Source.Camera ||
                publication.source === Track.Source.ScreenShare) &&
              !publication.isSubscribed
            ) {
              publication.setSubscribed(true);
            }
          }
        }
      } catch (err) {
        console.warn("Error ensuring subscriptions:", err);
      }
    };

    // Subscribe when connected
    if (room.state === "connected") {
      ensureSubscriptions();
    }

    // Subscribe when participants connect or publish tracks
    room.on(RoomEvent.ParticipantConnected, ensureSubscriptions);
    room.on(RoomEvent.TrackPublished, ensureSubscriptions);

    return () => {
      room.off(RoomEvent.ParticipantConnected, ensureSubscriptions);
      room.off(RoomEvent.TrackPublished, ensureSubscriptions);
    };
  }, [room]);

  // Subscribe to camera and screen share tracks
  const trackRefs = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: true },
  ]);

  // Filter to only subscribed, non-muted tracks
  const activeTracks = trackRefs.filter((ref) => {
    const pub = ref.publication;
    return !!(pub && pub.isSubscribed && !pub.isMuted && pub.track);
  });

  // Calculate video dimensions to match HLS layout (16:9 aspect ratio)
  const W = containerSize.w;
  const H = containerSize.h;
  const wByH = Math.floor((H * 16) / 9);
  const viewW = Math.min(W, wByH);
  const viewH = Math.floor((viewW * 9) / 16);

  return (
    <div
      ref={containerRef}
      className="flex-1 min-h-0 flex items-center justify-center"
    >
      {activeTracks.length > 0 ? (
        <div
          style={{ width: viewW, height: viewH }}
          className="relative rounded-lg overflow-hidden bg-black"
        >
          <GridLayout tracks={activeTracks}>
            <ParticipantTile />
          </GridLayout>
        </div>
      ) : (
        <div className="m-auto text-gray-500">Waiting for participants...</div>
      )}
    </div>
  );
}

// Connection status component (must be inside LiveKitRoom context)
function ConnectionStatusInner() {
  const room = useRoomContext();
  const [quality, setQuality] = useState<ConnectionQuality>(
    ConnectionQuality.Unknown
  );
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!room) return;

    const updateStatus = () => {
      setIsConnected(room.state === "connected");
      if (room.localParticipant) {
        setQuality(
          room.localParticipant.connectionQuality || ConnectionQuality.Unknown
        );
      }
    };

    updateStatus();

    room.on(RoomEvent.Connected, updateStatus);
    room.on(RoomEvent.Disconnected, updateStatus);
    room.on(RoomEvent.ConnectionQualityChanged, updateStatus);

    return () => {
      room.off(RoomEvent.Connected, updateStatus);
      room.off(RoomEvent.Disconnected, updateStatus);
      room.off(RoomEvent.ConnectionQualityChanged, updateStatus);
    };
  }, [room]);

  const qualityColors: Record<ConnectionQuality, string> = {
    [ConnectionQuality.Excellent]: "bg-green-500",
    [ConnectionQuality.Good]: "bg-green-400",
    [ConnectionQuality.Poor]: "bg-yellow-500",
    [ConnectionQuality.Lost]: "bg-red-500",
    [ConnectionQuality.Unknown]: "bg-gray-400",
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      <span
        className={`inline-block h-2 w-2 rounded-full ${
          qualityColors[quality]
        }`}
      />
      <span>{isConnected ? "Connected" : "Connecting..."}</span>
    </div>
  );
}

interface ObserverWebRTCLayoutProps {
  token: string;
  serverUrl: string;
  onError?: (error: Error) => void;
}

export default function ObserverWebRTCLayout({
  token,
  serverUrl,
  onError,
}: ObserverWebRTCLayoutProps) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (error && onError) {
      onError(new Error(error));
    }
  }, [error, onError]);

  return (
    <div className="w-full h-full rounded-xl bg-white overflow-hidden flex flex-col">
      {error ? (
        <>
          <div className="flex items-center justify-between px-1 pb-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
                <span>Disconnected</span>
              </div>
              <span className="rounded-full bg-custom-dark-blue-1 text-white text-xs px-3 py-1">
                Observer View 
              </span>
            </div>
            <div className="flex items-center">
              <Logo />
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center text-red-500">
            Connection error: {error}
          </div>
        </>
      ) : (
        <LiveKitRoom
          token={token}
          serverUrl={serverUrl}
          video={false}
          audio={false}
          connect={true}
          options={{
            adaptiveStream: true,
            dynacast: true,
          }}
          onError={(err) => {
            console.error("LiveKit connection error:", err);
            // Ignore "Client initiated disconnect" errors (normal on unmount)
            if (!err?.message?.includes("Client initiated disconnect")) {
              setError(err?.message || "Connection failed");
            }
          }}
          onDisconnected={(reason) => {
            console.log("LiveKit disconnected:", reason);
            // Only set error if it's not a normal, client-initiated disconnect
            if (reason && reason !== DisconnectReason.CLIENT_INITIATED) {
              setError(`Disconnected: ${String(reason)}`);
            }
          }}
        >
          <div className="w-full h-full flex flex-col">
            <div className="flex items-center justify-between px-1 pb-2">
              <div className="flex items-center gap-3">
                <ConnectionStatusInner />
                <span className="rounded-full bg-custom-dark-blue-1 text-white text-xs px-3 py-1">
                  Observer View
                </span>
              </div>
              <div className="flex items-center">
                <Logo />
              </div>
            </div>
            <ObserverVideoGrid />
            <RoomAudioRenderer />
          </div>
        </LiveKitRoom>
      )}
    </div>
  );
}
