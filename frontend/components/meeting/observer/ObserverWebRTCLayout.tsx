"use client";

import { useEffect, useRef, useState, useMemo } from "react";
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
import type { Socket } from "socket.io-client";
import WhiteboardPanel from "components/whiteboard/WhiteboardPanel";
import VideoFilmstrip from "../VideoFilmstrip";

// Custom tile component that shows formatted names from socket
function CustomParticipantTile({
  trackRef,
}: {
  trackRef: ReturnType<typeof useTracks>[number];
}) {
  return (
    <div className="w-full h-full">
      <div className="observer-tile-wrapper relative h-full w-full">
        <ParticipantTile trackRef={trackRef} mirror={false} />
      </div>
    </div>
  );
}

// Component for video tiles in observer screen share layout (20% width)
// Maintains 16:9 aspect ratio like admin view
function ObserverVideoTilesColumn({
  tracks,
  containerHeight,
}: {
  tracks: ReturnType<typeof useTracks>;
  containerHeight: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const gap = 8; // Match admin view gap
  const minTileW = 240; // Match admin view minimum tile width

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (!cr) return;
      setContainerWidth(Math.floor(cr.width));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const count = tracks.length;
  if (count === 0) return null;

  // Use a fallback width if containerWidth hasn't been measured yet
  const effectiveWidth = containerWidth > 0 ? containerWidth : 220; // min-w-[220px] fallback

  // Calculate optimal layout with 16:9 aspect ratio (similar to admin view)
  let cols = 1;

  if (count <= 5) {
    // 1-5 people: single column
    cols = 1;
  } else if (count === 6) {
    // 6 people: 2 columns, 3 rows per column
    cols = 2;
  } else if (count === 7) {
    // 7 people: 2 columns, 4 in first, 3 in second
    cols = 2;
  } else if (count <= 9) {
    // 8-9 people: 2 columns
    cols = 2;
  } else {
    // 10+ people: 3 columns
    cols = 3;
  }

  // Distribute tracks across columns
  const tracksPerCol = Math.ceil(count / cols);
  const columns: (typeof tracks)[] = [];
  for (let c = 0; c < cols; c++) {
    columns.push(tracks.slice(c * tracksPerCol, (c + 1) * tracksPerCol));
  }

  return (
    <div
      ref={containerRef}
      className="flex-[1] min-w-[220px] min-h-0 overflow-y-auto"
    >
      <div className="w-full h-full flex gap-1" style={{ gap: `${gap}px` }}>
        {columns.map((colTracks, colIdx) => {
          // For columns with different row counts (e.g., 7 people), recalculate per column
          const actualRows = colTracks.length;
          const colEffectiveWidth =
            containerWidth > 0 ? containerWidth : effectiveWidth;
          const availableW = Math.floor(
            (colEffectiveWidth - gap * (cols - 1)) / cols
          );
          const availableH = containerHeight - gap * (actualRows - 1);
          const rawTileH = Math.floor(availableH / actualRows);
          const fitW = Math.min(availableW, Math.floor((rawTileH * 16) / 9));
          const colTileW = Math.max(minTileW, fitW);
          const colTileH = Math.floor((colTileW * 9) / 16);

          return (
            <div
              key={colIdx}
              className="flex-1 flex flex-col items-center"
              style={{ gap: `${gap}px` }}
            >
              {colTracks.map((tr) => (
                <div
                  key={`${tr.participant?.identity}-${tr.publication?.trackSid}`}
                  className="relative overflow-hidden rounded bg-black flex-shrink-0 w-full"
                  style={{
                    width: `${colTileW}px`,
                    height: `${colTileH}px`,
                  }}
                >
                  <CustomParticipantTile trackRef={tr} />
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Component that subscribes to all video tracks (inside LiveKitRoom context)
function ObserverVideoGrid() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const shareContainerRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState<{ w: number; h: number }>({
    w: 0,
    h: 0,
  });
  const [shareContainerSize, setShareContainerSize] = useState<{
    w: number;
    h: number;
  }>({ w: 0, h: 0 });
  const gap = 8; // Match admin view gap
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

  useEffect(() => {
    const el = shareContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (!cr) return;
      setShareContainerSize({
        w: Math.floor(cr.width),
        h: Math.floor(cr.height),
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Map identity to formatted name from socket info
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

  // Filter to only subscribed tracks (include muted tracks with placeholders)
  // This matches the admin view behavior - show tracks even if muted
  const activeTracks = trackRefs.filter((ref) => {
    const pub = ref.publication;
    // Include if subscribed (track may be null if muted, but placeholder will show)
    return !!(pub && pub.isSubscribed);
  });

  // Helper: parse role from participant metadata
  const roleFromMetadata = (meta?: string | null): string | null => {
    if (!meta) return null;
    try {
      const obj = JSON.parse(meta);
      const raw = (obj?.role || obj?.userRole || obj?.serverRole) as unknown;
      return typeof raw === "string" ? raw : null;
    } catch {
      return null;
    }
  };

  // Include only Admin, Moderator, and Participant (exclude Observer)
  const shouldInclude = (ref: {
    participant?: { metadata?: string | null };
  }): boolean => {
    const meta = ref.participant?.metadata as string | null | undefined;
    const role = roleFromMetadata(meta)?.toLowerCase() || null;
    // Explicitly include Admin, Moderator, Participant
    // If role is null/undefined, include it (likely a participant without metadata)
    if (!role) return true; // Include if role cannot be determined
    return role === "admin" || role === "moderator" || role === "participant";
  };

  const cameraRefs = activeTracks.filter((r) => {
    const pub = r.publication;
    if (!pub || pub.source !== Track.Source.Camera) return false;
    if (!shouldInclude(r)) return false;
    return pub.isMuted === false && !!pub.track;
  });
  const screenshareRefs = activeTracks.filter(
    (r) =>
      r.publication?.source === Track.Source.ScreenShare && shouldInclude(r)
  );

  // If someone is screen sharing, prioritize that share and show it at 80% width.
  const hasScreenShare = screenshareRefs.length > 0;

  // Include all cameras in the right-side list, including the sharer's camera
  const cameraRefsForGrid = cameraRefs;

  // Decide auto grid size (snap up to 2/4/8/16) for non-screenshare view
  const desired = cameraRefsForGrid.length;
  const gridSteps = [2, 4, 8, 16];
  const gridSize = gridSteps.find((n) => desired <= n) || 16;

  // Map gridSize to columns/rows
  const gridToColsRows: Record<number, { cols: number; rows: number }> = {
    2: { cols: 2, rows: 1 },
    4: { cols: 2, rows: 2 },
    8: { cols: 4, rows: 2 },
    16: { cols: 4, rows: 4 },
  };
  const { cols, rows } = gridToColsRows[gridSize];

  // Calculate video dimensions to match HLS layout (16:9 aspect ratio) for non-screenshare view
  const W = containerSize.w;
  const H = containerSize.h;
  const wByH = Math.floor((H * 16) / 9);
  const viewW = Math.min(W, wByH);
  const viewH = Math.floor((viewW * 9) / 16);

  const shareVideoSize = useMemo(() => {
    const { w, h } = shareContainerSize;
    if (!w || !h) {
      return { w: 0, h: 0 };
    }
    const widthBoundByHeight = Math.floor((h * 16) / 9);
    const finalWidth = Math.min(w, widthBoundByHeight);
    const finalHeight = Math.floor((finalWidth * 9) / 16);
    return { w: finalWidth, h: finalHeight };
  }, [shareContainerSize]);

  return (
    <div
      ref={containerRef}
      className="flex-1 min-h-0 flex items-center justify-center"
    >
      {activeTracks.length > 0 ? (
        hasScreenShare ? (
          // Split layout: 80% screen share on the left, 20% participant grid on the right
          // Use flexbox for fluid responsive design (no aspect ratio constraint)
          <div className="w-full h-full flex" style={{ gap: `${gap}px` }}>
            {/* Screen share: 80% width - fills available space */}
            <div
              className="flex-[4] min-w-0 min-h-0 flex items-center justify-center"
              ref={shareContainerRef}
            >
              <div className="w-full h-full relative rounded-lg overflow-hidden bg-black flex items-center justify-center">
                <div
                  className="relative rounded-lg overflow-hidden"
                  style={
                    shareVideoSize.w && shareVideoSize.h
                      ? {
                          width: `${shareVideoSize.w}px`,
                          height: `${shareVideoSize.h}px`,
                        }
                      : { width: "95%", height: "95%" }
                  }
                >
                  <GridLayout tracks={[screenshareRefs[0]]}>
                    <ParticipantTile />
                  </GridLayout>
                </div>
              </div>
            </div>
            {/* Video tiles: 20% width - maximize height usage */}
            {cameraRefsForGrid.length > 0 && (
              <ObserverVideoTilesColumn
                tracks={cameraRefsForGrid}
                containerHeight={containerSize.h}
              />
            )}
          </div>
        ) : (
          // No screenshare: centered grid that snaps to 2/4/8/16
          <div
            style={{ width: viewW, height: viewH }}
            className="relative rounded-lg overflow-hidden bg-black"
          >
            <div
              className="w-full h-full grid gap-1 p-1"
              style={{
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
              }}
            >
              {cameraRefsForGrid.slice(0, gridSize).map((tr) => (
                <div
                  key={`${tr.participant?.identity}-${tr.publication?.trackSid}`}
                  className="relative overflow-hidden rounded bg-black"
                >
                  <CustomParticipantTile trackRef={tr} />
                </div>
              ))}
            </div>
          </div>
        )
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
        className={`inline-block h-2 w-2 rounded-full ${qualityColors[quality]}`}
      />
      <span>{isConnected ? "Connected" : "Connecting..."}</span>
    </div>
  );
}

interface ObserverWebRTCLayoutProps {
  token: string;
  serverUrl: string;
  onError?: (error: Error) => void;
  socket?: Socket;
  sessionId: string;
  isWhiteboardOpen: boolean;
}

export default function ObserverWebRTCLayout({
  token,
  serverUrl,
  onError,
  socket,
  sessionId,
  isWhiteboardOpen,
}: ObserverWebRTCLayoutProps) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (error && onError) {
      onError(new Error(error));
    }
  }, [error, onError]);

  return (
    <>
      <style>{`
        .observer-webrtc-layout .lk-participant-metadata {
          color: #fff !important;
        }
      `}</style>
      <div className="w-full h-full rounded-xl bg-white overflow-hidden flex flex-col observer-webrtc-layout">
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
              {isWhiteboardOpen ? (
                <div className="flex-1 min-h-0 flex gap-3">
                  <div className="flex-[4] min-w-0 min-h-0 rounded bg-white p-2 flex flex-col h-full">
                    <div className="flex-1 min-h-0">
                      <WhiteboardPanel
                        sessionId={sessionId}
                        socket={socket}
                        role="Observer"
                        hideToolbar
                      />
                    </div>
                  </div>
                  <div className="flex-[1] min-w-[220px] max-w-[420px] min-h-0 rounded bg-white p-2 overflow-hidden">
                    <div className="h-full">
                      <VideoFilmstrip />
                    </div>
                  </div>
                </div>
              ) : (
                <ObserverVideoGrid />
              )}
              <RoomAudioRenderer />
            </div>
          </LiveKitRoom>
        )}
      </div>
    </>
  );
}
