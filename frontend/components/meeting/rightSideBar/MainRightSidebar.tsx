import { Tabs, TabsList, TabsTrigger, TabsContent } from "components/ui/tabs";
import { Input } from "components/ui/input";
import { Button } from "components/ui/button";
import { MessageSquare, Send, X } from "lucide-react";
import { ChevronRight } from "lucide-react";
import React, { useEffect, useState } from "react";
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
  // prevent unused var linter errors
  // referencing these ensures they are treated as used until needed
  void Backroom;
  void sessionId;
  void socket;
  void me;
  void backroomDefaultTarget;
  void setBackroomDefaultTarget;
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
      <div className="my-2 bg-custom-gray-2 rounded-lg p-1 max-h-[40vh] min-h-[40vh] overflow-y-auto">
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
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="chat">
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
                                setDmMessages([]);
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
