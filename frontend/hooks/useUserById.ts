// hooks/useUserById.ts
"use client";
import { useQuery } from "@tanstack/react-query";
import api from "lib/api";
import { ApiResponse, ErrorResponse } from "@shared/interface/ApiResponseInterface";
import { IUser } from "@shared/interface/UserInterface";

export function useUserById(id: string) {
  return useQuery<IUser, ErrorResponse>({
    queryKey: ["user", id],
    queryFn: () =>
      api
        .get<ApiResponse<IUser>>("/api/v1/users/find-by-id", { params: { id } })
        .then(res => res.data.data),
  });
}
