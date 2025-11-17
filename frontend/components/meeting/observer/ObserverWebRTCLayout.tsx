"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  useTracks,
  RoomAudioRenderer,
  useRoomContext,
  useTrackRefContext,
  useParticipants,
} from "@livekit/components-react";
import { Track, RoomEvent, ConnectionQuality } from "livekit-client";
import { DisconnectReason } from "livekit-client";
import "@livekit/components-styles";
import Logo from "components/shared/LogoComponent";
import { formatParticipantName } from "utils/formatParticipantName";
import { isWhiteboardTrackRef } from "utils/livekitTracks";

// Custom tile component that shows formatted names from socket
function CustomParticipantTile({
  identityToName,
}: {
  identityToName: Record<string, string>;
}) {
  const trackRef = useTrackRefContext();
  const identity = trackRef.participant?.identity || "";
  const name = identityToName[identity] || identity;

  return (
    <>
      <style>{`
        .observer-tile-wrapper .lk-participant-metadata {
          display: none !important;
        }
      `}</style>
      <div className="relative w-full h-full observer-tile-wrapper">
        <ParticipantTile trackRef={trackRef} />
        {/* Name overlay */}
        <div className="absolute left-2 bottom-2 max-w-[calc(100%-16px)] z-50">
          <span
            className="inline-block max-w-full truncate rounded bg-black/60 px-2 py-1 text-xs text-white"
            title={name}
          >
            {name}
          </span>
        </div>
      </div>
    </>
  );
}

// Component for video tiles in observer screen share layout (20% width)
// Maintains 16:9 aspect ratio like admin view
function ObserverVideoTilesColumn({
  tracks,
  containerHeight,
  identityToName,
}: {
  tracks: ReturnType<typeof useTracks>;
  containerHeight: number;
  identityToName: Record<string, string>;
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
                  <div className="w-full h-full">
                    <GridLayout tracks={[tr]}>
                      <CustomParticipantTile identityToName={identityToName} />
                    </GridLayout>
                  </div>
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
  const [containerSize, setContainerSize] = useState<{ w: number; h: number }>({
    w: 0,
    h: 0,
  });
  const gap = 8; // Match admin view gap
  const room = useRoomContext();
  const participants = useParticipants();
  const [socketParticipantInfo, setSocketParticipantInfo] = useState<
    Record<
      string,
      {
        name: string;
        email: string;
        role: string;
        firstName: string;
        lastName: string;
      }
    >
  >({});

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

  // Listen for socket-based participant info updates
  useEffect(() => {
    const sock =
      typeof window !== "undefined"
        ? (
            window as unknown as {
              __meetingSocket?: {
                on?: (ev: string, cb: (p?: unknown) => void) => void;
                off?: (ev: string, cb: (p?: unknown) => void) => void;
                emit?: (
                  ev: string,
                  payload: unknown,
                  ack?: (resp: unknown) => void
                ) => void;
              };
            }
          ).__meetingSocket || null
        : null;
    if (!sock) return;

    // Request initial participant list
    if (sock.emit && typeof sock.emit === "function") {
      sock.emit("meeting:get-participants-info", (resp?: unknown) => {
        try {
          const r = resp as {
            participants?: Array<{
              identity: string;
              name: string;
              email: string;
              role: string;
              firstName: string;
              lastName: string;
            }>;
          };
          if (r?.participants && Array.isArray(r.participants)) {
            const infoMap: Record<
              string,
              {
                name: string;
                email: string;
                role: string;
                firstName: string;
                lastName: string;
              }
            > = {};
            for (const p of r.participants) {
              infoMap[p.identity.toLowerCase()] = {
                name: p.name,
                email: p.email,
                role: p.role,
                firstName: p.firstName || "",
                lastName: p.lastName || "",
              };
            }
            setSocketParticipantInfo((prev) => ({ ...prev, ...infoMap }));
          }
        } catch {}
      });
    }

    // Listen for participant info updates
    const onParticipantInfo = (payload?: unknown) => {
      try {
        const p = payload as {
          identity?: string;
          name?: string;
          email?: string;
          role?: string;
          firstName?: string;
          lastName?: string;
        };
        if (p?.identity && p.name) {
          setSocketParticipantInfo((prev) => ({
            ...prev,
            [p.identity!.toLowerCase()]: {
              name: p.name!,
              email: p.email || "",
              role: p.role || "",
              firstName: p.firstName || "",
              lastName: p.lastName || "",
            },
          }));
        }
      } catch {}
    };

    // Listen for participant removal
    const onParticipantRemoved = (payload?: unknown) => {
      try {
        const p = payload as { identity?: string };
        if (p?.identity) {
          setSocketParticipantInfo((prev) => {
            const next = { ...prev };
            delete next[p.identity!.toLowerCase()];
            return next;
          });
        }
      } catch {}
    };

    if (sock.on && typeof sock.on === "function") {
      sock.on("meeting:participant-info", onParticipantInfo);
      sock.on("meeting:participant-removed", onParticipantRemoved);
    }

    return () => {
      if (sock.off && typeof sock.off === "function") {
        sock.off("meeting:participant-info", onParticipantInfo);
        sock.off("meeting:participant-removed", onParticipantRemoved);
      }
    };
  }, []);

  // Map identity to formatted name from socket info
  const identityToName: Record<string, string> = useMemo(() => {
    const map: Record<string, string> = {};
    for (const participant of participants) {
      const identity = participant.identity || "";
      if (!identity) continue;

      // Prefer socket-based name, fallback to LiveKit name
      const socketInfo = socketParticipantInfo[identity.toLowerCase()];
      if (socketInfo) {
        // Format from firstName/lastName first
        const formattedName = formatParticipantName(
          socketInfo.firstName,
          socketInfo.lastName
        );
        // If formatted name exists, use it; otherwise fall back to socketInfo.name
        map[identity] = formattedName || socketInfo.name || identity;
      } else {
        // Fallback to LiveKit participant name
        map[identity] = participant.name || identity;
      }
    }

    return map;
  }, [participants, socketParticipantInfo]);

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

  const filteredTrackRefs = useMemo(
    () =>
      trackRefs.filter((ref) => {
        if (ref.publication?.source !== Track.Source.ScreenShare) return true;
        return !isWhiteboardTrackRef(ref);
      }),
    [trackRefs]
  );

  // Filter to only subscribed tracks (include muted tracks with placeholders)
  // This matches the admin view behavior - show tracks even if muted
  const activeTracks = filteredTrackRefs.filter((ref) => {
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

  const cameraRefs = activeTracks.filter(
    (r) => r.publication?.source === Track.Source.Camera && shouldInclude(r)
  );
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
            <div className="flex-[4] min-w-0 min-h-0">
              <div className="w-full h-full relative rounded-lg overflow-hidden bg-black">
                <GridLayout tracks={[screenshareRefs[0]]}>
                  <ParticipantTile />
                </GridLayout>
              </div>
            </div>
            {/* Video tiles: 20% width - maximize height usage */}
            {cameraRefsForGrid.length > 0 && (
              <ObserverVideoTilesColumn
                tracks={cameraRefsForGrid}
                containerHeight={containerSize.h}
                identityToName={identityToName}
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
                  <GridLayout tracks={[tr]}>
                    <CustomParticipantTile identityToName={identityToName} />
                  </GridLayout>
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
    <>
      <style>{`
        .observer-webrtc-layout .lk-participant-metadata {
          display: none !important;
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
              <ObserverVideoGrid />
              <RoomAudioRenderer />
            </div>
          </LiveKitRoom>
        )}
      </div>
    </>
  );
}
