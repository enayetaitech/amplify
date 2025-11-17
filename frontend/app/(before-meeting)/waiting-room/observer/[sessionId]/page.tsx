"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { SOCKET_URL } from "constant/socket";
import api from "lib/api";
import Logo from "components/shared/LogoComponent";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Badge } from "components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "components/ui/sheet";
import {
  MessageSquare,
  MoveLeftIcon,
  MoveRightIcon,
  Video,
  X,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import ChatWindow, {
  ChatWindowMessage,
} from "components/meeting/chat/ChatWindow";

import { Socket } from "socket.io-client";

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

export default function ObserverWaitingRoom() {
  const { sessionId } = useParams() as { sessionId: string };
  const router = useRouter();
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [observerList, setObserverList] = useState<
    { name: string; email: string }[]
  >([]);
  const [moderators, setModerators] = useState<
    { name: string; email: string; role: string }[]
  >([]);
  const [activeTab, setActiveTab] = useState<string>("list");
  const [meEmail, setMeEmail] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");
  void projectId;
  const [selectedObserver, setSelectedObserver] = useState<{
    name?: string;
    email?: string;
  } | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState<string>("");
  const [showGroupChat, setShowGroupChat] = useState<boolean>(false);
  const [dmUnreadByEmail, setDmUnreadByEmail] = useState<
    Record<string, number>
  >({});

  const meEmailLower = (meEmail || "").toLowerCase();

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

  useEffect(() => {
    // Effect: establish socket connection for this observer session
    // - Connects to the socket server with role=Observer and saved user info
    // - Listens for "observer:stream:started" to navigate to the streaming page
    // - Listens for participant admission announcements and shows toasts
    // - Cleans up listeners and disconnects the socket on unmount or sessionId change
    if (!sessionId) return;

    const saved =
      typeof window !== "undefined" &&
      window.localStorage.getItem("liveSessionUser")
        ? JSON.parse(String(window.localStorage.getItem("liveSessionUser")))
        : {};
    const s = io(SOCKET_URL, {
      path: "/socket.io",
      withCredentials: true,
      query: {
        sessionId,
        role: "Observer",
        name: saved?.name || "",
        email: saved?.email || "",
      },
    });

    const onStarted = (payload?: {
      sessionId?: string;
      playbackUrl?: string | null;
    }) => {
      const targetSessionId = payload?.sessionId || sessionId;
      toast.success(
        "Streaming started. You are being taken to the streaming page."
      );
      router.replace(`/meeting/${targetSessionId}?role=Observer`);
    };

    s.on("observer:stream:started", onStarted);
    setSocket(s);

    // Show toasts when participants are admitted
    const onOneAdmitted = (p: { name?: string; email?: string }) => {
      const label = p?.name || p?.email || "Participant";
      toast.success(`${label} was admitted to the meeting`);
    };
    const onManyAdmitted = (p: { count?: number }) => {
      const c = Number(p?.count || 0);
      if (c > 0) toast.success(`${c} participants were admitted`);
    };
    s.on("announce:participant:admitted", onOneAdmitted);
    s.on("announce:participants:admitted", onManyAdmitted);

    // Chat message handling
    const onChatNew = (payload: ChatPayload) => {
      if (
        payload.scope === "observer_project_group" ||
        payload.scope === "observer_wait_group"
      ) {
        // Group chat message (support both old and new scope for backward compatibility)
        const groupMessage = payload.message as GroupMessage;
        if (showGroupChat) {
          setGroupMessages((prev) => {
            // Check if message already exists (deduplicate by _id or timestamp + content + senderEmail)
            const messageWithId = groupMessage as GroupMessage & {
              _id?: string;
            };
            const messageId =
              messageWithId._id ||
              `${groupMessage.timestamp}${groupMessage.content}${
                groupMessage.senderEmail || groupMessage.email
              }`;
            const exists = prev.some((m) => {
              const mWithId = m as GroupMessage & { _id?: string };
              const mId =
                mWithId._id ||
                `${m.timestamp}${m.content}${m.senderEmail || m.email}`;
              return mId === messageId;
            });
            if (exists) return prev; // Don't add duplicate
            return [...prev, groupMessage];
          });
          setGroupUnread(0);
        } else {
          setGroupUnread((prev) => prev + 1);
        }
      } else if (
        selectedObserver &&
        (payload.scope === "observer_wait_dm" ||
          payload.scope === "stream_dm_obs_mod")
      ) {
        const message = payload.message;
        const selectedEmail = (selectedObserver.email || "").toLowerCase();
        const messageFrom = (message.email || "").toLowerCase();
        const messageTo = (message.toEmail || "").toLowerCase();
        const myEmail = (meEmail || "").toLowerCase();

        // Message is relevant if:
        // 1. It's from the selected person TO me, OR
        // 2. It's from me TO the selected person
        const isRelevantMessage =
          (messageFrom === selectedEmail && messageTo === myEmail) ||
          (messageFrom === myEmail && messageTo === selectedEmail);

        if (isRelevantMessage) {
          setMessages((prev) => {
            // Check if message already exists (deduplicate by _id or timestamp + content + email)
            const messageWithId = message as ChatMessage & { _id?: string };
            const messageId =
              messageWithId._id ||
              `${message.timestamp}${message.content}${message.email}`;
            const exists = prev.some((m) => {
              const mWithId = m as ChatMessage & { _id?: string };
              const mId = mWithId._id || `${m.timestamp}${m.content}${m.email}`;
              return mId === messageId;
            });
            if (exists) return prev; // Don't add duplicate
            return [...prev, message];
          });
        }
      }
    };
    s.on("chat:new", onChatNew);

    return () => {
      s.off("observer:stream:started", onStarted);
      s.off("announce:participant:admitted", onOneAdmitted);
      s.off("announce:participants:admitted", onManyAdmitted);
      s.off("chat:new", onChatNew);
      s.disconnect();
    };
  }, [router, sessionId, selectedObserver, showGroupChat, meEmail]);

  // DM unread count across all observers
  useEffect(() => {
    if (!socket) return;

    const onNew = (payload: ChatPayload) => {
      if (
        !payload?.scope ||
        (payload.scope !== "observer_wait_dm" &&
          payload.scope !== "stream_dm_obs_mod" &&
          payload.scope !== "observer_project_group") ||
        !payload?.message
      )
        return;

      // Handle project-level group chat unread
      if (payload.scope === "observer_project_group") {
        const groupMessage = payload.message as GroupMessage;
        void groupMessage;
        if (showGroupChat) {
          // Already visible, don't count as unread
          return;
        } else {
          setGroupUnread((prev) => prev + 1);
          return;
        }
      }

      const message = payload.message;
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

    socket.on("chat:new", onNew);
    return () => {
      socket.off("chat:new", onNew);
    };
  }, [socket, selectedObserver, showGroupChat, meEmail]);

  // Effect: load current observer identity and projectId from localStorage
  // - Reads `liveSessionUser` from localStorage to set `meEmail`
  // - Reads `observerProjectId` from localStorage for project-level chat
  // - Used to avoid showing the current observer in the observer list
  // - Runs once on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem("liveSessionUser")
        ? JSON.parse(String(window.localStorage.getItem("liveSessionUser")))
        : {};
      setMeEmail(saved?.email || "");

      // Get projectId from localStorage (stored during join)
      const storedProjectId = window.localStorage.getItem("observerProjectId");
      if (storedProjectId) {
        setProjectId(storedProjectId);
      } else {
        // Fallback: fetch from session if not in localStorage
        (async () => {
          try {
            const res = await api.get(`/api/v1/sessions/${sessionId}`);
            const sess = res.data?.data;
            if (sess) {
              const raw = (sess as { projectId?: unknown }).projectId;
              const extractId = (v: unknown): string | null => {
                if (!v) return null;
                if (typeof v === "string") return v;
                if (typeof v === "object") {
                  const obj = v as { _id?: unknown; toString?: () => string };
                  if (typeof obj._id === "string") return obj._id;
                  if (
                    obj._id &&
                    typeof (obj._id as { toString?: () => string }).toString ===
                      "function"
                  ) {
                    const s = String(
                      (obj._id as { toString?: () => string }).toString?.()
                    );
                    if (s && s !== "[object Object]") return s;
                  }
                }
                return null;
              };
              const pid = extractId(raw);
              if (pid) {
                setProjectId(pid);
                window.localStorage.setItem("observerProjectId", pid);
              }
            }
          } catch {
            // ignore
          }
        })();
      }
    } catch {
      // ignore
    }
  }, [sessionId]);

  // Effect: subscribe to observer list updates via socket
  // - Registers a handler for the "observer:list" event to update `observerList`
  // - Requests the current list via "observer:list:get" and sets the result
  // - Cleans up the event listener when the socket instance changes or on unmount
  useEffect(() => {
    if (!socket) return;
    const onList = (p: { observers?: { name: string; email: string }[] }) => {
      const rawList = Array.isArray(p?.observers) ? p.observers : [];

      // Deduplicate by email to prevent duplicate entries
      const uniqueList = Array.from(
        new Map(
          rawList
            .filter((o) => o.email) // Only include entries with email
            .map((o) => [o.email!.toLowerCase(), o])
        ).values()
      );

      setObserverList(uniqueList);
    };
    socket.on("observer:list", onList);
    socket.emit(
      "observer:list:get",
      {},
      (resp?: { observers?: { name: string; email: string }[] }) => {
        const rawList = Array.isArray(resp?.observers) ? resp!.observers! : [];

        // Deduplicate by email to prevent duplicate entries
        const uniqueList = Array.from(
          new Map(
            rawList
              .filter((o) => o.email) // Only include entries with email
              .map((o) => [o.email!.toLowerCase(), o])
          ).values()
        );

        setObserverList(uniqueList);
      }
    );
    // Moderators/Admins
    const onMods = (p: {
      moderators?: { name: string; email: string; role: string }[];
    }) => {
      const list = Array.isArray(p?.moderators) ? p.moderators : [];

      setModerators(list);
    };
    socket.on("moderator:list", onMods);
    socket.emit(
      "moderator:list:get",
      {},
      (resp?: {
        moderators?: { name: string; email: string; role: string }[];
      }) => {
        const list = Array.isArray(resp?.moderators) ? resp!.moderators! : [];

        setModerators(list);
      }
    );
    return () => {
      socket.off("observer:list", onList);
      socket.off("moderator:list", onMods);
    };
  }, [socket]);

  // Effect: load chat history when observer is selected
  useEffect(() => {
    if (!socket || !selectedObserver) {
      setMessages([]);
      return;
    }

    const loadChatHistory = async () => {
      try {
        // Load messages from both observer-to-observer and moderator-to-observer scopes
        const scopes = ["observer_wait_dm", "stream_dm_obs_mod"];
        let allMessages: ChatMessage[] = [];
        let loadedScopes = 0;

        scopes.forEach((scope) => {
          socket.emit(
            "chat:history:get",
            {
              scope: scope,
              thread: { withEmail: selectedObserver.email },
              limit: 50,
            },
            (response?: ChatHistoryResponse) => {
              if (response?.items) {
                allMessages = [...allMessages, ...response.items];
              }
              loadedScopes++;

              // When both scopes are loaded, sort by timestamp and set messages
              if (loadedScopes === scopes.length) {
                allMessages.sort(
                  (a, b) =>
                    new Date(a.timestamp).getTime() -
                    new Date(b.timestamp).getTime()
                );
                setMessages(allMessages);
              }
            }
          );
        });
      } catch (error) {
        console.error("Failed to load chat history:", error);
      }
    };

    loadChatHistory();
  }, [socket, selectedObserver]);

  // Effect: load group chat history when group chat is opened
  useEffect(() => {
    if (!socket || !showGroupChat) {
      setGroupMessages([]);
      return;
    }

    const loadGroupChatHistory = async () => {
      try {
        setGroupLoading(true);
        // Use project-level scope for unified chat
        socket.emit(
          "chat:history:get",
          {
            scope: "observer_project_group",
            limit: 50,
          },
          (response?: { items: GroupMessage[] }) => {
            if (response?.items) {
              setGroupMessages(response.items);
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
  }, [socket, showGroupChat]);

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
    if (!socket || !selectedObserver || !messageInput.trim()) return;

    try {
      socket.emit(
        "chat:send",
        {
          scope: "observer_wait_dm",
          content: messageInput.trim(),
          toEmail: selectedObserver.email,
        },
        (response?: SocketResponse) => {
          if (response?.ok) {
            setMessageInput("");
          } else {
            console.error("Failed to send message:", response?.error);
            toast.error("Failed to send message");
          }
        }
      );
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  // Function to send group chat message
  const sendGroupMessage = async () => {
    if (!socket || !groupText.trim()) return;

    try {
      // Use project-level scope for unified chat
      socket.emit(
        "chat:send",
        {
          scope: "observer_project_group",
          content: groupText.trim(),
        },
        (response?: SocketResponse) => {
          if (response?.ok) {
            setGroupText("");
          } else {
            console.error("Failed to send group message:", response?.error);
            toast.error("Failed to send group message");
          }
        }
      );
    } catch (error) {
      console.error("Error sending group message:", error);
      toast.error("Failed to send group message");
    }
  };

  return (
    <div className="min-h-screen dashboard_sidebar_bg">
      {/* Header */}

      <div className="flex">
        {/* Main */}
        <main className="flex-1 px-4 lg:px-8 pb-10 w-full">
          {/* Desktop toggle when sidebar hidden */}

          <div className="flex items-center justify-between px-4 lg:px-8 py-2 ">
            <div className="items-center gap-3 hidden lg:flex">
              <Video />
              <span className="text-sm">Observation Room</span>
              <span className="rounded-full bg-custom-dark-blue-1 text-white text-xs px-3 py-1">
                Observer View
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsChatOpen(true)}
              >
                <MessageSquare className="h-5 w-5" />
              </Button>
              <Logo />
            </div>
          </div>
          {!isChatOpen && (
            <div className="hidden lg:flex items-center gap-2 mb-3 justify-end ">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsChatOpen(true)}
              >
                <MoveLeftIcon className="h-4 w-4 mr-2" /> Open Chat
              </Button>
            </div>
          )}
          <div className=" rounded-xl bg-white p-4 lg:p-6">
            <div className="h-[60vh] lg:h-[70vh] flex items-center justify-center">
              <p className="text-center text-slate-700">
                Feel free to chat, the meeting stream will start soon.
              </p>
            </div>
          </div>
        </main>

        {/* Sidebar (desktop right) */}
        {isChatOpen && (
          <aside className="hidden lg:flex w-[320px] shrink-0 h-[100vh]  sticky top-0">
            <div className="bg-white w-full flex flex-col rounded-l-2xl h-full ">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h3 className="text-sm font-semibold tracking-wide">
                  Observation Room Chat
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsChatOpen(false)}
                  aria-label="Close chat"
                >
                  <MoveRightIcon className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-2">
                {/* New tabs: Observer List & Observer Chat */}
                <div className="my-2 bg-custom-gray-2 rounded-lg p-1 max-h-[40vh] min-h-[80vh] overflow-auto flex flex-col">
                  <div className="flex-1 flex min-h-0 flex-col">
                    <div className="sticky top-0 z-10 bg-custom-gray-2 w-full gap-2 flex items-center p-2">
                      <button
                        type="button"
                        data-tab="list"
                        className={`rounded-full text-sm px-4 cursor-pointer shadow-sm ${
                          activeTab === "list"
                            ? "bg-custom-dark-blue-1 text-white"
                            : "bg-transparent border-custom-dark-blue-1 text-custom-dark-blue-1"
                        }`}
                        onClick={() => setActiveTab("list")}
                      >
                        Observer List
                      </button>
                      <button
                        type="button"
                        data-tab="chat"
                        className={`rounded-full cursor-pointer text-sm px-4  shadow-sm ml-2 ${
                          activeTab === "chat"
                            ? "bg-custom-dark-blue-1 text-white"
                            : "bg-transparent border-custom-dark-blue-1 text-custom-dark-blue-1"
                        }`}
                        onClick={() => {
                          setActiveTab("chat");
                          setShowGroupChat(false);
                          setSelectedObserver(null);
                        }}
                      >
                        <span className="relative inline-flex items-center">
                          <span>Observer Chat</span>
                          {groupUnread +
                            Object.values(dmUnreadByEmail).reduce(
                              (a, b) => a + b,
                              0
                            ) >
                            0 && (
                            <span className="absolute -top-1 -right-4 inline-flex items-center justify-center text-[10px] min-w-[16px] h-4 px-1 rounded-full bg-custom-orange-1 text-white">
                              {groupUnread +
                                Object.values(dmUnreadByEmail).reduce(
                                  (a, b) => a + b,
                                  0
                                )}
                            </span>
                          )}
                        </span>
                      </button>
                    </div>

                    <div data-observer-panel className="p-2 flex-1 min-h-0">
                      <div
                        data-tabcontent="list"
                        style={{
                          display: activeTab === "list" ? "block" : "none",
                        }}
                        className="h-[70vh] overflow-y-auto bg-white rounded p-2"
                      >
                        <div className="space-y-2">
                          {(() => {
                            // Combined list: all observers (including current user) + moderators + admins
                            const combinedListMap = new Map<
                              string,
                              { name: string; email: string; role?: string }
                            >();

                            // Add all observers (including current user)
                            observerList.forEach((o) => {
                              const emailLower = (o.email || "").toLowerCase();
                              if (emailLower) {
                                combinedListMap.set(emailLower, {
                                  name: o.name || o.email || "Observer",
                                  email: o.email,
                                });
                              }
                            });

                            // Add all moderators/admins (will overwrite if already exists as observer)
                            moderators.forEach((m) => {
                              const emailLower = (m.email || "").toLowerCase();
                              const name = (m.name || "").trim();
                              if (
                                emailLower &&
                                name &&
                                name.toLowerCase() !== "moderator"
                              ) {
                                combinedListMap.set(emailLower, {
                                  name: m.name || m.email || "",
                                  email: m.email,
                                  role: m.role,
                                });
                              }
                            });

                            // Convert to array and sort by name
                            const combinedList = Array.from(
                              combinedListMap.values()
                            ).sort((a, b) => {
                              const nameA = (a.name || "").toLowerCase();
                              const nameB = (b.name || "").toLowerCase();
                              return nameA.localeCompare(nameB);
                            });

                            if (combinedList.length === 0) {
                              return (
                                <div className="text-sm text-gray-500">
                                  No observers yet.
                                </div>
                              );
                            }

                            return combinedList.map((item) => {
                              const label =
                                item.name || item.email || "Observer";
                              const emailLower = (
                                item.email || ""
                              ).toLowerCase();
                              const isCurrentUser =
                                meEmailLower !== "" &&
                                emailLower === meEmailLower;
                              const roleLabel =
                                item.role === "Admin"
                                  ? "Admin"
                                  : item.role === "Moderator"
                                  ? "Moderator"
                                  : null;

                              return (
                                <div
                                  key={`${label}-${item.email}`}
                                  className="flex items-center justify-between gap-2 rounded px-2 py-1"
                                >
                                  <div className="min-w-0 flex items-center gap-2">
                                    <div className="text-sm font-medium truncate">
                                      {label}
                                      {isCurrentUser && (
                                        <span className="text-gray-500 ml-1">
                                          (You)
                                        </span>
                                      )}
                                    </div>
                                    {roleLabel && (
                                      <Badge
                                        variant={
                                          item.role === "Admin"
                                            ? "default"
                                            : "secondary"
                                        }
                                        className="text-[10px] px-1.5 py-0 h-4"
                                      >
                                        {roleLabel}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                      <div
                        data-tabcontent="chat"
                        style={{
                          display: activeTab === "chat" ? "block" : "none",
                        }}
                        className="h-[70vh] overflow-y-auto bg-white rounded p-2"
                      >
                        <div className="space-y-2">
                          {!selectedObserver && !showGroupChat && (
                            <>
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

                              {(() => {
                                // Combined list: all observers (including current user) + moderators + admins
                                const combinedListMap = new Map<
                                  string,
                                  { name: string; email: string; role?: string }
                                >();

                                // Add all observers (including current user)
                                observerList.forEach((o) => {
                                  const emailLower = (
                                    o.email || ""
                                  ).toLowerCase();
                                  if (emailLower) {
                                    combinedListMap.set(emailLower, {
                                      name: o.name || o.email || "Observer",
                                      email: o.email,
                                    });
                                  }
                                });

                                // Add all moderators/admins (will overwrite if already exists as observer)
                                moderators.forEach((m) => {
                                  const emailLower = (
                                    m.email || ""
                                  ).toLowerCase();
                                  const name = (m.name || "").trim();
                                  if (
                                    emailLower &&
                                    name &&
                                    name.toLowerCase() !== "moderator"
                                  ) {
                                    combinedListMap.set(emailLower, {
                                      name: m.name || m.email || "",
                                      email: m.email,
                                      role: m.role,
                                    });
                                  }
                                });

                                // Convert to array and sort by name
                                const combinedList = Array.from(
                                  combinedListMap.values()
                                ).sort((a, b) => {
                                  const nameA = (a.name || "").toLowerCase();
                                  const nameB = (b.name || "").toLowerCase();
                                  return nameA.localeCompare(nameB);
                                });

                                if (combinedList.length === 0) {
                                  return (
                                    <div className="text-sm text-gray-500">
                                      No observers yet.
                                    </div>
                                  );
                                }

                                const filteredList =
                                  meEmailLower === ""
                                    ? combinedList
                                    : combinedList.filter((entry) => {
                                        const entryEmail = (
                                          entry.email || ""
                                        ).toLowerCase();
                                        return entryEmail !== meEmailLower;
                                      });

                                return filteredList.map((item) => {
                                  const label =
                                    item.name || item.email || "Observer";
                                  const emailLower = (
                                    item.email || ""
                                  ).toLowerCase();
                                  const unread =
                                    dmUnreadByEmail[emailLower] || 0;
                                  const roleLabel =
                                    item.role === "Admin"
                                      ? "Admin"
                                      : item.role === "Moderator"
                                      ? "Moderator"
                                      : null;

                                  return (
                                    <div
                                      key={`${label}-${item.email}`}
                                      className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                                      onClick={() => {
                                        setSelectedObserver({
                                          name: item.name,
                                          email: item.email,
                                        });
                                        setShowGroupChat(false);
                                        setDmUnreadByEmail((prev) => ({
                                          ...prev,
                                          [emailLower]: 0,
                                        }));
                                      }}
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-sm font-medium truncate">
                                          {label}
                                        </span>
                                        {roleLabel && (
                                          <Badge
                                            variant={
                                              item.role === "Admin"
                                                ? "default"
                                                : "secondary"
                                            }
                                            className="text-[10px] px-1.5 py-0 h-4"
                                          >
                                            {roleLabel}
                                          </Badge>
                                        )}
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
                                });
                              })()}
                            </>
                          )}

                          {showGroupChat && (
                            <div className="h-full flex flex-col min-h-0 overflow-y-auto">
                              {(() => {
                                const mapped: ChatWindowMessage[] =
                                  groupMessages.map((message, i) => ({
                                    id: i,
                                    senderEmail:
                                      message.senderEmail || message.email,
                                    senderName:
                                      message.name || message.senderName,
                                    content: message.content,
                                    timestamp: message.timestamp || new Date(),
                                  }));
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
                                    height="70vh"
                                  />
                                );
                              })()}
                            </div>
                          )}

                          {selectedObserver && (
                            <div className="h-full flex flex-col min-h-0 overflow-y-auto">
                              {(() => {
                                const mapped: ChatWindowMessage[] =
                                  messages.map((message, i) => ({
                                    id: i,
                                    senderEmail: message.email,
                                    senderName: message.senderName,
                                    content: message.content,
                                    timestamp: message.timestamp,
                                  }));
                                const send = () => {
                                  if (!messageInput.trim()) return;
                                  sendMessage();
                                };
                                const title = `Chat with ${
                                  selectedObserver.name ||
                                  selectedObserver.email
                                }`;
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
                                    height="70vh"
                                  />
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Mobile Chat Sheet on right */}
      <Sheet
        open={
          isChatOpen &&
          typeof window !== "undefined" &&
          window.innerWidth < 1024
        }
        onOpenChange={setIsChatOpen}
      >
        <SheetContent side="right" className="p-0 w-[90%] sm:max-w-sm">
          <SheetHeader className="px-4 py-3 border-b">
            <SheetTitle>Observation Room Chat</SheetTitle>
          </SheetHeader>
          <div className="p-2 h-[80vh] flex flex-col">
            <div className="flex-1 overflow-y-auto bg-white rounded p-2">
              {/* Mobile: show list or chat similar to desktop */}
              {!selectedObserver && !showGroupChat && (
                <div className="space-y-2">
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
                          <Badge className="h-4 min-w-[1rem] leading-none p-0 text-[10px] inline-flex items-center justify-center bg-custom-orange-1">
                            {groupUnread}
                          </Badge>
                        </span>
                      )}
                    </div>
                  </div>

                  {(() => {
                    // Combined list: all observers (including current user) + moderators + admins
                    const combinedListMap = new Map<
                      string,
                      { name: string; email: string; role?: string }
                    >();

                    // Add all observers (including current user)
                    observerList.forEach((o) => {
                      const emailLower = (o.email || "").toLowerCase();
                      if (emailLower) {
                        combinedListMap.set(emailLower, {
                          name: o.name || o.email || "Observer",
                          email: o.email,
                        });
                      }
                    });

                    // Add all moderators/admins (will overwrite if already exists as observer)
                    moderators.forEach((m) => {
                      const emailLower = (m.email || "").toLowerCase();
                      const name = (m.name || "").trim();
                      if (
                        emailLower &&
                        name &&
                        name.toLowerCase() !== "moderator"
                      ) {
                        combinedListMap.set(emailLower, {
                          name: m.name || m.email || "",
                          email: m.email,
                          role: m.role,
                        });
                      }
                    });

                    // Convert to array and sort by name
                    const combinedList = Array.from(
                      combinedListMap.values()
                    ).sort((a, b) => {
                      const nameA = (a.name || "").toLowerCase();
                      const nameB = (b.name || "").toLowerCase();
                      return nameA.localeCompare(nameB);
                    });

                    if (combinedList.length === 0) {
                      return (
                        <div className="text-sm text-gray-500">
                          No observers yet.
                        </div>
                      );
                    }

                    const filteredList =
                      meEmailLower === ""
                        ? combinedList
                        : combinedList.filter((entry) => {
                            const entryEmail = (
                              entry.email || ""
                            ).toLowerCase();
                            return entryEmail !== meEmailLower;
                          });

                    return filteredList.map((item) => {
                      const label = item.name || item.email || "Observer";
                      const emailLower = (item.email || "").toLowerCase();
                      const unread = dmUnreadByEmail[emailLower] || 0;
                      const roleLabel =
                        item.role === "Admin"
                          ? "Admin"
                          : item.role === "Moderator"
                          ? "Moderator"
                          : null;

                      return (
                        <div
                          key={`${label}-${item.email}`}
                          className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                          onClick={() => {
                            setSelectedObserver({
                              name: item.name,
                              email: item.email,
                            });
                            setShowGroupChat(false);
                            setDmUnreadByEmail((prev) => ({
                              ...prev,
                              [emailLower]: 0,
                            }));
                          }}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm font-medium truncate">
                              {label}
                            </span>
                            {roleLabel && (
                              <Badge
                                variant={
                                  item.role === "Admin"
                                    ? "default"
                                    : "secondary"
                                }
                                className="text-[10px] px-1.5 py-0 h-4"
                              >
                                {roleLabel}
                              </Badge>
                            )}
                          </div>
                          <div className="relative inline-flex items-center justify-center h-6 w-6">
                            <MessageSquare className="h-4 w-4 text-gray-400" />
                            {unread > 0 && (
                              <span className="absolute -top-1 -right-1">
                                <Badge className="h-4 min-w-[1rem] leading-none p-0 text-[10px] inline-flex items-center justify-center bg-custom-orange-1">
                                  {unread}
                                </Badge>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}

              {showGroupChat && (
                <div className="h-full flex flex-col min-h-0 overflow-y-auto">
                  <div className="flex items-center justify-between p-2 border-b">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        Observer Group Chat
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowGroupChat(false)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div ref={groupRef} className="flex-1 overflow-y-auto p-2">
                    {groupLoading ? (
                      <div className="text-sm text-gray-500">Loading...</div>
                    ) : (
                      <div className="space-y-2 text-sm">
                        {groupMessages.length === 0 ? (
                          <div className="text-gray-500">No messages yet.</div>
                        ) : (
                          groupMessages.map((message, idx) => {
                            const isFromMe =
                              message.senderEmail?.toLowerCase() ===
                                meEmail.toLowerCase() ||
                              message.email?.toLowerCase() ===
                                meEmail.toLowerCase();
                            const senderName =
                              message.name ||
                              message.senderEmail ||
                              message.senderName ||
                              "Unknown";
                            return (
                              <div
                                key={idx}
                                className={`flex ${
                                  isFromMe ? "justify-end" : "justify-start"
                                }`}
                              >
                                <div
                                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                                    isFromMe
                                      ? "bg-custom-dark-blue-1 text-white"
                                      : "bg-gray-100 text-gray-900"
                                  }`}
                                >
                                  <div className="text-xs opacity-70 mb-1">
                                    {senderName}
                                  </div>
                                  <div>{message.content}</div>
                                  <div className="text-xs opacity-70 mt-1">
                                    {message.timestamp
                                      ? new Date(
                                          message.timestamp
                                        ).toLocaleTimeString()
                                      : "Just now"}
                                  </div>
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
                      value={groupText}
                      onChange={(e) => setGroupText(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") sendGroupMessage();
                      }}
                    />
                    <Button
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={sendGroupMessage}
                      disabled={!groupText.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {selectedObserver && (
                <div className="h-full flex flex-col min-h-0 overflow-y-auto">
                  <div className="flex items-center justify-between p-2 border-b">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        Chat with{" "}
                        {selectedObserver.name || selectedObserver.email}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedObserver(null);
                        setShowGroupChat(false);
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div ref={dmRef} className="flex-1 overflow-y-auto p-2">
                    <div className="space-y-2 text-sm">
                      {messages.length === 0 ? (
                        <div className="text-gray-500">No messages yet.</div>
                      ) : (
                        messages.map((message, idx) => {
                          const isFromMe =
                            message.email?.toLowerCase() ===
                            meEmail.toLowerCase();
                          return (
                            <div
                              key={idx}
                              className={`flex ${
                                isFromMe ? "justify-end" : "justify-start"
                              }`}
                            >
                              <div
                                className={`max-w-[80%] rounded-lg px-3 py-2 ${
                                  isFromMe
                                    ? "bg-custom-dark-blue-1 text-white"
                                    : "bg-gray-100 text-gray-900"
                                }`}
                              >
                                {!isFromMe && (
                                  <div className="text-[11px] text-gray-500">
                                    {message.senderName || message.email}
                                  </div>
                                )}
                                <div className="whitespace-pre-wrap">
                                  {message.content}
                                </div>
                                <div className="text-xs opacity-70 mt-1">
                                  {new Date(
                                    message.timestamp
                                  ).toLocaleTimeString()}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                  <div className="p-2 flex items-center gap-2 border-t">
                    <Input
                      placeholder="Type a message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") sendMessage();
                      }}
                    />
                    <Button
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={sendMessage}
                      disabled={!messageInput.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
