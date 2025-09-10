// hooks/useResolveParticipantSession.ts
"use client";

import { useCallback } from "react";
import axios from "axios";
import api from "lib/api";

type TryGetSessionResponse = {
  _id: string;
  projectId: string | { _id: string };
};

export function useResolveParticipantSession() {
  const tryGetSession = useCallback(async (projectOrSessionId: string) => {
    try {
      const res = await api.get<{ data: TryGetSessionResponse }>(
        `/api/v1/sessions/${projectOrSessionId}`
      );
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
  }, []);

  const getLatestForProject = useCallback(async (projectId: string) => {
    const res = await api.get<{ data: { sessionId: string } }>(
      `/api/v1/sessions/project/${projectId}/latest`,
      { params: { role: "Participant" } }
    );
    return res.data.data.sessionId;
  }, []);

  const resolve = useCallback(
    async (projectOrSessionId: string) => {
      const maybe = await tryGetSession(projectOrSessionId);
      let projectId: string;
      if (maybe) {
        const pid = maybe.projectId as string | { _id: string };
        projectId = typeof pid === "string" ? pid : pid._id;
      } else {
        projectId = projectOrSessionId;
      }
      const sessionId = await getLatestForProject(projectId);
      return { sessionId, projectId };
    },
    [tryGetSession, getLatestForProject]
  );

  return { tryGetSession, getLatestForProject, resolve };
}
