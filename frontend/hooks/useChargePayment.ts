// hooks/useChargePayment.ts
"use client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "../lib/api";
import { IUser } from "@shared/interface/UserInterface";
import { ApiResponse } from "@shared/interface/ApiResponseInterface";
import { useGlobalContext } from "../context/GlobalContext";

export interface ChargeParams {
  amount: number;
  credits: number;
  customerId: string;
  userId: string;
}

/**
 * Charges a saved card, updates the user in context and localStorage,
 * then calls onSuccess (e.g. to kick off project creation).
 */
export function useChargePayment(onSuccess: () => void) {
  const { setUser } = useGlobalContext();
 
  return useMutation<{ data: { user: IUser } }, Error, ChargeParams>({
    mutationFn: ({ amount, credits, customerId, userId }) =>
      api
        .post<ApiResponse<{ user: IUser }>>("/api/v1/payment/charge", {
          customerId,
          amount,
          currency: "usd",
          userId,
          purchasedCredit: credits,
        })
        .then((res) => res.data),

    onSuccess: (apiResp) => {
      const updatedUser = apiResp.data.user;
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      toast.success("Payment successful");
      onSuccess();
    },

    onError: (err) => {
      toast.error(err.message ?? "Unknown error");
    },
  });
}
