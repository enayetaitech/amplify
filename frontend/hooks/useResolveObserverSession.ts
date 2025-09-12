// hooks/useResolveObserverSession.ts
"use client";

import { useCallback } from "react";
import axios from "axios";
import api from "lib/api";

type TryGetSessionResponse = {
  _id: string;
  projectId: string | { _id: string };
};

export interface LatestObserverSession {
  sessionId: string;
  status: "ongoing" | "upcoming";
}

export function useResolveObserverSession() {
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
    const res = await api.get<{ data: LatestObserverSession }>(
      `/api/v1/sessions/project/${projectId}/latest`,
      { params: { role: "Observer" } }
    );
    return res.data.data;
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
      const latest = await getLatestForProject(projectId);
      return { latest, projectId };
    },
    [tryGetSession, getLatestForProject]
  );

  return { tryGetSession, getLatestForProject, resolve };
}
