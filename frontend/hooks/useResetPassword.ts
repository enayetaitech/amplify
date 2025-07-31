// hooks/useResetPassword.ts
import { useMutation } from "@tanstack/react-query";

import type { ApiResponse, ErrorResponse } from "@shared/interface/ApiResponseInterface";
import { toast } from "sonner";
import api from "../lib/api";

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export default function useResetPassword() {
  return useMutation<
    ApiResponse<null>,
    { response?: { data: ErrorResponse } } & Error,
    ResetPasswordPayload
  >({
    mutationFn: ({ token, newPassword }) =>
      api
        .post<ApiResponse<null>>("/api/v1/users/reset-password", { token, newPassword })
        .then((res) => res.data),

    onSuccess: (response) => {
      toast.success(response.message);
    },

    onError: (error) => {
      const msg =
        error.response?.data.message || error.message || "Something went wrong";
      toast.error(msg);
    },
  });
}
