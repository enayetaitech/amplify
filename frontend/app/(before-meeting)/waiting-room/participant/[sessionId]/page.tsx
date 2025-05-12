"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMeeting } from "context/MeetingContext";
import { IWaitingRoomChat } from "@shared/interface/WaitingRoomChatInterface";

interface WaitingUser {
  name: string;
  email: string;
  joinedAt: string;
}

export default function ParticipantWaitingRoom() {
  const { sessionId } = useParams();
  const router = useRouter();
  const { socket } = useMeeting();

  const me = JSON.parse(localStorage.getItem("liveSessionUser")!) as {
    name: string;
    email: string;
    role: string;
  };

  const [waiting, setWaiting] = useState<WaitingUser[]>([]);

  // chat state
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<IWaitingRoomChat[]>([]);

  const hasJoinedRef = useRef(false);

  useEffect(() => {
    if (!socket) return;

    // guard so we only ever emit once
    if (!hasJoinedRef.current) {
      hasJoinedRef.current = true;

      socket.emit(
        "join-room",
        { sessionId, ...me },
        (rooms: { participants: WaitingUser[] }) => {
          const initial = rooms.participants.filter(
            (u) => u.email !== me.email
          );
          setWaiting(initial);
        }
      );
    }

    socket.on("participantWaitingRoomUpdate", (list) => {
      const filtered = list.filter((u: WaitingUser) => u.email !== me.email);

      setWaiting(filtered);
      if (!list.some((p: WaitingUser) => p.email === me.email)) {
        router.push("/remove-participant");
      }
    });

    socket.on("participantListUpdate", (participants: WaitingUser[]) => {
      if (participants.find((p) => p.email === me.email)) {
        router.push(`/meeting/${sessionId}`);
      }
    });

    // chat recv
    socket.on(
      "participant-waiting-room:receive-message",
      (msg: IWaitingRoomChat & { timestamp: string }) => {
        const withDate: IWaitingRoomChat = {
          ...msg,
          timestamp: new Date(msg.timestamp),
        };
        if (withDate.email === me.email) {
          setMessages((prev) => [...prev, withDate]);
        }
      }
    );

    return () => {
      socket.off("participantWaitingRoomUpdate");
      socket.off("participantListUpdate");
      socket.off("participant-waiting-room:receive-message");
    };
  }, [sessionId, socket]);

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    const payload = {
      sessionId,
      email: me.email,
      senderName: me.name,
      role: "Participant" as const,
      content: chatInput.trim(),
    };
    socket?.emit("participant-waiting-room:send-message", payload);
    setChatInput("");
  };

  return (
    <div className="max-w-lg mx-auto p-4 space-y-6">
      <h2 className="text-2xl font-semibold">Waiting Room</h2>

      <div className="border p-4 rounded space-y-2">
        <h3 className="font-medium">People waiting:</h3>
        {waiting.map((u) => (
          <div key={`${u.email}-${u.joinedAt}`} className="text-gray-700">
            {u.name} <span className="text-sm text-gray-500">({u.email})</span>
          </div>
        ))}
      </div>

      <div className="border p-4 rounded space-y-2 h-64 flex flex-col">
        <h3 className="font-medium">Chat with moderator</h3>
        <div className="flex-1 overflow-y-auto space-y-1">
          {messages.map((m) => (
            <div
              key={`${m.email}-${m.timestamp.toISOString()}`}
              className={`flex ${
                m.role === "Participant" ? "justify-end" : "justify-start"
              }`}
            >
              <span
                className={`px-3 py-1 rounded ${
                  m.role === "Participant"
                    ? "bg-green-200 text-green-800"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                {m.content}
              </span>
            </div>
          ))}
        </div>
        <div className="flex space-x-2">
          <input
            className="flex-1 border rounded px-2"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Type a message…"
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            className="px-4 py-1 bg-blue-600 text-white rounded"
            onClick={sendMessage}
          >
            Send
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-500">
        Waiting for the moderator to admit you…
      </p>
    </div>
  );
}
