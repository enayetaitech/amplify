"use client";

import { useEffect } from "react";
import { useRoomContext } from "@livekit/components-react";
import type { Socket } from "socket.io-client";
import { toast } from "sonner";

export default function BreakoutWarningBridge({
  socket,
  role,
}: {
  socket: Socket | null;
  role: "admin" | "moderator" | "participant" | "observer";
}) {
  const room = useRoomContext();

  useEffect(() => {
    if (!socket) return;
    const handler = (payload: { index?: number; identity?: string }) => {
      const isAdminish = role === "admin" || role === "moderator";
      const localId = room?.localParticipant?.identity || "";
      const isTarget = !!payload?.identity && payload.identity === localId;
      if (isAdminish || isTarget) {
        toast(
          `1 min left to close breakout${
            payload?.index ? ` #${payload.index}` : ""
          }`
        );
      }
    };
    socket.on("breakout:one-minute-warning", handler);
    return () => {
      socket.off("breakout:one-minute-warning", handler);
    };
  }, [socket, room, role]);

  useEffect(() => {
    if (!socket) return;
    const onClosedMod = (payload: { index?: number }) => {
      if (role === "admin" || role === "moderator") {
        toast(`Breakout${payload?.index ? ` #${payload.index}` : ""} closed`);
      }
    };
    const onClosed = (payload: { index?: number; identities?: string[] }) => {
      const localId = room?.localParticipant?.identity || "";
      const involved = (payload?.identities || []).includes(localId);
      if (involved) {
        toast(
          `Breakout${
            payload?.index ? ` #${payload.index}` : ""
          } closed. You are being transferred to the main meeting.`
        );
      }
    };
    socket.on("breakout:closed-mod", onClosedMod);
    socket.on("breakout:closed", onClosed);
    return () => {
      socket.off("breakout:closed-mod", onClosedMod);
      socket.off("breakout:closed", onClosed);
    };
  }, [socket, room, role]);

  return null;
}
