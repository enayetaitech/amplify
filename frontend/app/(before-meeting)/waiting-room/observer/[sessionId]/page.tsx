"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { SOCKET_URL } from "constant/socket";

export default function ObserverWaitingRoom() {
  const { sessionId } = useParams() as { sessionId: string };
  const router = useRouter();

  useEffect(() => {
    if (!sessionId) return;

    const s = io(SOCKET_URL, {
      path: "/socket.io",
      withCredentials: true,
      query: { sessionId, role: "Observer" },
    });

    const onStarted = () => {
      router.replace(`/meeting/${sessionId}?role=Observer`);
    };

    s.on("observer:stream:started", onStarted);

    return () => {
      s.off("observer:stream:started", onStarted);
      s.disconnect();
    };
  }, [router, sessionId]);

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-2">Observer Waiting Room</h2>
      <p className="text-sm text-muted-foreground">
        Waiting for the stream to start. You will be redirected automatically.
      </p>
    </div>
  );
}
