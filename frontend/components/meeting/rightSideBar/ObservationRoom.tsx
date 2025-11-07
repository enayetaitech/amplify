import React, { useState, useRef, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "components/ui/tabs";
import { Badge } from "components/ui/badge";
import { MessageSquare } from "lucide-react";
import RightSidebarHeading from "../RightSidebarHeading";
import ChatWindow, {
  ChatWindowMessage,
} from "components/meeting/chat/ChatWindow";

type WaitingObserver = { name?: string; email?: string };

type ChatMessage = {
  email: string;
  senderName: string;
  content: string;
  timestamp: string;
  toEmail?: string;
};

type ChatPayload = {
  scope: string;
  message: ChatMessage;
};

type ChatHistoryResponse = {
  items: ChatMessage[];
};

type SocketResponse = {
  ok: boolean;
  error?: string;
};

type MinimalSocket = {
  on: (event: string, cb: (payload: unknown) => void) => void;
  off: (event: string, cb: (payload: unknown) => void) => void;
  emit: (event: string, payload: object, ack?: (resp: unknown) => void) => void;
};

const ObservationRoom = () => {
  const [tab, setTab] = useState("list");
  const [observers, setObservers] = useState<WaitingObserver[]>([]);
  const [selectedObserver, setSelectedObserver] = useState<{
    name?: string;
    email?: string;
  } | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState<string>("");
  const [meEmail, setMeEmail] = useState<string>("");
  const [meRole, setMeRole] = useState<string>("");
  const [showGroupChat, setShowGroupChat] = useState<boolean>(false);
  const [dmUnreadByEmail, setDmUnreadByEmail] = useState<
    Record<string, number>
  >({});

  // Group chat state
  type GroupMessage = {
    senderEmail?: string;
    email?: string;
    name?: string;
    senderName?: string;
    content: string;
    timestamp?: string;
  };
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [groupText, setGroupText] = useState<string>("");
  const [groupLoading, setGroupLoading] = useState<boolean>(false);
  const [groupUnread, setGroupUnread] = useState<number>(0);

  // Refs for auto-scroll functionality
  const groupRef = useRef<HTMLDivElement | null>(null);
  const dmRef = useRef<HTMLDivElement | null>(null);

  // // Sync local state if parent supplies a list
  // React.useEffect(() => {
  //   setObservers(waitingObservers || []);
  // }, [waitingObservers]);

  // Wire to meeting socket to receive live observer list updates
  React.useEffect(() => {
    const w = window as Window & { __meetingSocket?: unknown };
    const maybe = w.__meetingSocket as unknown;
    const s =
      maybe &&
      typeof (maybe as { on?: unknown }).on === "function" &&
      typeof (maybe as { emit?: unknown }).emit === "function"
        ? (maybe as MinimalSocket)
        : undefined;
    if (!s) return;

    const onObserverList = (payload: unknown) => {
      const data = payload as { observers?: WaitingObserver[] };
      setObservers(Array.isArray(data?.observers) ? data.observers : []);
    };

    s.on("observer:list", onObserverList);

    // Chat message handling
    const onChatNew = (payload: unknown) => {
      const data = payload as ChatPayload;
      if (
        data.scope === "observer_project_group" ||
        data.scope === "observer_wait_group"
      ) {
        // Group chat message (support both old and new scope for backward compatibility)
        const groupMessage = data.message as GroupMessage;
        if (showGroupChat) {
          setGroupMessages((prev) => [...prev, groupMessage]);
          setGroupUnread(0);
        } else {
          setGroupUnread((prev) => prev + 1);
        }
      } else if (
        selectedObserver &&
        (data.scope === "observer_wait_dm" ||
          data.scope === "stream_dm_obs_mod")
      ) {
        const message = data.message;
        const isFromSelectedObserver =
          message.email?.toLowerCase() ===
            selectedObserver.email?.toLowerCase() ||
          message.toEmail?.toLowerCase() ===
            selectedObserver.email?.toLowerCase();

        if (isFromSelectedObserver) {
          setMessages((prev) => [...prev, message]);
        }
      }
    };
    s.on("chat:new", onChatNew);

    // Request initial observers snapshot
    try {
      s.emit("observer:list:get", {}, (resp?: unknown) => {
        const data = resp as { observers?: WaitingObserver[] };
        console.log("observer list", data?.observers);
        setObservers(Array.isArray(data?.observers) ? data.observers! : []);
      });
    } catch {}

    return () => {
      s.off("observer:list", onObserverList);
      s.off("chat:new", onChatNew);
    };
  }, [selectedObserver, showGroupChat]);

  // DM unread count across all observers
  React.useEffect(() => {
    const w = window as Window & { __meetingSocket?: unknown };
    const maybe = w.__meetingSocket as unknown;
    const s =
      maybe &&
      typeof (maybe as { on?: unknown }).on === "function" &&
      typeof (maybe as { emit?: unknown }).emit === "function"
        ? (maybe as MinimalSocket)
        : undefined;
    if (!s) return;

    const onNew = (payload: unknown) => {
      const data = payload as ChatPayload;
      if (
        !data?.scope ||
        (data.scope !== "observer_wait_dm" &&
          data.scope !== "stream_dm_obs_mod") ||
        !data?.message
      )
        return;

      const message = data.message;
      const from = (message.email || "").toLowerCase();
      const meLower = (meEmail || "").toLowerCase();

      // Check if this is an incoming message (not from me)
      const incomingFromObserver = from !== meLower;
      if (!incomingFromObserver) return; // don't count own messages

      const peer = from; // sender observer email
      const openPeer = (selectedObserver?.email || "").toLowerCase();
      const isOpen = !!selectedObserver && peer === openPeer && !showGroupChat;

      if (isOpen) return; // visible → read

      setDmUnreadByEmail((prev) => ({
        ...prev,
        [peer]: (prev[peer] || 0) + 1,
      }));
    };

    s.on("chat:new", onNew);
    return () => {
      s.off("chat:new", onNew);
    };
  }, [selectedObserver, showGroupChat, meEmail]);

  // Effect: load current user identity from localStorage
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem("liveSessionUser")
        ? JSON.parse(String(window.localStorage.getItem("liveSessionUser")))
        : {};

      setMeEmail(saved?.email || "");
      setMeRole(saved?.role || "");

      // Also check if email is in a different localStorage key
      const emailFromStorage = window.localStorage.getItem("userEmail");
      if (emailFromStorage) {
        setMeEmail(emailFromStorage);
      }

      // Also check if role is in a different localStorage key
      const roleFromStorage = window.localStorage.getItem("userRole");
      if (roleFromStorage) {
        setMeRole(roleFromStorage);
      }

      // Check if we can determine role and email from socket query params
      const socketQuery = (
        window as Window & {
          __meetingSocket?: {
            io?: {
              opts?: {
                query?: { role?: string; email?: string; name?: string };
              };
            };
          };
        }
      ).__meetingSocket?.io?.opts?.query;
      if (socketQuery?.role) {
        setMeRole(socketQuery.role);
      }
      if (socketQuery?.email) {
        setMeEmail(socketQuery.email);
      }

      // Fallback: if no role found and we're in ObservationRoom, assume Moderator
      if (!saved?.role && !roleFromStorage && !socketQuery?.role) {
        setMeRole("Moderator");
      }

      // Fallback: if no email found, try to get it from the socket connection
      if (!saved?.email && !emailFromStorage && !socketQuery?.email) {
        const w = window as Window & { __meetingSocket?: unknown };
        const maybe = w.__meetingSocket as unknown;
        if (
          maybe &&
          typeof (maybe as { io?: { opts?: { query?: { email?: string } } } })
            .io?.opts?.query?.email === "string"
        ) {
          const socketEmail = (
            maybe as { io: { opts: { query: { email: string } } } }
          ).io.opts.query.email;
          setMeEmail(socketEmail);
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  }, []);

  // Effect: load chat history when observer is selected
  React.useEffect(() => {
    if (!selectedObserver) {
      setMessages([]);
      return;
    }

    const w = window as Window & {
      __meetingSocket?: unknown;
      currentMeetingSessionId?: string;
    };
    const maybe = w.__meetingSocket as unknown;
    const s =
      maybe &&
      typeof (maybe as { on?: unknown }).on === "function" &&
      typeof (maybe as { emit?: unknown }).emit === "function"
        ? (maybe as MinimalSocket)
        : undefined;
    if (!s) return;

    // Clear messages first to prevent showing stale data
    setMessages([]);

    const loadChatHistory = async () => {
      try {
        // Load messages from both scopes to see the complete conversation
        const scopes = ["observer_wait_dm", "stream_dm_obs_mod"];
        let allMessages: ChatMessage[] = [];
        let loadedScopes = 0;
        const currentSessionId = w.currentMeetingSessionId; // Capture current sessionId to verify responses

        scopes.forEach((scope) => {
          s.emit(
            "chat:history:get",
            {
              scope: scope,
              thread: { withEmail: selectedObserver.email },
              limit: 50,
            },
            (response?: unknown) => {
              // Only process if we're still on the same session (prevent race conditions)
              if (
                currentSessionId &&
                w.currentMeetingSessionId !== currentSessionId
              ) {
                return; // Session changed, ignore this response
              }

              const data = response as ChatHistoryResponse;
              if (data?.items) {
                allMessages = [...allMessages, ...data.items];
              }
              loadedScopes++;

              // When both scopes are loaded, sort by timestamp and set messages
              if (loadedScopes === scopes.length) {
                // Double-check we're still on the same session before setting messages
                if (
                  !currentSessionId ||
                  w.currentMeetingSessionId === currentSessionId
                ) {
                  allMessages.sort(
                    (a, b) =>
                      new Date(a.timestamp).getTime() -
                      new Date(b.timestamp).getTime()
                  );
                  setMessages(allMessages);
                }
              }
            }
          );
        });
      } catch (error) {
        console.error("Failed to load chat history:", error);
      }
    };

    loadChatHistory();
  }, [selectedObserver, meRole]);

  // Effect: load group chat history when group chat is opened
  React.useEffect(() => {
    if (!showGroupChat) {
      setGroupMessages([]);
      return;
    }

    const w = window as Window & {
      __meetingSocket?: unknown;
      currentMeetingSessionId?: string;
    };
    const maybe = w.__meetingSocket as unknown;
    const s =
      maybe &&
      typeof (maybe as { on?: unknown }).on === "function" &&
      typeof (maybe as { emit?: unknown }).emit === "function"
        ? (maybe as MinimalSocket)
        : undefined;
    if (!s) return;

    // Clear messages first to prevent showing stale data from previous sessions
    setGroupMessages([]);

    const loadGroupChatHistory = async () => {
      try {
        setGroupLoading(true);
        const currentSessionId = w.currentMeetingSessionId; // Capture current sessionId to verify responses

        // Use project-level scope for unified chat (only today's messages)
        s.emit(
          "chat:history:get",
          {
            scope: "observer_project_group",
            limit: 50,
          },
          (response?: unknown) => {
            // Only process if we're still on the same session (prevent race conditions)
            if (
              currentSessionId &&
              w.currentMeetingSessionId !== currentSessionId
            ) {
              setGroupLoading(false);
              return; // Session changed, ignore this response
            }

            const data = response as { items: GroupMessage[] };
            if (data?.items) {
              setGroupMessages(data.items);
            }
            setGroupLoading(false);
            setGroupUnread(0);
          }
        );
      } catch (error) {
        console.error("Failed to load group chat history:", error);
        setGroupLoading(false);
      }
    };

    loadGroupChatHistory();
  }, [showGroupChat]);

  // Auto-scroll group chat when opened or messages appended
  useEffect(() => {
    if (!showGroupChat) return;
    const el = groupRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [showGroupChat, groupMessages.length, groupLoading]);

  // Auto-scroll DM view when open or messages appended
  useEffect(() => {
    if (!selectedObserver || showGroupChat) return;
    const el = dmRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [selectedObserver, showGroupChat, messages.length]);

  // Function to send a message
  const sendMessage = async () => {
    if (!selectedObserver || !messageInput.trim()) {
      return;
    }

    const w = window as Window & { __meetingSocket?: unknown };
    const maybe = w.__meetingSocket as unknown;
    const s =
      maybe &&
      typeof (maybe as { on?: unknown }).on === "function" &&
      typeof (maybe as { emit?: unknown }).emit === "function"
        ? (maybe as MinimalSocket)
        : undefined;

    if (!s) {
      console.error("No socket available");
      return;
    }

    try {
      // Determine the appropriate scope based on current user role
      const scope =
        meRole === "Moderator" || meRole === "Admin"
          ? "stream_dm_obs_mod"
          : "observer_wait_dm";

      s.emit(
        "chat:send",
        {
          scope: scope,
          content: messageInput.trim(),
          toEmail: selectedObserver.email,
        },
        (response?: unknown) => {
          const data = response as SocketResponse;
          if (data?.ok) {
            setMessageInput("");
          } else {
            console.error("Failed to send message:", data?.error);
          }
        }
      );
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Function to send group chat message
  const sendGroupMessage = async () => {
    if (!groupText.trim()) {
      return;
    }

    const w = window as Window & { __meetingSocket?: unknown };
    const maybe = w.__meetingSocket as unknown;

    const s =
      maybe &&
      typeof (maybe as { on?: unknown }).on === "function" &&
      typeof (maybe as { emit?: unknown }).emit === "function"
        ? (maybe as MinimalSocket)
        : undefined;

    if (!s) {
      console.error("No socket available for group message");
      return;
    }

    try {
      // Get user info from localStorage
      const saved =
        typeof window !== "undefined" &&
        window.localStorage.getItem("liveSessionUser")
          ? JSON.parse(String(window.localStorage.getItem("liveSessionUser")))
          : {};

      // Try to get name from socket query params (set during connection)
      const socketQuery = (
        window as Window & {
          __meetingSocket?: {
            io?: {
              opts?: {
                query?: { role?: string; email?: string; name?: string };
              };
            };
          };
        }
      ).__meetingSocket?.io?.opts?.query;

      // Get name from multiple sources: socket query > localStorage > email fallback
      const senderName =
        socketQuery?.name ||
        saved?.name ||
        (saved?.email ? saved.email.split("@")[0] : "") ||
        "";

      const senderEmail = socketQuery?.email || saved?.email || "";

      const payload = {
        scope: "observer_project_group",
        content: groupText.trim(),
        email: senderEmail,
        name: senderName,
      };

      s.emit("chat:send", payload, (response?: unknown) => {
        const data = response as SocketResponse;
        if (data?.ok) {
          setGroupText("");
        } else {
          console.error("❌ Failed to send group message:", data?.error);
        }
      });
    } catch (error) {
      console.error("❌ Error sending group message:", error);
    }
  };

  return (
    <div className="my-2 bg-custom-gray-2 rounded-lg p-1 max-h-[40vh] min-h-[40vh] overflow-hidden">
      <RightSidebarHeading
        title="Observation Room"
        observerCount={
          observers.filter((o) => (o.name || "").toLowerCase() !== "observer")
            .length
        }
      />

      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v);
          if (v === "list") {
            setShowGroupChat(false);
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
              // Close any open chat window when switching to the Observer Chat tab
              setShowGroupChat(false);
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
          <div className="space-y-2">
            {observers.filter(
              (o) => (o.name || "").toLowerCase() !== "observer"
            ).length === 0 ? (
              <div className="text-sm text-gray-500">No observers yet.</div>
            ) : (
              observers
                .filter((o) => (o.name || "").toLowerCase() !== "observer")
                .map((o, idx) => {
                  const label = o.name || o.email || "Observer";
                  return (
                    <div
                      key={`${label}-${idx}`}
                      className="flex items-center justify-between gap-2 rounded px-2 py-1"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {label}
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </TabsContent>

        <TabsContent value="chat">
          <div className="grid grid-cols-12 gap-2 h-[26vh]">
            {!selectedObserver && !showGroupChat && (
              <div className="col-span-12 rounded bg-white overflow-y-auto">
                <div className="space-y-1 p-2">
                  {/* Group Chat Option */}
                  <div
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                    onClick={() => {
                      setShowGroupChat(true);
                      setSelectedObserver(null);
                      setGroupUnread(0);
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

                  {observers.filter(
                    (o) => (o.name || "").toLowerCase() !== "observer"
                  ).length === 0 ? (
                    <div className="text-sm text-gray-500">
                      No observers yet.
                    </div>
                  ) : (
                    observers
                      .filter(
                        (o) => (o.name || "").toLowerCase() !== "observer"
                      )
                      .map((o, idx) => {
                        const label = o.name || o.email || "Observer";
                        const emailLower = (o.email || "").toLowerCase();
                        const unread = dmUnreadByEmail[emailLower] || 0;
                        return (
                          <div
                            key={`${label}-${idx}`}
                            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                            onClick={() => {
                              setSelectedObserver({
                                name: o.name,
                                email: o.email,
                              });
                              setShowGroupChat(false);
                              setDmUnreadByEmail((prev) => ({
                                ...prev,
                                [emailLower]: 0,
                              }));
                            }}
                          >
                            <div className="flex items-center gap-2 min-w-0 ">
                              <span className="text-sm font-medium truncate">
                                {label}
                              </span>
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
                      })
                  )}
                </div>
              </div>
            )}

            {showGroupChat && (
              <div className="col-span-12 rounded bg-white flex flex-col min-h-0 overflow-y-auto">
                {/* Old group chat UI commented per migration to ChatWindow */}
                {(() => {
                  const mapped: ChatWindowMessage[] = groupMessages.map(
                    (message, i) => ({
                      id: i,
                      senderEmail: message.senderEmail || message.email,
                      senderName: message.name || message.senderName,
                      content: message.content,
                      timestamp: message.timestamp || new Date(),
                    })
                  );
                  const send = () => {
                    if (!groupText.trim()) return;
                    sendGroupMessage();
                  };
                  return (
                    <ChatWindow
                      title="Observer Group Chat"
                      meEmail={meEmail}
                      messages={mapped}
                      value={groupText}
                      onChange={setGroupText}
                      onSend={send}
                      onClose={() => setShowGroupChat(false)}
                      height="26vh"
                    />
                  );
                })()}
              </div>
            )}

            {selectedObserver && (
              <div className="col-span-12 rounded bg-white flex flex-col min-h-0 overflow-y-auto">
                {/* Old DM chat UI commented per migration to ChatWindow */}
                {(() => {
                  const mapped: ChatWindowMessage[] = messages.map(
                    (message, i) => ({
                      id: i,
                      senderEmail: message.email,
                      senderName: message.senderName,
                      content: message.content,
                      timestamp: message.timestamp,
                    })
                  );
                  const title =
                    meRole === "Moderator" || meRole === "Admin"
                      ? `Message Observer: ${
                          selectedObserver.name || selectedObserver.email
                        }`
                      : `Chat with ${
                          selectedObserver.name || selectedObserver.email
                        }`;
                  const send = () => {
                    if (!messageInput.trim()) return;
                    sendMessage();
                  };
                  return (
                    <ChatWindow
                      title={title}
                      meEmail={meEmail}
                      messages={mapped}
                      value={messageInput}
                      onChange={setMessageInput}
                      onSend={send}
                      onClose={() => {
                        setSelectedObserver(null);
                        setShowGroupChat(false);
                      }}
                      height="26vh"
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

export default ObservationRoom;
