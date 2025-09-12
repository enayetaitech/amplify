"use client";

import { useEffect } from "react";
import { useRoomContext } from "@livekit/components-react";
import { RoomEvent, Track } from "livekit-client";

export default function SubscribeCameraBridge() {
  const room = useRoomContext();

  useEffect(() => {
    if (!room) return;

    const hasSetSubscribed = (
      pub: unknown
    ): pub is { setSubscribed: (b: boolean) => Promise<void> | void } => {
      return (
        !!pub &&
        typeof (pub as { setSubscribed?: unknown }).setSubscribed === "function"
      );
    };

    const ensureSubs = () => {
      try {
        for (const p of room.remoteParticipants.values()) {
          const pubs = p.getTrackPublications();
          for (const pub of pubs) {
            if (pub.source === Track.Source.Camera && !pub.isSubscribed) {
              try {
                if (hasSetSubscribed(pub)) {
                  void pub.setSubscribed(true);
                }
              } catch {}
            }
          }
        }
      } catch {}
    };

    const onConnected = () => ensureSubs();
    const onParticipantConnected = () => ensureSubs();
    const onTrackPublished = () => ensureSubs();

    if (room.state === "connected") ensureSubs();
    room.on(RoomEvent.Connected, onConnected);
    room.on(RoomEvent.ParticipantConnected, onParticipantConnected);
    room.on(RoomEvent.TrackPublished, onTrackPublished);
    return () => {
      room.off(RoomEvent.Connected, onConnected);
      room.off(RoomEvent.ParticipantConnected, onParticipantConnected);
      room.off(RoomEvent.TrackPublished, onTrackPublished);
    };
  }, [room]);
  return null;
}
