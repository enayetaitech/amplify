"use client";

import { useEffect } from "react";
import { useRoomContext } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import { UiRole } from "constant/roles";

export default function AutoPublishOnConnect({ role }: { role: UiRole }) {
  const room = useRoomContext();

  useEffect(() => {
    if (!room) return;

    const enableNow = async () => {
      if (role === "admin" || role === "moderator") {
        await room.localParticipant.setCameraEnabled(true);
        await room.localParticipant.setMicrophoneEnabled(false);
      }
    };

    if (room.state === "connected") {
      void enableNow();
      return;
    }

    const onConnected = () => {
      room.off(RoomEvent.Connected, onConnected);
      void enableNow();
    };
    room.on(RoomEvent.Connected, onConnected);

    return () => {
      room.off(RoomEvent.Connected, onConnected);
    };
  }, [room, role]);

  return null;
}

