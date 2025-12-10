"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Track } from "livekit-client";
import {
  useTracks,
  ParticipantTile,
  useParticipants,
} from "@livekit/components-react";
import type { TrackReferenceOrPlaceholder } from "@livekit/components-react";
import { Badge } from "components/ui/badge";
import {
  normalizeServerRole,
  normalizeUiRole,
  toUiRole,
  type UiRole as UiRoleType,
} from "constant/roles";
import { formatParticipantName } from "utils/formatParticipantName";
import { useSocketParticipantInfo } from "hooks/useSocketParticipantInfo";

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

function roleLabel(role: UiRoleType | null | undefined): string | null {
  if (!role) return null;
  if (role === "moderator") return "Host";
  if (role === "admin") return "Admin";
  if (role === "participant") return "Participant";
  if (role === "observer") return "Observer";
  return null;
}

function FilmstripTile({
  identityToName,
  identityToUiRole,
  tileSize,
  trackRef,
}: {
  identityToName: Record<string, string>;
  identityToUiRole: Record<string, UiRoleType | null>;
  tileSize: { w: number; h: number };
  trackRef: TrackReferenceOrPlaceholder;
}) {
  const identity = trackRef.participant?.identity || "";
  const fallbackName =
    identityToName[identity] ||
    parseDisplayNameFromMetadata(trackRef.participant?.metadata) ||
    trackRef.participant?.name ||
    identity ||
    "Participant";
  const badgeLabel = roleLabel(identityToUiRole[identity]);

  return (
    <div
      className="relative rounded-lg overflow-hidden bg-black"
      style={{ width: tileSize.w, height: tileSize.h }}
    >
      <ParticipantTile trackRef={trackRef} mirror={false} />
      <div className="absolute left-2 bottom-2 max-w-[calc(100%-100px)] z-10">
        <span
          className="inline-block max-w-full truncate rounded bg-black/60 px-2 py-1 text-xs text-white"
          title={fallbackName}
        >
          {fallbackName}
        </span>
      </div>
      {badgeLabel ? (
        <div className="absolute right-2 bottom-2 z-10">
          <Badge
            className="bg-black/60 text-white border-white/30"
            variant="outline"
          >
            {badgeLabel}
          </Badge>
        </div>
      ) : null}
    </div>
  );
}

export default function VideoFilmstrip() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [w, setW] = useState(0);
  const participants = useParticipants();
  const socketParticipantInfo = useSocketParticipantInfo();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (!cr) return;
      setW(Math.floor(cr.width));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const cameraTracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
  ]);

  const activeCameraTracks = useMemo(
    () =>
      cameraTracks.filter((trackRef) => {
        const publication = trackRef.publication;
        if (!publication) return false;
        if (publication.source !== Track.Source.Camera) return false;
        return publication.isMuted === false && !!publication.track;
      }),
    [cameraTracks]
  );

  const tile = useMemo(() => {
    // pick tile width based on container width; aim for 1 column vertical list
    const desiredW = Math.max(200, Math.min(360, Math.floor(w * 0.95)));
    const height = Math.floor((desiredW * 9) / 16);
    return { w: desiredW, h: height };
  }, [w]);

  const identityToName = useMemo(() => {
    const map: Record<string, string> = {};
    for (const participant of participants) {
      const id = participant.identity || "";
      if (!id) continue;
      const socketInfo = socketParticipantInfo[id.toLowerCase()];
      if (socketInfo) {
        const formatted = formatParticipantName(
          socketInfo.firstName,
          socketInfo.lastName
        );
        map[id] = formatted || socketInfo.name;
      } else {
        const metaName = parseDisplayNameFromMetadata(participant.metadata);
        map[id] = metaName || participant.name || id;
      }
    }
    return map;
  }, [participants, socketParticipantInfo]);

  const identityToUiRole = useMemo(() => {
    const map: Record<string, UiRoleType | null> = {};
    for (const participant of participants) {
      const id = participant.identity || "";
      if (!id) continue;
      const socketInfo = socketParticipantInfo[id.toLowerCase()];
      if (socketInfo?.role) {
        const serverRole = normalizeServerRole(socketInfo.role);
        map[id] = serverRole ? toUiRole(serverRole) : null;
      } else {
        map[id] = parseUiRoleFromMetadata(participant.metadata);
      }
    }
    return map;
  }, [participants, socketParticipantInfo]);

  return (
    <div ref={containerRef} className="w-full h-full overflow-y-auto">
      <div className="flex flex-col items-stretch gap-2 pr-1">
        {activeCameraTracks.map((trackRef, idx) => (
          <FilmstripTile
            key={
              trackRef.participant?.identity ||
              trackRef.participant?.sid ||
              `camera-${idx}`
            }
            identityToName={identityToName}
            identityToUiRole={identityToUiRole}
            tileSize={tile}
            trackRef={trackRef}
          />
        ))}
      </div>
    </div>
  );
}
