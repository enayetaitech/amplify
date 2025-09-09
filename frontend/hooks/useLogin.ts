// hooks/useLogin.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import api from "lib/api";
import { IUser } from "@shared/interface/UserInterface";
import { ApiResponse, ErrorResponse } from "@shared/interface/ApiResponseInterface";
import { LoginFormValues } from "schemas/loginSchema";
import { useGlobalContext } from "context/GlobalContext";

/**
 * Custom hook that returns a login‐mutation object.
 * On success, it saves the user into global context + localStorage and navigates to "/projects".
 * On error, it toasts the appropriate message.
 */
export function useLogin() {
  const router = useRouter();
  const { setUser } = useGlobalContext();

  return useMutation<ApiResponse<{ user: IUser; token: string }>, AxiosError<ErrorResponse>, LoginFormValues>({
    mutationFn: (vals) =>
      api
        .post<ApiResponse<{ user: IUser; token: string }>>(
          "/api/v1/users/login",
          {
            email: vals.email,
            password: vals.password,
          },
          { withCredentials: true }
        )
        .then((res) => res.data),

    onSuccess: (resp) => {
      const { user } = resp.data;
      setUser(user);
      localStorage.setItem("user", JSON.stringify(user));
      toast.success(resp.message);
      router.replace("/projects");
    },

    onError: (err) => {
      console.error('err', err)
      const msg = axios.isAxiosError(err)
        ? err.response?.data.message ?? err.message
        : "Login failed";
      toast.error(msg);
    },
  });
}
