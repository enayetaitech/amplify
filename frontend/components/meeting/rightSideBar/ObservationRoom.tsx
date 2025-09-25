import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "components/ui/tabs";
import { Badge } from "components/ui/badge";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { MessageSquare, Send, X } from "lucide-react";

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

  // Group chat state
  type GroupMessage = {
    senderEmail?: string;
    name?: string;
    senderName?: string;
    content: string;
    timestamp?: string;
  };
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [groupText, setGroupText] = useState<string>("");
  const [groupLoading, setGroupLoading] = useState<boolean>(false);

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
      if (data.scope === "observer_wait_group") {
        // Group chat message
        const groupMessage = data.message as GroupMessage;
        setGroupMessages((prev) => [...prev, groupMessage]);
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
  }, [selectedObserver]);

  // Effect: load current user identity from localStorage
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem("liveSessionUser")
        ? JSON.parse(String(window.localStorage.getItem("liveSessionUser")))
        : {};
      console.log("Loaded user data from localStorage:", saved);
      setMeEmail(saved?.email || "");
      setMeRole(saved?.role || "");

      // Also check if role is in a different localStorage key
      const roleFromStorage = window.localStorage.getItem("userRole");
      if (roleFromStorage) {
        console.log(
          "Found role in separate localStorage key:",
          roleFromStorage
        );
        setMeRole(roleFromStorage);
      }

      // Check if we can determine role from socket query params
      const socketQuery = (
        window as Window & {
          __meetingSocket?: { io?: { opts?: { query?: { role?: string } } } };
        }
      ).__meetingSocket?.io?.opts?.query;
      if (socketQuery?.role) {
        console.log("Found role in socket query:", socketQuery.role);
        setMeRole(socketQuery.role);
      }

      // Fallback: if no role found and we're in ObservationRoom, assume Moderator
      if (!saved?.role && !roleFromStorage && !socketQuery?.role) {
        console.log("No role found, assuming Moderator for ObservationRoom");
        setMeRole("Moderator");
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

    const w = window as Window & { __meetingSocket?: unknown };
    const maybe = w.__meetingSocket as unknown;
    const s =
      maybe &&
      typeof (maybe as { on?: unknown }).on === "function" &&
      typeof (maybe as { emit?: unknown }).emit === "function"
        ? (maybe as MinimalSocket)
        : undefined;
    if (!s) return;

    const loadChatHistory = async () => {
      try {
        // Load messages from both scopes to see the complete conversation
        const scopes = ["observer_wait_dm", "stream_dm_obs_mod"];
        let allMessages: ChatMessage[] = [];
        let loadedScopes = 0;

        scopes.forEach((scope) => {
          s.emit(
            "chat:history:get",
            {
              scope: scope,
              thread: { withEmail: selectedObserver.email },
              limit: 50,
            },
            (response?: unknown) => {
              const data = response as ChatHistoryResponse;
              if (data?.items) {
                allMessages = [...allMessages, ...data.items];
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
  }, [selectedObserver, meRole]);

  // Effect: load group chat history when group chat is opened
  React.useEffect(() => {
    if (!showGroupChat) {
      setGroupMessages([]);
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
    if (!s) return;

    const loadGroupChatHistory = async () => {
      try {
        setGroupLoading(true);
        s.emit(
          "chat:history:get",
          {
            scope: "observer_wait_group",
            limit: 50,
          },
          (response?: unknown) => {
            const data = response as { items: GroupMessage[] };
            if (data?.items) {
              setGroupMessages(data.items);
            }
            setGroupLoading(false);
          }
        );
      } catch (error) {
        console.error("Failed to load group chat history:", error);
        setGroupLoading(false);
      }
    };

    loadGroupChatHistory();
  }, [showGroupChat]);

  // Function to send a message
  const sendMessage = async () => {
    console.log("sendMessage called", {
      selectedObserver,
      messageInput,
      meRole,
    });

    if (!selectedObserver || !messageInput.trim()) {
      console.log("Early return: no observer or empty message");
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

    console.log("Socket check:", { socketExists: !!s, maybe });

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

      console.log("Sending message with scope:", scope, {
        content: messageInput.trim(),
        toEmail: selectedObserver.email,
      });

      s.emit(
        "chat:send",
        {
          scope: scope,
          content: messageInput.trim(),
          toEmail: selectedObserver.email,
        },
        (response?: unknown) => {
          console.log("Message send response:", response);
          const data = response as SocketResponse;
          if (data?.ok) {
            setMessageInput("");
            console.log("Message sent successfully");
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
    console.log("=== sendGroupMessage called ===");
    console.log("groupText:", groupText);
    console.log("groupText.trim():", groupText.trim());

    if (!groupText.trim()) {
      console.log("Early return: empty groupText");
      return;
    }

    const w = window as Window & { __meetingSocket?: unknown };
    const maybe = w.__meetingSocket as unknown;
    console.log("Socket check - maybe:", maybe);
    console.log(
      "Socket check - typeof on:",
      typeof (maybe as { on?: unknown }).on
    );
    console.log(
      "Socket check - typeof emit:",
      typeof (maybe as { emit?: unknown }).emit
    );

    const s =
      maybe &&
      typeof (maybe as { on?: unknown }).on === "function" &&
      typeof (maybe as { emit?: unknown }).emit === "function"
        ? (maybe as MinimalSocket)
        : undefined;

    console.log("Socket s:", s);
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

      console.log("=== User info from localStorage ===");
      console.log("saved:", saved);
      console.log("saved?.email:", saved?.email);
      console.log("saved?.name:", saved?.name);
      console.log("meRole:", meRole);

      const payload = {
        scope: "observer_wait_group",
        content: groupText.trim(),
        email: saved?.email || "",
        name: saved?.name || "",
      };

      console.log("=== Sending group message payload ===");
      console.log("payload:", payload);

      s.emit("chat:send", payload, (response?: unknown) => {
        console.log("=== Group message send response ===");
        console.log("response:", response);
        const data = response as SocketResponse;
        if (data?.ok) {
          setGroupText("");
          console.log("✅ Group message sent successfully");
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
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold pl-2">Observation Room</h3>
        {/* Debug role display */}
        <div className="text-xs text-gray-500">
          Role: {meRole || "Unknown"} | Email: {meEmail || "Unknown"}
        </div>
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
            {
              observers.filter(
                (o) => (o.name || "").toLowerCase() !== "observer"
              ).length
            }
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
            Observer Chat
            <Badge
              variant="destructive"
              className="ml-2 h-5 w-5 p-0 text-[10px] inline-flex items-center justify-center"
            >
              0
            </Badge>
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
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium truncate">
                        Group Chat
                      </span>
                    </div>
                    <div className="relative inline-flex items-center justify-center h-6 w-6">
                      <MessageSquare className="h-4 w-4 text-gray-400" />
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
                            }}
                          >
                            <div className="flex items-center gap-2 min-w-0 ">
                              <span className="text-sm font-medium truncate">
                                {label}
                              </span>
                            </div>
                            <div className="relative inline-flex items-center justify-center h-6 w-6">
                              <MessageSquare className="h-4 w-4 text-gray-400" />
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
                <div className="flex items-center justify-between p-0.5 border-b">
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
                <div className="flex-1 overflow-y-auto p-0.5">
                  {groupLoading ? (
                    <div className="text-sm text-gray-500">Loading...</div>
                  ) : (
                    <div className="space-y-2 text-sm">
                      {groupMessages.length === 0 ? (
                        <div className="text-gray-500">No messages yet.</div>
                      ) : (
                        groupMessages.map((message, idx) => {
                          console.log("Group message data:", message);
                          const isFromMe =
                            message.senderEmail?.toLowerCase() ===
                            meEmail.toLowerCase();
                          const senderName =
                            message.name ||
                            message.senderEmail ||
                            message.senderName ||
                            "Unknown";
                          console.log("Sender name resolved:", senderName);
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
                      if (e.key === "Enter") {
                        console.log("⌨️ Enter key pressed in group chat input");
                        sendGroupMessage();
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      console.log("🔘 Group chat send button clicked");
                      sendGroupMessage();
                    }}
                    disabled={!groupText.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {selectedObserver && (
              <div className="col-span-12 rounded bg-white flex flex-col min-h-0 overflow-y-auto">
                <div className="flex items-center justify-between p-0.5 border-b">
                  <div className="flex items-center gap-2">
                    <span className="text-sm ">
                      {meRole === "Moderator" || meRole === "Admin"
                        ? `Message Observer: ${
                            selectedObserver.name || selectedObserver.email
                          }`
                        : `Chat with ${
                            selectedObserver.name || selectedObserver.email
                          }`}
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
                <div className="flex-1 overflow-y-auto p-0.5">
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
                              <div className="text-xs opacity-70 mb-1">
                                {message.senderName || message.email}
                              </div>
                              <div>{message.content}</div>
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
                    placeholder={
                      meRole === "Moderator" || meRole === "Admin"
                        ? "Send message to observer..."
                        : "Type a message..."
                    }
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        console.log("Enter key pressed");
                        sendMessage();
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      console.log("Send button clicked");
                      sendMessage();
                    }}
                    disabled={!messageInput.trim()}
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
  );
};

export default ObservationRoom;
