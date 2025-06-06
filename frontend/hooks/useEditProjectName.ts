// frontend/hooks/useEditProjectName.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "lib/api";
import { ApiResponse } from "@shared/interface/ApiResponseInterface";
import { IProject } from "@shared/interface/ProjectInterface";
import { toast } from "sonner";

interface EditNamePayload {
  projectId: string;
  internalProjectName: string;
}


export function useEditProjectName(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<IProject>, Error, EditNamePayload>({
    mutationFn: async ({ projectId, internalProjectName }) => {
      const res = await api.patch<ApiResponse<IProject>>(
        "/api/v1/projects/edit-project",
        { projectId, internalProjectName }
      );
      return res.data;
    },
    onSuccess: () => {
     
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast.success("Internal project name updated");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
}
