"use client";

import { useQuery } from "@tanstack/react-query";
import api from "lib/api";

export type PollResponder = { userId?: string; name?: string; email?: string };
export type PollResponseItem = {
  responder?: PollResponder;
  answers: { questionId: string; value?: unknown }[];
  submittedAt: string;
};

export default function usePollResponses(pollId: string, runId: string | null) {
  return useQuery<{ run: unknown; responses: PollResponseItem[] }>({
    queryKey: ["poll-responses", pollId, runId],
    queryFn: async () => {
      const r = await api.get(`/api/v1/polls/${pollId}/responses`, {
        params: { runId },
      });
      return r.data.data as { run: unknown; responses: PollResponseItem[] };
    },
    enabled: !!pollId && !!runId,
  });
}
