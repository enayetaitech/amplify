"use client";

import { useQuery } from "@tanstack/react-query";
import api from "lib/api";

export type PollRunLite = {
  _id: string;
  runNumber: number;
  status: "OPEN" | "CLOSED";
  launchedAt?: string;
  closedAt?: string;
  anonymous?: boolean;
  shareResults?: "never" | "onStop" | "immediate";
};

export default function usePollRuns(pollId: string) {
  return useQuery<PollRunLite[]>({
    queryKey: ["poll-runs", pollId],
    queryFn: async () => {
      const r = await api.get(`/api/v1/polls/${pollId}/runs`);
      return r.data.data as PollRunLite[];
    },
    enabled: !!pollId,
  });
}
