"use client";

import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { Input } from "components/ui/input";
import { Button } from "components/ui/button";
import { Send } from "lucide-react";
import useChat, { ChatMessage, ChatScope } from "hooks/useChat";
import { formatDisplayName } from "lib/utils";

export default function ParticipantWaitingDm({
  socket,
  sessionId,
  me,
  chatProps,
}: {
  socket: Socket | null;
  sessionId: string;
  me: { email: string; name: string; role: "Participant" };
  chatProps?: {
    send: (
      scope: ChatScope,
      content: string,
      toEmail?: string
    ) => Promise<{ ok: boolean; error?: string }>;
    getHistory: (
      scope: ChatScope,
      options?: { withEmail?: string; limit?: number }
    ) => Promise<ChatMessage[]>;
    messagesByScope: Record<string, ChatMessage[]>;
  };
}) {
  // Always call useChat hook (required for React hooks rules)
  const localChat = useChat({
    socket,
    sessionId,
    my: me,
  });

  // Use provided chat props or fallback to local hook
  const { send, getHistory, messagesByScope } = chatProps || localChat;
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Only initialize history if using local hook (not when chatProps are provided)
    if (!chatProps) {
      getHistory("waiting_dm");
    }
  }, [getHistory, chatProps]);

  const waitingDmLength = messagesByScope["waiting_dm"]?.length || 0;
  useEffect(() => {
    if (listRef.current)
      listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [waitingDmLength]);

  const onSend = async () => {
    const t = text.trim();
    if (!t) return;
    const ack = await send("waiting_dm", t);
    if (ack.ok) setText("");
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div ref={listRef} className="flex-1 overflow-y-auto p-2 min-h-0">
        <div className="space-y-1 text-sm">
          {(messagesByScope["waiting_dm"] || []).map((m, i) => (
            <MessageItem key={i} m={m} />
          ))}
        </div>
      </div>
      <div className="flex-shrink-0 p-2 flex items-center gap-2 border-t bg-white">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message moderators"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
        />
        <Button onClick={onSend} size="sm" className="h-8 w-8 p-0">
          <Send className="h-4 w-4" />
        </Button>
      </div>
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
