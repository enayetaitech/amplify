// hooks/useUpdateUser.ts
"use client";
import { useMutation } from "@tanstack/react-query";
import api from "lib/api";
import { ApiResponse } from "@shared/interface/ApiResponseInterface";
import { ErrorResponse } from "@shared/interface/ApiResponseInterface";
import { useGlobalContext } from "context/GlobalContext";
import { toast } from "sonner";
import { IUser, EditUser } from "@shared/interface/UserInterface";
import { useRouter } from "next/navigation";

export function useUpdateUser(id: string) {
  const { setUser: setGlobalUser } = useGlobalContext();
  const router = useRouter();

  return useMutation<IUser, ErrorResponse, EditUser>({
    mutationFn: updatedFields =>
      api
        .put<ApiResponse<IUser>>(`/api/v1/users/edit/${id}`, updatedFields)
        .then(res => res.data.data),

    onSuccess: updatedUser => {
      setGlobalUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      toast.success("Profile updated successfully");
      router.push(`/my-profile/${id}`);
    },

    onError: err => {
      console.error("Error updating profile:", err);
      toast.error(err.message || "Failed to update profile");
    },
  });
}
