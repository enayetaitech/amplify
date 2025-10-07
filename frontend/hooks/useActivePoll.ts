"use client";

import { useQuery } from "@tanstack/react-query";
import api from "lib/api";

export function useActivePoll(sessionId: string) {
  return useQuery({
    queryKey: ["active-poll", sessionId],
    queryFn: async () => {
      const r = await api.get(`/api/v1/liveSessions/${sessionId}/active-poll`);
      return r.data.data as unknown;
    },
    enabled: !!sessionId,
  });
}

export default useActivePoll;
