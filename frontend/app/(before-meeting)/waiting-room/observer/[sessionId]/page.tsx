"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { SOCKET_URL } from "constant/socket";
import Logo from "components/shared/LogoComponent";
import { Button } from "components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "components/ui/sheet";
import {
  MessageSquare,
  PanelRightOpen,
  PanelRightClose,
  Video,
  ArrowLeft,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { Socket } from "socket.io-client";
import useChat from "hooks/useChat";

export default function ObserverWaitingRoom() {
  const { sessionId } = useParams() as { sessionId: string };
  const router = useRouter();
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [observerList, setObserverList] = useState<
    { name: string; email: string }[]
  >([]);
  const [activeTab, setActiveTab] = useState<string>("list");
  const [meEmail, setMeEmail] = useState<string>("");
  const [me, setMe] = useState<{
    email: string;
    name: string;
    role: "Observer";
  }>({ email: "", name: "", role: "Observer" });
  const [selectedObserverEmail, setSelectedObserverEmail] =
    useState<string>("");
  const [selectedObserverName, setSelectedObserverName] = useState<string>("");
  const [dmText, setDmText] = useState<string>("");
  const [isGroupChat, setIsGroupChat] = useState<boolean>(false);
  const [groupText, setGroupText] = useState<string>("");
  const [unreadGroupCount, setUnreadGroupCount] = useState<number>(0);
  const [unreadDmCounts, setUnreadDmCounts] = useState<Record<string, number>>(
    {}
  );

  const { send, getHistory, messagesByThread, makeThreadKey, messagesByScope } =
    useChat({
      socket,
      sessionId,
      my: me,
    });

  useEffect(() => {
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

    const onStarted = () => {
      toast.success(
        "Streaming started. You are being taken to the streaming page."
      );
      router.replace(`/meeting/${sessionId}?role=Observer`);
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

    return () => {
      s.off("observer:stream:started", onStarted);
      s.off("announce:participant:admitted", onOneAdmitted);
      s.off("announce:participants:admitted", onManyAdmitted);
      s.disconnect();
    };
  }, [router, sessionId]);

  // read current observer identity to avoid showing self in lists
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem("liveSessionUser")
        ? JSON.parse(String(window.localStorage.getItem("liveSessionUser")))
        : {};
      setMeEmail(saved?.email || "");
      setMe({
        email: saved?.email || "",
        name: saved?.name || saved?.email || "Observer",
        role: "Observer",
      });
    } catch {
      // ignore
    }
  }, []);

  // listen for observer list updates
  useEffect(() => {
    if (!socket) return;
    const onList = (p: { observers?: { name: string; email: string }[] }) => {
      const list = Array.isArray(p?.observers) ? p.observers : [];
      setObserverList(list);
    };
    socket.on("observer:list", onList);
    socket.emit(
      "observer:list:get",
      {},
      (resp?: { observers?: { name: string; email: string }[] }) => {
        const list = Array.isArray(resp?.observers) ? resp!.observers! : [];
        setObserverList(list);
      }
    );
    return () => {
      socket.off("observer:list", onList);
    };
  }, [socket]);

  // Track unread messages for group chat
  useEffect(() => {
    if (!socket) return;

    const onNewMessage = (payload: {
      scope: string;
      message: { email?: string; senderEmail?: string; [key: string]: unknown };
    }) => {
      const { scope, message } = payload || {};
      if (!scope || !message) return;

      if (scope === "observer_wait_group") {
        // Only count as unread if group chat is not currently open
        if (!isGroupChat) {
          setUnreadGroupCount((prev) => prev + 1);
        }
      } else if (scope === "observer_wait_dm") {
        // Only count as unread if this DM thread is not currently open
        const senderEmail = (
          message.email ||
          message.senderEmail ||
          ""
        ).toLowerCase();
        const isFromMe = senderEmail === me.email.toLowerCase();
        if (!isFromMe && selectedObserverEmail !== senderEmail) {
          setUnreadDmCounts((prev) => ({
            ...prev,
            [senderEmail]: (prev[senderEmail] || 0) + 1,
          }));
        }
      }
    };

    socket.on("chat:new", onNewMessage);
    return () => {
      socket.off("chat:new", onNewMessage);
    };
  }, [socket, isGroupChat, selectedObserverEmail, me.email]);

  // Reset unread counts when opening chats
  useEffect(() => {
    if (isGroupChat) {
      setUnreadGroupCount(0);
    }
  }, [isGroupChat]);

  useEffect(() => {
    if (selectedObserverEmail) {
      setUnreadDmCounts((prev) => ({
        ...prev,
        [selectedObserverEmail.toLowerCase()]: 0,
      }));
    }
  }, [selectedObserverEmail]);

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
            {/* <div className="text-center hidden lg:block">
          <h1 className="text-lg lg:text-xl font-semibold tracking-wide">
            MEETING 01 - PROJECT NAME
          </h1>
        </div> */}
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
                <PanelRightOpen className="h-4 w-4 mr-2" /> Open Chat
              </Button>
            </div>
          )}
          <div className=" rounded-xl bg-white p-4 lg:p-6">
            <div className="h-[60vh] lg:h-[70vh] flex items-center justify-center">
              <p className="text-center text-slate-700">
                Please wait, the meeting host will let you in soon.
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
                  <PanelRightClose className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-2">
                {/* New tabs: Observer List & Observer Chat */}
                <div className="my-2 bg-custom-gray-2 rounded-lg p-1 max-h-[85vh] min-h-[40vh] overflow-hidden flex flex-col">
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
                        onClick={() => setActiveTab("chat")}
                      >
                        Observer Chat
                      </button>
                    </div>

                    <div data-observer-panel className="p-2 flex-1 min-h-0">
                      <div
                        data-tabcontent="list"
                        style={{
                          display: activeTab === "list" ? "block" : "none",
                        }}
                        className="h-[80vh] overflow-y-auto bg-white rounded p-2"
                      >
                        <div className="space-y-2">
                          {observerList.filter(
                            (o) => (o.email || "") !== meEmail
                          ).length === 0 ? (
                            <div className="text-sm text-gray-500">
                              No observers yet.
                            </div>
                          ) : (
                            observerList
                              .filter((o) => (o.email || "") !== meEmail)
                              .map((o) => {
                                const label = o.name || o.email || "Observer";
                                return (
                                  <div
                                    key={`${label}-${o.email}`}
                                    className="flex items-center justify-start gap-2 rounded px-2 py-1"
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
                      </div>
                      <div
                        data-tabcontent="chat"
                        style={{
                          display: activeTab === "chat" ? "block" : "none",
                        }}
                        className="h-[70vh] overflow-hidden bg-white rounded p-2"
                      >
                        {isGroupChat ? (
                          <div className="flex flex-col h-full">
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-sm font-semibold truncate">
                                Observer Group Chat
                              </div>
                              <Button
                                variant="outline"
                                size="icon"
                                aria-label="Back"
                                onClick={() => {
                                  setIsGroupChat(false);
                                }}
                              >
                                <ArrowLeft className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex-1 min-h-0 overflow-y-auto rounded border p-2">
                              <div className="space-y-1 text-sm">
                                {(
                                  messagesByScope["observer_wait_group"] || []
                                ).map((m, i) => (
                                  <div
                                    key={i}
                                    className="flex items-start gap-2"
                                  >
                                    <div className="shrink-0 mt-[2px] h-2 w-2 rounded-full bg-custom-dark-blue-1" />
                                    <div className="min-w-0">
                                      <div className="text-[12px] text-gray-600">
                                        <span className="font-medium text-gray-900">
                                          {m.senderName ||
                                            m.name ||
                                            m.email ||
                                            m.senderEmail ||
                                            ""}
                                        </span>
                                        <span className="ml-2 text-[11px] text-gray-400">
                                          {new Date(
                                            String(m.timestamp)
                                          ).toLocaleTimeString()}
                                        </span>
                                      </div>
                                      <div className="whitespace-pre-wrap text-sm">
                                        {m.content}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <input
                                className="flex-1 h-9 rounded border px-3 text-sm"
                                value={groupText}
                                onChange={(e) => setGroupText(e.target.value)}
                                placeholder="Write a group message"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    const txt = groupText.trim();
                                    if (!txt) return;
                                    send("observer_wait_group", txt).then(
                                      (ack) => {
                                        if (ack.ok) setGroupText("");
                                      }
                                    );
                                  }
                                }}
                              />
                              <Button
                                size="icon"
                                aria-label="Send message"
                                onClick={() => {
                                  const txt = groupText.trim();
                                  if (!txt) return;
                                  send("observer_wait_group", txt).then(
                                    (ack) => {
                                      if (ack.ok) setGroupText("");
                                    }
                                  );
                                }}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ) : selectedObserverEmail ? (
                          <div className="flex flex-col h-full">
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-sm font-semibold truncate">
                                Chat with {selectedObserverName}
                              </div>
                              <Button
                                variant="outline"
                                size="icon"
                                aria-label="Back"
                                onClick={() => {
                                  setSelectedObserverEmail("");
                                  setSelectedObserverName("");
                                }}
                              >
                                <ArrowLeft className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex-1 min-h-0 overflow-y-auto rounded border p-2">
                              <div className="space-y-1 text-sm">
                                {(
                                  messagesByThread[
                                    makeThreadKey(
                                      "observer_wait_dm",
                                      me.email,
                                      selectedObserverEmail
                                    )
                                  ] || []
                                ).map((m, i) => (
                                  <div
                                    key={i}
                                    className="flex items-start gap-2"
                                  >
                                    <div className="shrink-0 mt-[2px] h-2 w-2 rounded-full bg-custom-dark-blue-1" />
                                    <div className="min-w-0">
                                      <div className="text-[12px] text-gray-600">
                                        <span className="font-medium text-gray-900">
                                          {m.senderName ||
                                            m.name ||
                                            m.email ||
                                            m.senderEmail ||
                                            ""}
                                        </span>
                                        <span className="ml-2 text-[11px] text-gray-400">
                                          {new Date(
                                            String(m.timestamp)
                                          ).toLocaleTimeString()}
                                        </span>
                                      </div>
                                      <div className="whitespace-pre-wrap text-sm">
                                        {m.content}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <input
                                className="flex-1 h-9 rounded border px-3 text-sm"
                                value={dmText}
                                onChange={(e) => setDmText(e.target.value)}
                                placeholder="Write a private message"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    const t = selectedObserverEmail
                                      .trim()
                                      .toLowerCase();
                                    const txt = dmText.trim();
                                    if (!t || !txt) return;
                                    send("observer_wait_dm", txt, t).then(
                                      (ack) => {
                                        if (ack.ok) setDmText("");
                                      }
                                    );
                                  }
                                }}
                              />
                              <Button
                                size="icon"
                                aria-label="Send message"
                                onClick={() => {
                                  const t = selectedObserverEmail
                                    .trim()
                                    .toLowerCase();
                                  const txt = dmText.trim();
                                  if (!t || !txt) return;
                                  send("observer_wait_dm", txt, t).then(
                                    (ack) => {
                                      if (ack.ok) setDmText("");
                                    }
                                  );
                                }}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full overflow-y-auto rounded p-1">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-2 rounded px-2 py-1 border-b mb-1">
                                <div className="min-w-0">
                                  <div className="text-sm font-medium truncate">
                                    Group Chat
                                  </div>
                                </div>
                                <div className="relative">
                                  <button
                                    type="button"
                                    className="h-7 w-7 inline-flex items-center justify-center rounded-md cursor-pointer"
                                    aria-label={`Open group chat`}
                                    title={`Open group chat`}
                                    onClick={() => {
                                      setIsGroupChat(true);
                                      getHistory("observer_wait_group");
                                    }}
                                  >
                                    <MessageSquare className="h-4 w-4" />
                                  </button>
                                  {unreadGroupCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                      {unreadGroupCount > 99
                                        ? "99+"
                                        : unreadGroupCount}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {observerList
                                .filter((o) => (o.email || "") !== meEmail)
                                .map((o) => {
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
                                      <div className="relative">
                                        <button
                                          type="button"
                                          className="h-7 w-7 inline-flex items-center justify-center rounded-md cursor-pointer"
                                          aria-label={`Chat with ${label}`}
                                          title={`Chat with ${label}`}
                                          onClick={() => {
                                            setSelectedObserverEmail(o.email);
                                            setSelectedObserverName(label);
                                            getHistory("observer_wait_dm", {
                                              withEmail: (
                                                o.email || ""
                                              ).toLowerCase(),
                                            });
                                          }}
                                        >
                                          <MessageSquare className="h-4 w-4" />
                                        </button>
                                        {unreadDmCounts[
                                          (o.email || "").toLowerCase()
                                        ] > 0 && (
                                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                            {unreadDmCounts[
                                              (o.email || "").toLowerCase()
                                            ] > 99
                                              ? "99+"
                                              : unreadDmCounts[
                                                  (o.email || "").toLowerCase()
                                                ]}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        )}
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
          <div className="p-2">
            <div className="my-2 bg-custom-gray-2 rounded-lg p-1 max-h-[70vh] min-h-[40vh] overflow-hidden flex flex-col">
              <div className="flex-1 flex min-h-0 flex-col">
                <div className="sticky top-0 z-10 bg-custom-gray-2 w-full gap-2 flex items-center p-2">
                  <div className="text-sm font-semibold">Observers</div>
                </div>
                {isGroupChat ? (
                  <div className="p-2 flex-1 min-h-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-semibold truncate">
                        Observer Group Chat
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Back"
                        onClick={() => {
                          setIsGroupChat(false);
                        }}
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="h-[52vh] overflow-y-auto bg-white rounded p-2">
                      <div className="space-y-1 text-sm">
                        {(messagesByScope["observer_wait_group"] || []).map(
                          (m, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <div className="shrink-0 mt-[2px] h-2 w-2 rounded-full bg-custom-dark-blue-1" />
                              <div className="min-w-0">
                                <div className="text-[12px] text-gray-600">
                                  <span className="font-medium text-gray-900">
                                    {m.senderName ||
                                      m.name ||
                                      m.email ||
                                      m.senderEmail ||
                                      ""}
                                  </span>
                                  <span className="ml-2 text-[11px] text-gray-400">
                                    {new Date(
                                      String(m.timestamp)
                                    ).toLocaleTimeString()}
                                  </span>
                                </div>
                                <div className="whitespace-pre-wrap text-sm">
                                  {m.content}
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        className="flex-1 h-9 rounded border px-3 text-sm"
                        value={groupText}
                        onChange={(e) => setGroupText(e.target.value)}
                        placeholder="Write a group message"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            const txt = groupText.trim();
                            if (!txt) return;
                            send("observer_wait_group", txt).then((ack) => {
                              if (ack.ok) setGroupText("");
                            });
                          }
                        }}
                      />
                      <Button
                        size="icon"
                        aria-label="Send message"
                        onClick={() => {
                          const txt = groupText.trim();
                          if (!txt) return;
                          send("observer_wait_group", txt).then((ack) => {
                            if (ack.ok) setGroupText("");
                          });
                        }}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : !selectedObserverEmail ? (
                  <div className="p-2 flex-1 min-h-0">
                    <div className="h-[56vh] overflow-y-auto bg-white rounded p-2">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2 rounded px-2 py-1 border-b mb-1">
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">
                              Group Chat
                            </div>
                          </div>
                          <div className="relative">
                            <button
                              type="button"
                              className="h-7 w-7 inline-flex items-center justify-center rounded-md cursor-pointer"
                              aria-label={`Open group chat`}
                              title={`Open group chat`}
                              onClick={() => {
                                setIsGroupChat(true);
                                getHistory("observer_wait_group");
                              }}
                            >
                              <MessageSquare className="h-4 w-4" />
                            </button>
                            {unreadGroupCount > 0 && (
                              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                {unreadGroupCount > 99
                                  ? "99+"
                                  : unreadGroupCount}
                              </span>
                            )}
                          </div>
                        </div>
                        {observerList.filter((o) => (o.email || "") !== meEmail)
                          .length === 0 ? (
                          <div className="text-sm text-gray-500">
                            No observers yet.
                          </div>
                        ) : (
                          observerList
                            .filter((o) => (o.email || "") !== meEmail)
                            .map((o) => {
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
                                  <div className="relative">
                                    <button
                                      type="button"
                                      className="h-7 w-7 inline-flex items-center justify-center rounded-md cursor-pointer"
                                      aria-label={`Chat with ${label}`}
                                      title={`Chat with ${label}`}
                                      onClick={() => {
                                        setSelectedObserverEmail(o.email);
                                        setSelectedObserverName(label);
                                        getHistory("observer_wait_dm", {
                                          withEmail: (
                                            o.email || ""
                                          ).toLowerCase(),
                                        });
                                      }}
                                    >
                                      <MessageSquare className="h-4 w-4" />
                                    </button>
                                    {unreadDmCounts[
                                      (o.email || "").toLowerCase()
                                    ] > 0 && (
                                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                        {unreadDmCounts[
                                          (o.email || "").toLowerCase()
                                        ] > 99
                                          ? "99+"
                                          : unreadDmCounts[
                                              (o.email || "").toLowerCase()
                                            ]}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-2 flex-1 min-h-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-semibold truncate">
                        Chat with {selectedObserverName}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Back"
                        onClick={() => {
                          setSelectedObserverEmail("");
                          setSelectedObserverName("");
                        }}
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="h-[52vh] overflow-y-auto bg-white rounded p-2">
                      <div className="space-y-1 text-sm">
                        {(
                          messagesByThread[
                            makeThreadKey(
                              "observer_wait_dm",
                              me.email,
                              selectedObserverEmail
                            )
                          ] || []
                        ).map((m, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <div className="shrink-0 mt-[2px] h-2 w-2 rounded-full bg-custom-dark-blue-1" />
                            <div className="min-w-0">
                              <div className="text-[12px] text-gray-600">
                                <span className="font-medium text-gray-900">
                                  {m.senderName ||
                                    m.name ||
                                    m.email ||
                                    m.senderEmail ||
                                    ""}
                                </span>
                                <span className="ml-2 text-[11px] text-gray-400">
                                  {new Date(
                                    String(m.timestamp)
                                  ).toLocaleTimeString()}
                                </span>
                              </div>
                              <div className="whitespace-pre-wrap text-sm">
                                {m.content}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        className="flex-1 h-9 rounded border px-3 text-sm"
                        value={dmText}
                        onChange={(e) => setDmText(e.target.value)}
                        placeholder="Write a private message"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            const t = selectedObserverEmail
                              .trim()
                              .toLowerCase();
                            const txt = dmText.trim();
                            if (!t || !txt) return;
                            send("observer_wait_dm", txt, t).then((ack) => {
                              if (ack.ok) setDmText("");
                            });
                          }
                        }}
                      />
                      <Button
                        size="icon"
                        aria-label="Send message"
                        onClick={() => {
                          const t = selectedObserverEmail.trim().toLowerCase();
                          const txt = dmText.trim();
                          if (!t || !txt) return;
                          send("observer_wait_dm", txt, t).then((ack) => {
                            if (ack.ok) setDmText("");
                          });
                        }}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
