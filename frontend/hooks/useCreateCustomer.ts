// hooks/useCreateCustomer.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import api from "lib/api";
import { toast } from "sonner";
import { useGlobalContext } from "context/GlobalContext";

export function useCreateCustomer() {
  const { user, setUser } = useGlobalContext();

  return useMutation({
    mutationFn: () =>
      api.post("/api/v1/payment/create-customer", {
        userId: user?._id,
        billingInfo: user?.billingInfo,
      }),
    onSuccess: (res) => {
      // response contains stripeCustomerId
      setUser({ ...user!, stripeCustomerId: res.data.data.stripeCustomerId });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unknown error");
    },
  });
}
