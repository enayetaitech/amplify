"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "components/ui/tabs";
import { Badge } from "components/ui/badge";
import ChatWindow, {
  ChatWindowMessage,
} from "components/meeting/chat/ChatWindow";
import useChat, { ChatScope } from "hooks/useChat";
import { formatParticipantName } from "utils/formatParticipantName";

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
    firstName?: string;
    lastName?: string;
    role: "Participant" | "Observer" | "Moderator" | "Admin";
  };
}) {
  const { send, getHistory, messagesByScope } = useChat({
    socket,
    sessionId,
    my: me,
  });

  console.log("Messages by scope", messagesByScope);

  const [groupText, setGroupText] = useState("");
  const [dmText, setDmText] = useState("");
  const groupRef = useRef<HTMLDivElement | null>(null);
  const dmRef = useRef<HTMLDivElement | null>(null);
  const [tab, setTab] = useState<"group" | "dm">("group");
  const [lastReadGroup, setLastReadGroup] = useState(0);
  const [lastReadDmIncoming, setLastReadDmIncoming] = useState(0);

  useEffect(() => {
    getHistory("meeting_group");
    getHistory("meeting_dm");
  }, [getHistory]);

  const meetingGroupLength = messagesByScope["meeting_group"]?.length || 0;
  const meetingDmLength = messagesByScope["meeting_dm"]?.length || 0;

  const meEmailLower = (me?.email || "").toLowerCase();
  const dmIncomingCount = useMemo(() => {
    const dm = messagesByScope["meeting_dm"] || [];
    let c = 0;
    for (const m of dm) {
      const sender = (m.email || m.senderEmail || "").toLowerCase();
      if (sender && sender !== meEmailLower) c++;
    }
    return c;
  }, [messagesByScope, meEmailLower]);

  const unreadGroup = Math.max(0, meetingGroupLength - lastReadGroup);
  const unreadDm = Math.max(0, dmIncomingCount - lastReadDmIncoming);

  useEffect(() => {
    if (groupRef.current)
      groupRef.current.scrollTop = groupRef.current.scrollHeight;
  }, [meetingGroupLength]);
  useEffect(() => {
    if (dmRef.current) dmRef.current.scrollTop = dmRef.current.scrollHeight;
  }, [meetingDmLength]);

  // If tab is open, new messages should not produce unread badges
  useEffect(() => {
    if (tab === "group") setLastReadGroup(meetingGroupLength);
  }, [meetingGroupLength, tab]);
  useEffect(() => {
    if (tab === "dm") setLastReadDmIncoming(dmIncomingCount);
  }, [dmIncomingCount, tab]);

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

  return (
    <div className="my-2 bg-custom-gray-2 rounded-lg p-1 max-h-[80vh] min-h-[80vh] overflow-hidden overflow-x-hidden w-full max-w-full flex flex-col">
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v === "dm" ? "dm" : "group")}
        className="flex-1 flex min-h-0 flex-col"
      >
        <TabsList className="sticky top-0 z-10 bg-custom-gray-2 w-full gap-2">
          <TabsTrigger
            value="group"
            className="rounded-full h-6 px-4 border shadow-sm data-[state=active]:bg-custom-dark-blue-1 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent data-[state=inactive]:border-custom-dark-blue-1 data-[state=inactive]:text-custom-dark-blue-1 cursor-pointer"
          >
            Group Chat
            {unreadGroup > 0 && (
              <Badge
                variant="destructive"
                className="ml-2 h-5 w-5 p-0 text-[10px] inline-flex items-center justify-center"
              >
                {unreadGroup}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="dm"
            className="rounded-full h-6 px-4 border shadow-sm data-[state=active]:bg-custom-dark-blue-1 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent data-[state=inactive]:border-custom-dark-blue-1 data-[state=inactive]:text-custom-dark-blue-1 cursor-pointer"
          >
            DM to Moderators
            {unreadDm > 0 && (
              <Badge
                variant="destructive"
                className="ml-2 h-5 w-5 p-0 text-[10px] inline-flex items-center justify-center"
              >
                {unreadDm}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="group" className="flex-1 min-h-0 h-full">
          {/* Old UI commented; replaced with reusable ChatWindow */}
          {(() => {
            const mapped: ChatWindowMessage[] = (
              messagesByScope["meeting_group"] || []
            ).map((m, i) => {
              const formattedName = formatParticipantName(
                m.firstName,
                m.lastName
              );
              return {
                id: i,
                senderEmail: (m.email || m.senderEmail) as string | undefined,
                senderName:
                  formattedName || m.senderName || m.name || undefined,
                content: m.content,
                timestamp: m.timestamp || new Date(),
              };
            });
            const send = () => onSend("meeting_group");
            return (
              <ChatWindow
                title="Group Chat"
                meEmail={me.email}
                messages={mapped}
                value={groupText}
                onChange={setGroupText}
                onSend={send}
                onClose={() => setTab("dm")}
                height="72vh"
                placeholder="Write a message"
              />
            );
          })()}
        </TabsContent>

        <TabsContent value="dm" className="flex-1 min-h-0">
          {/* Old UI commented; replaced with reusable ChatWindow */}
          {(() => {
            const mapped: ChatWindowMessage[] = (
              messagesByScope["meeting_dm"] || []
            ).map((m, i) => {
              const formattedName = formatParticipantName(
                m.firstName,
                m.lastName
              );
              return {
                id: i,
                senderEmail: (m.email || m.senderEmail) as string | undefined,
                senderName:
                  formattedName || m.senderName || m.name || undefined,
                content: m.content,
                timestamp: m.timestamp || new Date(),
              };
            });
            const send = () => onSend("meeting_dm");
            return (
              <ChatWindow
                title="Chat with Moderators"
                meEmail={me.email}
                messages={mapped}
                value={dmText}
                onChange={setDmText}
                onSend={send}
                onClose={() => setTab("group")}
                height="72vh"
                placeholder="Ask moderators privately"
              />
            );
          })()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
