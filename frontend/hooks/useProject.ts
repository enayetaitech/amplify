// frontend/hooks/useProject.ts
"use client";

import { ApiResponse } from "@shared/interface/ApiResponseInterface";
import { IProject } from "@shared/interface/ProjectInterface";
import { useQuery } from "@tanstack/react-query";
import api from "lib/api";

/**
 * Fetch a single project by ID.
 */
async function fetchProjectById(id: string): Promise<IProject> {
  const res = await api.get<ApiResponse<IProject>>(
    `/api/v1/projects/get-project-by-id/${id}`
  );
  return res.data.data;
}

export function useProject(projectId: string | undefined) {
  return useQuery<IProject, Error>({
    queryKey: ["project", projectId],
    queryFn: () => fetchProjectById(projectId!),
    enabled: Boolean(projectId),
  });
}
