// frontend/utils/hooks/useProjects.ts
"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import api from "lib/api";
import { IProject } from "@shared/interface/ProjectInterface";
import { IPaginationMeta } from "@shared/interface/PaginationInterface";

export interface UseProjectsParams {
  userId: string | undefined;
  page: number;
  limit?: number;
  search?: string;
  tag?: string;
}

export interface UseProjectsResult {
  projects: IProject[];
  meta: IPaginationMeta;
  isLoading: boolean;
  isError: boolean;
  error?: Error;
}

/**
 * Fetch projects for a given userId / page / search.
 * Returns: { projects, meta, isLoading, isError, error }.
 *
 * Automatically keeps previous data while paginating.
 */
export function useProjects({
  userId,
  page,
  limit = 10,
  search = "",
  tag=""
}: UseProjectsParams): UseProjectsResult {
  const {
    data,
    error,
    isLoading,
    isError,
  } = useQuery<
    { data: IProject[]; meta: IPaginationMeta },
    Error
  >({
    queryKey: ["projects", userId, page, search, tag],
    queryFn: () =>
      api
        .get<{
          data: IProject[];
          meta: IPaginationMeta;
        }>(`/api/v1/projects/get-project-by-userId/${userId}`, {
          params: { page, limit, search, tag },
        })
        .then((res) => res.data),
    // show last page’s data while fetching new page
    placeholderData: keepPreviousData,
    // enabled: Boolean(userId),
  });

  return {
    projects: data?.data ?? [],
    meta: data?.meta ?? { totalItems: 0, totalPages: 0, page, limit, hasPrev: false, hasNext: false },
    isLoading,
    isError,
    error: isError ? error : undefined,
  };
}
