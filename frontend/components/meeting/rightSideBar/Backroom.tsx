"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "components/ui/tabs";
import { Input } from "components/ui/input";
import { Button } from "components/ui/button";
import { Badge } from "components/ui/badge";
import { Send, MessageSquare, X } from "lucide-react";
import useChat, { ChatMessage, ChatScope } from "hooks/useChat";
import { formatDisplayName } from "lib/utils";

type UserRole = "Participant" | "Observer" | "Moderator" | "Admin";

export default function Backroom({
  socket,
  sessionId,
  me,
  defaultDmTarget,
}: {
  socket: Socket | null;
  sessionId: string;
  me: { email: string; name: string; role: UserRole };
  defaultDmTarget?: string;
}) {
  const { send, getHistory, messagesByScope } = useChat({
    socket,
    sessionId,
    my: me,
  });

  const [tab, setTab] = useState<"group" | "dm_obs" | "dm_mod">("group");

  const [groupText, setGroupText] = useState("");
  const [dmModTarget, setDmModTarget] = useState("");
  const [dmModText, setDmModText] = useState("");

  // Observer list and lightweight UI state for list-first observer chat (UI only)
  const [observerList, setObserverList] = useState<
    { name: string; email: string }[]
  >([]);
  const [selectedObserver, setSelectedObserver] = useState<{
    email: string;
    name?: string;
  } | null>(null);
  const [showGroupChatObs, setShowGroupChatObs] = useState(false);
  // prevent unused var linter errors for UI-only pieces
  void defaultDmTarget;

  const groupRef = useRef<HTMLDivElement | null>(null);
  const dmModRef = useRef<HTMLDivElement | null>(null);

  const isObserver = me?.role === "Observer";
  const dmObsScope: ChatScope = isObserver
    ? "stream_dm_obs_obs"
    : "stream_dm_obs_mod";

  // Seed histories
  useEffect(() => {
    getHistory("stream_group");
  }, [getHistory]);

  // Load observer list for list-first UI (non-functional chat)
  useEffect(() => {
    const s = socket;
    if (!s) return;
    const onList = (p?: { observers?: { name: string; email: string }[] }) => {
      const list = Array.isArray(p?.observers) ? p.observers! : [];
      setObserverList(list);
    };
    s.on("observer:list", onList);
    s.emit(
      "observer:list:get",
      {},
      (resp?: { observers?: { name: string; email: string }[] }) => {
        const list = Array.isArray(resp?.observers) ? resp!.observers! : [];
        setObserverList(list);
      }
    );
    return () => {
      s.off("observer:list", onList);
    };
  }, [socket]);

  // Listen for external open DM requests from MainRightSidebar
  useEffect(() => {
    const onOpenDm = (e: Event) => {
      const ev = e as CustomEvent<{ email: string; name?: string }>;
      const target = ev.detail;
      if (!target || !target.email) return;
      setTab("dm_obs");
      setSelectedObserver({ email: target.email, name: target.name });
      setShowGroupChatObs(false);
    };
    window.addEventListener("open-backroom-dm", onOpenDm as EventListener);
    return () => {
      window.removeEventListener("open-backroom-dm", onOpenDm as EventListener);
    };
  }, []);

  useEffect(() => {
    if (dmModTarget.trim())
      getHistory("stream_dm_obs_mod", {
        withEmail: dmModTarget.trim().toLowerCase(),
      });
  }, [dmModTarget, getHistory]);

  // Unread counters similar to existing chat panels
  const meEmailLower = (me?.email || "").toLowerCase();
  const groupLen = messagesByScope["stream_group"]?.length || 0;
  const dmObsLen = (messagesByScope[dmObsScope] || []).length;
  void dmObsLen;
  const dmModLen = (messagesByScope["stream_dm_obs_mod"] || []).length;
  const dmObsIncoming = useMemo(() => {
    const dm = messagesByScope[dmObsScope] || [];
    let c = 0;
    for (const m of dm) {
      const sender = (m.email || m.senderEmail || "").toLowerCase();
      if (sender && sender !== meEmailLower) c++;
    }
    return c;
  }, [messagesByScope, meEmailLower, dmObsScope]);
  const dmModIncoming = useMemo(() => {
    const dm = messagesByScope["stream_dm_obs_mod"] || [];
    let c = 0;
    for (const m of dm) {
      const sender = (m.email || m.senderEmail || "").toLowerCase();
      if (sender && sender !== meEmailLower) c++;
    }
    return c;
  }, [messagesByScope, meEmailLower]);

  const [lastReadGroup, setLastReadGroup] = useState(0);
  const [lastReadDmObsIncoming, setLastReadDmObsIncoming] = useState(0);
  const [lastReadDmModIncoming, setLastReadDmModIncoming] = useState(0);

  const unreadGroup = Math.max(0, groupLen - lastReadGroup);
  const unreadDmObs = Math.max(0, dmObsIncoming - lastReadDmObsIncoming);
  const unreadDmMod = Math.max(0, dmModIncoming - lastReadDmModIncoming);

  useEffect(() => {
    if (groupRef.current)
      groupRef.current.scrollTop = groupRef.current.scrollHeight;
  }, [groupLen]);
  // No auto-scroll for observer DM UI (UI-only)
  useEffect(() => {
    if (dmModRef.current)
      dmModRef.current.scrollTop = dmModRef.current.scrollHeight;
  }, [dmModLen]);

  useEffect(() => {
    if (tab === "group") setLastReadGroup(groupLen);
  }, [groupLen, tab]);
  useEffect(() => {
    if (tab === "dm_obs") setLastReadDmObsIncoming(dmObsIncoming);
  }, [dmObsIncoming, tab]);
  useEffect(() => {
    if (tab === "dm_mod") setLastReadDmModIncoming(dmModIncoming);
  }, [dmModIncoming, tab]);

  const onGroupScroll = () => {
    const el = groupRef.current;
    if (!el) return;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 6;
    if (nearBottom) setLastReadGroup(groupLen);
  };
  // No scroll handler for observer DM UI (UI-only)
  const onDmModScroll = () => {
    const el = dmModRef.current;
    if (!el) return;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 6;
    if (nearBottom) setLastReadDmModIncoming(dmModIncoming);
  };

  const sendGroup = async () => {
    const trimmed = groupText.trim();
    if (!trimmed) return;
    const ack = await send("stream_group", trimmed);
    if (ack.ok) setGroupText("");
  };
  // Observer DM sending intentionally omitted (UI-only)
  const sendDmMod = async () => {
    const trimmed = dmModText.trim();
    if (!trimmed) return;
    const target = dmModTarget.trim().toLowerCase();
    if (!target) return;
    const ack = await send("stream_dm_obs_mod", trimmed, target);
    if (ack.ok) setDmModText("");
  };

  const groupItems = (messagesByScope["stream_group"] || []).map((m, i) =>
    renderItem(m, i)
  );
  // No items mapping for observer DM UI (UI-only)
  const dmModItems = (messagesByScope["stream_dm_obs_mod"] || [])
    .filter((m) =>
      dmModTarget
        ? (m.toEmail || "") === dmModTarget.trim().toLowerCase() ||
          (m.email || "").toLowerCase() === dmModTarget.trim().toLowerCase()
        : true
    )
    .map((m, i) => renderItem(m, i));

  return (
    <div className="flex flex-col">
      <div className="my-2 bg-custom-gray-2 rounded-lg p-1 max-h-[40vh] min-h-[40vh] overflow-hidden overflow-x-hidden w-full max-w-full flex flex-col">
        <Tabs
          value={tab}
          onValueChange={(v) =>
            setTab(
              v === "dm_obs" ? "dm_obs" : v === "dm_mod" ? "dm_mod" : "group"
            )
          }
          className="flex-1 flex min-h-0 flex-col"
        >
          <TabsList className="sticky top-0 z-10 bg-custom-gray-2 w-full gap-2">
            <TabsTrigger
              value="group"
              className="rounded-full h-6 px-4 border shadow-sm data-[state=active]:bg-custom-dark-blue-1 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent data-[state=inactive]:border-custom-dark-blue-1 data-[state=inactive]:text-custom-dark-blue-1 cursor-pointer"
            >
              Group Chat
              {unreadGroup > 0 && (
                <Badge
                  variant="destructive"
                  className="ml-2 h-5 w-5 p-0 text-[10px] inline-flex items-center justify-center"
                >
                  {unreadGroup}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="dm_obs"
              className="rounded-full h-6 px-4 border shadow-sm data-[state=active]:bg-custom-dark-blue-1 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent data-[state=inactive]:border-custom-dark-blue-1 data-[state=inactive]:text-custom-dark-blue-1 cursor-pointer"
            >
              {isObserver ? "Observer DMs" : "DM Observers"}
              {unreadDmObs > 0 && (
                <Badge
                  variant="destructive"
                  className="ml-2 h-5 w-5 p-0 text-[10px] inline-flex items-center justify-center"
                >
                  {unreadDmObs}
                </Badge>
              )}
            </TabsTrigger>
            {isObserver && (
              <TabsTrigger
                value="dm_mod"
                className="rounded-full h-6 px-4 border shadow-sm data-[state=active]:bg-custom-dark-blue-1 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent data-[state=inactive]:border-custom-dark-blue-1 data-[state=inactive]:text-custom-dark-blue-1 cursor-pointer"
              >
                Moderator DMs
                {unreadDmMod > 0 && (
                  <Badge
                    variant="destructive"
                    className="ml-2 h-5 w-5 p-0 text-[10px] inline-flex items-center justify-center"
                  >
                    {unreadDmMod}
                  </Badge>
                )}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="group" className="flex-1 min-h-0">
            <div
              ref={groupRef}
              onScroll={onGroupScroll}
              className="h-[26vh] overflow-y-auto overflow-x-hidden bg-white rounded p-2"
            >
              <div className="space-y-1 text-sm">
                {groupItems.length === 0 ? (
                  <div className="text-gray-500">No messages yet.</div>
                ) : (
                  groupItems
                )}
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Input
                value={groupText}
                onChange={(e) => setGroupText(e.target.value)}
                placeholder="Write a message to everyone"
                className="flex-1 min-w-0"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendGroup();
                  }
                }}
              />
              <Button onClick={sendGroup} size="sm" className="h-8 w-8 p-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="dm_obs" className="flex-1 min-h-0">
            <div className="grid grid-cols-12 gap-2 h-[22vh]">
              {!selectedObserver && !showGroupChatObs && (
                <div className="col-span-12 rounded bg-white overflow-y-auto">
                  <div className="space-y-1 p-2">
                    {observerList.length === 0 ? (
                      <div className="text-sm text-gray-500">
                        No observers yet.
                      </div>
                    ) : (
                      <>
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
                          <MessageSquare className="h-4 w-4 text-gray-400" />
                        </div>
                        {observerList.map((o) => {
                          const label = o.name
                            ? formatDisplayName(o.name)
                            : o.email || "Observer";
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
                              }}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-sm font-medium truncate">
                                  {label}
                                </span>
                              </div>
                              <MessageSquare className="h-4 w-4 text-gray-400" />
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                </div>
              )}
              {showGroupChatObs && (
                <div className="col-span-12 rounded bg-white flex flex-col">
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
                  <div className="flex-1 overflow-y-auto p-2">
                    <div className="space-y-1 text-sm">
                      <div className="text-gray-500">
                        UI only (not functional).
                      </div>
                    </div>
                  </div>
                  <div className="p-2 flex items-center gap-2 border-t">
                    <Input placeholder="Type a message..." disabled />
                    <Button size="sm" className="h-8 w-8 p-0" disabled>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              {selectedObserver && !showGroupChatObs && (
                <div className="col-span-12 rounded bg-white flex flex-col">
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
                  <div className="flex-1 overflow-y-auto p-2">
                    <div className="space-y-1 text-sm">
                      <div className="text-gray-500">
                        UI only (not functional).
                      </div>
                    </div>
                  </div>
                  <div className="p-2 flex items-center gap-2 border-t">
                    <Input placeholder="Type a message..." disabled />
                    <Button size="sm" className="h-8 w-8 p-0" disabled>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {isObserver && (
            <TabsContent value="dm_mod" className="flex-1 min-h-0">
              <div className="flex items-center gap-2 mb-2">
                <Input
                  value={dmModTarget}
                  onChange={(e) => setDmModTarget(e.target.value)}
                  placeholder="Moderator email"
                  onBlur={() =>
                    dmModTarget &&
                    getHistory("stream_dm_obs_mod", {
                      withEmail: dmModTarget.trim().toLowerCase(),
                    })
                  }
                />
              </div>
              <div
                ref={dmModRef}
                onScroll={onDmModScroll}
                className="h-[22vh] overflow-y-auto overflow-x-hidden bg-white rounded p-2"
              >
                <div className="space-y-1 text-sm">
                  {dmModItems.length === 0 ? (
                    <div className="text-gray-500">No messages yet.</div>
                  ) : (
                    dmModItems
                  )}
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Input
                  value={dmModText}
                  onChange={(e) => setDmModText(e.target.value)}
                  placeholder="Write a private message to moderator"
                  className="flex-1 min-w-0"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendDmMod();
                    }
                  }}
                />
                <Button onClick={sendDmMod} size="sm" className="h-8 w-8 p-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}

function renderItem(m: ChatMessage, i: number) {
  const raw = m.senderName || m.name || m.email || m.senderEmail || "";
  const label = raw.includes("@") ? raw : formatDisplayName(raw);
  const when = new Date(String(m.timestamp)).toLocaleTimeString();
  const content = m.content;
  const role = m.role || "Observer";
  return (
    <div key={`${label}-${i}`} className="flex items-start gap-2">
      <div className="shrink-0 mt-[2px] h-2 w-2 rounded-full bg-custom-dark-blue-1" />
      <div className="min-w-0">
        <div className="text-[12px] text-gray-600">
          <span className="font-medium text-gray-900">{label}</span>
          <span className="ml-1 text-[11px] text-gray-500">{role}</span>
          <span className="ml-2 text-[11px] text-gray-400">{when}</span>
        </div>
        <div className="whitespace-pre-wrap text-sm">{content}</div>
      </div>
    </div>
  );
}
