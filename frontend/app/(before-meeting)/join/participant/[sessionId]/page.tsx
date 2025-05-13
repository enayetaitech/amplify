"use client";

import React, { useState} from "react";
import { useParams, useRouter } from "next/navigation";
import { useMeeting } from "context/MeetingContext";


export default function ParticipantJoinMeeting() {
  const router = useRouter();
  const {sessionId} = useParams();
 
  const { socket } = useMeeting();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [joining, setJoining] = useState(false);


  const handleJoin = () => {
    if (!name || !email || !socket) return;
    setJoining(true);

    localStorage.setItem(
      "liveSessionUser",
      JSON.stringify({ name, email, role: "Participant" })
    );

 

    socket.emit(
      "join-room",
      { sessionId, name, email, role: "Participant" },
      () => {
        setJoining(false);
        router.push(`/waiting-room/participant/${sessionId}`);
      }
    );
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <h2 className="text-xl font-semibold">Join as Participant</h2>
      <input
        className="w-full p-2 border rounded"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className="w-full p-2 border rounded"
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button
        className="w-full py-2 bg-green-600 text-white rounded"
        onClick={handleJoin}
        disabled={joining}
      >
        {joining ? "Joining…" : "Join Meeting"}
      </button>
    </div>
  );
}
