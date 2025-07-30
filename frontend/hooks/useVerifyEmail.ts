// hooks/useVerifyEmail.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import api from "lib/api";
import { ApiResponse, ErrorResponse } from "@shared/interface/ApiResponseInterface";

export function useVerifyEmail() {
  return useMutation<void, AxiosError<ErrorResponse>, string>({
    /**
     * We call GET /api/v1/users/verify-email?token=…
     * (adjust the path if yours is under /users/verify-email)
     */
    mutationFn: (token) =>
      api
        .get<ApiResponse<null>>("/api/v1/users/verify-email", { params: { token } })
        .then((res) => {
          // we only care about side-effects here
          console.log(res)
        }),
  });
}
