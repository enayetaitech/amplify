"use client";

import { useEffect } from "react";
import { useRoomContext } from "@livekit/components-react";

export default function ForceCameraOffSelfBridge() {
  const room = useRoomContext();
  useEffect(() => {
    const handler = async () => {
      try {
        if (room?.localParticipant) {
          await room.localParticipant.setCameraEnabled(false);
        }
      } catch (e) {
        console.error("Failed to self force-camera-off:", e);
      }
    };
    window.addEventListener("amplify:force-camera-off", handler);
    return () =>
      window.removeEventListener("amplify:force-camera-off", handler);
  }, [room]);
  return null;
}
