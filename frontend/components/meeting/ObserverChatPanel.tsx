"use client";

import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "components/ui/tabs";
import { Input } from "components/ui/input";
import { Button } from "components/ui/button";
import { Send } from "lucide-react";
import useChat, { ChatMessage } from "hooks/useChat";

export default function ObserverChatPanel({
  socket,
  sessionId,
  me,
  isStreaming,
}: {
  socket: Socket | null;
  sessionId: string;
  me: {
    email: string;
    name: string;
    role: "Observer" | "Moderator" | "Admin" | "Participant";
  };
  isStreaming: boolean;
}) {
  const { send, getHistory, messagesByScope } = useChat({
    socket,
    sessionId,
    my: me,
  });
  const [grpText, setGrpText] = useState("");
  const [dmTarget, setDmTarget] = useState("");
  const [dmText, setDmText] = useState("");
  const grpRef = useRef<HTMLDivElement | null>(null);
  const feedRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isStreaming) getHistory("stream_group");
  }, [isStreaming, getHistory]);

  const streamGroupLength = messagesByScope["stream_group"]?.length || 0;
  const meetingGroupLength = messagesByScope["meeting_group"]?.length || 0;

  useEffect(() => {
    if (grpRef.current) grpRef.current.scrollTop = grpRef.current.scrollHeight;
  }, [streamGroupLength]);
  useEffect(() => {
    if (feedRef.current)
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [meetingGroupLength]);

  const onSendGroup = async () => {
    const text = grpText.trim();
    if (!text) return;
    const ack = await send("stream_group", text);
    if (ack.ok) setGrpText("");
  };

  const onSendDm = async () => {
    const t = dmTarget.trim().toLowerCase();
    const text = dmText.trim();
    if (!t || !text) return;
    // observer can DM observer or moderator during stream
    const scope = "stream_dm_obs_mod" as const; // UI will use email of moderator or observer
    const ack = await send(scope, text, t);
    if (ack.ok) setDmText("");
  };

  return (
    <div className="my-2 bg-custom-gray-2 rounded-lg p-1 max-h-[40vh] min-h-[40vh] overflow-hidden flex flex-col">
      <Tabs
        defaultValue={isStreaming ? "ogroup" : "owait"}
        className="flex-1 flex min-h-0 flex-col"
      >
        <TabsList className="sticky top-0 z-10 bg-custom-gray-2 w-full gap-2">
          {isStreaming ? (
            <>
              <TabsTrigger
                value="ogroup"
                className="rounded-full h-6 px-4 border shadow-sm data-[state=active]:bg-custom-dark-blue-1 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent data-[state=inactive]:border-custom-dark-blue-1 data-[state=inactive]:text-custom-dark-blue-1 cursor-pointer"
              >
                Observers+Moderators
              </TabsTrigger>
              <TabsTrigger
                value="dm"
                className="rounded-full h-6 px-4 border shadow-sm data-[state=active]:bg-custom-dark-blue-1 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent data-[state=inactive]:border-custom-dark-blue-1 data-[state=inactive]:text-custom-dark-blue-1 cursor-pointer"
              >
                Direct Messages
              </TabsTrigger>
              <TabsTrigger
                value="feed"
                className="rounded-full h-6 px-4 border shadow-sm data-[state=active]:bg-custom-dark-blue-1 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent data-[state=inactive]:border-custom-dark-blue-1 data-[state=inactive]:text-custom-dark-blue-1 cursor-pointer"
              >
                Participant Feed
              </TabsTrigger>
            </>
          ) : (
            <>
              <TabsTrigger
                value="owait"
                className="rounded-full h-6 px-4 border shadow-sm data-[state=active]:bg-custom-dark-blue-1 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent data-[state=inactive]:border-custom-dark-blue-1 data-[state=inactive]:text-custom-dark-blue-1 cursor-pointer"
              >
                Observer Group
              </TabsTrigger>
              <TabsTrigger
                value="dm"
                className="rounded-full h-6 px-4 border shadow-sm data-[state=active]:bg-custom-dark-blue-1 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent data-[state=inactive]:border-custom-dark-blue-1 data-[state=inactive]:text-custom-dark-blue-1 cursor-pointer"
              >
                Direct Messages
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {isStreaming ? (
          <>
            <TabsContent value="ogroup" className="flex-1 min-h-0">
              <div
                ref={grpRef}
                className="h-[22vh] overflow-y-auto bg-white rounded p-2"
              >
                <div className="space-y-1 text-sm">
                  {(messagesByScope["stream_group"] || []).map((m, i) =>
                    renderItem(m, i)
                  )}
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Input
                  value={grpText}
                  onChange={(e) => setGrpText(e.target.value)}
                  placeholder="Write a message"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      onSendGroup();
                    }
                  }}
                />
                <Button
                  onClick={onSendGroup}
                  className="inline-flex items-center gap-1"
                >
                  <Send className="h-4 w-4" />
                  Send
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="feed" className="flex-1 min-h-0">
              <div
                ref={feedRef}
                className="h-[24vh] overflow-y-auto bg-white rounded p-2"
              >
                <div className="space-y-1 text-sm">
                  {(messagesByScope["meeting_group"] || []).map((m, i) =>
                    renderItem(m, i)
                  )}
                </div>
              </div>
            </TabsContent>
          </>
        ) : (
          <TabsContent value="owait" className="flex-1 min-h-0">
            <div className="text-sm text-gray-500">Streaming not active.</div>
          </TabsContent>
        )}

        <TabsContent value="dm" className="flex-1 min-h-0">
          <div className="flex items-center gap-2 mb-2">
            <Input
              value={dmTarget}
              onChange={(e) => setDmTarget(e.target.value)}
              placeholder="Email (observer or moderator)"
            />
          </div>
          <div className="h-[18vh] overflow-y-auto bg-white rounded p-2">
            <div className="space-y-1 text-sm">
              {(messagesByScope["stream_dm_obs_mod"] || [])
                .filter((m) =>
                  dmTarget
                    ? (m.toEmail || "").toLowerCase() ===
                        dmTarget.trim().toLowerCase() ||
                      (m.email || "").toLowerCase() ===
                        dmTarget.trim().toLowerCase()
                    : true
                )
                .map((m, i) => renderItem(m, i))}
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Input
              value={dmText}
              onChange={(e) => setDmText(e.target.value)}
              placeholder="Write a private message"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSendDm();
                }
              }}
            />
            <Button
              onClick={onSendDm}
              className="inline-flex items-center gap-1"
            >
              <Send className="h-4 w-4" />
              Send
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function renderItem(m: ChatMessage, i: number) {
  const label = m.senderName || m.name || m.email || m.senderEmail || "";
  const when = new Date(String(m.timestamp)).toLocaleTimeString();
  const content = m.content;
  const role = m.role || "Moderator";
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
