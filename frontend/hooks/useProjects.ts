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
  status?: string;
  from?: string;
  to?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export interface UseProjectsResult {
  projects: IProject[];
  meta: IPaginationMeta;
  isLoading: boolean;
  isError: boolean;
  error?: Error;
}

export function useMembershipProjects(userId: string | undefined) {
  const { data, isLoading, isError, error } = useQuery<
    { data: IProject[]; meta?: IPaginationMeta },
    Error
  >({
    queryKey: ["membership-projects", userId],
    queryFn: () =>
      api
        .get<{ data: IProject[]; meta?: IPaginationMeta }>(
          `/api/v1/projects/for-user/${userId}`
        )
        .then((res) => res.data),
    enabled: !!userId,
  });

  return {
    projects: data?.data ?? [],
    isLoading,
    isError,
    error: isError ? error : undefined,
  };
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
  tag = "",
  status,
  from,
  to,
  sortBy,
  sortDir,
}: UseProjectsParams): UseProjectsResult {
  const { data, error, isLoading, isError } = useQuery<
    { data: IProject[]; meta: IPaginationMeta },
    Error
  >({
    queryKey: [
      "projects",
      userId,
      page,
      search,
      tag,
      status,
      from,
      to,
      sortBy,
      sortDir,
    ],
    queryFn: () =>
      api
        .get<{
          data: IProject[];
          meta: IPaginationMeta;
        }>(`/api/v1/projects/get-project-by-userId/${userId}`, {
          params: {
            page,
            limit,
            search,
            tag,
            status,
            from,
            to,
            sortBy,
            sortDir,
          },
        })
        .then((res) => res.data),

    placeholderData: keepPreviousData,
  });

  return {
    projects: data?.data ?? [],
    meta: data?.meta ?? {
      totalItems: 0,
      totalPages: 0,
      page,
      limit,
      hasPrev: false,
      hasNext: false,
    },
    isLoading,
    isError,
    error: isError ? error : undefined,
  };
}
