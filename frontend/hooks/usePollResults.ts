"use client";

import { useQuery } from "@tanstack/react-query";
import api from "lib/api";

// returns mapping questionId -> { total, counts: [{ value, count }] }
export function usePollResults(
  pollId: string,
  runId: string | undefined | null
) {
  return useQuery({
    queryKey: ["poll-results", pollId, runId],
    queryFn: async () => {
      if (!runId) return {} as Record<string, any>;
      const r = await api.get(`/api/v1/polls/${pollId}/results`, {
        params: { runId },
      });
      return r.data.data as Record<
        string,
        { total: number; counts: { value: any; count: number }[] }
      >;
    },
    enabled: !!pollId && !!runId,
  });
}

export default usePollResults;

