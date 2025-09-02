"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "constant/socket";
import type {
  IObserverWaitingUser,
  IParticipant,
  IObserver,
} from "@shared/interface/LiveSessionInterface";

type UserRole = "Participant" | "Observer" | "Moderator" | "Admin";

interface WaitingUser {
  name: string;
  email: string;
  role: Extract<UserRole, "Participant" | "Moderator" | "Admin">;
  joinedAt: string;
}

interface JoinAck {
  participantsWaitingRoom: WaitingUser[];
  observersWaitingRoom: IObserverWaitingUser[];
  participantList: IParticipant[];
  observerList: IObserver[];
}

export default function ParticipantWaitingRoom() {
  const { sessionId } = useParams() as { sessionId: string };
  const router = useRouter();
  // const { socket } = useMeeting();

  // Load 'me' from localStorage (set by Join page)
  const me = useMemo(() => {
    const raw = localStorage.getItem("liveSessionUser");
    if (!raw) {
      // If missing, bounce back to join
      router.replace(`/join/participant/${sessionId}`);
      throw new Error("Missing Live Session User");
    }
    return JSON.parse(raw) as { name: string; email: string; role: UserRole };
  }, [router, sessionId]);

  const [waiting, setWaiting] = useState<WaitingUser[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const joinedRef = useRef(false);

  // chat state
  // const [chatInput, setChatInput] = useState("");

  useEffect(() => {
    const s = io(SOCKET_URL, {
      path: "/socket.io",
      withCredentials: true,
      query: {
        sessionId,
        role: me.role,
        name: me.name,
        email: me.email,
      },
    });
    socketRef.current = s;

    s.on("connect", () => {
      if (joinedRef.current) return;
      joinedRef.current = true;

      s.emit("join-room", {}, (rooms: JoinAck) => {
        // exclude self from the UI list
        const others = (rooms.participantsWaitingRoom || []).filter(
          (u) => u.email !== me.email
        );
        setWaiting(others);
      });
    });

    s.on(
      "waiting:list",
      (payload: { participantsWaitingRoom: WaitingUser[] }) => {
        setWaiting(
          (payload.participantsWaitingRoom || []).filter(
            (u) => u.email !== me.email
          )
        );
      }
    );

    s.on("waiting:admitted", () => {
      // Navigate to the meeting page (camera/mic off by default in later milestones)
      router.push(`/meeting/${sessionId}`);
    });

    s.on("waiting:removed", () => {
      router.push(`/remove-participant`); // implement simple “removed” page later
    });

    return () => {
      s.disconnect();
    };
  }, [me.email, me.name, me.role, router, sessionId]);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Waiting Room</h1>
      <p className="text-sm text-muted-foreground">
        Hi {me.name}, you’ll enter the meeting once the moderator admits you.
      </p>

      <div className="rounded-xl border p-4">
        <h2 className="font-medium mb-2">Other participants waiting</h2>
        {waiting.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You’re the first here.
          </p>
        ) : (
          <ul className="space-y-2">
            {waiting.map((u) => (
              <li key={u.email} className="flex items-center justify-between">
                <span>{u.name}</span>
                <span className="text-xs text-muted-foreground">{u.email}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
