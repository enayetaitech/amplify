"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Track } from "livekit-client";
import {
  TrackLoop,
  useTracks,
  ParticipantTile,
} from "@livekit/components-react";

export default function VideoFilmstrip() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [w, setW] = useState(0);

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

  const tile = useMemo(() => {
    // pick tile width based on container width; aim for 1 column vertical list
    const desiredW = Math.max(200, Math.min(360, Math.floor(w * 0.95)));
    const height = Math.floor((desiredW * 9) / 16);
    return { w: desiredW, h: height };
  }, [w]);

  return (
    <div ref={containerRef} className="w-full h-full overflow-y-auto">
      <div className="flex flex-col items-stretch gap-2 pr-1">
        <TrackLoop tracks={cameraTracks}>
          <div
            className="relative rounded-lg overflow-hidden bg-black"
            style={{ width: tile.w, height: tile.h }}
          >
            <ParticipantTile />
          </div>
        </TrackLoop>
      </div>
    </div>
  );
}
