// hooks/useResolveObserverSession.ts
"use client";

import { useCallback } from "react";
import axios from "axios";
import api from "lib/api";

// Use the same base URL as the shared api instance when calling low-level
// session lookups so we can bypass the global axios response interceptor
// (which triggers silent refresh on certain error flows). This keeps the
// user-facing logic that treats 404 as "not found" from causing a token
// refresh attempt.
const BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_BASE_URL?.trim() || "https://amplifyre.shop";

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
      // Use the plain axios client (no interceptors) so a 404 here is treated
      // as a legitimate "not found" condition and won't trigger the
      // silent-refresh flow defined on the `api` instance.
      const res = await axios.get<{ data: TryGetSessionResponse }>(
        `${BASE_URL}/api/v1/sessions/${projectOrSessionId}`,
        { withCredentials: true }
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
