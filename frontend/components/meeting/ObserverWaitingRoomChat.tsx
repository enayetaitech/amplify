"use client";

import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "components/ui/tabs";
import { Input } from "components/ui/input";
import { Button } from "components/ui/button";
import { Send } from "lucide-react";
import useChat, { ChatMessage } from "hooks/useChat";
import { formatDisplayName } from "lib/utils";

export default function ObserverWaitingRoomChat({
  socket,
  sessionId,
  me,
}: {
  socket: Socket | null;
  sessionId: string;
  me: { email: string; name: string; role: "Observer" };
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
  const dmRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    getHistory("observer_wait_group");
  }, [getHistory]);
  const observerWaitGroupLength =
    messagesByScope["observer_wait_group"]?.length || 0;
  useEffect(() => {
    if (grpRef.current) grpRef.current.scrollTop = grpRef.current.scrollHeight;
  }, [observerWaitGroupLength]);

  const onSendGroup = async () => {
    const text = grpText.trim();
    if (!text) return;
    const ack = await send("observer_wait_group", text);
    if (ack.ok) setGrpText("");
  };
  const onSendDm = async () => {
    const t = dmTarget.trim().toLowerCase();
    const text = dmText.trim();
    if (!t || !text) return;
    const ack = await send("observer_wait_dm", text, t);
    if (ack.ok) setDmText("");
  };

  return (
    <div className="my-2 bg-custom-gray-2 rounded-lg p-1 max-h-[70vh] min-h-[40vh] overflow-hidden flex flex-col">
      <Tabs defaultValue="ogroup" className="flex-1 flex min-h-0 flex-col">
        <TabsList className="sticky top-0 z-10 bg-custom-gray-2 w-full gap-2">
          <TabsTrigger
            value="ogroup"
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
        </TabsList>

        <TabsContent value="ogroup" className="flex-1 min-h-0">
          <div
            ref={grpRef}
            className="h-[42vh] overflow-y-auto bg-white rounded p-2"
          >
            <div className="space-y-1 text-sm">
              {(messagesByScope["observer_wait_group"] || []).map((m, i) => (
                <MessageItem key={i} m={m} />
              ))}
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

        <TabsContent value="dm" className="flex-1 min-h-0">
          <div className="flex items-center gap-2 mb-2">
            <Input
              value={dmTarget}
              onChange={(e) => setDmTarget(e.target.value)}
              placeholder="Observer email"
              onBlur={() =>
                dmTarget &&
                getHistory("observer_wait_dm", {
                  withEmail: dmTarget.trim().toLowerCase(),
                })
              }
            />
          </div>
          <div
            ref={dmRef}
            className="h-[38vh] overflow-y-auto bg-white rounded p-2"
          >
            <div className="space-y-1 text-sm">
              {(messagesByScope["observer_wait_dm"] || [])
                .filter((m) =>
                  dmTarget
                    ? (m.toEmail || "") === dmTarget.trim().toLowerCase() ||
                      (m.email || "").toLowerCase() ===
                        dmTarget.trim().toLowerCase()
                    : true
                )
                .map((m, i) => (
                  <MessageItem key={i} m={m} />
                ))}
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

function MessageItem({ m }: { m: ChatMessage }) {
  const raw = m.senderName || m.name || m.email || m.senderEmail || "";
  const label = raw.includes("@") ? raw : formatDisplayName(raw);
  const when = new Date(String(m.timestamp)).toLocaleTimeString();
  return (
    <div className="flex items-start gap-2">
      <div className="shrink-0 mt-[2px] h-2 w-2 rounded-full bg-custom-dark-blue-1" />
      <div className="min-w-0">
        <div className="text-[12px] text-gray-600">
          <span className="font-medium text-gray-900">{label}</span>
          <span className="ml-2 text-[11px] text-gray-400">{when}</span>
        </div>
        <div className="whitespace-pre-wrap text-sm">{m.content}</div>
      </div>
    </div>
  );
}
