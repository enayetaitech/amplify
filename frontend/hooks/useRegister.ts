// hooks/useRegister.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import api from "lib/api";
import { IUser } from "@shared/interface/UserInterface";
import { ApiResponse } from "@shared/interface/ApiResponseInterface";
import { RegisterFormValues } from "schemas/registerSchema";

/**
 * Custom hook that returns a `useMutation`-powered object for registering a user.
 * It automatically handles the API call, error toasting, and redirect on success.
 */
export function useRegister() {
  const router = useRouter();

  return useMutation<IUser, unknown, { values: RegisterFormValues; fullPhoneNumber: string }>({
    // 1) mutation function: call the API
    mutationFn: async ({ values, fullPhoneNumber }) => {
      const res = await api.post<ApiResponse<IUser>>(
        "/api/v1/users/register",
        {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phoneNumber: fullPhoneNumber,
          companyName: values.companyName,
          password: values.password,
          termsAccepted: values.terms,
          role: "Admin",
        }
      );
      return res.data.data;
    },

    // 2) on success: show toast & redirect to account activation
    onSuccess: (_, { values }) => {
      toast.success("Your registration was successful!");
      router.push(`/account-activation?email=${encodeURIComponent(values.email)}`);
    },

    // 3) on error: toast the error message
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || "Registration failed";
        toast.error(message);
      } else {
        toast.error("Registration failed");
      }
    },
  });
}
