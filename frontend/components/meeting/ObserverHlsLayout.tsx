"use client";

import { useEffect, useRef } from "react";
import Hls from "hls.js";

export default function ObserverHlsLayout({ hlsUrl }: { hlsUrl: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hlsUrl) return;

    let cleanup: (() => void) | null = null;

    const ping = async (src: string) => {
      for (let i = 0; i < 10; i++) {
        try {
          const u = new URL(src);
          const r = await fetch(u.toString(), {
            method: "HEAD",
            cache: "no-store",
          });
          if (r.ok) return true;
        } catch {}
        await new Promise((r) => setTimeout(r, 1000));
      }
      return false;
    };

    (async () => {
      await ping(hlsUrl);
      if (
        (video as HTMLVideoElement).canPlayType("application/vnd.apple.mpegurl")
      ) {
        (video as HTMLVideoElement).src = hlsUrl;
        try {
          await (video as HTMLVideoElement).play();
        } catch {}
        return;
      }
      if (Hls.isSupported()) {
        const hls = new Hls({
          liveDurationInfinity: true,
          liveSyncDurationCount: 3,
          maxLiveSyncPlaybackRate: 1.2,
          fragLoadingRetryDelay: 1000,
          manifestLoadingRetryDelay: 1000,
          levelLoadingRetryDelay: 1000,
          fragLoadingMaxRetry: 6,
          manifestLoadingMaxRetry: 6,
          levelLoadingMaxRetry: 6,
        });
        hls.loadSource(hlsUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (data.fatal) {
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
            if (data.type === Hls.ErrorTypes.MEDIA_ERROR)
              hls.recoverMediaError();
          }
        });
        try {
          await (video as HTMLVideoElement).play();
        } catch {}
        cleanup = () => hls.destroy();
      }
    })();

    return () => {
      if (cleanup) cleanup();
    };
  }, [hlsUrl]);

  return (
    <div className="grid grid-cols-12 gap-4 h-[calc(100vh-80px)] p-4">
      <div className="col-span-9 border rounded p-3 flex flex-col min-h-0">
        <video
          ref={videoRef}
          controls
          playsInline
          autoPlay
          crossOrigin="anonymous"
          className="w-full h-full"
        />
      </div>
      <aside className="col-span-3 border rounded p-3 overflow-y-auto">
        <h3 className="font-semibold mb-2">Observers</h3>
      </aside>
    </div>
  );
}

