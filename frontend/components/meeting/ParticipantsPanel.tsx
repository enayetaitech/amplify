"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParticipants } from "@livekit/components-react";
import { Button } from "components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "components/ui/tabs";
import {
  MicOff,
  CameraOff,
  ScreenShare,
  ScreenShareOff,
  Mic,
  Camera,
  MessageSquare,
  Send,
  X,
} from "lucide-react";
import { Track } from "livekit-client";
import type { Socket } from "socket.io-client";
import type { UiRole } from "constant/roles";
import useChat from "hooks/useChat";
import { Input } from "components/ui/input";
import { Badge } from "components/ui/badge";
import { toast } from "sonner";
import { formatDisplayName } from "lib/utils";

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

function emailFromIdentity(identity?: string): string | null {
  if (!identity) return null;
  const hit = identity.match(EMAIL_RE);
  return hit ? hit[0].toLowerCase() : null;
}

function emailFromParticipant(p: {
  identity?: string;
  metadata?: string | null;
  name?: string | null;
}) {
  // 1) Try identity direct pattern
  const fromId = emailFromIdentity(p.identity);
  if (fromId) return fromId;

  // Helper to search any string values within a JSON object
  const findEmailInObject = (o: unknown): string | null => {
    if (!o) return null;
    if (typeof o === "string") {
      const hit = o.match(EMAIL_RE);
      return hit ? hit[0].toLowerCase() : null;
    }
    if (typeof o === "object") {
      for (const v of Object.values(o as Record<string, unknown>)) {
        const found = findEmailInObject(v);
        if (found) return found;
      }
    }
    return null;
  };

  // 2) Try metadata JSON (common case)
  const mdRaw = p?.metadata || null;
  if (mdRaw) {
    try {
      const meta = JSON.parse(mdRaw);
      const fromJson =
        findEmailInObject(meta) ||
        // direct known keys if present
        (
          (meta?.email || meta?.userEmail || meta?.e) as string | undefined
        )?.toString?.() ||
        null;
      if (fromJson && EMAIL_RE.test(fromJson)) return fromJson.toLowerCase();
    } catch {
      // Fallback to regex over raw string
      const hit = mdRaw.match(EMAIL_RE);
      if (hit) return hit[0].toLowerCase();
    }
  }

  // 3) Try participant display name
  if (p?.name) {
    const hit = String(p.name).match(EMAIL_RE);
    if (hit) return hit[0].toLowerCase();
  }

  return null;
}

