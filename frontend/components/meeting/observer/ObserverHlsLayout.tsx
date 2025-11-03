"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import Logo from "components/shared/LogoComponent";

export default function ObserverHlsLayout({ hlsUrl }: { hlsUrl: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState<{ w: number; h: number }>({
    w: 0,
    h: 0,
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (!cr) return;
      setContainerSize({ w: Math.floor(cr.width), h: Math.floor(cr.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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
          manifestLoadingRetryDelay: 2000,
          levelLoadingRetryDelay: 2000,
          fragLoadingMaxRetry: 6,
          manifestLoadingMaxRetry: 6,
          levelLoadingMaxRetry: 6,
          // Buffer configuration to prevent over-buffering on fast networks
          maxBufferLength: 20,
          maxMaxBufferLength: 30,
          maxBufferSize: 30 * 1000 * 1000,
          maxBufferHole: 0.5,
          // Prevent requesting segments too quickly (causes 404/timeouts on fast networks)
          startFragPrefetch: false,
          // Add delay between segment requests to avoid race conditions
          fragLoadingTimeOut: 20000,
          manifestLoadingTimeOut: 10000,
          // Disable low latency mode which can cause issues on fast networks
          lowLatencyMode: false,
        });
        hls.loadSource(hlsUrl);
        hls.attachMedia(video);
        
        // Wait for manifest before playing (prevents race conditions on fast networks)
        const waitForManifest = new Promise<void>((resolve) => {
          const onManifestLoaded = () => {
            hls.off(Hls.Events.MANIFEST_LOADED, onManifestLoaded);
            // Small delay after manifest loads to ensure segments are available
            setTimeout(() => resolve(), 500);
          };
          hls.on(Hls.Events.MANIFEST_LOADED, onManifestLoaded);
        });

        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (data.fatal) {
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              // Wait a bit before retrying to avoid hammering server
              setTimeout(() => hls.startLoad(), 2000);
            }
            if (data.type === Hls.ErrorTypes.MEDIA_ERROR)
              hls.recoverMediaError();
          }
        });
        
        try {
          await waitForManifest;
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
      <div
        ref={containerRef}
        className="flex-1 min-h-0 flex items-center justify-center"
      >
        {(() => {
          const W = containerSize.w;
          const H = containerSize.h;
          const wByH = Math.floor((H * 16) / 9);
          const viewW = Math.min(W, wByH);
          const viewH = Math.floor((viewW * 9) / 16);
          return (
            <div
              style={{ width: viewW, height: viewH }}
              className="relative rounded-lg overflow-hidden bg-black"
            >
              <video
                ref={videoRef}
                controls
                playsInline
                autoPlay
                crossOrigin="anonymous"
                className="w-full h-full object-cover bg-black"
              />
            </div>
          );
        })()}
      </div>
    </div>
  );
}
