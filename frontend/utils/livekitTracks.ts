type TrackRefLike = {
  publication?: {
    trackName?: string | null;
  };
} | null;

const normalizeTrackName = (name?: string | null): string => {
  return typeof name === "string" ? name.trim().toLowerCase() : "";
};

export function isWhiteboardTrackRef(ref: TrackRefLike): boolean {
  if (!ref) return false;
  const publicationName = ref.publication?.trackName;
  return normalizeTrackName(publicationName) === "whiteboard";
}
