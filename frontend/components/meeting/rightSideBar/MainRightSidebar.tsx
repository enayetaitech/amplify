import { Tabs, TabsList, TabsTrigger, TabsContent } from "components/ui/tabs";
import { Input } from "components/ui/input";
import { Button } from "components/ui/button";
import { Badge } from "components/ui/badge";
import { MessageSquare, Send, X } from "lucide-react";
import { ChevronRight } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { formatDisplayName } from "lib/utils";
import type { Socket } from "socket.io-client";
import DocumentHub from "./DocumentHub";
import ObservationRoom from "./ObservationRoom";
import Backroom from "./Backroom";

const MainRightSidebar = ({
  setIsRightOpen,
  isStreaming,
  observerCount,
  observerList,
  sessionId,
  socket,
  me,
}: {
  setIsRightOpen: (isRightOpen: boolean) => void;
  isStreaming: boolean;
  observerCount: number;
  observerList: { name: string; email: string }[];
  sessionId: string;
  socket: Socket | null;
  me: {
    email: string;
    name: string;
    role: "Participant" | "Observer" | "Moderator" | "Admin";
  };
}) => {
  const [tab, setTab] = useState("list");
  const [backroomDefaultTarget, setBackroomDefaultTarget] = useState<
    string | undefined
  >(undefined);
  const [selectedObserver, setSelectedObserver] = useState<{
    email: string;
    name?: string;
  } | null>(null);
  const [showGroupChatObs, setShowGroupChatObs] = useState(false);
  // Group chat state (stream_group)
  type GroupMessage = { senderEmail?: string; name?: string; content: string };
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [groupText, setGroupText] = useState("");
  const [groupLoading, setGroupLoading] = useState(false);
  const [groupUnread, setGroupUnread] = useState(0);
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
  const [loadingHistory, setLoadingHistory] = useState(false);
  const meLower = (me?.email || "").toLowerCase();
  const [dmUnreadByEmail, setDmUnreadByEmail] = useState<
    Record<string, number>
  >({});
  // prevent unused var linter errors
  // referencing these ensures they are treated as used until needed
  void Backroom;
  void sessionId;
  void socket;
  void me;
  void backroomDefaultTarget;
  void setBackroomDefaultTarget;
  const groupRef = useRef<HTMLDivElement | null>(null);
  const dmRef = useRef<HTMLDivElement | null>(null);
  // Group chat: load when opened
  useEffect(() => {
    if (!socket) return;
    if (!showGroupChatObs) return;
    setGroupLoading(true);
    socket.emit(
      "chat:history:get",
      { scope: "stream_group", limit: 100 },
      (resp?: { items?: GroupMessage[] }) => {
        setGroupMessages(Array.isArray(resp?.items) ? resp!.items! : []);
        setGroupLoading(false);
        setGroupUnread(0);
      }
    );
  }, [socket, showGroupChatObs]);

  // Group chat: live updates
  useEffect(() => {
    if (!socket) return;
    const onNew = (p: { scope?: string; message?: GroupMessage }) => {
      if (p?.scope !== "stream_group" || !p?.message) return;
      if (showGroupChatObs) {
        setGroupMessages((prev) => [...prev, p.message as GroupMessage]);
        setGroupUnread(0);
      } else {
        setGroupUnread((x) => x + 1);
      }
    };
    socket.on("chat:new", onNew);
    return () => {
      socket.off("chat:new", onNew);
    };
  }, [socket, showGroupChatObs]);

  // Auto-scroll group chat when opened or messages appended
  useEffect(() => {
    if (!showGroupChatObs) return;
    const el = groupRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [showGroupChatObs, groupMessages.length, groupLoading]);
  // Load DM history when selecting an observer (moderator/admin side)
  useEffect(() => {
    if (!socket) return;
    if (!selectedObserver || showGroupChatObs) {
      setDmMessages([]);
      return;
    }
    setLoadingHistory(true);
    socket.emit(
      "chat:history:get",
      {
        scope: "stream_dm_obs_mod",
        thread: { withEmail: selectedObserver.email },
        limit: 100,
      },
      (resp?: { items?: DmMessage[] }) => {
        const items = Array.isArray(resp?.items) ? resp!.items! : [];
        setDmMessages(items);
        setLoadingHistory(false);
      }
    );
  }, [socket, selectedObserver, showGroupChatObs]);

  // Live updates for DM
  useEffect(() => {
    if (!socket) return;
    const onNew = (p: { scope?: string; message?: DmMessage }) => {
      if (!p?.scope || p.scope !== "stream_dm_obs_mod" || !p?.message) return;
      if (!selectedObserver) return;
      const from = (p.message.email || "").toLowerCase();
      const to = (p.message.toEmail || "").toLowerCase();
      const peer = (selectedObserver.email || "").toLowerCase();
      const match =
        (from === meLower && to === peer) || (from === peer && to === meLower);
      if (!match) return;
      setDmMessages((prev) => [...prev, p.message as DmMessage]);
    };
    socket.on("chat:new", onNew);
    return () => {
      socket.off("chat:new", onNew);
    };
  }, [socket, selectedObserver, meLower]);

  // Auto-scroll DM view when open or messages appended
  useEffect(() => {
    if (!selectedObserver || showGroupChatObs) return;
    const el = dmRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [selectedObserver, showGroupChatObs, dmMessages.length, loadingHistory]);

  // DM unread across all observers
  useEffect(() => {
    if (!socket) return;
    const onNew = (p: { scope?: string; message?: DmMessage }) => {
      if (!p?.scope || p.scope !== "stream_dm_obs_mod" || !p?.message) return;
      const from = (p.message.email || "").toLowerCase();
      const incomingFromObserver = from !== meLower;
      if (!incomingFromObserver) return; // don't count own messages
      const peer = from; // sender observer email
      const openPeer = (selectedObserver?.email || "").toLowerCase();
      const isOpen =
        !!selectedObserver && peer === openPeer && !showGroupChatObs;
      if (isOpen) return; // visible → read
      setDmUnreadByEmail((prev) => ({
        ...prev,
        [peer]: (prev[peer] || 0) + 1,
      }));
    };
    socket.on("chat:new", onNew);
    return () => {
      socket.off("chat:new", onNew);
    };
  }, [socket, selectedObserver, showGroupChatObs, meLower]);
  return (
    <aside className="relative col-span-3 h-full rounded-l-2xl p-3 overflow-y-auto bg-white shadow">
      <button
        type="button"
        onClick={() => setIsRightOpen(false)}
        className="absolute -left-3 top-3 z-20 h-8 w-8 rounded-full border bg-white shadow flex items-center justify-center"
        aria-label="Collapse right panel"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      {!isStreaming && <ObservationRoom />}
      {/* Backroom tabs - styled like left sidebar Participants panel */}
      <div className="my-2 bg-custom-gray-2 rounded-lg p-1 max-h-[40vh] min-h-[40vh] overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold pl-2">Backroom</h3>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full bg-black text-white text-xs px-3 py-1"
            aria-label="Observer count"
          >
            <span className="inline-flex h-4 w-4 items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </span>
            <span>Viewers</span>
            <span className="ml-1 rounded bg-white/20 px-1">
              {isStreaming ? observerCount : 0}
            </span>
          </button>
        </div>
        <Tabs value={tab} onValueChange={(v) => setTab(v)}>
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
              {groupUnread +
                Object.values(dmUnreadByEmail).reduce((a, b) => a + b, 0) >
                0 && (
                <Badge
                  variant="destructive"
                  className="ml-2 h-5 w-5 p-0 text-[10px] inline-flex items-center justify-center"
                >
                  {groupUnread +
                    Object.values(dmUnreadByEmail).reduce((a, b) => a + b, 0)}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            {!isStreaming ? (
              <div className="text-sm text-gray-500">Not Streaming</div>
            ) : (
              <div className="space-y-2">
                {observerList.length === 0 && (
                  <div className="text-sm text-gray-500">No observers yet.</div>
                )}
                {observerList.map((o) => {
                  const label = o.name || o.email || "Observer";
                  const emailLower = (o.email || "").toLowerCase();
                  const unread = dmUnreadByEmail[emailLower] || 0;
                  return (
                    <div
                      key={`${label}-${o.email}`}
                      className="flex items-center justify-between gap-2  rounded px-2 py-1"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {label}
                        </div>
                      </div>
                      <div className="relative inline-flex items-center justify-center h-6 w-6">
                        <MessageSquare className="h-4 w-4 text-gray-400" />
                        {unread > 0 && (
                          <span className="absolute -top-1 -right-1">
                            <Badge
                              variant="destructive"
                              className="h-4 min-w-[1rem] leading-none p-0 text-[10px] inline-flex items-center justify-center"
                            >
                              {unread}
                            </Badge>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="chat">
            <div className="grid grid-cols-12 gap-2 h-[26vh]">
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
                          className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer "
                          onClick={() => {
                            setShowGroupChatObs(true);
                            setSelectedObserver(null);
                            setGroupUnread(0);
                          }}
                        >
                          <div className="flex items-center gap-2 min-w-0 ">
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
                                setDmMessages([]);
                                const k = (o.email || "").toLowerCase();
                                setDmUnreadByEmail((prev) => ({
                                  ...prev,
                                  [k]: 0,
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
                  <div ref={groupRef} className="flex-1 overflow-y-auto p-2">
                    {groupLoading ? (
                      <div className="text-sm text-gray-500">Loading…</div>
                    ) : (
                      <div className="space-y-1 text-sm">
                        {groupMessages.length === 0 ? (
                          <div className="text-gray-500">No messages yet.</div>
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
                          const txt = groupText.trim();
                          if (!txt) return;
                          socket?.emit(
                            "chat:send",
                            { scope: "stream_group", content: txt },
                            (ack?: { ok?: boolean; error?: string }) => {
                              if (ack?.ok) setGroupText("");
                            }
                          );
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        const txt = groupText.trim();
                        if (!txt) return;
                        socket?.emit(
                          "chat:send",
                          { scope: "stream_group", content: txt },
                          (ack?: { ok?: boolean; error?: string }) => {
                            if (ack?.ok) setGroupText("");
                          }
                        );
                      }}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              {selectedObserver && !showGroupChatObs && (
                <div className="col-span-12 rounded bg-white flex flex-col min-h-0 overflow-y-auto">
                  <div className="flex items-center justify-between p-0.5 border-b">
                    <div className="flex items-center gap-2">
                      <span className="text-sm ">
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
                  <div ref={dmRef} className="flex-1 overflow-y-auto p-0.5">
                    {loadingHistory ? (
                      <div className="text-sm text-gray-500">Loading…</div>
                    ) : (
                      <div className="space-y-1 text-sm">
                        {dmMessages.length === 0 ? (
                          <div className="text-gray-500">No messages yet.</div>
                        ) : (
                          dmMessages.map((m, idx) => {
                            const fromMe =
                              (m.email || "").toLowerCase() === meLower;
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
                          if (!selectedObserver) return;
                          const scope = "stream_dm_obs_mod"; // moderator/admin → observer
                          socket?.emit(
                            "chat:send",
                            {
                              scope,
                              content: dmText.trim(),
                              toEmail: selectedObserver.email,
                            },
                            (ack?: { ok?: boolean; error?: string }) => {
                              if (ack?.ok) setDmText("");
                            }
                          );
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        if (!selectedObserver) return;
                        const scope = "stream_dm_obs_mod";
                        socket?.emit(
                          "chat:send",
                          {
                            scope,
                            content: dmText.trim(),
                            toEmail: selectedObserver.email,
                          },
                          (ack?: { ok?: boolean; error?: string }) => {
                            if (ack?.ok) setDmText("");
                          }
                        );
                      }}
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

      {/* Document Hub */}
      <DocumentHub />
    </aside>
  );
};

export default MainRightSidebar;