export default function ParticipantsPanel({
  role,
  socket,
  myEmail,
  sessionId,
}: {
  role: UiRole;
  socket: Socket | null;
  myEmail?: string | null;
  sessionId: string;
}) {
  const [shareAllowedOverride, setShareAllowedOverride] = useState<
    Record<string, boolean | undefined>
  >({});
  const all = useParticipants();
  const remotes = all.filter((p) => !p.isLocal);
  const [bulkBusy, setBulkBusy] = useState(false);

  // Chat state for moderator → participants meeting DMs
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(
    null
  );
  const [participantChatText, setParticipantChatText] = useState("");
  const [participantUnreadMap, setParticipantUnreadMap] = useState<
    Record<string, number>
  >({});
  const chatListRef = useRef<HTMLDivElement | null>(null);
  const [lastReadCount, setLastReadCount] = useState<Record<string, number>>(
    {}
  );
  const [showGroupChat, setShowGroupChat] = useState(false);
  const [groupChatText, setGroupChatText] = useState("");
  const [lastReadGroupCount, setLastReadGroupCount] = useState(0);
  const selectedParticipantDisplayName = useMemo(() => {
    if (!selectedParticipant) return "";
    const match = remotes.find((p) => {
      const e = emailFromParticipant(p) || "";
      return e.toLowerCase() === selectedParticipant;
    });
    const nm = match?.name || "";
    const formatted = nm ? formatDisplayName(nm) : "";
    return formatted || selectedParticipant;
  }, [selectedParticipant, remotes]);

  const { send, getHistory, messagesByScope } = useChat({
    socket,
    sessionId,
    my: {
      email: myEmail || "",
      name: "Moderator",
      role: "Moderator",
    },
  });

  // derive participant emails
  const participantEmail = (p: {
    identity?: string;
    metadata?: string | null;
  }): string | null => {
    return emailFromParticipant(p);
  };

  // Track unread per participant for meeting_dm
  useEffect(() => {
    const dm = messagesByScope["meeting_dm"] || [];
    const currentCounts: Record<string, number> = {};
    for (const m of dm) {
      const from = (m.email || "").toLowerCase();
      const to = (m.toEmail || "").toLowerCase();
      if (!from) continue;
      if (m.toEmail === "__moderators__") {
        currentCounts[from] = (currentCounts[from] || 0) + 1;
      } else if (myEmail && to === myEmail.toLowerCase()) {
        currentCounts[from] = (currentCounts[from] || 0) + 1;
      }
    }
    const unread: Record<string, number> = {};
    for (const [email, cnt] of Object.entries(currentCounts)) {
      const seen = lastReadCount[email] || 0;
      unread[email] = Math.max(0, cnt - seen);
    }
    setParticipantUnreadMap(unread);
  }, [messagesByScope, myEmail, lastReadCount]);

  // auto scroll chat when open
  const dmLen = (messagesByScope["meeting_dm"] || []).length;
  useEffect(() => {
    if (selectedParticipant && chatListRef.current) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
    }
  }, [selectedParticipant, dmLen]);

  // auto scroll group chat when open
  const groupLen = (messagesByScope["meeting_group"] || []).length;
  useEffect(() => {
    if (showGroupChat && chatListRef.current) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
    }
    if (showGroupChat) {
      setLastReadGroupCount(groupLen);
    }
  }, [showGroupChat, groupLen]);
  const unreadGroup = Math.max(0, groupLen - lastReadGroupCount);

  const countIncomingFrom = (participantEmailLower: string): number => {
    const dm = messagesByScope["meeting_dm"] || [];
    let cnt = 0;
    for (const m of dm) {
      const from = (m.email || "").toLowerCase();
      const to = (m.toEmail || "").toLowerCase();
      if (from !== participantEmailLower) continue;
      if (m.toEmail === "__moderators__") {
        cnt++;
        continue;
      }
      if (myEmail && to === myEmail.toLowerCase()) cnt++;
    }
    return cnt;
  };

  const openParticipantChat = (email: string) => {
    const e = email.toLowerCase();
    setSelectedParticipant(e);
    const current = countIncomingFrom(e);
    setLastReadCount((prev) => ({ ...prev, [e]: current }));
    getHistory("meeting_dm", { withEmail: e });
  };
  const closeParticipantChat = () => setSelectedParticipant(null);
  const sendParticipantMessage = async () => {
    const text = participantChatText.trim();
    if (!text || !selectedParticipant) return;
    const ack = await send("meeting_dm", text, selectedParticipant);
    if (ack.ok) setParticipantChatText("");
  };

  const onChatScroll = () => {
    const el = chatListRef.current;
    if (!el || !selectedParticipant) return;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 8;
    if (nearBottom) {
      const current = countIncomingFrom(selectedParticipant);
      setLastReadCount((prev) => ({ ...prev, [selectedParticipant]: current }));
    }
  };
  const onGroupChatScroll = () => {
    const el = chatListRef.current;
    if (!el || !showGroupChat) return;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 8;
    if (nearBottom) setLastReadGroupCount(groupLen);
  };

  if (!(role === "admin" || role === "moderator")) return null;

  // (bulk function inlined into the single toggle button below)

  // Determine if all remote participants are currently allowed to screenshare
  const allAllowed =
    remotes.length > 0 &&
    remotes.every((p) => {
      const identity = p.identity || "";
      const sources = (p.permissions?.canPublishSources ??
        []) as unknown as Track.Source[];
      const computedAllowed =
        sources.length === 0 ||
        sources.includes(Track.Source.ScreenShare) ||
        sources.includes(Track.Source.ScreenShareAudio);
      const allowed =
        shareAllowedOverride[identity] !== undefined
          ? (shareAllowedOverride[identity] as boolean)
          : computedAllowed;
      return allowed;
    });

  return (
    <div className="my-2 bg-custom-gray-2 rounded-lg p-1 max-h-[40vh] min-h-[40vh] overflow-y-auto">
      <Tabs defaultValue="list">
        <TabsList className="sticky top-0 z-10 bg-custom-gray-2 w-full gap-2">
          <TabsTrigger
            value="list"
            className="rounded-full h-6 px-4 border shadow-sm data-[state=active]:bg-custom-dark-blue-1 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent data-[state=inactive]:border-custom-dark-blue-1 data-[state=inactive]:text-custom-dark-blue-1 cursor-pointer"
          >
            Participant List
          </TabsTrigger>
          <TabsTrigger
            value="chat"
            className="rounded-full h-6 px-4 border shadow-sm data-[state=active]:bg-custom-dark-blue-1 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent data-[state=inactive]:border-custom-dark-blue-1 data-[state=inactive]:text-custom-dark-blue-1 cursor-pointer"
          >
            Participant Chat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <div className="font-semibold mb-2">Participants (Live)</div>

          {remotes.length !== 0 && (
            <div className="flex items-center gap-2 mb-3">
              <Button
                size="sm"
                onClick={() => {
                  if (!socket || bulkBusy) return;
                  setBulkBusy(true);
                  const next = !allAllowed;
                  socket.emit(
                    "meeting:screenshare:allow-all",
                    { allow: next },
                    (ack: { ok: boolean; updated: number; error?: string }) => {
                      if (!ack?.ok) {
                        console.error(
                          `${
                            next ? "Allow" : "Revoke"
                          } all screenshare failed:`,
                          ack?.error
                        );
                        setBulkBusy(false);
                        return;
                      }
                      setShareAllowedOverride((prev) => {
                        const updated: Record<string, boolean | undefined> = {
                          ...prev,
                        };
                        for (const rp of remotes) {
                          const id = rp.identity || "";
                          if (id) updated[id] = next;
                        }
                        return updated;
                      });
                      setBulkBusy(false);
                    }
                  );
                }}
                disabled={!socket || bulkBusy}
                className="bg-gray-100 hover:bg-gray-200 text-black"
              >
                {allAllowed ? "Revoke all" : "Allow screenshare for all"}
              </Button>
            </div>
          )}

          <div className="space-y-2">
            {remotes.length === 0 && (
              <div className="text-sm text-gray-500">
                No remote participants yet.
              </div>
            )}

            {remotes.map((p) => {
              const identity: string = p.identity || "";
              const name: string = p.name || "";
              const email = emailFromParticipant(p);
              const label = name ? formatDisplayName(name) : email || identity;

              const micPub = p.getTrackPublication
                ? p.getTrackPublication(Track.Source.Microphone)
                : undefined;
              const isMicOn = !!micPub && !micPub.isMuted;
              const camPub = p.getTrackPublication
                ? p.getTrackPublication(Track.Source.Camera)
                : undefined;
              const isCamOn = !!camPub && !camPub.isMuted;

              const isMe = !!myEmail && email === myEmail.toLowerCase();
              const canAct = !isMe && !!socket;
              const canMute = !isMe && !!socket;
              const targetPayload = email
                ? { targetEmail: email }
                : { targetIdentity: identity };

              return (
                <div
                  key={identity}
                  className="flex items-center justify-between gap-2 rounded px-2 py-1"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{label}</div>
                    {email && (
                      <div className="text-[11px] text-gray-500 truncate">
                        {email}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Mute mic"
                      title="Mute mic"
                      disabled={!canMute}
                      onClick={() => {
                        if (!socket) return;
                        const payload = email
                          ? { targetEmail: email }
                          : { targetIdentity: identity };
                        socket.emit(
                          "meeting:mute-mic",
                          payload,
                          (ack: { ok: boolean; error?: string }) => {
                            if (!ack?.ok)
                              console.error("Mute mic failed:", ack?.error);
                          }
                        );
                      }}
                    >
                      {isMicOn ? (
                        <Mic className="h-4 w-4 text-black font-bold" />
                      ) : (
                        <MicOff className="h-4 w-4 text-custom-orange-1 font-bold" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Turn off camera"
                      title="Turn off camera"
                      disabled={!canMute}
                      onClick={() => {
                        if (!socket) return;
                        const payload = email
                          ? { targetEmail: email }
                          : { targetIdentity: identity };
                        socket.emit(
                          "meeting:camera-off",
                          payload,
                          (ack: { ok: boolean; error?: string }) => {
                            if (!ack?.ok)
                              console.error("Camera off failed:", ack?.error);
                          }
                        );
                      }}
                    >
                      {isCamOn ? (
                        <Camera className="h-4 w-4 text-black font-bold" />
                      ) : (
                        <CameraOff className="h-4 w-4 text-custom-orange-2 font-bold" />
                      )}
                    </Button>
                    {(() => {
                      const sources = (p.permissions?.canPublishSources ??
                        []) as unknown as Track.Source[];
                      const computedAllowed =
                        sources.length === 0 ||
                        sources.includes(Track.Source.ScreenShare) ||
                        sources.includes(Track.Source.ScreenShareAudio);
                      const allowed =
                        shareAllowedOverride[identity] !== undefined
                          ? (shareAllowedOverride[identity] as boolean)
                          : computedAllowed;
                      return (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={!canAct}
                          aria-label={
                            allowed ? "Revoke screenshare" : "Allow screenshare"
                          }
                          title={
                            allowed ? "Revoke screenshare" : "Allow screenshare"
                          }
                          onClick={() => {
                            if (!socket) return;
                            const next = !allowed;
                            socket.emit(
                              "meeting:screenshare:allow",
                              { ...targetPayload, allow: next },
                              (ack: { ok: boolean; error?: string }) => {
                                if (!ack?.ok) {
                                  console.error(
                                    `${
                                      next ? "Allow" : "Revoke"
                                    } screenshare failed:`,
                                    ack?.error
                                  );
                                  return;
                                }
                                setShareAllowedOverride((prev) => ({
                                  ...prev,
                                  [identity]: next,
                                }));
                              }
                            );
                          }}
                        >
                          {allowed ? (
                            <ScreenShareOff className="h-4 w-4 text-custom-orange-1" />
                          ) : (
                            <ScreenShare className="h-4 w-4 text-black" />
                          )}
                        </Button>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="chat">
          <div className="grid grid-cols-12 gap-2 h-[28vh]">
            {!selectedParticipant && !showGroupChat && (
              <div className="col-span-12 rounded bg-white overflow-y-auto">
                <div className="space-y-1 p-2">
                  {remotes.length === 0 ? (
                    <div className="text-sm text-gray-500">
                      No participants in the meeting.
                    </div>
                  ) : (
                    <>
                      <div
                        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                        onClick={() => {
                          setShowGroupChat(true);
                          setSelectedParticipant(null);
                          getHistory("meeting_group");
                          setLastReadGroupCount(groupLen);
                        }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-medium truncate">
                            Group Chat
                          </span>
                          {unreadGroup > 0 && (
                            <Badge
                              variant="destructive"
                              className="h-5 w-5 p-0 text-xs flex items-center justify-center"
                            >
                              {unreadGroup}
                            </Badge>
                          )}
                        </div>
                        <MessageSquare className="h-4 w-4 text-gray-400" />
                      </div>
                      {remotes.map((p) => {
                        const email = participantEmail(p);
                        const name = p.name
                          ? formatDisplayName(p.name)
                          : email || p.identity || "Unknown";
                        const unread = email
                          ? participantUnreadMap[email.toLowerCase()] || 0
                          : 0;
                        return (
                          <div
                            key={p.identity}
                            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                            onClick={() => {
                              if (email) {
                                openParticipantChat(email);
                              } else {
                                toast.info(
                                  "Email not available for this participant yet."
                                );
                              }
                            }}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-sm font-medium truncate">
                                {name}
                              </span>
                              {!email && (
                                <span className="text-xs text-gray-400">
                                  (no email)
                                </span>
                              )}
                              {email && unread > 0 && (
                                <Badge
                                  variant="destructive"
                                  className="h-5 w-5 p-0 text-xs flex items-center justify-center"
                                >
                                  {unread}
                                </Badge>
                              )}
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
            {showGroupChat && (
              <div className="col-span-12 rounded bg-white flex flex-col">
                <div className="flex items-center justify-between p-2 border-b">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      Participant Group Chat
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
                <div
                  ref={chatListRef}
                  onScroll={onGroupChatScroll}
                  className="flex-1 overflow-y-auto p-2"
                >
                  <div className="space-y-1 text-sm">
                    {(messagesByScope["meeting_group"] || []).map((m, i) => {
                      const who =
                        m.senderName ||
                        m.name ||
                        m.email ||
                        m.senderEmail ||
                        "";
                      return (
                        <div
                          key={`${who}-${i}`}
                          className="flex items-start gap-2"
                        >
                          <div className="shrink-0 mt-[2px] h-2 w-2 rounded-full bg-custom-dark-blue-1" />
                          <div className="min-w-0">
                            <div className="text-[12px] text-gray-600">
                              <span className="font-medium text-gray-900">
                                {who}
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
                      );
                    })}
                  </div>
                </div>
                <div className="p-2 flex items-center gap-2 border-t">
                  <Input
                    value={groupChatText}
                    onChange={(e) => setGroupChatText(e.target.value)}
                    placeholder="Type a message..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        const text = groupChatText.trim();
                        if (!text) return;
                        send("meeting_group", text).then((ack) => {
                          if (ack.ok) setGroupChatText("");
                        });
                      }
                    }}
                  />
                  <Button
                    onClick={() => {
                      const text = groupChatText.trim();
                      if (!text) return;
                      send("meeting_group", text).then((ack) => {
                        if (ack.ok) setGroupChatText("");
                      });
                    }}
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            {selectedParticipant && !showGroupChat && (
              <div className="col-span-12 rounded bg-white flex flex-col">
                <div className="flex items-center justify-between p-2 border-b">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      Chat with {selectedParticipantDisplayName}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={closeParticipantChat}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div
                  ref={chatListRef}
                  onScroll={onChatScroll}
                  className="flex-1 overflow-y-auto p-2"
                >
                  <div className="space-y-1 text-sm">
                    {(messagesByScope["meeting_dm"] || [])
                      .filter(
                        (m) =>
                          (m.email?.toLowerCase?.() === selectedParticipant &&
                            (m.toEmail?.toLowerCase?.() ===
                              (myEmail || "").toLowerCase() ||
                              m.toEmail === "__moderators__")) ||
                          (m.email?.toLowerCase?.() ===
                            (myEmail || "").toLowerCase() &&
                            m.toEmail?.toLowerCase?.() === selectedParticipant)
                      )
                      .map((m, i) => (
                        <div
                          key={`${m.email}-${i}`}
                          className="flex items-start gap-2"
                        >
                          <div className="shrink-0 mt-[2px] h-2 w-2 rounded-full bg-custom-dark-blue-1" />
                          <div className="min-w-0">
                            <div className="text-[12px] text-gray-600">
                              <span className="font-medium text-gray-900">
                                {m.senderName || m.email}
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
                <div className="p-2 flex items-center gap-2 border-t">
                  <Input
                    value={participantChatText}
                    onChange={(e) => setParticipantChatText(e.target.value)}
                    placeholder="Type a message..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendParticipantMessage();
                      }
                    }}
                  />
                  <Button
                    onClick={sendParticipantMessage}
                    size="sm"
                    className="h-8 w-8 p-0"
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
}
