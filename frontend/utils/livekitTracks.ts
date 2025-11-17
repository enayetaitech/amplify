import type { Track } from "livekit-client";

type TrackRefLike = {
  publication?: {
    trackName?: string | null;
  };
  track?: Track | null;
} | null;

const normalizeTrackName = (name?: string | null): string => {
  return typeof name === "string" ? name.trim().toLowerCase() : "";
};

export function isWhiteboardTrackRef(ref: TrackRefLike): boolean {
  if (!ref) return false;
  const publicationName = ref.publication?.trackName;
  const trackName = ref.track?.name;
  const resolvedName = publicationName || trackName;
  return normalizeTrackName(resolvedName) === "whiteboard";
}

