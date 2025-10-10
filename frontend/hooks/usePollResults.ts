"use client";

import { useQuery } from "@tanstack/react-query";
import api from "lib/api";

type OptionCount = { value: unknown; count: number };
type Aggregate = { total: number; counts: OptionCount[] };
type AggregatesMap = Record<string, Aggregate>;

// returns mapping questionId -> { total, counts: [{ value, count }] }
export function usePollResults(
  pollId: string,
  runId: string | undefined | null,
  sessionId?: string
) {
  return useQuery<AggregatesMap>({
    queryKey: ["poll-results", pollId, runId, sessionId],
    queryFn: async () => {
      if (!runId) return {} as AggregatesMap;
      const r = await api.get(`/api/v1/polls/${pollId}/results`, {
        params: { runId, sessionId },
      });
      return r.data.data as AggregatesMap;
    },
    enabled: !!pollId && !!runId && !!sessionId,
  });
}

export default usePollResults;
