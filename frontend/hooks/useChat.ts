"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

export type ChatScope =
  | "waiting_dm"
  | "meeting_group"
  | "meeting_dm"
  | "meeting_mod_dm"
  | "observer_wait_group"
  | "observer_wait_dm"
  | "stream_group"
  | "stream_dm_obs_obs"
  | "stream_dm_obs_mod";

export type ChatMessage = {
  _id?: string;
  sessionId?: string;
  email: string;
  senderName: string;
  role: "Participant" | "Observer" | "Moderator";
  content: string;
  timestamp: string | Date;
  scope: ChatScope;
  toEmail?: string;
  // group models shape
  senderEmail?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
};

type ThreadKey = string; // e.g. participant email for moderator pool DM thread, or peer email for 1:1

function makeThreadKey(
  scope: ChatScope,
  meEmail: string | null,
  peer?: string | null
): ThreadKey {
  const m = (meEmail || "").toLowerCase();
  const p = (peer || "").toLowerCase();
  return `${scope}::${m}::${p}`;
}

export function useChat(params: {
  socket: Socket | null;
  sessionId: string;
  my: {
    email: string;
    name: string;
    role: "Participant" | "Observer" | "Moderator" | "Admin";
  };
}) {
  const { socket, my } = params;
  const [byScope, setByScope] = useState<Record<string, ChatMessage[]>>({});
  const [byThread, setByThread] = useState<Record<ThreadKey, ChatMessage[]>>(
    {}
  );
  const meEmailLower = (my?.email || "").toLowerCase();
  const sockRef = useRef<Socket | null>(null);
  const seenByScopeRef = useRef<Record<string, Set<string>>>({});

  useEffect(() => {
    sockRef.current = socket || null;
    if (!socket) return;

    const onNew = (payload: { scope: ChatScope; message: ChatMessage }) => {
      const { scope, message } = payload || ({} as any);
      console.log('payload', payload);
      console.log('scope', scope);
      console.log('message', message);
      if (!scope || !message) return;
      const idKey = String(
        (message as any)._id ||
          `${(
            message.email ||
            message.senderEmail ||
            ""
          ).toLowerCase()}-${String(message.timestamp)}-${message.content}`
      );
      if (!seenByScopeRef.current[scope])
        seenByScopeRef.current[scope] = new Set();
      if (seenByScopeRef.current[scope].has(idKey)) return;
      seenByScopeRef.current[scope].add(idKey);
      setByScope((prev) => {
        const next = { ...prev };
        const list = next[scope] ? [...next[scope]] : [];
        list.push(message);
        next[scope] = list;
        return next;
      });

      // DM threading
      if (
        scope === "waiting_dm" ||
        scope === "meeting_dm" ||
        scope === "meeting_mod_dm" ||
        scope === "observer_wait_dm" ||
        scope === "stream_dm_obs_obs" ||
        scope === "stream_dm_obs_mod"
      ) {
        const peer = (() => {
          const sender = (
            message.email ||
            message.senderEmail ||
            ""
          ).toLowerCase();
          const to = (message.toEmail || "").toLowerCase();
          if (scope === "waiting_dm" || scope === "meeting_dm") {
            // participant → __moderators__; moderator → participant
            if (to === "__moderators__") return sender; // participant thread appears under their own email for moderators
            return sender === meEmailLower ? to : sender;
          }
          // 1:1
          return sender === meEmailLower ? to : sender;
        })();
        const key = makeThreadKey(scope, meEmailLower, peer);
        setByThread((prev) => {
          const next = { ...prev };
          const list = next[key] ? [...next[key]] : [];
          list.push(message);
          next[key] = list;
          return next;
        });
      }
    };

    socket.on("chat:new", onNew);
    return () => {
      socket.off("chat:new", onNew);
    };
  }, [socket, meEmailLower]);

  const send = useCallback(
    async (scope: ChatScope, content: string, toEmail?: string) => {
      const s = sockRef.current;
      if (!s) return { ok: false, error: "no_socket" } as const;
      return new Promise<{ ok: boolean; error?: string }>((resolve) => {
        s.emit(
          "chat:send",
          { scope, content, toEmail },
          (ack?: { ok?: boolean; error?: string }) => {
            resolve({ ok: !!ack?.ok, error: ack?.error });
          }
        );
      });
    },
    []
  );

  const getHistory = useCallback(
    async (
      scope: ChatScope,
      options?: { withEmail?: string; limit?: number }
    ) => {
      const s = sockRef.current;
      if (!s) return [] as ChatMessage[];
      const payload: any = { scope, limit: options?.limit ?? 50 };
      if (options?.withEmail) payload.thread = { withEmail: options.withEmail };
      return new Promise<ChatMessage[]>((resolve) => {
        s.emit(
          "chat:history:get",
          payload,
          (resp?: { items?: ChatMessage[] }) => {
            resolve(Array.isArray(resp?.items) ? resp!.items! : []);
          }
        );
      });
    },
    []
  );

  return useMemo(
    () => ({
      send,
      getHistory,
      messagesByScope: byScope,
      messagesByThread: byThread,
      makeThreadKey,
    }),
    [send, getHistory, byScope, byThread]
  );
}

export default useChat;
