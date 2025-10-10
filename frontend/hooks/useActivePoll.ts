"use client";

import { useQuery } from "@tanstack/react-query";
import api from "lib/api";
import { IPoll } from "@shared/interface/PollInterface";

export type PollRun = {
  _id: string;
  runNumber: number;
  status: "OPEN" | "CLOSED";
  anonymous?: boolean;
  shareResults?: "never" | "onStop" | "immediate";
};

export type ActivePollResp = { poll?: IPoll; run?: PollRun } | null;

export function useActivePoll(sessionId: string) {
  return useQuery<ActivePollResp>({
    queryKey: ["active-poll", sessionId],
    queryFn: async () => {
      const r = await api.get(`/api/v1/liveSessions/${sessionId}/active-poll`);
      return (r.data.data as ActivePollResp) || null;
    },
    enabled: !!sessionId,
  });
}

export default useActivePoll;
