"use client";
import { useQuery } from "@tanstack/react-query";
import api from "lib/api";
import { ApiResponse } from "@shared/interface/ApiResponseInterface";

export interface PurchaseItem {
  _id: string;
  credits: number;
  amountCents: number;
  currency: string;
  status: string;
  paymentIntentId?: string;
  chargeId?: string;
  receiptUrl?: string;
  createdAt: string;
}

export function usePurchases(limit = 20) {
  return useQuery({
    queryKey: ["purchases", limit],
    queryFn: async () => {
      const res = await api.get<
        ApiResponse<{ items: PurchaseItem[]; nextCursor?: string }>
      >(`/api/v1/payment/purchases?limit=${limit}`);
      return res.data.data;
    },
  });
}
