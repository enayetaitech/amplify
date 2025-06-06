// frontend/hooks/useEditProjectDescription.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "lib/api";
import { ApiResponse } from "@shared/interface/ApiResponseInterface";
import { IProject } from "@shared/interface/ProjectInterface";
import { toast } from "sonner";

interface EditDescPayload {
  projectId: string;
  description: string;
}

/**
 * Hook for editing a project's description.
 *
 * Usage:
 *  const { mutate: editDesc, isPending } = useEditProjectDescription(projectId);
 *  editDesc({ description: "New description" });
 */
export function useEditProjectDescription(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<IProject>, Error, EditDescPayload>({
    mutationFn: async ({ projectId, description }) => {
      const res = await api.patch<ApiResponse<IProject>>(
        "/api/v1/projects/edit-project",
        { projectId, description }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast.success("Description updated");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
}
