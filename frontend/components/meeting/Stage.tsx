"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import {
  ParticipantTile,
  useParticipants,
  useTracks,
  TrackLoop,
} from "@livekit/components-react";
import { useTrackRefContext } from "@livekit/components-react";
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

type StageProps = {
  role: "participant" | "moderator" | "admin" | "observer";
};

export default function Stage({ role }: StageProps) {
  const [pinnedIdentity, setPinnedIdentity] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState<{ w: number; h: number }>({
    w: 0,
    h: 0,
  });
  const [spotlightIds, setSpotlightIds] = useState<string[]>([]);
  const [focusedShareIdx, setFocusedShareIdx] = useState<number>(0);
  const stageRef = useRef<HTMLDivElement | null>(null);
  // Track each tile DOM element by identity for fallback overlay positioning
  const tileElByIdentityRef = useRef<Record<string, HTMLElement | null>>({});
  const [tileLabelPos, setTileLabelPos] = useState<
    Record<
      string,
      {
        nameLeft: number;
        roleRight: number;
        bottom: number;
        tileLeft: number;
        tileRight: number;
        tileTop: number;
        tileHeight: number;
        nameMaxWidth: number;
      }
    >
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

  const identityToSpeaking: Record<string, boolean> = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const p of participants) {
      const id = p.identity || "";
      if (!id) continue;
      map[id] = !!p.isSpeaking;
    }
    return map;
  }, [participants]);

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

  const identityToName: Record<string, string> = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of participants) {
      const id = p.identity || "";
      if (!id) continue;
      // Prefer socket-based name, fallback to LiveKit metadata/name
      const socketInfo = socketParticipantInfo[id.toLowerCase()];
      if (socketInfo) {
        // Try to format from firstName/lastName first
        const formattedName = formatParticipantName(
          socketInfo.firstName,
          socketInfo.lastName
        );
        // If formatted name exists, use it; otherwise fall back to socketInfo.name
        map[id] = formattedName || socketInfo.name;
      } else {
        const metaName = parseDisplayNameFromMetadata(p.metadata);
        map[id] = metaName || p.name || id;
      }
    }
    return map;
  }, [participants, socketParticipantInfo]);

  const identityToCamOn: Record<string, boolean> = useMemo(() => {
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

  const identityToUiRole: Record<string, UiRoleType | null> = useMemo(() => {
    const map: Record<string, UiRoleType | null> = {};
    for (const p of participants) {
      const id = p.identity || "";
      if (!id) continue;
      // Prefer socket-based role, fallback to LiveKit metadata
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
    // Filter to hide non-video unless speaking/pinned/spotlight
    const filtered = [...cameraTracks].filter((t) => {
      const id = t.participant?.identity || "";
      if (!id) return false;
      const priority =
        (pinnedIdentity && id === pinnedIdentity) || spotlightIds.includes(id);
      const camOn = identityToCamOn[id];
      const speaking = identityToSpeaking[id];
      return priority || camOn || speaking;
    });

    filtered.sort((a, b) => {
      const aId = a.participant?.identity || "";
      const bId = b.participant?.identity || "";

      // 1) spotlight first
      const aSpot = spotlightIds.includes(aId) ? 1 : 0;
      const bSpot = spotlightIds.includes(bId) ? 1 : 0;
      if (aSpot !== bSpot) return bSpot - aSpot;

      // 2) pinned next
      const aPinned = pinnedIdentity && aId === pinnedIdentity ? 1 : 0;
      const bPinned = pinnedIdentity && bId === pinnedIdentity ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned;

      // 3) stable by name/identity (avoid speaking-based resorting to prevent flicker)
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
    identityToSpeaking,
    identityToName,
  ]);

  // Track valid identities to clean up stale refs
  const validIdentitiesRef = useRef<Set<string>>(new Set());

  // Update valid identities when tracks change
  useEffect(() => {
    const validIds = new Set<string>();
    for (const track of orderedTracks) {
      const id = track.participant?.identity;
      if (id) validIds.add(id);
    }
    validIdentitiesRef.current = validIds;

    // Clean up stale refs
    const currentRefs = tileElByIdentityRef.current;
    for (const id of Object.keys(currentRefs)) {
      if (!validIds.has(id)) {
        delete currentRefs[id];
      }
    }
  }, [orderedTracks]);

  // Compute absolute positions for fallback labels on mobile (sibling top-layer overlay)
  useEffect(() => {
    if (!isMobileUA) return;
    const el = stageRef.current;
    if (!el) return;
    let raf = 0;
    let measureTimeout: NodeJS.Timeout | null = null;

    const measure = () => {
      try {
        const containerRect = el.getBoundingClientRect();
        const next: Record<
          string,
          {
            nameLeft: number;
            roleRight: number;
            bottom: number;
            tileLeft: number;
            tileRight: number;
            tileTop: number;
            tileHeight: number;
            nameMaxWidth: number;
          }
        > = {};

        // Only process valid identities (non-empty)
        for (const [id, node] of Object.entries(tileElByIdentityRef.current)) {
          // Skip empty identities or missing nodes
          if (!id || !node || !validIdentitiesRef.current.has(id)) continue;

          const r = node.getBoundingClientRect();
          // Skip if element has no dimensions (not yet rendered)
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
          // Calculate max width for name to leave space for role badge (estimate ~80px for role badge + padding)
          const roleBadgeWidth = 80; // Estimated width for role badge
          const nameMaxWidth = Math.max(80, tileWidth - roleBadgeWidth - 24); // Leave 24px total padding
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

    // Debounced measure to avoid excessive calculations
    const debouncedMeasure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        // Add a small delay to ensure DOM is settled
        if (measureTimeout) clearTimeout(measureTimeout);
        measureTimeout = setTimeout(measure, 50);
      });
    };

    const ro = new ResizeObserver(debouncedMeasure);
    ro.observe(el);
    window.addEventListener("resize", debouncedMeasure);

    // Initial measurement with delay to ensure DOM is ready
    measureTimeout = setTimeout(measure, 100);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", debouncedMeasure);
      cancelAnimationFrame(raf);
      if (measureTimeout) clearTimeout(measureTimeout);
    };
  }, [isMobileUA, orderedTracks.length]);

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
        // broadcast if moderator/admin and socket is available
        try {
          const sock = (
            window as unknown as {
              __meetingSocket?: { emit: (ev: string, p: unknown) => void };
            }
          ).__meetingSocket;
          if (sock && (role === "moderator" || role === "admin")) {
            sock.emit("meeting:layout:spotlight", { identities: next });
          }
        } catch {}
        return next;
      });
    },
    [role]
  );

  // listen for spotlight broadcasts
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

  function MobileFallbackOverlay() {
    if (!isMobileUA) return null;
    return (
      <div className="pointer-events-none absolute inset-0 z-[100]">
        {Object.entries(tileLabelPos).map(([id, pos]) => {
          // Skip empty identities or invalid positions
          if (!id || pos.tileHeight <= 0) return null;

          // Skip if this identity is no longer in the valid set
          if (!validIdentitiesRef.current.has(id)) return null;

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
          // For narrow tiles (< 200px), stack name and role vertically
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
                // Narrow tile: stack name and role vertically
                <div
                  className="absolute flex flex-col gap-1 items-start"
                  style={{ left: `8px`, bottom: `8px`, maxWidth: `${tileWidth - 16}px` }}
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
                // Wide tile: name on left, role on right
                <>
                  <span
                    className="absolute inline-block truncate rounded bg-black/70 px-2 py-1 text-xs text-white"
                    style={{
                      left: `8px`,
                      bottom: `8px`,
                      maxWidth: `${pos.nameMaxWidth}px`,
                    }}
                    title={identityToName[id] || id}
                  >
                    {identityToName[id] || id}
                  </span>
                  {label && (
                    <span
                      className="absolute inline-block rounded border border-white/30 bg-black/70 px-2 py-1 text-xs text-white whitespace-nowrap"
                      style={{ right: `8px`, bottom: `8px` }}
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
  }

  function Tile() {
    const trackRef = useTrackRefContext();
    const participant = trackRef.participant;
    const identity = participant?.identity || "";
    const resolvedParticipant =
      participant ||
      (identity
        ? participants.find((p) => p.identity === identity)
        : undefined);
    const metadata = resolvedParticipant?.metadata;
    const identityLower = identity.toLowerCase();
    const mappedName = identity
      ? identityToName[identity] || identityToName[identityLower]
      : undefined;
    const name =
      mappedName ||
      parseDisplayNameFromMetadata(metadata) ||
      resolvedParticipant?.name ||
      identity ||
      "Participant";
    // const isPinned = !!pinnedIdentity && identity === pinnedIdentity; // reserved for future features
    const speaking = !!identityToSpeaking[identity];

    const camPub = trackRef.participant?.getTrackPublication
      ? trackRef.participant.getTrackPublication(Track.Source.Camera)
      : undefined;
    const camOn = !!camPub && !camPub.isMuted;

    return (
      <div
        key={identity || trackRef.participant?.sid || "tile"}
        className={`relative isolate rounded-lg overflow-hidden bg-black group outline-none ${
          speaking ? "ring-2 ring-custom-light-blue-2" : "ring-0"
        }`}
        tabIndex={0}
        ref={(node) => {
          // Only store refs for tiles with valid non-empty identities
          if (identity && node) {
            tileElByIdentityRef.current[identity] = node;
          }
        }}
        onDoubleClick={(e) => {
          if (!identity) return;
          if ((role === "moderator" || role === "admin") && e.shiftKey)
            toggleSpotlight(identity);
          else togglePin(identity);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && identity) togglePin(identity);
        }}
        aria-label={`${name}${speaking ? ", speaking" : ""}`}
      >
        <ParticipantTile trackRef={trackRef} mirror={false} />

        {/* Bottom-left: placeholder avatar when camera off */}
        {!camOn && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-neutral-700 text-white">
                {name ? name.charAt(0).toUpperCase() : "?"}
              </AvatarFallback>
            </Avatar>
          </div>
        )}

        {/* Bottom overlay: participant name and role badge (desktop/tablet only; mobile uses fallback overlay) */}
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
            {(() => {
              // Try to get role from identityToUiRole first, then fallback to metadata parsing
              let tileRole = identity ? identityToUiRole[identity] : null;
              if (!tileRole) {
                tileRole =
                  parseUiRoleFromMetadata(metadata) ??
                  (resolvedParticipant?.isLocal ? role : null);
              }
              if (!tileRole) return null;
              const label =
                tileRole === "moderator"
                  ? "Host"
                  : tileRole === "admin"
                  ? "Admin"
                  : tileRole === "participant"
                  ? "Participant"
                  : "Observer";
              return (
                <Badge
                  variant="outline"
                  className="bg-black/70 text-white border-white/30 shrink-0"
                >
                  {label}
                </Badge>
              );
            })()}
          </div>
        )}
      </div>
    );
  }

  // Resize observer for smart grid sizing
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
  const N = orderedTracks.length || 1;

  // Component for video tiles grid in screen share layout (20% width)
  function ScreenShareVideoGrid({
    tracks,
    containerHeight,
  }: {
    tracks: typeof orderedTracks;
    containerHeight: number;
  }) {
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
        if (area > sbBest.area)
          sbBest = { cols, rows, w: tileW, h: tileH, area };
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
  }

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
    // maintain 16:9 without overflow
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
    const facesCount = orderedTracks.length;
    const sharePrimary =
      activeShares.length > 0
        ? [
            activeShares[
              Math.max(0, Math.min(focusedShareIdx, activeShares.length - 1))
            ],
          ]
        : [];
    // Always use side-by-side flex layout for screen share (80/20 split)
    // This ensures consistent layout regardless of sidebar state or container width
    return (
      <div
        ref={stageRef}
        className="relative flex-1 min-h-0 w-full max-w-full overflow-hidden"
      >
        <div className="flex gap-3 h-full w-full max-w-full">
          {/* Screen share: full width on mobile, 80% width on desktop - fluid layout */}
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
          {/* Video tiles: hidden on mobile, 20% width on desktop - fluid layout */}
          {facesCount > 0 && (
            <div className="hidden md:flex md:flex-[1] min-w-[220px] max-w-[420px] min-h-0 rounded bg-white p-2 overflow-hidden">
              <div className="h-full w-full">
                <ScreenShareVideoGrid
                  tracks={orderedTracks}
                  containerHeight={containerSize.h}
                />
              </div>
            </div>
          )}
        </div>
        <MobileFallbackOverlay />
      </div>
    );
  }

  return (
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
        <TrackLoop tracks={orderedTracks}>
          <div className="relative rounded-lg overflow-hidden bg-black">
            <Tile />
          </div>
        </TrackLoop>
      </div>
      <MobileFallbackOverlay />
    </div>
  );
}
