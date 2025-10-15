"use client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "lib/api";
import { ApiResponse } from "@shared/interface/ApiResponseInterface";
import { IUser } from "@shared/interface/UserInterface";
import { useGlobalContext } from "context/GlobalContext";

export function useBuyCredits(onSuccess: () => void) {
  const { setUser } = useGlobalContext();

  return useMutation<
    { data: { user: IUser; receiptUrl?: string } },
    Error,
    { amountCents: number; credits: number; idempotencyKey?: string }
  >({
    mutationFn: ({ amountCents, credits, idempotencyKey }) =>
      api
        .post<ApiResponse<{ user: IUser; receiptUrl?: string }>>(
          "/api/v1/payment/charge",
          {
            amount: amountCents,
            currency: "usd",
            credits,
            idempotencyKey,
          }
        )
        .then((r) => r.data),
    onSuccess: (resp) => {
      const updatedUser = resp.data.user;
      setUser(updatedUser);
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
      toast.success("Credits purchased successfully");
      onSuccess();
    },
    onError: (err) => {
      toast.error(err?.message || "Payment failed");
    },
  });
}
