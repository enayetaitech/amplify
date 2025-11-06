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

  const participants = useParticipants();
  const cameraTracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
  ]);
  const shareTracks = useTracks([
    { source: Track.Source.ScreenShare, withPlaceholder: true },
  ]);

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
      const metaName = parseDisplayNameFromMetadata(p.metadata);
      const name = metaName || p.name || id;
      map[id] = name;
    }
    return map;
  }, [participants]);

  // Debug: log participant identities and resolved names whenever list changes
  useEffect(() => {
    try {
      const rows = participants.map((p) => ({
        identity: p.identity,
        p_name: p.name,
        meta: p.metadata,
        resolved: identityToName[p.identity || ""],
      }));
      console.table(rows);
    } catch {}
  }, [participants, identityToName]);

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
      const ui =
        parseUiRoleFromMetadata(p.metadata) ?? (p.isLocal ? role : null);
      map[id] = ui;
    }
    return map;
  }, [participants, role]);

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

      // 3) speaking next
      const aSpeak = identityToSpeaking[aId] ? 1 : 0;
      const bSpeak = identityToSpeaking[bId] ? 1 : 0;
      if (aSpeak !== bSpeak) return bSpeak - aSpeak;

      // 4) stable by name/identity
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

  function Tile() {
    const trackRef = useTrackRefContext();
    const identity = trackRef.participant?.identity || "";
    const name = identityToName[identity] || identity;
    // const isPinned = !!pinnedIdentity && identity === pinnedIdentity; // reserved for future features
    const speaking = !!identityToSpeaking[identity];

    const camPub = trackRef.participant?.getTrackPublication
      ? trackRef.participant.getTrackPublication(Track.Source.Camera)
      : undefined;
    const camOn = !!camPub && !camPub.isMuted;

    return (
      <div
        key={trackRef.publication?.trackSid || identity}
        className={`relative rounded-lg overflow-hidden bg-black group outline-none ${
          speaking ? "ring-2 ring-custom-light-blue-2" : "ring-0"
        }`}
        tabIndex={0}
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
        {(() => {
          try {
            console.debug("[Stage] Tile render", {
              identity,
              resolvedName: name,
              camOn,
              speaking,
            });
          } catch {}
          return null;
        })()}
        <ParticipantTile trackRef={trackRef} />

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

        {/* Bottom-left: participant name (always visible, mobile-friendly) */}
        <div className="absolute left-2 bottom-2 max-w-[75%] z-20 participant-name-overlay">
          <span
            className="inline-block max-w-full truncate rounded bg-black/60 px-2 py-1 text-xs text-white"
            title={name}
          >
            {name}
          </span>
        </div>

        {/* Bottom-right: role badge only */}
        <div className="absolute right-2 bottom-2 z-20 participant-name-overlay">
          {(() => {
            const tileRole = identityToUiRole[identity];
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
                className="bg-black/60 text-white border-white/30"
              >
                {label}
              </Badge>
            );
          })()}
        </div>
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
    const useSideBySide = containerSize.w >= 1100; // heuristic: wide viewports prefer side-by-side

    if (useSideBySide) {
      // Side-by-side: left share (~65% width), right faces smart grid
      const sharePaneMaxW = Math.floor(containerSize.w * 0.65);
      const sharePaneH = containerSize.h;
      const shareWByH = Math.floor((sharePaneH * 16) / 9);
      const shareW = Math.min(sharePaneMaxW, shareWByH);
      const shareH = Math.floor((shareW * 9) / 16);
      const rightW = Math.max(0, containerSize.w - shareW - gap);

      // Smart grid for faces in right pane
      let sbBest = {
        cols: 1,
        rows: Math.max(1, facesCount),
        w: minTileW,
        h: Math.floor((minTileW * 9) / 16),
        area: 0,
      };
      if (facesCount > 0 && rightW > 0) {
        for (let cols = 1; cols <= Math.min(facesCount, maxCols); cols++) {
          const rows = Math.ceil(facesCount / cols);
          const availW = Math.max(0, rightW - (cols - 1) * gap);
          const availH = Math.max(0, containerSize.h - (rows - 1) * gap);
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
        <div ref={stageRef} className="flex-1 min-h-0">
          <div className="flex" style={{ gap }}>
            <div
              className="flex items-center justify-center"
              style={{ width: shareW, height: containerSize.h }}
            >
              <TrackLoop tracks={sharePrimary}>
                <div
                  style={{ width: shareW, height: shareH }}
                  className="relative rounded-lg overflow-hidden bg-black"
                >
                  <Tile />
                  {activeShares.length > 1 && (
                    <div className="absolute top-2 right-2 flex gap-1">
                      {activeShares.map((s, idx) => {
                        const label =
                          s.participant?.name ||
                          s.participant?.identity ||
                          `Share ${idx + 1}`;
                        return (
                          <button
                            key={s.publication?.trackSid || `${label}-${idx}`}
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
            {facesCount > 0 && rightW > 0 && (
              <div
                className="grid"
                style={{
                  width: rightW,
                  gridTemplateColumns: `repeat(${sbBest.cols}, ${sbBest.w}px)`,
                  gridAutoRows: `${sbBest.h}px`,
                  gap,
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
            )}
          </div>
        </div>
      );
    }

    // Presenter Large layout: share big + bottom filmstrip
    const filmstripGap = facesCount > 0 ? gap : 0;

    // compute filmstrip one-row best sizing
    let stripCols = Math.min(facesCount, maxCols);
    let stripW = minTileW;
    let stripH = Math.floor((stripW * 9) / 16);
    if (facesCount > 0) {
      for (let cols = Math.min(facesCount, maxCols); cols >= 1; cols--) {
        const availW = Math.max(0, containerSize.w - (cols - 1) * gap);
        const rawTileW = Math.floor(availW / cols);
        const tileW = Math.max(minTileW, rawTileW);
        const tileH = Math.floor((tileW * 9) / 16);
        stripCols = cols;
        stripW = tileW;
        stripH = tileH;
        break;
      }
    }

    const availableForShareH = Math.max(
      0,
      containerSize.h - (facesCount > 0 ? stripH + filmstripGap : 0)
    );
    const shareWByH = Math.floor((availableForShareH * 16) / 9);
    const shareW = Math.min(containerSize.w, shareWByH);
    const shareH = Math.min(availableForShareH, Math.floor((shareW * 9) / 16));

    return (
      <div
        ref={stageRef}
        className="flex-1 min-h-0 flex flex-col"
        style={{ gap }}
      >
        <div
          className="flex items-center justify-center"
          style={{ height: shareH }}
        >
          <TrackLoop tracks={sharePrimary}>
            <div
              style={{ width: shareW, height: shareH }}
              className="relative rounded-lg overflow-hidden bg-black"
            >
              <Tile />
              {activeShares.length > 1 && (
                <div className="absolute top-2 right-2 flex gap-1">
                  {activeShares.map((s, idx) => {
                    const label =
                      s.participant?.name ||
                      s.participant?.identity ||
                      `Share ${idx + 1}`;
                    return (
                      <button
                        key={s.publication?.trackSid || `${label}-${idx}`}
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
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${stripCols}, ${stripW}px)`,
              gridAutoRows: `${stripH}px`,
              gap,
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
        )}
      </div>
    );
  }

  return (
    <div ref={stageRef} className="flex-1 min-h-0">
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${best.cols}, ${best.w}px)`,
          gridAutoRows: `${best.h}px`,
          gap,
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
    </div>
  );
}
