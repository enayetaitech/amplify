"use client";

import { useEffect } from "react";
import type { Socket } from "socket.io-client";

export default function MeetingJoinBridge({
  socket,
}: {
  socket: Socket | null;
}) {
  useEffect(() => {
    if (!socket) return;
    socket.emit("meeting:join");
    return () => {
      try {
        socket.emit("meeting:leave");
      } catch {}
    };
  }, [socket]);
  return null;
}
