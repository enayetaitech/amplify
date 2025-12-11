"use client";

import React, {
  useMemo,
  useState,
  useCallback,
  useRef,
  useEffect,
  createContext,
  useContext,
  memo,
} from "react";
import {
  ParticipantTile,
  useParticipants,
  useTracks,
  TrackLoop,
  useVisualStableUpdate,
} from "@livekit/components-react";
import { useTrackRefContext } from "@livekit/components-react";
import type { TrackReferenceOrPlaceholder } from "@livekit/components-react";
import type { Participant } from "livekit-client";
import { Track } from "livekit-client";
import { Badge } from "components/ui/badge";
import { Avatar, AvatarFallback } from "components/ui/avatar";
import {
  normalizeServerRole,
  normalizeUiRole,
  toUiRole,
  type UiRole as UiRoleType,
} from "constant/roles";
import { formatParticipantName } from "utils/formatParticipantName";
import { isWhiteboardTrackRef } from "utils/livekitTracks";
import { useSocketParticipantInfo } from "hooks/useSocketParticipantInfo";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type TileLabelPosition = {
  nameLeft: number;
  roleRight: number;
  bottom: number;
  tileLeft: number;
  tileRight: number;
  tileTop: number;
  tileHeight: number;
  nameMaxWidth: number;
};

type TileContextType = {
  identityToName: Record<string, string>;
  identityToSpeaking: Record<string, boolean>;
  identityToUiRole: Record<string, UiRoleType | null>;
  isMobileUA: boolean;
  role: "participant" | "moderator" | "admin" | "observer";
  onTileRef: (identity: string, node: HTMLElement | null) => void;
  onTileDoubleClick: (identity: string, shiftKey: boolean) => void;
};

type ScreenShareVideoGridProps = {
  tracks: TrackReferenceOrPlaceholder[];
  containerHeight: number;
  gap: number;
  minTileW: number;
  maxCols: number;
};

type MobileFallbackOverlayProps = {
  isMobileUA: boolean;
  tileLabelPos: Record<string, TileLabelPosition>;
  validIdentities: Set<string>;
  identityToName: Record<string, string>;
  identityToUiRole: Record<string, UiRoleType | null>;
  participants: Participant[];
};

type StageProps = {
  role: "participant" | "moderator" | "admin" | "observer";
};

// ============================================================================
// HELPER FUNCTIONS (defined outside component to prevent recreation)
// ============================================================================

function parseDisplayNameFromMetadata(meta?: string | null): string | null {
  if (!meta) return null;
  try {
    const obj = JSON.parse(meta);
    const fromDirect =
      (typeof obj?.displayName === "string" && obj.displayName) ||
      (typeof obj?.name === "string" && obj.name);
    if (fromDirect) return String(fromDirect);
    const fromNested =
      (obj?.user &&
        (obj.user.displayName ||
          obj.user.name ||
          (obj.user.firstName && obj.user.lastName
            ? `${obj.user.firstName} ${obj.user.lastName}`
            : null) ||
          obj.user.email)) ||
      null;
    return fromNested ? String(fromNested) : null;
  } catch {
    return null;
  }
}

function parseUiRoleFromMetadata(meta?: string | null): UiRoleType | null {
  if (!meta) return null;
  try {
    const obj = JSON.parse(meta);
    const raw = (obj?.uiRole ||
      obj?.role ||
      obj?.userRole ||
      obj?.serverRole) as unknown;
    if (typeof raw !== "string") return null;
    const ui = normalizeUiRole(raw);
    if (ui) return ui;
    const server = normalizeServerRole(raw);
    if (server) return toUiRole(server);
    return null;
  } catch {
    return null;
  }
}

// ============================================================================
// TILE CONTEXT
// ============================================================================

const TileContext = createContext<TileContextType | null>(null);

// ============================================================================
// TILE COMPONENT - DEFINED OUTSIDE Stage TO PREVENT RECREATION
// ============================================================================

