"use client";

import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import ChatWindow, {
  ChatWindowMessage,
} from "components/meeting/chat/ChatWindow";
import useChat, { ChatMessage, ChatScope } from "hooks/useChat";

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
      {(() => {
        const msgs = (messagesByScope["waiting_dm"] || []).map((m, i) => ({
          id: i,
          senderEmail: (m.email || m.senderEmail) as string | undefined,
          senderName: (m.senderName || m.name) as string | undefined,
          content: m.content,
          timestamp: m.timestamp || new Date(),
        })) as ChatWindowMessage[];
        const send = () => onSend();
        return (
          <ChatWindow
            title="Chat with Moderators"
            meEmail={me.email}
            messages={msgs}
            value={text}
            onChange={setText}
            onSend={send}
            onClose={() => {
              /* parent controls visibility; no-op here */
            }}
            height="100%"
            placeholder="Message moderators"
          />
        );
      })()}
    </div>
  );
}

// function MessageItem({ m }: { m: ChatMessage }) {
//   const raw = m.senderName || m.name || m.email || m.senderEmail || "";
//   const label = raw.includes("@") ? raw : formatDisplayName(raw);
//   const when = new Date(String(m.timestamp)).toLocaleTimeString();
//   return (
//     <div className="flex items-start gap-2">
//       <div className="shrink-0 mt-[2px] h-2 w-2 rounded-full bg-custom-dark-blue-1" />
//       <div className="min-w-0">
//         <div className="text-[12px] text-gray-600">
//           <span className="font-medium text-gray-900">{label}</span>
//           <span className="ml-2 text-[11px] text-gray-400">{when}</span>
//         </div>
//         <div className="whitespace-pre-wrap text-sm">{m.content}</div>
//       </div>
//     </div>
//   );
// }
