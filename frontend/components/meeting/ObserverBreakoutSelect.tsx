"use client";

import { useEffect, useState } from "react";
import api from "lib/api";
import type { Socket } from "socket.io-client";
import ObserverHlsLayout from "./ObserverHlsLayout";

export default function ObserverBreakoutSelect({
  sessionId,
  initialMainUrl,
}: {
  sessionId: string;
  initialMainUrl: string | null;
}) {
  const [options, setOptions] = useState<
    Array<{ key: string; label: string; url: string | null }>
  >([{ key: "__main__", label: "Main", url: initialMainUrl }]);
  const [selected, setSelected] = useState<string>("__main__");
  const [url, setUrl] = useState<string | null>(initialMainUrl);

  useEffect(() => {
    setOptions((prev) => {
      const rest = prev.filter((o) => o.key !== "__main__");
      return [{ key: "__main__", label: "Main", url: initialMainUrl }, ...rest];
    });
    if (selected === "__main__") setUrl(initialMainUrl);
  }, [initialMainUrl]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await api.get<{
          data: {
            items: Array<{
              index: number;
              livekitRoom: string;
              hls?: { playbackUrl?: string };
            }>;
          };
        }>(`/api/v1/livekit/public/${sessionId}/breakouts`);
        const items = res.data?.data?.items || [];
        const mapped = items.map((b) => ({
          key: b.livekitRoom,
          label: `Breakout #${b.index}`,
          url: b.hls?.playbackUrl || null,
        }));
        if (!cancelled) {
          setOptions((prev) => {
            const main = prev.find((o) => o.key === "__main__") || {
              key: "__main__",
              label: "Main",
              url: initialMainUrl,
            };
            return [main, ...mapped];
          });
        }
      } catch {}
    };

    load();

    const s: Socket | undefined = (
      globalThis as unknown as { __meetingSocket?: Socket }
    ).__meetingSocket;
    const onChanged = () => load();
    s?.on("breakouts:changed", onChanged);
    return () => {
      cancelled = true;
      s?.off("breakouts:changed", onChanged);
    };
  }, [sessionId, initialMainUrl]);

  useEffect(() => {
    if (selected === "__main__") {
      setUrl(options.find((o) => o.key === "__main__")?.url || null);
    } else {
      setUrl(options.find((o) => o.key === selected)?.url || null);
    }
  }, [selected, options]);

  useEffect(() => {
    if (selected === "__main__") return;
    if (url) return;
    let tries = 0;
    let t: ReturnType<typeof setTimeout> | undefined;
    const tick = async () => {
      tries++;
      try {
        const res = await api.get<{
          data: {
            items: Array<{
              index: number;
              livekitRoom: string;
              hls?: { playbackUrl?: string };
            }>;
          };
        }>(`/api/v1/livekit/public/${sessionId}/breakouts`);
        const items = res.data?.data?.items || [];
        const found = items.find((b) => b.livekitRoom === selected);
        if (found?.hls?.playbackUrl) {
          setOptions((prev) => {
            const main = prev.find((o) => o.key === "__main__") || {
              key: "__main__",
              label: "Main",
              url: initialMainUrl,
            };
            const mapped = items.map((b) => ({
              key: b.livekitRoom,
              label: `Breakout #${b.index}`,
              url: b.hls?.playbackUrl || null,
            }));
            return [main, ...mapped];
          });
          setUrl(found.hls.playbackUrl);
          return;
        }
      } catch {}
      if (tries < 5) t = setTimeout(tick, 1500);
    };
    tick();
    return () => clearTimeout(t);
  }, [selected, url, sessionId, initialMainUrl]);

  useEffect(() => {
    const s: Socket | undefined = (
      globalThis as unknown as { __meetingSocket?: Socket }
    ).__meetingSocket;
    const onChanged = async () => {
      try {
        const res = await api.get<{
          data: {
            items: Array<{
              index: number;
              livekitRoom: string;
              hls?: { playbackUrl?: string };
            }>;
          };
        }>(`/api/v1/livekit/public/${sessionId}/breakouts`);
        const items = res.data?.data?.items || [];
        const mapped = items.map((b) => ({
          key: b.livekitRoom,
          label: `Breakout #${b.index}`,
          url: b.hls?.playbackUrl || null,
        }));
        setOptions((prev) => {
          const main = prev.find((o) => o.key === "__main__") || {
            key: "__main__",
            label: "Main",
            url: initialMainUrl,
          };
          return [main, ...mapped];
        });
      } catch {}
    };
    s?.on("breakouts:changed", onChanged);
    return () => {
      s?.off("breakouts:changed", onChanged);
    };
  }, [sessionId, initialMainUrl]);

  return (
    <div className="grid grid-cols-12 gap-4 h-[calc(100vh-80px)] p-4">
      <div className="col-span-3 border rounded p-3 overflow-y-auto">
        <h3 className="font-semibold mb-2">Observer</h3>
        <label className="block text-sm mb-1">Choose a room</label>
        <select
          className="border rounded px-2 py-1 text-black w-full"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          {options.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </select>
        <div className="text-xs text-gray-500 mt-2">
          {url ? "Streaming available" : "No live stream for this room"}
        </div>
      </div>
      <div className="col-span-9 border rounded p-3 flex flex-col min-h-0">
        {url ? (
          <ObserverHlsLayout hlsUrl={url} />
        ) : (
          <div className="m-auto text-gray-500">No live stream…</div>
        )}
      </div>
    </div>
  );
}