const Tile = memo(function Tile() {
  const ctx = useContext(TileContext);
  const trackRef = useTrackRefContext();
  const participant = trackRef.participant;
  const identity = participant?.identity || "";
  const metadata = participant?.metadata;

  if (!ctx) return null;

  const {
    identityToName,
    identityToSpeaking,
    identityToUiRole,
    isMobileUA,
    role,
    onTileRef,
    onTileDoubleClick,
  } = ctx;

  const identityLower = identity.toLowerCase();
  const mappedName = identity
    ? identityToName[identity] || identityToName[identityLower]
    : undefined;
  const name =
    mappedName ||
    parseDisplayNameFromMetadata(metadata) ||
    participant?.name ||
    identity ||
    "Participant";

  const speaking = !!identityToSpeaking[identity];

  const camPub = participant?.getTrackPublication
    ? participant.getTrackPublication(Track.Source.Camera)
    : undefined;
  const camOn = !!camPub && !camPub.isMuted;

  let tileRole = identity ? identityToUiRole[identity] : null;
  if (!tileRole) {
    tileRole =
      parseUiRoleFromMetadata(metadata) ?? (participant?.isLocal ? role : null);
  }
  const roleLabel = tileRole
    ? tileRole === "moderator"
      ? "Host"
      : tileRole === "admin"
      ? "Admin"
      : tileRole === "participant"
      ? "Participant"
      : "Observer"
    : null;

  return (
    <div
      className={`relative isolate rounded-lg overflow-hidden bg-black group outline-none ${
        speaking ? "ring-2 ring-custom-light-blue-2" : "ring-0"
      }`}
      tabIndex={0}
      ref={(node) => {
        if (identity) {
          onTileRef(identity, node);
        }
      }}
      onDoubleClick={(e) => {
        if (identity) {
          onTileDoubleClick(identity, e.shiftKey);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" && identity) {
          onTileDoubleClick(identity, false);
        }
      }}
      aria-label={`${name}${speaking ? ", speaking" : ""}`}
    >
      <ParticipantTile trackRef={trackRef} />

      {!camOn && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-neutral-700 text-white">
              {name ? name.charAt(0).toUpperCase() : "?"}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      {!isMobileUA && (
        <div className="absolute inset-x-2 bottom-2 flex items-end justify-between gap-2 z-[100] participant-name-overlay pointer-events-none">
          <div className="flex-1 min-w-0 max-w-[calc(100%-90px)]">
            <span
              className="inline-block max-w-full truncate rounded bg-black/70 px-2 py-1 text-xs text-white pointer-events-auto"
              title={name}
            >
              {name}
            </span>
          </div>
          {roleLabel && (
            <Badge
              variant="outline"
              className="bg-black/70 text-white border-white/30 shrink-0"
            >
              {roleLabel}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
});

// ============================================================================
// SCREEN SHARE VIDEO GRID - DEFINED OUTSIDE Stage
// ============================================================================

const ScreenShareVideoGrid = memo(function ScreenShareVideoGrid({
  tracks,
  containerHeight,
  gap,
  minTileW,
  maxCols,
}: ScreenShareVideoGridProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

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

  const facesCount = tracks.length;
  let sbBest = {
    cols: 1,
    rows: Math.max(1, facesCount),
    w: minTileW,
    h: Math.floor((minTileW * 9) / 16),
    area: 0,
  };

  if (facesCount > 0 && containerWidth > 0) {
    for (let cols = 1; cols <= Math.min(facesCount, maxCols); cols++) {
      const rows = Math.ceil(facesCount / cols);
      const availW = Math.max(0, containerWidth - (cols - 1) * gap);
      const availH = Math.max(0, containerHeight - (rows - 1) * gap);
      if (availW === 0 || availH === 0) continue;
      const rawTileW = Math.floor(availW / cols);
      const rawTileH = Math.floor(availH / rows);
      const fitW = Math.min(rawTileW, Math.floor((rawTileH * 16) / 9));
      const tileW = Math.max(minTileW, fitW);
      const tileH = Math.floor((tileW * 9) / 16);
      const area = tileW * tileH;
      if (area > sbBest.area) sbBest = { cols, rows, w: tileW, h: tileH, area };
    }
  }

  return (
    <div ref={containerRef} className="w-full h-full min-h-0 overflow-y-auto">
      {facesCount > 0 && containerWidth > 0 ? (
        <div
          className="grid w-full"
          style={{
            gridTemplateColumns: `repeat(${sbBest.cols}, ${sbBest.w}px)`,
            gridAutoRows: `${sbBest.h}px`,
            gap: `${gap}px`,
            justifyContent: "center",
            alignContent: "start",
            padding: `${gap}px`,
          }}
        >
          <TrackLoop tracks={tracks}>
            <div className="relative rounded-lg overflow-hidden bg-black">
              <Tile />
            </div>
          </TrackLoop>
        </div>
      ) : null}
    </div>
  );
});

// ============================================================================
// MOBILE FALLBACK OVERLAY - DEFINED OUTSIDE Stage
// ============================================================================

const MobileFallbackOverlay = memo(function MobileFallbackOverlay({
  isMobileUA,
  tileLabelPos,
  validIdentities,
  identityToName,
  identityToUiRole,
  participants,
}: MobileFallbackOverlayProps) {
  if (!isMobileUA) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[100]">
      {Object.entries(tileLabelPos).map(([id, pos]) => {
        if (!id || pos.tileHeight <= 0) return null;
        if (!validIdentities.has(id)) return null;

        let tileRole = identityToUiRole[id];
        if (!tileRole) {
          const participant = participants.find((p) => p.identity === id);
          if (participant) {
            tileRole = parseUiRoleFromMetadata(participant.metadata);
          }
        }
        const label = tileRole
          ? tileRole === "moderator"
            ? "Host"
            : tileRole === "admin"
            ? "Admin"
            : tileRole === "participant"
            ? "Participant"
            : "Observer"
          : null;

        const tileWidth = pos.tileRight - pos.tileLeft;
        const isNarrowTile = tileWidth < 200;

        return (
          <div
            key={`fallback-${id}`}
            className="absolute pointer-events-none"
            style={{
              left: `${pos.tileLeft}px`,
              top: `${pos.tileTop}px`,
              width: `${tileWidth}px`,
              height: `${pos.tileHeight}px`,
            }}
          >
            {isNarrowTile ? (
              <div
                className="absolute flex flex-col gap-1 items-start"
                style={{
                  left: "8px",
                  bottom: "8px",
                  maxWidth: `${tileWidth - 16}px`,
                }}
              >
                <span
                  className="inline-block truncate rounded bg-black/70 px-2 py-1 text-xs text-white"
                  title={identityToName[id] || id}
                  style={{ maxWidth: "100%" }}
                >
                  {identityToName[id] || id}
                </span>
                {label && (
                  <span className="inline-block rounded border border-white/30 bg-black/70 px-2 py-1 text-xs text-white whitespace-nowrap">
                    {label}
                  </span>
                )}
              </div>
            ) : (
              <>
                <span
                  className="absolute inline-block truncate rounded bg-black/70 px-2 py-1 text-xs text-white"
                  style={{
                    left: "8px",
                    bottom: "8px",
                    maxWidth: `${pos.nameMaxWidth}px`,
                  }}
                  title={identityToName[id] || id}
                >
                  {identityToName[id] || id}
                </span>
                {label && (
                  <span
                    className="absolute inline-block rounded border border-white/30 bg-black/70 px-2 py-1 text-xs text-white whitespace-nowrap"
                    style={{ right: "8px", bottom: "8px" }}
                  >
                    {label}
                  </span>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
});

// ============================================================================
// MAIN STAGE COMPONENT
// ============================================================================

export default function Stage({ role }: StageProps) {
  const [pinnedIdentity, setPinnedIdentity] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState<{ w: number; h: number }>({
    w: 0,
    h: 0,
  });
  const [spotlightIds, setSpotlightIds] = useState<string[]>([]);
  const [focusedShareIdx, setFocusedShareIdx] = useState<number>(0);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const tileElByIdentityRef = useRef<Record<string, HTMLElement | null>>({});
  const [tileLabelPos, setTileLabelPos] = useState<
    Record<string, TileLabelPosition>
  >({});

  const isMobileUA = useMemo(() => {
    try {
      if (typeof navigator === "undefined") return false;
      const ua = navigator.userAgent || "";
      return /iPhone|iPad|iPod|Android/i.test(ua);
    } catch {
      return false;
    }
  }, []);

  const socketParticipantInfo = useSocketParticipantInfo();
  const participants = useParticipants();

  const cameraTracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
  ]);
  const shareTrackRefs = useTracks([
    { source: Track.Source.ScreenShare, withPlaceholder: true },
  ]);
  const shareTracks = useMemo(
    () => shareTrackRefs.filter((ref) => !isWhiteboardTrackRef(ref)),
    [shareTrackRefs]
  );

  const identityToSpeaking = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const p of participants) {
      const id = p.identity || "";
      if (!id) continue;
      map[id] = !!p.isSpeaking;
    }
    return map;
  }, [participants]);

  const identityToName = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of participants) {
      const id = p.identity || "";
      if (!id) continue;
      const socketInfo = socketParticipantInfo[id.toLowerCase()];
      if (socketInfo) {
        const formattedName = formatParticipantName(
          socketInfo.firstName,
          socketInfo.lastName
        );
        map[id] = formattedName || socketInfo.name;
      } else {
        const metaName = parseDisplayNameFromMetadata(p.metadata);
        map[id] = metaName || p.name || id;
      }
    }
    return map;
  }, [participants, socketParticipantInfo]);

  const identityToCamOn = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const p of participants) {
      const id = p.identity || "";
      if (!id) continue;
      const camPub = p.getTrackPublication
        ? p.getTrackPublication(Track.Source.Camera)
        : undefined;
      map[id] = !!camPub && !camPub.isMuted;
    }
    return map;
  }, [participants]);

  const identityToUiRole = useMemo(() => {
    const map: Record<string, UiRoleType | null> = {};
    for (const p of participants) {
      const id = p.identity || "";
      if (!id) continue;
      const socketInfo = socketParticipantInfo[id.toLowerCase()];
      if (socketInfo?.role) {
        const serverRole = normalizeServerRole(socketInfo.role);
        const ui = serverRole ? toUiRole(serverRole) : null;
        map[id] = ui ?? (p.isLocal ? role : null);
      } else {
        const ui =
          parseUiRoleFromMetadata(p.metadata) ?? (p.isLocal ? role : null);
        map[id] = ui;
      }
    }
    return map;
  }, [participants, role, socketParticipantInfo]);

  const orderedTracks = useMemo(() => {
    const filtered = [...cameraTracks].filter((t) => {
      const id = t.participant?.identity || "";
      if (!id) return false;
      const priority =
        (pinnedIdentity && id === pinnedIdentity) || spotlightIds.includes(id);
      const camOn = identityToCamOn[id];
      return priority || camOn;
    });

    filtered.sort((a, b) => {
      const aId = a.participant?.identity || "";
      const bId = b.participant?.identity || "";

      const aSpot = spotlightIds.includes(aId) ? 1 : 0;
      const bSpot = spotlightIds.includes(bId) ? 1 : 0;
      if (aSpot !== bSpot) return bSpot - aSpot;

      const aPinned = pinnedIdentity && aId === pinnedIdentity ? 1 : 0;
      const bPinned = pinnedIdentity && bId === pinnedIdentity ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned;

      const aName = identityToName[aId] || aId;
      const bName = identityToName[bId] || bId;
      return aName.localeCompare(bName);
    });
    return filtered;
  }, [
    cameraTracks,
    pinnedIdentity,
    spotlightIds,
    identityToCamOn,
    identityToName,
  ]);

  const stableTracks = useVisualStableUpdate(orderedTracks, 25);

  const validIdentitiesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const validIds = new Set<string>();
    for (const track of orderedTracks) {
      const id = track.participant?.identity;
      if (id) validIds.add(id);
    }
    validIdentitiesRef.current = validIds;

    const currentRefs = tileElByIdentityRef.current;
    for (const id of Object.keys(currentRefs)) {
      if (!validIds.has(id)) {
        delete currentRefs[id];
      }
    }
  }, [orderedTracks]);

  useEffect(() => {
    if (!isMobileUA) return;
    const el = stageRef.current;
    if (!el) return;
    let raf = 0;
    let measureTimeout: NodeJS.Timeout | null = null;

    const measure = () => {
      try {
        const containerRect = el.getBoundingClientRect();
        const next: Record<string, TileLabelPosition> = {};

        for (const [id, node] of Object.entries(tileElByIdentityRef.current)) {
          if (!id || !node || !validIdentitiesRef.current.has(id)) continue;

          const r = node.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;

          const tileLeft = Math.round(r.left - containerRect.left);
          const tileRight = Math.round(r.right - containerRect.left);
          const tileTop = Math.round(r.top - containerRect.top);
          const tileBottom = Math.round(r.bottom - containerRect.top);
          const tileWidth = tileRight - tileLeft;
          const tileHeight = tileBottom - tileTop;
          const nameLeft = Math.max(0, tileLeft + 8);
          const roleRight = Math.max(0, tileRight - 8);
          const bottom = Math.max(0, tileBottom - 8);
          const roleBadgeWidth = 80;
          const nameMaxWidth = Math.max(80, tileWidth - roleBadgeWidth - 24);
          next[id] = {
            nameLeft,
            roleRight,
            bottom,
            tileLeft,
            tileRight,
            tileTop,
            tileHeight,
            nameMaxWidth,
          };
        }
        setTileLabelPos(next);
      } catch {
        // Silently ignore measurement errors
      }
    };

    const debouncedMeasure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (measureTimeout) clearTimeout(measureTimeout);
        measureTimeout = setTimeout(measure, 50);
      });
    };

    const ro = new ResizeObserver(debouncedMeasure);
    ro.observe(el);
    window.addEventListener("resize", debouncedMeasure);
    measureTimeout = setTimeout(measure, 100);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", debouncedMeasure);
      cancelAnimationFrame(raf);
      if (measureTimeout) clearTimeout(measureTimeout);
    };
  }, [isMobileUA, stableTracks.length]);

  const togglePin = useCallback((identity: string) => {
    setPinnedIdentity((prev) => (prev === identity ? null : identity));
  }, []);

  const toggleSpotlight = useCallback(
    (identity: string) => {
      setSpotlightIds((prev) => {
        const exists = prev.includes(identity);
        const next = exists
          ? prev.filter((x) => x !== identity)
          : [...prev, identity].slice(0, 2);
        try {
          const sock = (
            window as unknown as {
              __meetingSocket?: { emit: (ev: string, p: unknown) => void };
            }
          ).__meetingSocket;
          if (sock && (role === "moderator" || role === "admin")) {
            sock.emit("meeting:layout:spotlight", { identities: next });
          }
        } catch {
          // Ignore socket errors
        }
        return next;
      });
    },
    [role]
  );

  useEffect(() => {
    type Sock = {
      on?: (ev: string, cb: (p?: unknown) => void) => void;
      off?: (ev: string, cb: (p?: unknown) => void) => void;
    } | null;
    const sock: Sock =
      typeof window !== "undefined"
        ? (window as unknown as { __meetingSocket?: Sock }).__meetingSocket ||
          null
        : null;
    if (!sock) return;
    const onSpot = (p?: unknown) => {
      const q = (p || {}) as { identities?: unknown };
      const ids = Array.isArray(q.identities)
        ? (q.identities as unknown[])
        : [];
      const list = ids.filter((x) => typeof x === "string") as string[];
      setSpotlightIds(list);
    };
    if (typeof sock.on === "function") {
      sock.on("meeting:layout:spotlight", onSpot);
    }
    return () => {
      if (typeof sock.off === "function") {
        sock.off("meeting:layout:spotlight", onSpot);
      }
    };
  }, []);

  const handleTileRef = useCallback(
    (identity: string, node: HTMLElement | null) => {
      if (identity) {
        tileElByIdentityRef.current[identity] = node;
      }
    },
    []
  );

  const handleTileDoubleClick = useCallback(
    (identity: string, shiftKey: boolean) => {
      if ((role === "moderator" || role === "admin") && shiftKey) {
        toggleSpotlight(identity);
      } else {
        togglePin(identity);
      }
    },
    [role, toggleSpotlight, togglePin]
  );

  const tileContextValue = useMemo<TileContextType>(
    () => ({
      identityToName,
      identityToSpeaking,
      identityToUiRole,
      isMobileUA,
      role,
      onTileRef: handleTileRef,
      onTileDoubleClick: handleTileDoubleClick,
    }),
    [
      identityToName,
      identityToSpeaking,
      identityToUiRole,
      isMobileUA,
      role,
      handleTileRef,
      handleTileDoubleClick,
    ]
  );

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (!cr) return;
      setContainerSize((s) =>
        s.w !== Math.floor(cr.width) || s.h !== Math.floor(cr.height)
          ? { w: Math.floor(cr.width), h: Math.floor(cr.height) }
          : s
      );
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const gap = 8;
  const minTileW = 240;
  const maxCols = 5;
  const N = stableTracks.length || 1;

  let best = {
    cols: 1,
    rows: N,
    w: minTileW,
    h: Math.floor((minTileW * 9) / 16),
    area: 0,
  };
  for (let cols = 1; cols <= Math.min(N, maxCols); cols++) {
    const rows = Math.ceil(N / cols);
    const availW = Math.max(0, containerSize.w - (cols - 1) * gap);
    const availH = Math.max(0, containerSize.h - (rows - 1) * gap);
    if (availW === 0 || availH === 0) continue;
    const rawTileW = Math.floor(availW / cols);
    const rawTileH = Math.floor(availH / rows);
    const fitW = Math.min(rawTileW, Math.floor((rawTileH * 16) / 9));
    const tileW = Math.max(minTileW, fitW);
    const tileH = Math.floor((tileW * 9) / 16);
    const area = tileW * tileH;
    if (area > best.area) best = { cols, rows, w: tileW, h: tileH, area };
  }

  const activeShares = shareTracks.filter((t) => !!t.publication);
  const hasShare = activeShares.length > 0;

  useEffect(() => {
    if (focusedShareIdx >= activeShares.length)
      setFocusedShareIdx(Math.max(0, activeShares.length - 1));
  }, [activeShares.length, focusedShareIdx]);

  if (hasShare) {
    const facesCount = stableTracks.length;
    const sharePrimary =
      activeShares.length > 0
        ? [
            activeShares[
              Math.max(0, Math.min(focusedShareIdx, activeShares.length - 1))
            ],
          ]
        : [];

    return (
      <TileContext.Provider value={tileContextValue}>
        <div
          ref={stageRef}
          className="relative flex-1 min-h-0 w-full max-w-full overflow-hidden"
        >
          <div className="flex gap-3 h-full w-full max-w-full">
            <div className="flex-1 md:flex-[4] min-w-0 min-h-0 max-w-full flex items-center justify-center">
              <TrackLoop tracks={sharePrimary}>
                <div className="relative rounded-lg overflow-hidden bg-black w-full h-full">
                  <Tile />
                  {activeShares.length > 1 && (
                    <div className="absolute top-2 right-2 flex gap-1 z-10">
                      {activeShares.map((s, idx) => {
                        const label =
                          s.participant?.name ||
                          s.participant?.identity ||
                          `Share ${idx + 1}`;
                        return (
                          <button
                            key={
                              s.participant?.identity ||
                              s.participant?.sid ||
                              `${label}-${idx}`
                            }
                            type="button"
                            onClick={() => setFocusedShareIdx(idx)}
                            className={`text-xs px-2 py-1 rounded-md border ${
                              idx === focusedShareIdx
                                ? "bg-black/60 text-white border-white/50"
                                : "bg-black/30 text-white/80 border-white/30"
                            }`}
                            title={label}
                            aria-label={`Focus ${label}`}
                          >
                            {idx + 1}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </TrackLoop>
            </div>
            {facesCount > 0 && (
              <div className="hidden md:flex md:flex-[1] min-w-[220px] max-w-[420px] min-h-0 rounded bg-white p-2 overflow-hidden">
                <div className="h-full w-full">
                  <ScreenShareVideoGrid
                    tracks={stableTracks}
                    containerHeight={containerSize.h}
                    gap={gap}
                    minTileW={minTileW}
                    maxCols={maxCols}
                  />
                </div>
              </div>
            )}
          </div>
          <MobileFallbackOverlay
            isMobileUA={isMobileUA}
            tileLabelPos={tileLabelPos}
            validIdentities={validIdentitiesRef.current}
            identityToName={identityToName}
            identityToUiRole={identityToUiRole}
            participants={participants}
          />
        </div>
      </TileContext.Provider>
    );
  }

  return (
    <TileContext.Provider value={tileContextValue}>
      <div
        ref={stageRef}
        className={`relative flex-1 min-h-0 w-full max-w-full overflow-hidden ${
          isMobileUA ? "mobile-fallback" : ""
        }`}
      >
        <div
          className="grid w-full max-w-full"
          style={{
            gridTemplateColumns: `repeat(${best.cols}, ${best.w}px)`,
            gridAutoRows: `${best.h}px`,
            gap: `${gap}px`,
            justifyContent: "center",
            alignContent: "center",
          }}
        >
          <TrackLoop tracks={stableTracks}>
            <div className="relative rounded-lg overflow-hidden bg-black">
              <Tile />
            </div>
          </TrackLoop>
        </div>
        <MobileFallbackOverlay
          isMobileUA={isMobileUA}
          tileLabelPos={tileLabelPos}
          validIdentities={validIdentitiesRef.current}
          identityToName={identityToName}
          identityToUiRole={identityToUiRole}
          participants={participants}
        />
      </div>
    </TileContext.Provider>
  );
}
