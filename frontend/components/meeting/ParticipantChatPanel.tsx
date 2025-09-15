"use client";

import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "components/ui/tabs";
import { Input } from "components/ui/input";
import { Button } from "components/ui/button";
import { Send } from "lucide-react";
import useChat, { ChatScope, ChatMessage } from "hooks/useChat";

export default function ParticipantChatPanel({
  socket,
  sessionId,
  me,
}: {
  socket: Socket | null;
  sessionId: string;
  me: {
    email: string;
    name: string;
    role: "Participant" | "Observer" | "Moderator" | "Admin";
  };
}) {
  const { send, getHistory, messagesByScope } = useChat({
    socket,
    sessionId,
    my: me,
  });
  const [groupText, setGroupText] = useState("");
  const [dmText, setDmText] = useState("");
  const groupRef = useRef<HTMLDivElement | null>(null);
  const dmRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // seed history
    getHistory("meeting_group");
    getHistory("meeting_dm");
  }, [getHistory]);

  const meetingGroupLength = messagesByScope["meeting_group"]?.length || 0;
  const meetingDmLength = messagesByScope["meeting_dm"]?.length || 0;

  useEffect(() => {
    if (groupRef.current)
      groupRef.current.scrollTop = groupRef.current.scrollHeight;
  }, [meetingGroupLength]);
  useEffect(() => {
    if (dmRef.current) dmRef.current.scrollTop = dmRef.current.scrollHeight;
  }, [meetingDmLength]);

  const onSend = async (scope: ChatScope) => {
    const text = scope === "meeting_group" ? groupText : dmText;
    const trimmed = text.trim();
    if (!trimmed) return;
    const ack = await send(scope, trimmed);
    if (ack.ok) {
      if (scope === "meeting_group") setGroupText("");
      else setDmText("");
    }
  };

  const groupItems = (messagesByScope["meeting_group"] || []).map((m, i) =>
    renderItem(m, i)
  );
  const dmItems = (messagesByScope["meeting_dm"] || []).map((m, i) =>
    renderItem(m, i)
  );

  return (
    <div className="my-2 bg-custom-gray-2 rounded-lg p-1 max-h-[40vh] min-h-[40vh] overflow-hidden flex flex-col">
      <Tabs defaultValue="group" className="flex-1 flex min-h-0 flex-col">
        <TabsList className="sticky top-0 z-10 bg-custom-gray-2 w-full gap-2">
          <TabsTrigger
            value="group"
            className="rounded-full h-6 px-4 border shadow-sm data-[state=active]:bg-custom-dark-blue-1 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent data-[state=inactive]:border-custom-dark-blue-1 data-[state=inactive]:text-custom-dark-blue-1 cursor-pointer"
          >
            Group Chat
          </TabsTrigger>
          <TabsTrigger
            value="dm"
            className="rounded-full h-6 px-4 border shadow-sm data-[state=active]:bg-custom-dark-blue-1 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent data-[state=inactive]:border-custom-dark-blue-1 data-[state=inactive]:text-custom-dark-blue-1 cursor-pointer"
          >
            DM to Moderators
          </TabsTrigger>
        </TabsList>

        <TabsContent value="group" className="flex-1 min-h-0">
          <div
            ref={groupRef}
            className="h-[26vh] overflow-y-auto bg-white rounded p-2"
          >
            <div className="space-y-1 text-sm">
              {groupItems.length === 0 ? (
                <div className="text-gray-500">No messages yet.</div>
              ) : (
                groupItems
              )}
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Input
              value={groupText}
              onChange={(e) => setGroupText(e.target.value)}
              placeholder="Write a message"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSend("meeting_group");
                }
              }}
            />
            <Button
              onClick={() => onSend("meeting_group")}
              className="inline-flex items-center gap-1"
            >
              <Send className="h-4 w-4" />
              Send
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="dm" className="flex-1 min-h-0">
          <div
            ref={dmRef}
            className="h-[26vh] overflow-y-auto bg-white rounded p-2"
          >
            <div className="space-y-1 text-sm">
              {dmItems.length === 0 ? (
                <div className="text-gray-500">No messages yet.</div>
              ) : (
                dmItems
              )}
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Input
              value={dmText}
              onChange={(e) => setDmText(e.target.value)}
              placeholder="Ask moderators privately"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSend("meeting_dm");
                }
              }}
            />
            <Button
              onClick={() => onSend("meeting_dm")}
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
