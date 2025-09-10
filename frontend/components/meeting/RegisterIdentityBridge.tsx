"use client";

import { useEffect } from "react";
import { useRoomContext } from "@livekit/components-react";
import type { Socket } from "socket.io-client";
import { RoomEvent } from "livekit-client";

export default function RegisterIdentityBridge({
  socket,
  email,
}: {
  socket: Socket | null;
  email?: string;
}) {
  const room = useRoomContext();
  useEffect(() => {
    if (!room || !socket) return;

    const send = () => {
      const id = room.localParticipant?.identity;
      if (id) socket.emit("meeting:register-identity", { identity: id, email });
    };

    if (room.state === "connected") send();
    room.on(RoomEvent.Connected, send);
    return () => {
      room.off(RoomEvent.Connected, send);
    };
  }, [room, socket, email]);
  return null;
}

