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
  const [debug, setDebug] = useState<{
    enabled: boolean;
    lastPlaylistUpdateTs: number | null;
    lastSegmentSn: number | null;
    recoveryCount: number;
    lastError: string | null;
  }>({
    enabled: false,
    lastPlaylistUpdateTs: null,
    lastSegmentSn: null,
    recoveryCount: 0,
    lastError: null,
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
          enableWorker: true,
          lowLatencyMode: false,
          liveDurationInfinity: true,
          liveSyncDurationCount: 3,
          maxLiveSyncPlaybackRate: 1.2,
          backBufferLength: 30,
          maxBufferLength: 15,
          // Make timeouts more forgiving for very slow networks
          fragLoadingTimeOut: 20000,
          manifestLoadingTimeOut: 20000,
          levelLoadingTimeOut: 20000,
          fragLoadingRetryDelay: 1000,
          manifestLoadingRetryDelay: 1000,
          levelLoadingRetryDelay: 1000,
          fragLoadingMaxRetry: 6,
          manifestLoadingMaxRetry: 6,
          levelLoadingMaxRetry: 6,
          // Help cross small decode gaps on poor networks
          maxBufferHole: 1,
          nudgeOffset: 0.1,
        });

        let lastUpdateAt = Date.now();

        hls.on(Hls.Events.LEVEL_UPDATED, () => {
          lastUpdateAt = Date.now();
          setDebug((d) => ({ ...d, lastPlaylistUpdateTs: lastUpdateAt }));
        });

        hls.on(Hls.Events.FRAG_LOADED, (_e, data: unknown) => {
          if (typeof data === "object" && data !== null) {
            const d = data as Record<string, unknown>;
            const frag =
              (d["frag"] as Record<string, unknown> | undefined) || undefined;
            const maybeSn = frag?.["sn"];
            if (typeof maybeSn === "number") {
              setDebug((dd) => ({ ...dd, lastSegmentSn: maybeSn }));
            }
          }
        });

        // If the playlist doesn't update for 8s, restart loader
        const watchdog = setInterval(() => {
          const now = Date.now();
          if (now - lastUpdateAt > 8000) {
            try {
              hls.stopLoad();
              hls.startLoad();
            } catch {}
            lastUpdateAt = now;
            setDebug((d) => ({ ...d, recoveryCount: d.recoveryCount + 1 }));
          }
        }, 3000);

        // If playback time stops advancing for a while, try to gently recover
        let lastT = 0;
        let stagnantSince: number | null = null;
        const progressMon = setInterval(() => {
          const v = video as HTMLVideoElement;
          if (!v || v.paused || v.readyState < 2) return;
          const t = v.currentTime;
          if (t <= lastT + 0.01) {
            if (stagnantSince == null) stagnantSince = Date.now();
            if (Date.now() - stagnantSince > 8000) {
              try {
                // Nudge and restart loader to re-buffer
                v.currentTime = Math.max(0, t - 0.05);
                hls.startLoad();
              } catch {}
              stagnantSince = Date.now();
              setDebug((d) => ({ ...d, recoveryCount: d.recoveryCount + 1 }));
            }
          } else {
            stagnantSince = null;
          }
          lastT = t;
        }, 2000);

        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (data.fatal) {
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              hls.startLoad();
            } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              hls.recoverMediaError();
            } else {
              try {
                hls.stopLoad();
                hls.startLoad();
              } catch {}
            }
            setDebug((d) => ({
              ...d,
              recoveryCount: d.recoveryCount + 1,
              lastError: `${data.type}:${data.details || "fatal"}`,
            }));
          }
        });

        // React to element-level stalls/waits
        const onStall = () => {
          try {
            hls.startLoad();
          } catch {}
          setDebug((d) => ({ ...d, recoveryCount: d.recoveryCount + 1 }));
        };
        video.addEventListener("stalled", onStall);
        video.addEventListener("waiting", onStall);
        video.addEventListener("suspend", onStall);

        hls.loadSource(hlsUrl);
        hls.attachMedia(video);

        try {
          await (video as HTMLVideoElement).play();
        } catch {}
        cleanup = () => {
          clearInterval(watchdog);
          clearInterval(progressMon);
          video.removeEventListener("stalled", onStall);
          video.removeEventListener("waiting", onStall);
          video.removeEventListener("suspend", onStall);
          hls.destroy();
        };
      }
    })();

    return () => {
      if (cleanup) cleanup();
    };
  }, [hlsUrl]);

  // Enable overlay via hash param `#hlsDebug=1`
  useEffect(() => {
    if (typeof window === "undefined") return;
    const enabled = (window.location.hash || "").includes("hlsDebug=1");
    if (enabled) setDebug((d) => ({ ...d, enabled: true }));
  }, []);

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
              {debug.enabled ? (
                <div className="absolute top-2 left-2 text-[10px] leading-tight bg-black/60 text-white rounded px-2 py-1 space-y-0.5">
                  <div>HLS Debug</div>
                  <div>
                    Last playlist:{" "}
                    {debug.lastPlaylistUpdateTs
                      ? new Date(
                          debug.lastPlaylistUpdateTs
                        ).toLocaleTimeString()
                      : "-"}
                  </div>
                  <div>Last segment SN: {debug.lastSegmentSn ?? "-"}</div>
                  <div>Recovery count: {debug.recoveryCount}</div>
                  {debug.lastError ? (
                    <div>Last error: {debug.lastError}</div>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
