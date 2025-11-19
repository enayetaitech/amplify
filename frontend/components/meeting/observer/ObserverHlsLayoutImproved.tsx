"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import Logo from "components/shared/LogoComponent";
import { AlertCircle } from "lucide-react";
import { Button } from "components/ui/button";

interface ObserverHlsLayoutImprovedProps {
  hlsUrl: string;
  maxRetries?: number;
  retryDelay?: number;
}

export default function ObserverHlsLayoutImproved({
  hlsUrl,
  maxRetries = 5,
  retryDelay = 3000,
}: ObserverHlsLayoutImprovedProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsInstanceRef = useRef<Hls | null>(null);
  const [containerSize, setContainerSize] = useState<{ w: number; h: number }>({
    w: 0,
    h: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

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

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (hlsInstanceRef.current) {
      try {
        hlsInstanceRef.current.destroy();
      } catch (err) {
        console.warn("Error destroying HLS instance:", err);
      }
      hlsInstanceRef.current = null;
    }
  }, []);

  const attemptReconnect = useCallback(
    (reason: string) => {
      if (retryCount >= maxRetries) {
        setError(`Failed after ${maxRetries} retries. ${reason}`);
        setIsLoading(false);
        return;
      }

      setRetryCount((prev) => prev + 1);
      setError(`Reconnecting... (${retryCount + 1}/${maxRetries})`);
      setIsLoading(true);

      reconnectTimeoutRef.current = setTimeout(() => {
        // Trigger reload by creating a new effect cycle
        setError(null);
      }, retryDelay);
    },
    [retryCount, maxRetries, retryDelay]
  );

  const initializeHls = useCallback(
    async (url: string) => {
      const video = videoRef.current;
      if (!video) return;

      cleanup();
      setError(null);
      setIsLoading(true);

      // Quick availability check with timeout
      const checkAvailability = async (src: string): Promise<boolean> => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        try {
          const response = await fetch(src, {
            method: "HEAD",
            cache: "no-store",
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          return response.ok;
        } catch {
          clearTimeout(timeoutId);
          return false;
        }
      };

      const isAvailable = await checkAvailability(url);
      if (!isAvailable) {
        attemptReconnect("HLS stream not available");
        return;
      }

      // Native HLS support (Safari)
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        try {
          video.src = url;
          await video.play();
          setIsLoading(false);
          setError(null);
          return;
        } catch (err) {
          console.warn("Native HLS playback failed:", err);
          // Fall through to HLS.js
        }
      }

      // HLS.js support
      if (!Hls.isSupported()) {
        setError("HLS is not supported in this browser");
        setIsLoading(false);
        return;
      }

      try {
        const hls = new Hls({
          liveDurationInfinity: true,
          liveSyncDurationCount: 3,
          maxLiveSyncPlaybackRate: 1.2,
          fragLoadingRetryDelay: 2000, // Increased delay between retries
          manifestLoadingRetryDelay: 3000,
          levelLoadingRetryDelay: 3000,
          fragLoadingMaxRetry: 4,
          manifestLoadingMaxRetry: 4,
          levelLoadingMaxRetry: 4,
          enableWorker: true,
          // Disable low latency mode - causes race conditions on fast networks
          lowLatencyMode: false,
          // Conservative buffer settings for fast networks
          maxBufferLength: 20,
          maxMaxBufferLength: 30,
          maxBufferSize: 30 * 1000 * 1000,
          maxBufferHole: 0.5,
          highBufferWatchdogPeriod: 2,
          nudgeOffset: 0.1,
          nudgeMaxRetry: 3,
          // Prevent requesting segments before they're available
          startFragPrefetch: false,
          // Timeouts to handle slow segment availability
          fragLoadingTimeOut: 20000,
          manifestLoadingTimeOut: 10000,
          // Add delay between manifest refreshes to avoid hammering server
          manifestLoadingMaxRetryTimeout: 10000,
        });

        hlsInstanceRef.current = hls;

        // Enhanced error handling
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.error("Network error, attempting to recover...");
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.error("Media error, attempting to recover...");
                hls.recoverMediaError();
                break;
              default:
                console.error("Fatal HLS error:", data);
                cleanup();
                attemptReconnect(data.details || "Fatal HLS error");
                break;
            }
          } else {
            // Non-fatal errors - log but continue
            console.warn("Non-fatal HLS error:", data);
          }
        });

        hls.on(Hls.Events.MANIFEST_LOADED, () => {
          console.log("HLS manifest loaded successfully");
          setError(null);
        });

        hls.on(Hls.Events.FRAG_LOADED, () => {
          setIsLoading(false);
        });

        // Handle fragment loading issues (common on fast networks)
        hls.on(Hls.Events.FRAG_LOADING, () => {
          // Fragment is starting to load
        });

        hls.on(Hls.Events.FRAG_LOAD_EMERGENCY_ABORTED, () => {
          console.warn("Fragment load aborted, will retry");
          // HLS.js will handle retry automatically
        });

        // Listen for buffer issues
        hls.on(Hls.Events.BUFFER_APPENDING, () => {
          // Buffer is being filled
        });

        // Monitor buffer state to prevent over-buffering
        hls.on(Hls.Events.BUFFER_APPENDED, () => {
          // Check if buffer is getting too large
          if (video.buffered.length > 0) {
            const bufferedEnd = video.buffered.end(video.buffered.length - 1);
            const currentTime = video.currentTime;
            const bufferAhead = bufferedEnd - currentTime;

            // If buffer is too far ahead (more than 30 seconds), reduce buffer
            if (bufferAhead > 30) {
              try {
                // Let HLS.js handle buffer management, just log
                console.log(`Buffer ahead: ${bufferAhead.toFixed(1)}s`);
              } catch {}
            }
          }
        });

        hls.loadSource(url);
        hls.attachMedia(video);

        // Attempt play after a short delay to ensure media is ready
        try {
          await new Promise((resolve) => setTimeout(resolve, 500));
          await video.play();
          setIsLoading(false);
        } catch (playError) {
          console.warn("Auto-play failed:", playError);
          // User interaction might be needed, but don't treat as fatal
          setIsLoading(false);
        }
      } catch (err) {
        console.error("HLS initialization error:", err);
        cleanup();
        attemptReconnect(
          err instanceof Error ? err.message : "Failed to initialize HLS"
        );
      }
    },
    [cleanup, attemptReconnect]
  );

  useEffect(() => {
    if (!hlsUrl) {
      setError("No HLS URL provided");
      setIsLoading(false);
      return;
    }

    initializeHls(hlsUrl);

    return () => {
      cleanup();
    };
  }, [hlsUrl, initializeHls, cleanup]);

  const handleManualRetry = () => {
    setRetryCount(0);
    setError(null);
    if (hlsUrl) {
      initializeHls(hlsUrl);
    }
  };

  return (
    <div className="w-full h-full rounded-xl bg-white overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-1 pb-2">
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-wrap">
          <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            {error ? (
              <span className="inline-block h-2 w-2 rounded-full bg-red-500 flex-shrink-0" />
            ) : isLoading ? (
              <span className="inline-block h-2 w-2 rounded-full bg-yellow-500 animate-pulse flex-shrink-0" />
            ) : (
              <span className="inline-block h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
            )}
            <span className="whitespace-nowrap">{error ? "Error" : isLoading ? "Loading..." : "Live"}</span>
          </div>
          <span className="rounded-full bg-custom-dark-blue-1 text-white text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1 whitespace-nowrap">
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
                onError={(e) => {
                  console.error("Video element error:", e);
                  setError("Video playback error");
                  setIsLoading(false);
                }}
                onLoadedData={() => {
                  setIsLoading(false);
                  setError(null);
                }}
              />
              {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-4">
                  <AlertCircle className="h-12 w-12 mb-4 text-red-500" />
                  <p className="text-center mb-4">{error}</p>
                  <Button onClick={handleManualRetry} variant="default">
                    Retry Connection
                  </Button>
                </div>
              )}
              {isLoading && !error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="text-white">Loading stream...</div>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
