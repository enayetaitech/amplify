// hooks/useDeleteUser.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import api from "lib/api";
import { toast } from "sonner";
import { useGlobalContext } from "context/GlobalContext";
import { useRouter } from "next/navigation";
import { ErrorResponse } from "@shared/interface/ApiResponseInterface";

export function useDeleteUser() {
  const { setUser } = useGlobalContext();
  const router = useRouter();

  return useMutation<void, ErrorResponse, string>({
    mutationFn: (userId) =>
      api
        .delete(`/api/v1/users/${userId}`)
        .then(res => res.data.data),
    onSuccess: () => {
      toast.success("Account deleted");
      setUser(null);
      router.push("/login");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete account");
    },
  });
}
