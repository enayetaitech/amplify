"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { SOCKET_URL } from "constant/socket";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "components/ui/tabs";
import { MessageSquare } from "lucide-react";
import useChat from "hooks/useChat";
import { formatParticipantName } from "utils/formatParticipantName";
import ChatWindow, {
  ChatWindowMessage,
} from "components/meeting/chat/ChatWindow";

type WaitingUser = {
  firstName?: string;
  lastName?: string;
  name: string;
  email: string;
  joinedAt: string;
  role: "Participant" | "Moderator" | "Admin";
};
type WaitingListPayload = { participantsWaitingRoom: WaitingUser[] };

export default function ModeratorWaitingPanel() {
  const { sessionId: sid, id } = useParams() as {
    sessionId?: string;
    id?: string;
  };
  const sessionId = sid ?? id;
  const [waiting, setWaiting] = useState<WaitingUser[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const joinedRef = useRef(false);
  const [, setActiveTab] = useState<"list" | "chat">("list");
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [chatText, setChatText] = useState("");
  const chatListRef = useRef<HTMLDivElement | null>(null);
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});

  // Calculate total unread count for the tab badge
  const totalUnreadCount = Object.values(unreadMap).reduce(
    (sum, count) => sum + count,
    0
  );
  const prevLenRef = useRef<number>(0);
  // Toasts handled globally in meeting page; keep only local list state here

  // For demo: “me” as Moderator (in prod, JWT-protected page)
  const me = useMemo(
    () => ({ role: "Moderator", name: "Moderator", email: "mod@example.com" }),
    []
  );

  useEffect(() => {
    if (!sessionId) return;
    const s = io(SOCKET_URL, {
      path: "/socket.io",
      withCredentials: true,
      query: {
        sessionId: sessionId as string,
        role: me.role,
        name: me.name,
        email: me.email,
      },
    });
    socketRef.current = s;

    s.on("connect", () => {
      if (joinedRef.current) return;
      joinedRef.current = true;
      s.emit("join-room", {}, (rooms: WaitingListPayload) => {
        const initial = rooms.participantsWaitingRoom || [];
        setWaiting(initial);
      });
    });

    s.on(
      "waiting:list",
      (payload: { participantsWaitingRoom: WaitingUser[] }) => {
        setWaiting(payload.participantsWaitingRoom || []);
      }
    );

    return () => {
      s.disconnect();
    };
  }, [me.email, me.name, me.role, sessionId]);

  const admit = (email: string, label?: string) => {
    toast.success(`Admitted ${label || email}`);
    socketRef.current?.emit("waiting:admit", { email });
  };
  const remove = (email: string, label?: string) => {
    toast.success(`Removed ${label || email} from waiting room`);
    socketRef.current?.emit("waiting:remove", { email });
  };
  const admitAll = () => {
    toast.success("Admitted all participants");
    socketRef.current?.emit("waiting:admitAll");
  };

  const { send, getHistory, messagesByScope } = useChat({
    socket: socketRef.current,
    sessionId: String(sessionId || ""),
    my: { email: me.email, name: me.name, role: "Moderator" },
  });

  useEffect(() => {
    if (!selectedEmail) return;
    getHistory("waiting_dm", { withEmail: selectedEmail.toLowerCase() });
    // reset unread for this thread when opened
    setUnreadMap((prev) => ({ ...prev, [selectedEmail.toLowerCase()]: 0 }));
  }, [selectedEmail, getHistory]);

  useEffect(() => {
    if (chatListRef.current)
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messagesByScope["waiting_dm"]?.length, selectedEmail]);

  const onSendChat = async () => {
    if (!selectedEmail) return;
    const t = chatText.trim();
    if (!t) return;
    const ack = await send("waiting_dm", t, selectedEmail.toLowerCase());
    if (ack.ok) setChatText("");
  };

  // Track unread per participant and auto-select latest active thread if none selected
  useEffect(() => {
    const arr = messagesByScope["waiting_dm"] || [];
    const prevLen = prevLenRef.current || 0;
    if (arr.length > prevLen) {
      const newItems = arr.slice(prevLen);
      for (const m of newItems) {
        const sender = (m.email || m.senderEmail || "").toLowerCase();
        const to = (m.toEmail || "").toLowerCase();
        const peer = to === "__moderators__" || !to ? sender : to;
        if (!selectedEmail || selectedEmail.toLowerCase() !== peer) {
          setUnreadMap((prev) => ({ ...prev, [peer]: (prev[peer] || 0) + 1 }));
        }
      }
      prevLenRef.current = arr.length;
    } else if (arr.length < prevLen) {
      prevLenRef.current = arr.length;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messagesByScope["waiting_dm"]?.length]);

  function openChat(emailLower: string) {
    setSelectedEmail(emailLower);
    setUnreadMap((prev) => ({ ...prev, [emailLower]: 0 }));
  }

  // Hide panel entirely if empty
  if (waiting.length === 0) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-2 bg-custom-gray-2 rounded-lg p-2 max-h-[30vh] overflow-y-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-semibold">Waiting ({waiting.length})</h1>
        <button
          className="bg-custom-orange-1 text-sm text-white rounded-lg px-3 py-1 cursor-pointer"
          onClick={admitAll}
        >
          Admit all
        </button>
      </div>

      <Tabs
        defaultValue="list"
        onValueChange={(v) => {
          setActiveTab(v as "list" | "chat");
          if (v === "chat") {
            setSelectedEmail(null);
          }
        }}
      >
        <TabsList className="sticky top-0 z-10 bg-custom-gray-2 w-full gap-2">
          <TabsTrigger
            value="list"
            className="rounded-full h-6 px-4 border shadow-sm data-[state=active]:bg-custom-dark-blue-1 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent data-[state=inactive]:border-custom-dark-blue-1 data-[state=inactive]:text-custom-dark-blue-1 cursor-pointer"
          >
            Waiting List
          </TabsTrigger>
          <TabsTrigger
            value="chat"
            className="rounded-full h-6 px-4 border shadow-sm data-[state=active]:bg-custom-dark-blue-1 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent data-[state=inactive]:border-custom-dark-blue-1 data-[state=inactive]:text-custom-dark-blue-1 cursor-pointer relative"
            onClick={() => {
              // Ensure any open DM thread is closed when clicking the tab
              setSelectedEmail(null);
              setChatText("");
            }}
          >
            Waiting Chat
            {totalUnreadCount > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center text-[10px] min-w-[16px] h-4 px-1 rounded-full bg-custom-orange-1 text-white">
                {totalUnreadCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="min-h-0 overflow-y-auto">
          <div className="rounded-xl divide-y max-h-[22vh] overflow-y-auto">
            {waiting.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">
                No one is waiting.
              </div>
            ) : (
              waiting.map((u) => (
                <div
                  key={u.email}
                  className="p-3 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">
                      {(() => {
                        // Use firstName/lastName if available and not empty
                        const firstName = (u.firstName || "").trim();
                        const lastName = (u.lastName || "").trim();
                        if (firstName && lastName) {
                          return (
                            formatParticipantName(firstName, lastName) ||
                            u.email
                          );
                        }
                        // Fallback: parse name if firstName/lastName not available (for old data)
                        if (u.name) {
                          const parts = u.name
                            .trim()
                            .split(/\s+/)
                            .filter(Boolean);
                          if (parts.length >= 2) {
                            const first = parts[0];
                            const last = parts.slice(1).join(" ");
                            return (
                              formatParticipantName(first, last) || u.email
                            );
                          }
                          return parts[0] || u.email;
                        }
                        return u.email;
                      })()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="bg-custom-orange-1 text-sm text-white rounded-lg px-3 py-1 cursor-pointer"
                      onClick={() => admit(u.email, u.name || u.email)}
                    >
                      Admit
                    </button>
                    <button
                      className="bg-custom-dark-blue-1 text-sm text-white rounded-lg px-3 py-1 cursor-pointer"
                      onClick={() => remove(u.email, u.name || u.email)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="chat" className="min-h-0">
          <div className="h-[24vh]">
            {!selectedEmail && (
              <div className="rounded bg-white overflow-y-auto h-full">
                {waiting.length === 0 ? (
                  <div className="p-3 text-sm text-gray-500">
                    No one is waiting.
                  </div>
                ) : (
                  waiting.map((u) => {
                    // Use firstName/lastName if available and not empty
                    const firstName = (u.firstName || "").trim();
                    const lastName = (u.lastName || "").trim();
                    const label = (() => {
                      if (firstName && lastName) {
                        return (
                          formatParticipantName(firstName, lastName) || u.email
                        );
                      }
                      // Fallback: parse name if firstName/lastName not available (for old data)
                      if (u.name) {
                        const parts = u.name
                          .trim()
                          .split(/\s+/)
                          .filter(Boolean);
                        if (parts.length >= 2) {
                          const first = parts[0];
                          const last = parts.slice(1).join(" ");
                          return formatParticipantName(first, last) || u.email;
                        }
                        return parts[0] || u.email;
                      }
                      return u.email;
                    })();
                    const isActive =
                      selectedEmail &&
                      selectedEmail.toLowerCase() === u.email.toLowerCase();
                    return (
                      <div
                        key={u.email}
                        className={`px-3 py-2 flex items-center justify-between gap-2 border-b ${
                          isActive ? "bg-custom-gray-2" : ""
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">
                            {label}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="h-7 w-7 inline-flex items-center justify-center rounded-md cursor-pointer"
                          aria-label={`Open chat with ${label}`}
                          onClick={() => openChat(u.email.toLowerCase())}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </button>
                        {unreadMap[u.email.toLowerCase()] ? (
                          <span className="ml-1 inline-flex items-center justify-center text-[10px] min-w-[16px] h-4 px-1 rounded-full bg-custom-orange-1 text-white">
                            {unreadMap[u.email.toLowerCase()]}
                          </span>
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>
            )}
            {selectedEmail && (
              <div className="rounded bg-white flex flex-col h-full ">
                {(() => {
                  const filtered = (messagesByScope["waiting_dm"] || []).filter(
                    (m) =>
                      selectedEmail
                        ? (m.toEmail || "") === selectedEmail ||
                          (m.email || "").toLowerCase() === selectedEmail
                        : true
                  );
                  const mapped: ChatWindowMessage[] = filtered.map((m, i) => {
                    // Use firstName/lastName from message if available, otherwise try to find sender in waiting list
                    let formattedSenderName = "";
                    const messageWithNames = m as {
                      firstName?: string;
                      lastName?: string;
                      email?: string;
                      senderEmail?: string;
                      senderName?: string;
                      name?: string;
                    };
                    if (
                      messageWithNames.firstName &&
                      messageWithNames.lastName
                    ) {
                      // Message has firstName/lastName from backend
                      formattedSenderName = formatParticipantName(
                        messageWithNames.firstName,
                        messageWithNames.lastName
                      );
                    } else {
                      // Fallback: Try to find the sender in waiting list
                      const sender = waiting.find(
                        (w) =>
                          (w.email || "").toLowerCase() ===
                          (
                            messageWithNames.email ||
                            messageWithNames.senderEmail ||
                            ""
                          ).toLowerCase()
                      );
                      if (sender) {
                        // Use firstName/lastName from waiting list if available and not empty
                        const senderFirstName = (sender.firstName || "").trim();
                        const senderLastName = (sender.lastName || "").trim();
                        if (senderFirstName && senderLastName) {
                          formattedSenderName = formatParticipantName(
                            senderFirstName,
                            senderLastName
                          );
                        } else if (sender.name) {
                          // Parse name if firstName/lastName not available
                          const parts = sender.name
                            .trim()
                            .split(/\s+/)
                            .filter(Boolean);
                          if (parts.length >= 2) {
                            const first = parts[0];
                            const last = parts.slice(1).join(" ");
                            formattedSenderName = formatParticipantName(
                              first,
                              last
                            );
                          } else {
                            formattedSenderName = parts[0] || "";
                          }
                        }
                      }
                      // Final fallback: parse senderName/name from message
                      if (!formattedSenderName) {
                        const nameToParse =
                          messageWithNames.senderName ||
                          messageWithNames.name ||
                          "";
                        if (nameToParse) {
                          const parts = nameToParse
                            .trim()
                            .split(/\s+/)
                            .filter(Boolean);
                          if (parts.length >= 2) {
                            const first = parts[0];
                            const last = parts.slice(1).join(" ");
                            formattedSenderName = formatParticipantName(
                              first,
                              last
                            );
                          } else {
                            formattedSenderName = parts[0] || "";
                          }
                        }
                      }
                    }

                    return {
                      id: i,
                      senderEmail: (m.email || m.senderEmail) as
                        | string
                        | undefined,
                      senderName: formattedSenderName || undefined,
                      content: m.content,
                      timestamp: m.timestamp || new Date(),
                    };
                  });
                  const send = () => onSendChat();
                  const user = waiting.find(
                    (w) =>
                      w.email.toLowerCase() ===
                      (selectedEmail || "").toLowerCase()
                  );
                  const titleName = user
                    ? (() => {
                        // Use firstName/lastName if available and not empty
                        const firstName = (user.firstName || "").trim();
                        const lastName = (user.lastName || "").trim();
                        if (firstName && lastName) {
                          return (
                            formatParticipantName(firstName, lastName) ||
                            selectedEmail
                          );
                        }
                        // Fallback: parse name if firstName/lastName not available (for old data)
                        if (user.name) {
                          const parts = user.name
                            .trim()
                            .split(/\s+/)
                            .filter(Boolean);
                          if (parts.length >= 2) {
                            const first = parts[0];
                            const last = parts.slice(1).join(" ");
                            return (
                              formatParticipantName(first, last) ||
                              selectedEmail
                            );
                          }
                          return parts[0] || selectedEmail;
                        }
                        return selectedEmail;
                      })()
                    : selectedEmail;

                  return (
                    <ChatWindow
                      title={`Message ${titleName}`}
                      meEmail={me.email}
                      messages={mapped}
                      value={chatText}
                      onChange={setChatText}
                      onSend={send}
                      onClose={() => setSelectedEmail(null)}
                      height="24vh"
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
}
