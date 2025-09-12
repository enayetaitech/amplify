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
  const stageRef = useRef<HTMLDivElement | null>(null);

  const participants = useParticipants();
  const cameraTracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
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

  const identityToName: Record<string, string> = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of participants) {
      const id = p.identity || "";
      if (!id) continue;
      const name = p.name || id;
      map[id] = name;
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
    const arr = [...cameraTracks];
    arr.sort((a, b) => {
      const aId = a.participant?.identity || "";
      const bId = b.participant?.identity || "";

      // 1) pinned first
      const aPinned = pinnedIdentity && aId === pinnedIdentity ? 1 : 0;
      const bPinned = pinnedIdentity && bId === pinnedIdentity ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned;

      // 2) speaking next
      const aSpeak = identityToSpeaking[aId] ? 1 : 0;
      const bSpeak = identityToSpeaking[bId] ? 1 : 0;
      if (aSpeak !== bSpeak) return bSpeak - aSpeak;

      // 3) stable by name/identity
      const aName = identityToName[aId] || aId;
      const bName = identityToName[bId] || bId;
      return aName.localeCompare(bName);
    });
    return arr;
  }, [cameraTracks, pinnedIdentity, identityToSpeaking, identityToName]);

  const togglePin = useCallback((identity: string) => {
    setPinnedIdentity((prev) => (prev === identity ? null : identity));
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
        onDoubleClick={() => identity && togglePin(identity)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && identity) togglePin(identity);
        }}
        aria-label={`${name}${speaking ? ", speaking" : ""}`}
      >
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

        {/* Bottom-right: role badge only */}
        <div className="absolute right-2 bottom-2">
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
