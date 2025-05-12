"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import api from "lib/api";
import { useParams, useRouter } from "next/navigation";
import React from "react";
import { ISession } from "@shared/interface/SessionInterface";
import { ILiveSession } from "@shared/interface/LiveSessionInterface";
import { toast } from "sonner";

const Sessions = () => {
  const { projectId } = useParams();
  const router = useRouter();

  const {
    data: sessions,
    isLoading,
    error,
  } = useQuery<ISession[], Error>({
    queryKey: ["sessions", projectId],
    queryFn: () =>
      api
        .get(`/api/v1/sessions/project/${projectId}`)
        .then((res) => res.data.data),
    enabled: Boolean(projectId),
  });

  // 2️⃣ Mutation to start a session
  const startSessionMutation = useMutation<ILiveSession, Error, string>({
    // 1️⃣ the actual mutation function, which takes the sessionId
    mutationFn: (sessionId) =>
      api
        .post<{ data: ILiveSession }>(`/api/v1/liveSessions/${sessionId}/start`)
        .then((res) => {
          console.log('Live session response', res.data.data)
          return res.data.data}),

    // 2️⃣ what to do when it succeeds
    onSuccess: (liveSession) => {
      console.log("moderator navigated to ->",liveSession._id)
      router.push(`/meeting/${liveSession._id}`);
    },

    // 3️⃣ optional error handling
    onError: (err) => {
      toast.error(err.message || "Could not start session");
    },
  });

  if (isLoading) return <p>Loading sessions…</p>;
  if (error) return <p className="text-red-500">Error: {error.message}</p>;

  return (
    <div className="space-y-4">
      {sessions!.map((session) => (
        <div
          key={session._id}
          className="p-4 border rounded flex items-center justify-between"
        >
          <div>
            <h3 className="text-lg font-medium">
              {session.title || "Session"}
            </h3>
            <p className="text-sm text-gray-600">ID: {session._id}</p>
          </div>

          <div className="space-x-2">
            {/* Start Session button */}
            <button
              onClick={() => startSessionMutation.mutate(session._id)}
              disabled={startSessionMutation.isPending}
            >
              {startSessionMutation.isPending ? "Starting…" : "Start Session"}
            </button>

            {/* Join Backroom button */}
            <button
              onClick={() =>
                router.push(
                  `/before-meeting/join/participant?sessionId=${session._id}`
                )
              }
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Join Backroom
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Sessions;
