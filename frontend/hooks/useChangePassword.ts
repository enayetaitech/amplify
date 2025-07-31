// hooks/useChangePassword.ts
import { useMutation } from "@tanstack/react-query";

import { toast } from "sonner";
import type { ApiResponse, ErrorResponse } from "@shared/interface/ApiResponseInterface";
import api from "../lib/api";

export interface ChangePasswordPayload {
  userId: string;
  oldPassword: string;
  newPassword: string;
}

export default function useChangePassword() {
  return useMutation<
    ApiResponse<null>,
    { response?: { data: ErrorResponse } } & Error,
    ChangePasswordPayload
  >({
    mutationFn: ({ userId, oldPassword, newPassword }) =>
      api
        .post<ApiResponse<null>>("/api/v1/users/change-password", {
          userId,
          oldPassword,
          newPassword,
        })
        .then((r) => r.data),

    onSuccess: (response) => {
      toast.success(response.message);
    },

    onError: (err) => {
      const msg =
        err.response?.data.message || err.message || "Something went wrong";
      toast.error(msg);
    },
  });
}
