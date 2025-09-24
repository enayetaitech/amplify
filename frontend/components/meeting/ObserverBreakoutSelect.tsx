"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import api from "lib/api";
import type { Socket } from "socket.io-client";
import ObserverHlsLayout from "./ObserverHlsLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "components/ui/tabs";
import { Input } from "components/ui/input";
import { Button } from "components/ui/button";
import { Badge } from "components/ui/badge";
import { Separator } from "components/ui/separator";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  MessageSquare,
  Send,
  X,
} from "lucide-react";
import { toast } from "sonner";
import DocumentHub from "./rightSideBar/DocumentHub";
// import ObserverChatPanel from "./ObserverChatPanel";
import { formatDisplayName } from "lib/utils";
import { useGlobalContext } from "context/GlobalContext";
import { safeLocalGet } from "utils/storage";

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
  const [isLeftOpen, setIsLeftOpen] = useState(true);
  const [isRightOpen, setIsRightOpen] = useState(true);
  const [observerCount, setObserverCount] = useState(0);
  const [observerList, setObserverList] = useState<
    { name: string; email: string }[]
  >([]);
  const [moderatorList, setModeratorList] = useState<
    { name: string; email: string; role: string }[]
  >([]);
  const [selectedObserver, setSelectedObserver] = useState<{
    email: string;
    name?: string;
  } | null>(null);
  const [showGroupChatObs, setShowGroupChatObs] = useState(false);
  type DmScope = "stream_dm_obs_mod" | "stream_dm_obs_obs";
  type DmMessage = {
    email: string;
    senderName?: string;
    role?: string;
    content: string;
    timestamp?: string | Date;
    toEmail?: string;
  };
  const [dmMessages, setDmMessages] = useState<DmMessage[]>([]);
  const [dmText, setDmText] = useState("");
  const [dmScope, setDmScope] = useState<DmScope | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  // Group chat state (stream_group)
  type GroupMessage = { senderEmail?: string; name?: string; content: string };
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [groupText, setGroupText] = useState("");
  const [groupLoading, setGroupLoading] = useState(false);
  const [groupUnread, setGroupUnread] = useState(0);
  const [dmUnreadByEmail, setDmUnreadByEmail] = useState<
    Record<string, number>
  >({});
  const groupRef = useRef<HTMLDivElement | null>(null);
  const dmRef = useRef<HTMLDivElement | null>(null);

  // derive current user's email (observer) to hide self from lists
  const { user } = useGlobalContext();
  const myEmailLower = useMemo(() => {
    const emailFromUser = (user?.email as string) || "";
    if (emailFromUser) return emailFromUser.toLowerCase();
    const stored = safeLocalGet<{ email?: string }>("liveSessionUser");
    const e = (stored?.email as string) || "";
    return e.toLowerCase();
  }, [user]);

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

  // Right sidebar: observer count/list
  useEffect(() => {
    const s = meetingSocket;
    if (!s) return;
    const onCount = (p: { count?: number }) => {
      setObserverCount(Number(p?.count || 0));
    };
    const onList = (p: { observers?: { name: string; email: string }[] }) => {
      const list = Array.isArray(p?.observers) ? p.observers : [];
      setObserverList(list);
      setObserverCount(list.length);
    };
    const onMods = (p: {
      moderators?: { name: string; email: string; role: string }[];
    }) => {
      console.log("Moderator name", p.moderators);
      setModeratorList(Array.isArray(p?.moderators) ? p.moderators : []);
    };
    s.on("observer:count", onCount);
    s.on("observer:list", onList);
    s.on("moderator:list", onMods);
    // initial list
    s.emit(
      "observer:list:get",
      {},
      (resp?: { observers?: { name: string; email: string }[] }) => {
        const list = Array.isArray(resp?.observers) ? resp!.observers! : [];
        setObserverList(list);
        setObserverCount(list.length);
      }
    );
    s.emit(
      "moderator:list:get",
      {},
      (resp?: {
        moderators?: { name: string; email: string; role: string }[];
      }) => {
        setModeratorList(
          Array.isArray(resp?.moderators) ? resp!.moderators! : []
        );
      }
    );
    return () => {
      s.off("observer:count", onCount);
      s.off("observer:list", onList);
      s.off("moderator:list", onMods);
    };
  }, [meetingSocket]);

  // Compute whether selected peer is moderator
  const selectedIsModerator = useMemo(() => {
    if (!selectedObserver) return false;
    const sel = (selectedObserver.email || "").toLowerCase();
    return moderatorList.some((m) => (m.email || "").toLowerCase() === sel);
  }, [selectedObserver, moderatorList]);

  // Load DM history when selecting a peer
  useEffect(() => {
    const s = meetingSocket;
    if (!s) return;
    if (!selectedObserver || showGroupChatObs) {
      setDmMessages([]);
      setDmScope(null);
      return;
    }
    const scope: DmScope = selectedIsModerator
      ? "stream_dm_obs_mod"
      : "stream_dm_obs_obs";
    setDmScope(scope);
    setLoadingHistory(true);
    try {
      s.emit(
        "chat:history:get",
        {
          scope,
          thread: { withEmail: selectedObserver.email },
          limit: 100,
        },
        (resp?: { items?: DmMessage[] }) => {
          const items = Array.isArray(resp?.items) ? resp!.items! : [];
          setDmMessages(items);
          setLoadingHistory(false);
        }
      );
    } catch {
      setDmMessages([]);
      setLoadingHistory(false);
    }
  }, [meetingSocket, selectedObserver, selectedIsModerator, showGroupChatObs]);

  // Live incoming DM messages
  useEffect(() => {
    const s = meetingSocket;
    if (!s) return;
    const onChatNew = (p: { scope?: string; message?: DmMessage }) => {
      if (!p?.scope || !p?.message) return;
      if (!dmScope || p.scope !== dmScope) return;
      if (!selectedObserver) return;
      const me = myEmailLower;
      const peer = (selectedObserver.email || "").toLowerCase();
      const from = (p.message.email || "").toLowerCase();
      const to = (p.message.toEmail || "").toLowerCase();
      const matches =
        (from === me && to === peer) || (from === peer && to === me);
      if (!matches) return;
      setDmMessages((prev) => [...prev, p.message as DmMessage]);
    };
    s.on("chat:new", onChatNew);
    return () => {
      s.off("chat:new", onChatNew);
    };
  }, [meetingSocket, dmScope, selectedObserver, myEmailLower]);

  // Auto-scroll DM chat
  useEffect(() => {
    if (!selectedObserver || showGroupChatObs) return;
    const el = dmRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [selectedObserver, showGroupChatObs, dmMessages.length, loadingHistory]);

  // Global unread for DMs (both obs-obs and obs-mod)
  useEffect(() => {
    const s = meetingSocket;
    if (!s) return;
    const onNew = (p: { scope?: string; message?: DmMessage }) => {
      if (!p?.scope || !p?.message) return;
      if (!(p.scope === "stream_dm_obs_mod" || p.scope === "stream_dm_obs_obs"))
        return;
      const me = myEmailLower;
      const from = (p.message.email || "").toLowerCase();
      const to = (p.message.toEmail || "").toLowerCase();
      const incomingFromPeer = from !== me;
      const peer = incomingFromPeer ? from : to;
      const openPeer = (selectedObserver?.email || "").toLowerCase();
      const isOpen =
        !!selectedObserver && peer === openPeer && !showGroupChatObs;
      if (isOpen) return;
      setDmUnreadByEmail((prev) => ({
        ...prev,
        [peer]: (prev[peer] || 0) + 1,
      }));
    };
    s.on("chat:new", onNew);
    return () => {
      s.off("chat:new", onNew);
    };
  }, [meetingSocket, selectedObserver, showGroupChatObs, myEmailLower]);

  // Send DM
  const sendDm = () => {
    const s = meetingSocket;
    if (!s || !selectedObserver || !dmScope) return;
    const text = dmText.trim();
    if (!text) return;
    s.emit(
      "chat:send",
      { scope: dmScope, content: text, toEmail: selectedObserver.email },
      (ack?: { ok?: boolean; error?: string }) => {
        if (ack?.ok) {
          setDmText("");
        } else {
          toast.error(ack?.error || "Failed to send message");
        }
      }
    );
  };

  // Group chat: load history when opened
  useEffect(() => {
    const s = meetingSocket;
    if (!s) return;
    if (!showGroupChatObs) return;
    setGroupLoading(true);
    try {
      s.emit(
        "chat:history:get",
        { scope: "stream_group", limit: 100 },
        (resp?: { items?: GroupMessage[] }) => {
          setGroupMessages(Array.isArray(resp?.items) ? resp!.items! : []);
          setGroupLoading(false);
          setGroupUnread(0);
        }
      );
    } catch {
      setGroupMessages([]);
      setGroupLoading(false);
    }
  }, [meetingSocket, showGroupChatObs]);

  // Group chat: live updates
  useEffect(() => {
    const s = meetingSocket;
    if (!s) return;
    const onNew = (p: { scope?: string; message?: GroupMessage }) => {
      if (p?.scope !== "stream_group" || !p?.message) return;
      if (showGroupChatObs) {
        setGroupMessages((prev) => [...prev, p.message as GroupMessage]);
        setGroupUnread(0);
      } else {
        setGroupUnread((x) => x + 1);
      }
    };
    s.on("chat:new", onNew);
    return () => {
      s.off("chat:new", onNew);
    };
  }, [meetingSocket, showGroupChatObs]);

  // Auto-scroll group chat
  useEffect(() => {
    if (!showGroupChatObs) return;
    const el = groupRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [showGroupChatObs, groupMessages.length, groupLoading]);

  // Group chat: send
  const sendGroup = () => {
    const s = meetingSocket;
    if (!s) return;
    const txt = groupText.trim();
    if (!txt) return;
    s.emit(
      "chat:send",
      { scope: "stream_group", content: txt },
      (ack?: { ok?: boolean; error?: string }) => {
        if (ack?.ok) setGroupText("");
        else toast.error(ack?.error || "Failed to send message");
      }
    );
  };

  const mainColSpanClass =
    (isLeftOpen ? 1 : 0) + (isRightOpen ? 1 : 0) === 2
      ? "col-span-6"
      : (isLeftOpen ? 1 : 0) + (isRightOpen ? 1 : 0) === 1
      ? "col-span-9"
      : "col-span-12";

  const hasBreakouts = useMemo(
    () => options.some((o) => o.key !== "__main__"),
    [options]
  );

  // Track previous breakout set to detect creations/closures and toast
  const prevBreakoutsMapRef = useRef<Map<string, number>>(new Map());
  const breakoutsInitRef = useRef(false);

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
        // diff previous vs current for toast notifications
        try {
          const prevMap = prevBreakoutsMapRef.current;
          const currentMap = new Map<string, number>();
          for (const b of items) currentMap.set(b.livekitRoom, b.index);
          if (breakoutsInitRef.current) {
            for (const [room, idx] of currentMap.entries()) {
              if (!prevMap.has(room)) toast.success(`Breakout #${idx} created`);
            }
            for (const [room, idx] of prevMap.entries()) {
              if (!currentMap.has(room)) toast.info(`Breakout #${idx} closed`);
            }
          }
          prevBreakoutsMapRef.current = currentMap;
          if (!breakoutsInitRef.current) breakoutsInitRef.current = true;
        } catch {}
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
      // Rely on breakouts:changed diff to toast; avoid duplicate toasts here
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
    <div className="relative grid grid-cols-12 gap-4 h-[100dvh]">
      {isLeftOpen && (
        <div className="relative col-span-3 h-[100dvh] rounded-r-2xl p-2 overflow-y-auto overflow-x-hidden bg-white shadow min-h-0 flex flex-col gap-4">
          <button
            type="button"
            onClick={() => setIsLeftOpen(false)}
            className="absolute -right-3 top-3 z-20 h-8 w-8 rounded-full border bg-white shadow flex items-center justify-center"
            aria-label="Collapse left panel"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {/* Upper: Participants tabs */}
          <div className="bg-custom-gray-2 rounded-lg p-2 flex-1 min-h-0 overflow-y-auto">
            <h3 className="font-semibold mb-2">Participants</h3>
            <Tabs defaultValue="plist">
              <TabsList className="sticky top-0 z-10 bg-custom-gray-2 w-full gap-2">
                <TabsTrigger
                  value="plist"
                  className="rounded-full h-6 px-4 border shadow-sm data-[state=active]:bg-custom-dark-blue-1 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent data-[state=inactive]:border-custom-dark-blue-1 data-[state=inactive]:text-custom-dark-blue-1 cursor-pointer"
                >
                  Participant List
                </TabsTrigger>
                <TabsTrigger
                  value="pchat"
                  className="rounded-full h-6 px-4 border shadow-sm data-[state=active]:bg-custom-dark-blue-1 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent data-[state=inactive]:border-custom-dark-blue-1 data-[state=inactive]:text-custom-dark-blue-1 cursor-pointer"
                >
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

          {hasBreakouts && <Separator className="my-2" />}

          {/* Lower: Breakouts selection (existing functionality) */}
          {hasBreakouts && (
            <div className="bg-custom-gray-2 rounded-lg p-2 flex-1 min-h-0 overflow-y-auto">
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
          )}
        </div>
      )}
      {!isLeftOpen && (
        <button
          type="button"
          onClick={() => setIsLeftOpen(true)}
          className="absolute -left-3 top-3 z-20 h-8 w-8 rounded-full border bg-white shadow flex items-center justify-center"
          aria-label="Expand left panel"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
      <div className={`${mainColSpanClass} rounded p-3 flex flex-col min-h-0`}>
        {url ? (
          <ObserverHlsLayout hlsUrl={url} />
        ) : (
          <div className="m-auto text-gray-500">No live stream…</div>
        )}
      </div>
      {isRightOpen && (
        <aside className="relative col-span-3 h-[100dvh] rounded-l-2xl p-3 overflow-y-auto bg-white shadow">
          <button
            type="button"
            onClick={() => setIsRightOpen(false)}
            className="absolute -left-3 top-3 z-20 h-8 w-8 rounded-full border bg-white shadow flex items-center justify-center"
            aria-label="Collapse right panel"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold pl-5">Backroom</h3>
            <div className="inline-flex items-center gap-1 rounded-full bg-black text-white text-xs px-3 py-1">
              <span className="inline-flex h-4 w-4 items-center justify-center">
                <Eye className="h-3.5 w-3.5" />
              </span>
              <span>Viewers</span>
              <span className="ml-1 rounded bg-white/20 px-1">
                {observerCount}
              </span>
            </div>
          </div>
          <div className="my-2 bg-custom-gray-2 rounded-lg p-1 max-h-[40vh] min-h-[40vh] overflow-hidden">
            <Tabs defaultValue="list">
              <TabsList className="sticky top-0 z-10 bg-custom-gray-2 w-full gap-2">
                <TabsTrigger
                  value="list"
                  className="rounded-full h-6 px-4 border shadow-sm data-[state=active]:bg-custom-dark-blue-1 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent data-[state=inactive]:border-custom-dark-blue-1 data-[state=inactive]:text-custom-dark-blue-1 cursor-pointer"
                >
                  Observer List
                </TabsTrigger>
                <TabsTrigger
                  value="chat"
                  className="rounded-full h-6 px-4 border shadow-sm data-[state=active]:bg-custom-dark-blue-1 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent data-[state=inactive]:border-custom-dark-blue-1 data-[state=inactive]:text-custom-dark-blue-1 cursor-pointer"
                >
                  Observer Text
                </TabsTrigger>
              </TabsList>
              <TabsContent value="list">
                <div className="space-y-2">
                  {observerList.length === 0 && (
                    <div className="text-sm text-gray-500">
                      No observers yet.
                    </div>
                  )}
                  {observerList.map((o) => {
                    const label = o.name || o.email || "Observer";
                    return (
                      <div
                        key={`${label}-${o.email}`}
                        className="flex items-center justify-between gap-2 rounded px-2 py-1"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">
                            {label}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
              <TabsContent value="chat">
                <div className="grid grid-cols-12 gap-2 h-[32vh]">
                  {!selectedObserver && !showGroupChatObs && (
                    <div className="col-span-12 rounded bg-white ">
                      <div className="space-y-1 p-2">
                        {observerList.length === 0 ? (
                          <div className="text-sm text-gray-500">
                            No observers yet.
                          </div>
                        ) : (
                          <>
                            {moderatorList
                              .filter((m) => {
                                const nm = (m?.name || "").trim().toLowerCase();
                                if (nm === "moderator") return false;
                                if (
                                  (m?.email || "").toLowerCase() ===
                                  myEmailLower
                                )
                                  return false;
                                const lbl = (m?.name || m?.email || "").trim();
                                return lbl.length > 0;
                              })
                              .map((m) => {
                                const label = m.name
                                  ? formatDisplayName(m.name)
                                  : m.email || "";
                                const mKey = (m.email || "").toLowerCase();
                                const mUnread = dmUnreadByEmail[mKey] || 0;
                                return (
                                  <div
                                    key={`${m.email}-${m.role}`}
                                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                                    onClick={() => {
                                      setSelectedObserver({
                                        email: m.email,
                                        name: m.name,
                                      });
                                      setShowGroupChatObs(false);
                                      setDmUnreadByEmail((prev) => ({
                                        ...prev,
                                        [mKey]: 0,
                                      }));
                                    }}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="text-sm font-medium truncate">
                                        {label}
                                      </span>
                                    </div>
                                    <div className="relative inline-flex items-center justify-center h-6 w-6">
                                      <MessageSquare className="h-4 w-4 text-gray-400" />
                                      {mUnread > 0 && (
                                        <span className="absolute -top-1 -right-1">
                                          <Badge
                                            variant="destructive"
                                            className="h-4 min-w-[1rem] leading-none p-0 text-[10px] inline-flex items-center justify-center"
                                          >
                                            {mUnread}
                                          </Badge>
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            <div
                              className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                              onClick={() => {
                                setShowGroupChatObs(true);
                                setSelectedObserver(null);
                              }}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-sm font-medium truncate">
                                  Group Chat
                                </span>
                              </div>
                              <div className="relative inline-flex items-center justify-center h-6 w-6">
                                <MessageSquare className="h-4 w-4 text-gray-400" />
                                {groupUnread > 0 && (
                                  <span className="absolute -top-1 -right-1">
                                    <Badge
                                      variant="destructive"
                                      className="h-4 min-w-[1rem] leading-none p-0 text-[10px] inline-flex items-center justify-center"
                                    >
                                      {groupUnread}
                                    </Badge>
                                  </span>
                                )}
                              </div>
                            </div>
                            {observerList
                              .filter(
                                (o) =>
                                  (o?.email || "").toLowerCase() !==
                                  myEmailLower
                              )
                              .map((o) => {
                                const label = o.name
                                  ? formatDisplayName(o.name)
                                  : o.email || "Observer";
                                const oKey = (o.email || "").toLowerCase();
                                return (
                                  <div
                                    key={`${o.email}`}
                                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                                    onClick={() => {
                                      setSelectedObserver({
                                        email: o.email,
                                        name: o.name,
                                      });
                                      setShowGroupChatObs(false);
                                      setDmUnreadByEmail((prev) => ({
                                        ...prev,
                                        [oKey]: 0,
                                      }));
                                    }}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="text-sm font-medium truncate">
                                        {label}
                                      </span>
                                    </div>
                                    <div className="relative inline-flex items-center justify-center h-6 w-6">
                                      <MessageSquare className="h-4 w-4 text-gray-400" />
                                      {(dmUnreadByEmail[
                                        (o.email || "").toLowerCase()
                                      ] || 0) > 0 && (
                                        <span className="absolute -top-1 -right-1">
                                          <Badge
                                            variant="destructive"
                                            className="h-4 min-w-[1rem] leading-none p-0 text-[10px] inline-flex items-center justify-center"
                                          >
                                            {
                                              dmUnreadByEmail[
                                                (o.email || "").toLowerCase()
                                              ]
                                            }
                                          </Badge>
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  {showGroupChatObs && (
                    <div className="col-span-12 rounded bg-white flex flex-col min-h-0 overflow-y-auto">
                      <div className="flex items-center justify-between p-2 border-b">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            Observer Group Chat
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowGroupChatObs(false)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div
                        ref={groupRef}
                        className="flex-1 overflow-y-auto p-2"
                      >
                        {groupLoading ? (
                          <div className="text-sm text-gray-500">Loading…</div>
                        ) : (
                          <div className="space-y-1 text-sm">
                            {groupMessages.length === 0 ? (
                              <div className="text-gray-500">
                                No messages yet.
                              </div>
                            ) : (
                              groupMessages.map((m, idx) => (
                                <div
                                  key={idx}
                                  className="mr-auto bg-gray-50 max-w-[90%] rounded px-2 py-1"
                                >
                                  <div className="text-[11px] text-gray-500">
                                    {m.name || m.senderEmail}
                                  </div>
                                  <div className="whitespace-pre-wrap">
                                    {m.content}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                      <div className="p-2 flex items-center gap-2 border-t">
                        <Input
                          placeholder="Type a message..."
                          value={groupText}
                          onChange={(e) => setGroupText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              sendGroup();
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={sendGroup}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {selectedObserver && !showGroupChatObs && (
                    <div className="col-span-12 rounded bg-white flex flex-col min-h-0 overflow-y-auto">
                      <div className="flex items-center justify-between p-2 border-b">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            Chat with{" "}
                            {selectedObserver.name
                              ? formatDisplayName(selectedObserver.name)
                              : selectedObserver.email}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedObserver(null)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div ref={dmRef} className="flex-1 overflow-y-auto p-2">
                        {loadingHistory ? (
                          <div className="text-sm text-gray-500">Loading…</div>
                        ) : (
                          <div className="space-y-1 text-sm">
                            {dmMessages.length === 0 ? (
                              <div className="text-gray-500">
                                No messages yet.
                              </div>
                            ) : (
                              dmMessages.map((m, idx) => {
                                const fromMe =
                                  (m.email || "").toLowerCase() ===
                                  myEmailLower;
                                return (
                                  <div
                                    key={idx}
                                    className={`max-w-[85%] rounded px-2 py-1 ${
                                      fromMe
                                        ? "ml-auto bg-blue-50"
                                        : "mr-auto bg-gray-50"
                                    }`}
                                  >
                                    {!fromMe && (
                                      <div className="text-[11px] text-gray-500">
                                        {m.senderName || m.email}
                                      </div>
                                    )}
                                    <div className="whitespace-pre-wrap">
                                      {m.content}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                      <div className="p-2 flex items-center gap-2 border-t">
                        <Input
                          placeholder="Type a message..."
                          value={dmText}
                          onChange={(e) => setDmText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              sendDm();
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={sendDm}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DocumentHub />
        </aside>
      )}
      {!isRightOpen && (
        <button
          type="button"
          onClick={() => setIsRightOpen(true)}
          className="absolute -right-3 top-3 z-20 h-8 w-8 rounded-full border bg-white shadow flex items-center justify-center"
          aria-label="Expand right panel"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
