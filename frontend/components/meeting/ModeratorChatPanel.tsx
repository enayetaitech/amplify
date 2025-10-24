"use client";

import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "components/ui/tabs";
import { Input } from "components/ui/input";
import { Badge } from "components/ui/badge";
import ChatWindow, {
  ChatWindowMessage,
} from "components/meeting/chat/ChatWindow";
import useChat from "hooks/useChat";

export default function ModeratorChatPanel({
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
  const [dmTarget, setDmTarget] = useState("");
  const [dmText, setDmText] = useState("");
  const [wrTarget, setWrTarget] = useState("");
  const [wrText, setWrText] = useState("");
  const [modTarget, setModTarget] = useState("");
  const [modText, setModText] = useState("");

  const groupRef = useRef<HTMLDivElement | null>(null);
  // const dmRef = useRef<HTMLDivElement | null>(null);
  // const wrRef = useRef<HTMLDivElement | null>(null);
  // const modRef = useRef<HTMLDivElement | null>(null);
  const [tab, setTab] = useState<"group" | "dm" | "waiting" | "mods">("group");
  const [lastReadGroup, setLastReadGroup] = useState(0);

  useEffect(() => {
    getHistory("meeting_group");
  }, [getHistory]);

  useEffect(() => {
    if (dmTarget.trim())
      getHistory("meeting_dm", { withEmail: dmTarget.trim().toLowerCase() });
  }, [dmTarget, getHistory]);
  useEffect(() => {
    if (wrTarget.trim())
      getHistory("waiting_dm", { withEmail: wrTarget.trim().toLowerCase() });
  }, [wrTarget, getHistory]);
  useEffect(() => {
    if (modTarget.trim())
      getHistory("meeting_mod_dm", {
        withEmail: modTarget.trim().toLowerCase(),
      });
  }, [modTarget, getHistory]);

  const groupMessagesLength = messagesByScope["meeting_group"]?.length || 0;
  useEffect(() => {
    if (groupRef.current)
      groupRef.current.scrollTop = groupRef.current.scrollHeight;
  }, [groupMessagesLength]);

  // Clear unread when viewing or when new messages arrive while on the tab
  useEffect(() => {
    if (tab === "group") setLastReadGroup(groupMessagesLength);
  }, [groupMessagesLength, tab]);

  const unreadGroup = Math.max(0, groupMessagesLength - lastReadGroup);

  // const onGroupScroll = () => {
  //   const el = groupRef.current;
  //   if (!el) return;
  //   const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 6;
  //   if (nearBottom) setLastReadGroup(groupMessagesLength);
  // };

  const onSendGroup = async () => {
    const text = groupText.trim();
    if (!text) return;
    const ack = await send("meeting_group", text);
    if (ack.ok) setGroupText("");
  };
  const onSendDm = async () => {
    const t = dmTarget.trim().toLowerCase();
    const text = dmText.trim();
    if (!t || !text) return;
    const ack = await send("meeting_dm", text, t);
    if (ack.ok) setDmText("");
  };
  const onSendWr = async () => {
    const t = wrTarget.trim().toLowerCase();
    const text = wrText.trim();
    if (!t || !text) return;
    const ack = await send("waiting_dm", text, t);
    if (ack.ok) setWrText("");
  };
  const onSendMod = async () => {
    const t = modTarget.trim().toLowerCase();
    const text = modText.trim();
    if (!t || !text) return;
    const ack = await send("meeting_mod_dm", text, t);
    if (ack.ok) setModText("");
  };

  // const groupItems = (messagesByScope["meeting_group"] || []).map((m, i) =>
  //   renderItem(m, i)
  // );

  return (
    <div className="my-2 bg-custom-gray-2 rounded-lg p-1 max-h-[40vh] min-h-[40vh] overflow-hidden flex flex-col">
      <Tabs
        value={tab}
        onValueChange={(v) =>
          setTab(
            v === "dm"
              ? "dm"
              : v === "waiting"
              ? "waiting"
              : v === "mods"
              ? "mods"
              : "group"
          )
        }
        className="flex-1 flex min-h-0 flex-col"
      >
        <TabsList className="sticky top-0 z-10 bg-custom-gray-2 w-full gap-2">
          <TabsTrigger
            value="group"
            className="rounded-full h-6 px-4 border shadow-sm data-[state=active]:bg-custom-dark-blue-1 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent data-[state=inactive]:border-custom-dark-blue-1 data-[state=inactive]:text-custom-dark-blue-1 cursor-pointer"
          >
            Participant Group
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
            Participant DMs
          </TabsTrigger>
          <TabsTrigger
            value="waiting"
            className="rounded-full h-6 px-4 border shadow-sm data-[state=active]:bg-custom-dark-blue-1 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent data-[state=inactive]:border-custom-dark-blue-1 data-[state=inactive]:text-custom-dark-blue-1 cursor-pointer"
          >
            Waiting DMs
          </TabsTrigger>
          <TabsTrigger
            value="mods"
            className="rounded-full h-6 px-4 border shadow-sm data-[state=active]:bg-custom-dark-blue-1 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent data-[state=inactive]:border-custom-dark-blue-1 data-[state=inactive]:text-custom-dark-blue-1 cursor-pointer"
          >
            Moderator DMs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="group" className="flex-1 min-h-0">
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
            return (
              <ChatWindow
                title="Participant Group"
                meEmail={me.email}
                messages={mapped}
                value={groupText}
                onChange={setGroupText}
                onSend={onSendGroup}
                onClose={() => setTab("dm")}
                height="22vh"
                placeholder="Write a message to everyone"
              />
            );
          })()}
        </TabsContent>

        <TabsContent value="dm" className="flex-1 min-h-0">
          <div className="flex items-center gap-2 mb-2">
            <Input
              value={dmTarget}
              onChange={(e) => setDmTarget(e.target.value)}
              placeholder="Participant email"
              onBlur={() =>
                dmTarget &&
                getHistory("meeting_dm", {
                  withEmail: dmTarget.trim().toLowerCase(),
                })
              }
            />
          </div>
          {(() => {
            const filtered = (messagesByScope["meeting_dm"] || []).filter((m) =>
              dmTarget
                ? (m.toEmail || "") === dmTarget.trim().toLowerCase() ||
                  (m.email || "").toLowerCase() ===
                    dmTarget.trim().toLowerCase()
                : true
            );
            const mapped: ChatWindowMessage[] = filtered.map((m, i) => ({
              id: i,
              senderEmail: (m.email || m.senderEmail) as string | undefined,
              senderName: (m.senderName || m.name) as string | undefined,
              content: m.content,
              timestamp: m.timestamp || new Date(),
            }));
            return (
              <ChatWindow
                title="Participant DMs"
                meEmail={me.email}
                messages={mapped}
                value={dmText}
                onChange={setDmText}
                onSend={onSendDm}
                onClose={() => setTab("waiting")}
                height="18vh"
                placeholder="Write a private message"
              />
            );
          })()}
        </TabsContent>

        <TabsContent value="waiting" className="flex-1 min-h-0">
          <div className="flex items-center gap-2 mb-2">
            <Input
              value={wrTarget}
              onChange={(e) => setWrTarget(e.target.value)}
              placeholder="Participant email (waiting room)"
              onBlur={() =>
                wrTarget &&
                getHistory("waiting_dm", {
                  withEmail: wrTarget.trim().toLowerCase(),
                })
              }
            />
          </div>
          {(() => {
            const filtered = (messagesByScope["waiting_dm"] || []).filter((m) =>
              wrTarget
                ? (m.toEmail || "") === wrTarget.trim().toLowerCase() ||
                  (m.email || "").toLowerCase() ===
                    wrTarget.trim().toLowerCase()
                : true
            );
            const mapped: ChatWindowMessage[] = filtered.map((m, i) => ({
              id: i,
              senderEmail: (m.email || m.senderEmail) as string | undefined,
              senderName: (m.senderName || m.name) as string | undefined,
              content: m.content,
              timestamp: m.timestamp || new Date(),
            }));
            return (
              <ChatWindow
                title="Waiting DMs"
                meEmail={me.email}
                messages={mapped}
                value={wrText}
                onChange={setWrText}
                onSend={onSendWr}
                onClose={() => setTab("mods")}
                height="18vh"
                placeholder="Write a private message to waiting participant"
              />
            );
          })()}
        </TabsContent>

        <TabsContent value="mods" className="flex-1 min-h-0">
          <div className="flex items-center gap-2 mb-2">
            <Input
              value={modTarget}
              onChange={(e) => setModTarget(e.target.value)}
              placeholder="Moderator email"
              onBlur={() =>
                modTarget &&
                getHistory("meeting_mod_dm", {
                  withEmail: modTarget.trim().toLowerCase(),
                })
              }
            />
          </div>
          {(() => {
            const filtered = (messagesByScope["meeting_mod_dm"] || []).filter(
              (m) =>
                modTarget
                  ? (m.toEmail || "") === modTarget.trim().toLowerCase() ||
                    (m.email || "").toLowerCase() ===
                      modTarget.trim().toLowerCase()
                  : true
            );
            const mapped: ChatWindowMessage[] = filtered.map((m, i) => ({
              id: i,
              senderEmail: (m.email || m.senderEmail) as string | undefined,
              senderName: (m.senderName || m.name) as string | undefined,
              content: m.content,
              timestamp: m.timestamp || new Date(),
            }));
            return (
              <ChatWindow
                title="Moderator DMs"
                meEmail={me.email}
                messages={mapped}
                value={modText}
                onChange={setModText}
                onSend={onSendMod}
                onClose={() => setTab("group")}
                height="18vh"
                placeholder="Write a private message to moderator"
              />
            );
          })()}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// function renderItem(m: ChatMessage, i: number) {
//   const label = m.senderName || m.name || m.email || m.senderEmail || "";
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
