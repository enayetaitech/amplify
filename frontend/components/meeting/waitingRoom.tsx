"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "constant/socket";

type WaitingUser = {
  name: string;
  email: string;
  joinedAt: string;
  role: "Participant" | "Moderator" | "Admin";
};
type WaitingListPayload = { participantsWaitingRoom: WaitingUser[] };

export default function ModeratorWaitingPanel() {
  const { sessionId: sid, id } = useParams() as {
    sessionId?: string;
    id?: string;
  };
  const sessionId = sid ?? id;
  const [waiting, setWaiting] = useState<WaitingUser[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const joinedRef = useRef(false);
  
  console.log("sessionId", sessionId);

  // For demo: “me” as Moderator (in prod, JWT-protected page)
  const me = useMemo(
    () => ({ role: "Moderator", name: "Moderator", email: "mod@example.com" }),
    []
  );

  useEffect(() => {
    if (!sessionId) return;
    const s = io(SOCKET_URL, {
      path: "/socket.io",
      withCredentials: true,
      query: {
        sessionId: sessionId as string,
        role: me.role,
        name: me.name,
        email: me.email,
      },
    });
    socketRef.current = s;

    s.on("connect", () => {
      if (joinedRef.current) return;
      joinedRef.current = true;
      s.emit("join-room", {}, (rooms: WaitingListPayload) => {
        setWaiting(rooms.participantsWaitingRoom || []);
      });
    });

    s.on(
      "waiting:list",
      (payload: { participantsWaitingRoom: WaitingUser[] }) => {
        setWaiting(payload.participantsWaitingRoom || []);
      }
    );

    return () => {
      s.disconnect();
    };
  }, [me.email, me.name, me.role, sessionId]);

  const admit = (email: string) =>
    socketRef.current?.emit("waiting:admit", { email });
  const remove = (email: string) =>
    socketRef.current?.emit("waiting:remove", { email });
  const admitAll = () => socketRef.current?.emit("waiting:admitAll");

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Moderator – Waiting Room</h1>
        <button className="border rounded-lg px-3 py-2" onClick={admitAll}>
          Admit all
        </button>
      </div>

      <div className="rounded-xl border divide-y">
        {waiting.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">
            No one is waiting.
          </div>
        ) : (
          waiting.map((u) => (
            <div
              key={u.email}
              className="p-4 flex items-center justify-between"
            >
              <div>
                <div className="font-medium">{u.name}</div>
                <div className="text-xs text-muted-foreground">{u.email}</div>
              </div>
              <div className="space-x-2">
                <button
                  className="border rounded-lg px-3 py-2"
                  onClick={() => admit(u.email)}
                >
                  Admit
                </button>
                <button
                  className="border rounded-lg px-3 py-2"
                  onClick={() => remove(u.email)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
