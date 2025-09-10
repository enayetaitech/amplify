"use client";

import { useEffect } from "react";
import { useRoomContext } from "@livekit/components-react";

export default function ForceMuteSelfBridge() {
  const room = useRoomContext();
  useEffect(() => {
    const handler = async () => {
      try {
        if (room?.localParticipant) {
          await room.localParticipant.setMicrophoneEnabled(false);
        }
      } catch (e) {
        console.error("Failed to self force-mute:", e);
      }
    };
    window.addEventListener("amplify:force-mute-self", handler);
    return () => window.removeEventListener("amplify:force-mute-self", handler);
  }, [room]);
  return null;
}

