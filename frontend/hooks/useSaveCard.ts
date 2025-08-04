// hooks/useSaveCard.ts
"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "lib/api";
import { IUser } from "@shared/interface/UserInterface";
import { ApiResponse, ErrorResponse } from "@shared/interface/ApiResponseInterface";
import { useGlobalContext } from "../context/GlobalContext";

export function useSaveCard() {
  const { user, setUser } = useGlobalContext();
  const qc = useQueryClient();

  return useMutation<IUser, ErrorResponse, string>({
    mutationFn: async (paymentMethodId) => {
      if (!user) throw new Error("Not authenticated");
      const res = await api.post<ApiResponse<{ user: IUser }>>(
        "/api/v1/payment/save-payment-method",
        {
          customerId: user.stripeCustomerId!,
          paymentMethodId,
        }
      );
      return res.data.data.user;
    },
    onSuccess: (newUser) => {
      setUser(newUser);
      qc.invalidateQueries({ queryKey: ["stripeSetupIntent", user!._id] });
      toast.success("Card saved successfully");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unknown error");
    },
  });
}
