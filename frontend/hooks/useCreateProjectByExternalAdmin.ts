// hooks/useCreateProjectByExternalAdmin.ts
"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "../lib/api";
import { ApiResponse } from "@shared/interface/ApiResponseInterface";
import { IProjectFormState } from "@shared/interface/CreateProjectInterface";
import { useGlobalContext } from "../context/GlobalContext";
import { IProject } from "@shared/interface/ProjectInterface";

export interface CreateProjectParams {
  uniqueId: string;
  formState: IProjectFormState;
  totalPurchasePrice: number;
  totalCreditsNeeded: number;
}

/**
 * Hits “create-project-by-external-admin”, invalidates the user’s projects list,
 * and calls onSuccess with the new project’s ID to open the modal.
 */
export function useCreateExternalProject(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formatProjectData: (raw: IProjectFormState) => Partial<IProject>,
  onSuccess: (newProjectId: string) => void
) {
  const { user } = useGlobalContext();
  const qc = useQueryClient();

  return useMutation<
    ApiResponse<{ data: { _id: string } }>,
    Error,
    CreateProjectParams
  >({
    mutationFn: ({ uniqueId, formState, totalPurchasePrice, totalCreditsNeeded }) =>
      api.post("/api/v1/projects/create-project-by-external-admin", {
        userId: user?._id,
        uniqueId,
        projectData: formatProjectData(formState),
        totalPurchasePrice,
        totalCreditsNeeded,
      }),

    onSuccess: (resp) => {
      const newId = resp.data.data._id;
      toast.success("Project created");
      qc.invalidateQueries({ queryKey: ["projectsByUser", user?._id] });
      onSuccess(newId);
    },

    onError: (err) => {
      toast.error(err.message ?? "Could not create project");
    },
  });
}
