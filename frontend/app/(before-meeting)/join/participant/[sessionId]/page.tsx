"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "lib/api";
import axios from "axios";
import { toast } from "sonner";

export default function ParticipantJoinMeeting() {
  const router = useRouter();
  const { sessionId: idParam } = useParams() as { sessionId: string };

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [joining, setJoining] = useState(false);

  async function resolveProjectToSession(projectId: string) {
    const res = await api.get<{ data: { sessionId: string } }>(
      `/api/v1/sessions/project/${projectId}/latest`,
      { params: { role: "Participant" } }
    );
    return res.data.data.sessionId;
  }

  async function tryGetSession(projectOrSessionId: string) {
    try {
      const res = await api.get<{
        data: { _id: string; projectId: string | { _id: string } };
      }>(`/api/v1/sessions/${projectOrSessionId}`);
      return {
        sessionId: res.data.data._id,
        projectId: res.data.data.projectId,
      };
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        return null;
      }
      throw err;
    }
  }

  const handleJoin = async () => {
    if (!name || !email) {
      toast.error("Name and email are required");
      return;
    }
    setJoining(true);
    try {
      // Determine if the route param is a sessionId or a projectId
      const maybeSession = await tryGetSession(idParam);
      let projectId: string;
      if (maybeSession) {
        // Always resolve via project to enforce Participant semantics
        type ProjectRef = string | { _id: string };
        const pid = maybeSession.projectId as ProjectRef;
        projectId = typeof pid === "string" ? pid : pid._id;
      } else {
        projectId = idParam;
      }

      // Resolve latest session for participant
      let sessionId: string;
      try {
        sessionId = await resolveProjectToSession(projectId);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          toast.error("No session is currently running");
          return;
        }
        throw err;
      }

      // Enqueue into waiting room
      await api.post(`/api/v1/waiting-room/enqueue`, {
        sessionId,
        name,
        email,
        role: "Participant",
      });

      localStorage.setItem(
        "liveSessionUser",
        JSON.stringify({ name, email, role: "Participant" })
      );

      router.push(`/waiting-room/participant/${sessionId}`);
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.message : "Failed to join";
      toast.error(msg);
    } finally {
      setJoining(false);
    }
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

      {/* localhost:3000/join/participant/670d9310667c144b9c271710 */}
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
