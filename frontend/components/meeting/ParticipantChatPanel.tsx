"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "components/ui/tabs";
import { Badge } from "components/ui/badge";
import ChatWindow, {
  ChatWindowMessage,
} from "components/meeting/chat/ChatWindow";
import useChat, { ChatScope } from "hooks/useChat";


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
  const [tab, setTab] = useState<"group" | "dm">("group");
  const [lastReadGroup, setLastReadGroup] = useState(0);
  const [lastReadDmIncoming, setLastReadDmIncoming] = useState(0);

  useEffect(() => {
    // seed history
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

  // const onGroupScroll = () => {
  //   const el = groupRef.current;
  //   if (!el) return;
  //   const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 6;
  //   if (nearBottom) setLastReadGroup(meetingGroupLength);
  // };
  // const onDmScroll = () => {
  //   const el = dmRef.current;
  //   if (!el) return;
  //   const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 6;
  //   if (nearBottom) setLastReadDmIncoming(dmIncomingCount);
  // };

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

  // const groupItems = (messagesByScope["meeting_group"] || []).map((m, i) =>
  //   renderItem(m, i)
  // );
  // const dmItems = (messagesByScope["meeting_dm"] || []).map((m, i) =>
  //   renderItem(m, i)
  // );

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
            ).map((m, i) => ({
              id: i,
              senderEmail: (m.email || m.senderEmail) as string | undefined,
              senderName: (m.senderName || m.name) as string | undefined,
              content: m.content,
              timestamp: m.timestamp || new Date(),
            }));
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
            ).map((m, i) => ({
              id: i,
              senderEmail: (m.email || m.senderEmail) as string | undefined,
              senderName: (m.senderName || m.name) as string | undefined,
              content: m.content,
              timestamp: m.timestamp || new Date(),
            }));
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

// function renderItem(m: ChatMessage, i: number) {
//   const raw = m.senderName || m.name || m.email || m.senderEmail || "";
//   const label = raw.includes("@") ? raw : formatDisplayName(raw);
//   const when = new Date(String(m.timestamp)).toLocaleTimeString();
//   const content = m.content;
//   const role = m.role || "Moderator";
//   return (
//     <div key={`${label}-${i}`} className="flex items-start gap-2">
//       <div className="shrink-0 mt-[2px] h-2 w-2 rounded-full bg-custom-dark-blue-1" />
//       <div className="min-w-0">
//         <div className="text-[12px] text-gray-600">
//           <span className="font-medium text-gray-900">{label}</span>
//           <span className="ml-1 text-[11px] text-gray-500">{role}</span>
//           <span className="ml-2 text-[11px] text-gray-400">{when}</span>
//         </div>
//         <div className="whitespace-pre-wrap text-sm">{content}</div>
//       </div>
//     </div>
//   );
// }
