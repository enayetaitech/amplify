// hooks/useSaveBilling.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "lib/api";
import axios, { AxiosError } from "axios";
import { ApiResponse, ErrorResponse } from "@shared/interface/ApiResponseInterface";
import { IBillingInfo } from "@shared/interface/UserInterface";

interface SaveBillingPayload {
  userId: string;
  billingInfo: IBillingInfo;
}

export function useSaveBilling(onSuccessCallback: () => void) {
  return useMutation<
    ApiResponse<null>,
    AxiosError<ErrorResponse>,
    SaveBillingPayload
  >({
    mutationFn: ({ userId, billingInfo }) =>
      api
        .post<ApiResponse<null>>(
          "/api/v1/payment/save-billing-info",
          { userId, billingInfo }
        )
        .then((res) => res.data),

    onSuccess: () => {
      toast.success("Billing info saved successfully");
      onSuccessCallback();
    },

    onError: (error) => {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message ?? error.message
        : "Unknown error";
      toast.error(message);
    },
  });
}
