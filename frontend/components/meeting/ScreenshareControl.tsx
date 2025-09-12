"use client";

import { useEffect, useState } from "react";
import { useRoomContext } from "@livekit/components-react";
import { RoomEvent, Track } from "livekit-client";
import { Button } from "components/ui/button";
import { ScreenShareIcon } from "@livekit/components-react";

export default function ScreenshareControl({
  role,
}: {
  role: "admin" | "moderator" | "participant" | "observer";
}) {
  const room = useRoomContext();
  const [allowed, setAllowed] = useState<boolean>(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    const lp = room.localParticipant;

    const compute = () => {
      if (role === "admin" || role === "moderator") {
        setAllowed(true);
        return;
      }

      const sources = (lp.permissions?.canPublishSources ??
        []) as unknown as Track.Source[];
      const can =
        sources.length === 0 ||
        sources.includes(Track.Source.ScreenShare) ||
        sources.includes(Track.Source.ScreenShareAudio);

      setAllowed(can);
    };

    compute();
    const onPerms = () => compute();
    room.on(RoomEvent.ParticipantPermissionsChanged, onPerms);
    return () => {
      room.off(RoomEvent.ParticipantPermissionsChanged, onPerms);
    };
  }, [room, role]);

  useEffect(() => {
    const sock = window.__meetingSocket;
    if (!sock) return;

    const stop = async () => {
      try {
        await room.localParticipant.setScreenShareEnabled(false);
      } catch {}
    };

    sock.on("meeting:force-stop-screenshare", stop);
    return () => {
      sock.off("meeting:force-stop-screenshare", stop);
    };
  }, [room]);

  useEffect(() => {
    const lp = room.localParticipant;
    if (!lp) return;

    const compute = () => {
      const hasShare =
        lp
          .getTrackPublications()
          .some((pub) => pub.source === Track.Source.ScreenShare) ||
        lp
          .getTrackPublications()
          .some((pub) => pub.source === Track.Source.ScreenShareAudio);
      setSharing(hasShare);
    };

    compute();

    const onPub = () => compute();
    const onUnpub = () => compute();

    room.on(RoomEvent.LocalTrackPublished, onPub);
    room.on(RoomEvent.LocalTrackUnpublished, onUnpub);
    return () => {
      room.off(RoomEvent.LocalTrackPublished, onPub);
      room.off(RoomEvent.LocalTrackUnpublished, onUnpub);
    };
  }, [room]);

  const toggle = async () => {
    await room.localParticipant.setScreenShareEnabled(!sharing);
  };

  if (!allowed) return null;

  return (
    <Button
      size="sm"
      onClick={toggle}
      title={sharing ? "Stop share" : "Share screen"}
    >
      <ScreenShareIcon />
      <span className="ml-1">{sharing ? "Stop" : "Share"}</span>
    </Button>
  );
}

