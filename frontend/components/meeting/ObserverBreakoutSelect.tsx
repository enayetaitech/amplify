"use client";

import { useEffect, useState } from "react";
import api from "lib/api";
import type { Socket } from "socket.io-client";
import ObserverHlsLayout from "./ObserverHlsLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "components/ui/tabs";
import { Separator } from "components/ui/separator";

export default function ObserverBreakoutSelect({
  sessionId,
  initialMainUrl,
}: {
  sessionId: string;
  initialMainUrl: string | null;
}) {
  type ParticipantItem = { identity: string; name: string };
  const [options, setOptions] = useState<
    Array<{ key: string; label: string; url: string | null }>
  >([{ key: "__main__", label: "Main", url: initialMainUrl }]);
  const [selected, setSelected] = useState<string>("__main__");
  const [url, setUrl] = useState<string | null>(initialMainUrl);
  const [participants, setParticipants] = useState<ParticipantItem[]>([]);
  const [refreshTick, setRefreshTick] = useState(0);
  const [meetingSocket, setMeetingSocket] = useState<Socket | undefined>(
    undefined
  );

  useEffect(() => {
    setOptions((prev) => {
      const rest = prev.filter((o) => o.key !== "__main__");
      return [{ key: "__main__", label: "Main", url: initialMainUrl }, ...rest];
    });
    if (selected === "__main__") setUrl(initialMainUrl);
  }, [initialMainUrl, selected]);

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

  // Wait for meeting socket to be available
  useEffect(() => {
    let t: ReturnType<typeof setInterval> | undefined;
    const trySet = () => {
      const s: Socket | undefined = (
        globalThis as unknown as { __meetingSocket?: Socket }
      ).__meetingSocket;
      if (s) {
        setMeetingSocket(s);
        if (t) clearInterval(t);
      }
    };
    trySet();
    if (!meetingSocket) {
      t = setInterval(trySet, 400);
    }
    return () => {
      if (t) clearInterval(t);
    };
  }, [meetingSocket]);

  // Load participants for current room (main or breakout) via socket RPC
  useEffect(() => {
    let cancelled = false;
    const s = meetingSocket;
    const load = () => {
      try {
        s?.emit(
          "participants:list:get",
          selected !== "__main__" ? { room: selected } : {},
          (resp?: { items?: ParticipantItem[] }) => {
            if (cancelled) return;
            setParticipants(Array.isArray(resp?.items) ? resp!.items! : []);
          }
        );
      } catch {
        if (!cancelled) setParticipants([]);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [sessionId, selected, refreshTick, meetingSocket]);

  // Refresh participants on socket event
  useEffect(() => {
    const s = meetingSocket;
    const onChanged = () => setRefreshTick((x) => x + 1);
    s?.on("meeting:participants-changed", onChanged);
    return () => {
      s?.off("meeting:participants-changed", onChanged);
    };
  }, [sessionId, meetingSocket]);

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
    const refreshMainUrl = async () => {
      try {
        const res = await api.get<{ data?: { url?: string } }>(
          `/api/v1/livekit/${sessionId}/hls`
        );
        const mainUrl = res?.data?.data?.url || initialMainUrl || null;
        setOptions((prev) => {
          const rest = prev.filter((o) => o.key !== "__main__");
          return [{ key: "__main__", label: "Main", url: mainUrl }, ...rest];
        });
        setUrl(mainUrl);
      } catch {
        setUrl(initialMainUrl || null);
      }
    };

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

        // if currently-selected breakout no longer exists, auto-switch to Main
        const exists = items.some((b) => b.livekitRoom === selected);
        if (selected !== "__main__" && !exists) {
          setSelected("__main__");
          await refreshMainUrl();
          setRefreshTick((x) => x + 1);
        }
      } catch {}
    };
    s?.on("breakouts:changed", onChanged);
    const onClosed = async () => {
      // also force-check selection on explicit close event
      await onChanged();
    };
    s?.on("breakout:closed-mod", onClosed);
    return () => {
      s?.off("breakouts:changed", onChanged);
      s?.off("breakout:closed-mod", onClosed);
    };
  }, [sessionId, initialMainUrl, selected]);

  return (
    <div className="grid grid-cols-12 gap-4 h-[calc(100vh-80px)] p-4">
      <div className="col-span-3 border rounded p-3 overflow-y-auto">
        {/* Upper: Participants tabs */}
        <div>
          <h3 className="font-semibold mb-2">Participants</h3>
          <Tabs defaultValue="plist">
            <TabsList className="gap-2">
              <TabsTrigger value="plist" className="rounded-full h-7 px-4">
                Participant List
              </TabsTrigger>
              <TabsTrigger value="pchat" className="rounded-full h-7 px-4">
                Participant Chat
              </TabsTrigger>
            </TabsList>
            <TabsContent value="plist">
              <div className="space-y-2">
                {participants.length === 0 && (
                  <div className="text-sm text-gray-500">
                    No participants yet.
                  </div>
                )}
                {participants.map((p) => (
                  <div key={p.identity} className="text-sm">
                    {p.name}
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="pchat">
              <div className="text-sm text-gray-500">
                Participant chat will appear here.
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <Separator className="my-4" />

        {/* Lower: Breakouts selection (existing functionality) */}
        <div>
          <h3 className="font-semibold mb-2">Breakouts</h3>
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
