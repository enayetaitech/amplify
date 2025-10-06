"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import api from "lib/api";
import type { Socket } from "socket.io-client";
import ObserverHlsLayout from "./ObserverHlsLayout";

// extracted messaging UI uses Tabs/Input/Button/Badge internally
import { Separator } from "components/ui/separator";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import DocumentHub from "../rightSideBar/DocumentHub";
// import ObserverChatPanel from "./ObserverChatPanel";
// formatDisplayName now used in extracted component
import { useGlobalContext } from "context/GlobalContext";
import { safeLocalGet } from "utils/storage";
import ParticipantMessageInObserverLeftSidebar from "./ParticipantMessageInObserverLeftSidebar";
import ObserverBreakoutSelect from "./ObserverBreakoutSelect";
import ObserverMessageComponent from "./ObserverMessageComponent";

export default function ObserverMeetingView({
  sessionId,
  initialMainUrl,
  lkToken,
  wsUrl,
}: {
  sessionId: string;
  initialMainUrl: string | null;
  lkToken: string | null;
  wsUrl: string | null;
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

  void lkToken;
  void wsUrl;
  // Participant group chat state (meeting_group)
  type ParticipantGroupMessage = {
    senderEmail?: string;
    name?: string;
    content: string;
    timestamp?: Date;
  };
  const [participantGroupMessages, setParticipantGroupMessages] = useState<
    ParticipantGroupMessage[]
  >([]);
  const [participantGroupLoading, setParticipantGroupLoading] = useState(false);
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

  // Participant group chat: load history when component mounts
  useEffect(() => {
    const s = meetingSocket;
    if (!s) return;
    setParticipantGroupLoading(true);
    try {
      s.emit(
        "chat:history:get",
        { scope: "meeting_group", limit: 100 },
        (resp?: { items?: ParticipantGroupMessage[] }) => {
          setParticipantGroupMessages(
            Array.isArray(resp?.items) ? resp!.items! : []
          );
          setParticipantGroupLoading(false);
        }
      );
    } catch {
      setParticipantGroupMessages([]);
      setParticipantGroupLoading(false);
    }
  }, [meetingSocket]);

  // Participant group chat: live updates
  useEffect(() => {
    const s = meetingSocket;
    if (!s) return;
    const onNew = (p: {
      scope?: string;
      message?: ParticipantGroupMessage;
    }) => {
      if (p?.scope !== "meeting_group" || !p?.message) return;
      setParticipantGroupMessages((prev) => [
        ...prev,
        p.message as ParticipantGroupMessage,
      ]);
    };
    s.on("chat:new", onNew);
    return () => {
      s.off("chat:new", onNew);
    };
  }, [meetingSocket]);

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
          <ParticipantMessageInObserverLeftSidebar
            participants={participants}
            participantGroupMessages={participantGroupMessages}
            participantGroupLoading={participantGroupLoading}
          />

          {hasBreakouts && <Separator className="my-2" />}

          {/* Lower: Breakouts selection */}
          {hasBreakouts && (
            <ObserverBreakoutSelect
              options={options}
              selected={selected}
              setSelected={setSelected}
              url={url}
            />
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
          <ObserverMessageComponent
            observerCount={observerCount}
            observerList={observerList}
            moderatorList={moderatorList}
            myEmailLower={myEmailLower}
            dmUnreadByEmail={dmUnreadByEmail}
            setDmUnreadByEmail={setDmUnreadByEmail}
            selectedObserver={selectedObserver}
            setSelectedObserver={setSelectedObserver}
            showGroupChatObs={showGroupChatObs}
            setShowGroupChatObs={setShowGroupChatObs}
            groupUnread={groupUnread}
            groupRef={groupRef}
            groupLoading={groupLoading}
            groupMessages={groupMessages}
            groupText={groupText}
            setGroupText={setGroupText}
            sendGroup={sendGroup}
            dmRef={dmRef}
            loadingHistory={loadingHistory}
            dmMessages={dmMessages}
            dmText={dmText}
            setDmText={setDmText}
            sendDm={sendDm}
          />

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
