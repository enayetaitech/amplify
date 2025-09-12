"use client";

import { useEffect, useRef } from "react";
import Hls from "hls.js";
import Logo from "components/shared/LogoComponent";

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
    <div className="w-full h-full rounded-xl bg-white overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-1 pb-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
            <span>On going meeting</span>
          </div>
          <span className="rounded-full bg-custom-dark-blue-1 text-white text-xs px-3 py-1">
            Observer View
          </span>
        </div>
        <div className="flex items-center">
          <Logo />
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <video
          ref={videoRef}
          controls
          playsInline
          autoPlay
          crossOrigin="anonymous"
          className="w-full h-full object-cover bg-black"
        />
      </div>
    </div>
  );
}
