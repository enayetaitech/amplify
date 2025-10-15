"use client";
import { useQuery } from "@tanstack/react-query";
import api from "lib/api";
import { ApiResponse } from "@shared/interface/ApiResponseInterface";

export interface UsageItem {
  sessionId: string;
  sessionTitle?: string;
  projectId: string;
  projectName?: string;
  date: string;
  creditsUsed?: number;
}

export function useUsage(period: "month" | "quarter" = "month", limit = 5) {
  return useQuery({
    queryKey: ["usage", period, limit],
    queryFn: async () => {
      const res = await api.get<
        ApiResponse<{
          items: UsageItem[];
          totalCreditsUsed: number;
          period: string;
        }>
      >(`/api/v1/payment/usage?period=${period}&limit=${limit}`);
      return res.data.data;
    },
  });
}
