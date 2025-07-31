import { useMutation } from "@tanstack/react-query";
import type {
  ApiResponse,
  ErrorResponse,
} from "@shared/interface/ApiResponseInterface";
import { toast } from "sonner";
import api from "lib/api";

interface ForgotPasswordData {
  email: string;
}

export default function useForgotPassword() {
  return useMutation<
    ApiResponse<null>,
    { response?: { data: ErrorResponse } } & Error,
    ForgotPasswordData
  >({
    mutationFn: ({ email }) =>
      api
        .post<ApiResponse<null>>("/api/v1/users/forgot-password", { email })
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
