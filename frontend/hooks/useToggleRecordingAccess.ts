// frontend/hooks/useToggleRecordingAccess.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "lib/api";
import { ApiResponse } from "@shared/interface/ApiResponseInterface";
import { IProject } from "@shared/interface/ProjectInterface";
import { toast } from "sonner";

/**
 * Hook for toggling a project's recordingAccess flag.
 *
 * Usage:
 *  const { mutate: toggleRecording, isPending } = useToggleRecordingAccess(projectId);
 *  toggleRecording();
 */
export function useToggleRecordingAccess(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<IProject>, Error, void>({
    mutationFn: async () => {
      const res = await api.patch<ApiResponse<IProject>>(
        "/api/v1/projects/toggle-recording-access",
        { projectId }
      );
      return res.data;
    },
    onSuccess: (response) => {
      const updated = response.data;
      if (updated.recordingAccess) {
        toast.success("Recording access granted");
      } else {
        toast.success("Recording access revoked");
      }
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
}
