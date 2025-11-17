import React, { useEffect, useRef, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "components/ui/tabs";
// import { Input } from "components/ui/input";
// import { Button } from "components/ui/button";
import { Badge } from "components/ui/badge";
import { MessageSquare } from "lucide-react";
import { formatDisplayName } from "lib/utils";
import type { Socket } from "socket.io-client";
import RightSidebarHeading from "../RightSidebarHeading";
import ChatWindow, {
  ChatWindowMessage,
} from "components/meeting/chat/ChatWindow";

interface BackroomProps {
  isStreaming: boolean;
  observerCount: number;
  observerList: { name: string; email: string }[];
  socket: Socket | null;
  me: {
    email: string;
    name: string;
    role: "Participant" | "Observer" | "Moderator" | "Admin";
  };
}

const Backroom = ({
  isStreaming,
  observerCount,
  observerList,
  socket,
  me,
}: BackroomProps) => {
  const [tab, setTab] = useState("list");
  const [selectedObserver, setSelectedObserver] = useState<{
    email: string;
    name?: string;
  } | null>(null);
  const [showGroupChatObs, setShowGroupChatObs] = useState(false);

  // Group chat state (stream_group)
  type GroupMessage = {
    senderEmail?: string;
    name?: string;
    content: string;
    timestamp?: string | Date;
    _id?: string;
  };
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

  const groupRef = useRef<HTMLDivElement | null>(null);
  const dmRef = useRef<HTMLDivElement | null>(null);

  // Group chat: load when opened (project-level unified chat)
  useEffect(() => {
    if (!socket) return;
    if (!showGroupChatObs) return;
    setGroupLoading(true);
    socket.emit(
      "chat:history:get",
      { scope: "observer_project_group", limit: 100 },
      (resp?: { items?: GroupMessage[] }) => {
        const historyItems = Array.isArray(resp?.items) ? resp!.items! : [];
        // Merge with existing messages, deduplicating by _id or timestamp + content + senderEmail
        setGroupMessages((prev) => {
          const merged = [...prev];
          for (const msg of historyItems) {
            const messageWithId = msg as GroupMessage & { _id?: string };
            const messageId =
              messageWithId._id ||
              `${msg.timestamp || ""}${msg.content}${msg.senderEmail || ""}`;
            const exists = merged.some((m) => {
              const mWithId = m as GroupMessage & { _id?: string };
              const mId =
                mWithId._id ||
                `${m.timestamp || ""}${m.content}${m.senderEmail || ""}`;
              return mId === messageId;
            });
            if (!exists) {
              merged.push(msg);
            }
          }
          // Sort by timestamp if available
          return merged.sort((a, b) => {
            const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
            const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
            return aTime - bTime;
          });
        });
        setGroupLoading(false);
        setGroupUnread(0);
      }
    );
  }, [socket, showGroupChatObs]);

  // Group chat: live updates (project-level unified chat)
  useEffect(() => {
    if (!socket) return;
    const onNew = (p: { scope?: string; message?: GroupMessage }) => {
      if (p?.scope !== "observer_project_group" || !p?.message) return;
      // Always add message to state, regardless of whether chat window is open
      // This ensures messages are available when the chat window is opened
      setGroupMessages((prev) => {
        // Check if message already exists (deduplicate by _id or timestamp + content + senderEmail)
        const messageWithId = p.message as GroupMessage & { _id?: string };
        const messageId =
          messageWithId._id ||
          `${messageWithId.timestamp || ""}${messageWithId.content}${
            messageWithId.senderEmail || ""
          }`;
        const exists = prev.some((m) => {
          const mWithId = m as GroupMessage & { _id?: string };
          const mId =
            mWithId._id ||
            `${m.timestamp || ""}${m.content}${m.senderEmail || ""}`;
          return mId === messageId;
        });
        if (exists) return prev; // Don't add duplicate
        return [...prev, p.message as GroupMessage];
      });
      if (showGroupChatObs) {
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
        scope: "backroom_dm",
        thread: { withEmail: selectedObserver.email },
        limit: 100,
      },
      (resp?: { items?: DmMessage[] }) => {
        const historyItems = Array.isArray(resp?.items) ? resp!.items! : [];
        // Filter to ensure only DM messages (must have toEmail) are included
        // This prevents group chat messages from appearing in DM chat
        const filteredItems = historyItems.filter((msg) => {
          // Must have toEmail to be a DM message (group messages don't have toEmail)
          if (!msg.toEmail) return false;
          const msgFrom = (msg.email || "").toLowerCase();
          const msgTo = (msg.toEmail || "").toLowerCase();
          const selectedEmail = (selectedObserver.email || "").toLowerCase();
          const myEmail = meLower;
          // Message must be between me and the selected observer
          return (
            (msgFrom === selectedEmail && msgTo === myEmail) ||
            (msgFrom === myEmail && msgTo === selectedEmail)
          );
        });
        // Merge with existing messages, deduplicating by _id or timestamp + content + email
        setDmMessages((prev) => {
          const merged = [...prev];
          for (const msg of filteredItems) {
            const messageWithId = msg as DmMessage & { _id?: string };
            const messageId =
              messageWithId._id ||
              `${msg.timestamp || ""}${msg.content}${msg.email || ""}`;
            const exists = merged.some((m) => {
              const mWithId = m as DmMessage & { _id?: string };
              const mId =
                mWithId._id ||
                `${m.timestamp || ""}${m.content}${m.email || ""}`;
              return mId === messageId;
            });
            if (!exists) {
              merged.push(msg);
            }
          }
          // Sort by timestamp if available
          return merged.sort((a, b) => {
            const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
            const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
            return aTime - bTime;
          });
        });
        setLoadingHistory(false);
      }
    );
  }, [socket, selectedObserver, showGroupChatObs, meLower]);

  // Live updates for DM
  useEffect(() => {
    if (!socket) return;
    const onNew = (p: { scope?: string; message?: DmMessage }) => {
      // Only process backroom DM messages, explicitly reject group chat messages and observation room DMs
      if (!p?.scope || p.scope !== "backroom_dm" || !p?.message) return;
      if (!selectedObserver) return;
      const message = p.message;

      // CRITICAL: Ensure this is a DM message by checking for toEmail
      // Group chat messages (observer_project_group) don't have toEmail
      if (!message.toEmail) return;

      const selectedEmail = (selectedObserver.email || "").toLowerCase();
      const messageFrom = (message.email || "").toLowerCase();
      const messageTo = (message.toEmail || "").toLowerCase();
      const myEmail = meLower;

      // Message is relevant if:
      // 1. It's from the selected person TO me, OR
      // 2. It's from me TO the selected person
      const isRelevantMessage =
        (messageFrom === selectedEmail && messageTo === myEmail) ||
        (messageFrom === myEmail && messageTo === selectedEmail);

      if (isRelevantMessage) {
        setDmMessages((prev) => {
          // Check if message already exists (deduplicate by _id or timestamp + content + email)
          const messageWithId = message as DmMessage & { _id?: string };
          const messageId =
            messageWithId._id ||
            `${message.timestamp || ""}${message.content}${
              message.email || ""
            }`;
          const exists = prev.some((m) => {
            const mWithId = m as DmMessage & { _id?: string };
            const mId =
              mWithId._id || `${m.timestamp || ""}${m.content}${m.email || ""}`;
            return mId === messageId;
          });
          if (exists) return prev; // Don't add duplicate
          return [...prev, message];
        });
      }
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
      if (!p?.scope || p.scope !== "backroom_dm" || !p?.message) return;
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
    <div className="my-2 bg-custom-gray-2 rounded-lg p-1 max-h-[50vh] min-h-[50vh] overflow-hidden">
      <RightSidebarHeading
        title="Backroom"
        observerCount={isStreaming ? observerCount : 0}
      />
      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v);
          if (v === "list") {
            setShowGroupChatObs(false);
            setSelectedObserver(null);
          }
        }}
      >
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
            onClick={() => {
              // Close any open chat window when switching to Observer Chat tab
              setShowGroupChatObs(false);
              setSelectedObserver(null);
            }}
          >
            Observer Chat
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
                // const emailLower = (o.email || "").toLowerCase();
                // const unread = dmUnreadByEmail[emailLower] || 0;
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
                    {/* <div className="relative inline-flex items-center justify-center h-6 w-6">
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
                    </div> */}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="chat">
          <div className="grid grid-cols-12 gap-2 h-[36vh]">
            {!selectedObserver && !showGroupChatObs && (
              <div className="col-span-12 rounded bg-white overflow-y-auto">
                <div className="space-y-1 p-2">
                  {observerList.filter(
                    (o) =>
                      (o.email || "").toLowerCase() !== me.email.toLowerCase()
                  ).length === 0 ? (
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
                      {observerList
                        .filter(
                          (o) =>
                            (o.email || "").toLowerCase() !==
                            me.email.toLowerCase()
                        )
                        .map((o) => {
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
                {/* Old chat UI commented per migration to ChatWindow */}
                {/**
                 * Old group chat UI removed in favor of reusable ChatWindow above.
                 */}
                {(() => {
                  const mapped: ChatWindowMessage[] = groupMessages.map(
                    (m, i) => ({
                      id: m._id || i,
                      senderEmail: m.senderEmail,
                      senderName: m.name,
                      content: m.content,
                      timestamp: m.timestamp
                        ? new Date(m.timestamp)
                        : new Date(),
                    })
                  );
                  const sendGroup = () => {
                    const txt = groupText.trim();
                    if (!txt) return;
                    socket?.emit(
                      "chat:send",
                      { scope: "observer_project_group", content: txt },
                      (ack?: { ok?: boolean; error?: string }) => {
                        if (ack?.ok) setGroupText("");
                      }
                    );
                  };
                  return (
                    <ChatWindow
                      title="Observer Group Chat"
                      meEmail={me.email}
                      messages={mapped}
                      value={groupText}
                      onChange={setGroupText}
                      onSend={sendGroup}
                      onClose={() => setShowGroupChatObs(false)}
                      height="36vh"
                    />
                  );
                })()}
              </div>
            )}
            {selectedObserver && !showGroupChatObs && (
              <div className="col-span-12 rounded bg-white flex flex-col min-h-0 overflow-y-auto">
                {/* Old DM chat UI commented per migration to ChatWindow */}
                {(() => {
                  // Filter to ensure only DM messages are displayed (must have toEmail)
                  // This prevents group chat messages from appearing in DM chat
                  const filteredDmMessages = dmMessages.filter((m) => {
                    if (!m.toEmail) return false; // Group messages don't have toEmail
                    const msgFrom = (m.email || "").toLowerCase();
                    const msgTo = (m.toEmail || "").toLowerCase();
                    const selectedEmail = (
                      selectedObserver.email || ""
                    ).toLowerCase();
                    const myEmail = meLower;
                    // Message must be between me and the selected observer
                    return (
                      (msgFrom === selectedEmail && msgTo === myEmail) ||
                      (msgFrom === myEmail && msgTo === selectedEmail)
                    );
                  });
                  const mapped: ChatWindowMessage[] = filteredDmMessages.map(
                    (m, i) => ({
                      id: i,
                      senderEmail: m.email,
                      senderName: m.senderName,
                      content: m.content,
                      timestamp: m.timestamp || new Date(),
                    })
                  );
                  const sendDm = () => {
                    if (!selectedObserver) return;
                    const txt = dmText.trim();
                    if (!txt) return;
                    socket?.emit(
                      "chat:send",
                      {
                        scope: "backroom_dm",
                        content: txt,
                        toEmail: selectedObserver.email,
                      },
                      (ack?: { ok?: boolean; error?: string }) => {
                        if (ack?.ok) setDmText("");
                      }
                    );
                  };
                  const title = `Chat with ${
                    selectedObserver.name
                      ? formatDisplayName(selectedObserver.name)
                      : selectedObserver.email
                  }`;
                  return (
                    <ChatWindow
                      title={title}
                      meEmail={me.email}
                      messages={mapped}
                      value={dmText}
                      onChange={setDmText}
                      onSend={sendDm}
                      onClose={() => setSelectedObserver(null)}
                      height="36vh"
                      warning="The message will not last more than one session."
                    />
                  );
                })()}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Backroom;
