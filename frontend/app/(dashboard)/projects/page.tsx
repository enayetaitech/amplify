"use client";
import React, { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useGlobalContext } from "context/GlobalContext";
import api from "lib/api";
import { IProject } from "@shared/interface/ProjectInterface";
import axios from "axios";
import NoSearchResult from "components/NoSearchResult";

import CustomButton from "components/shared/CustomButton";
import { CalendarIcon, Plus, SearchIcon } from "lucide-react";
import HeadingBlue25px from "components/HeadingBlue25pxComponent";
import { Input } from "components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "components/ui/popover";
import { Button } from "components/ui/button";
import { Calendar } from "components/ui/calendar";
import { format } from "date-fns";
import CustomPagination from "components/shared/Pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import { Badge } from "components/ui/badge";
import { IPaginationMeta } from "@shared/interface/PaginationInterface";
import { useRouter } from "next/navigation";

type DateRange = [Date, Date] | undefined;

const Projects: React.FC = () => {
  const { user } = useGlobalContext();
  const router = useRouter();
  const userId = user?._id;
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>(undefined);
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, error, isLoading } = useQuery<
    { data: IProject[]; meta: IPaginationMeta },
    Error
  >({
    queryKey: ["projects", userId, page],
    queryFn: () =>
      api
        .get<{
          data: IProject[];
          meta: IPaginationMeta;
        }>(`/api/v1/projects/get-project-by-userId/${userId}`, {
          params: { page, limit },
        })
        .then((res) => res.data),
    placeholderData: keepPreviousData,
  });

  const projects = data?.data ?? [];

  useEffect(() => {
    console.log("Fetched projects:", projects);
  }, [projects]);

  // Filter by name and (if selected) date range
  const filtered = (projects ?? [])?.filter((p) => {
    const matchesSearch = p.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    if (!dateRange) return matchesSearch;

    const start = new Date(p.startDate);
    return matchesSearch && start >= dateRange[0] && start <= dateRange[1];
  });

  console.log("filtered", filtered);

  // If no user exists, you might choose to render a message or redirect
  if (!userId) {
    return <p>User not found or not authenticated.</p>;
  }

  // if (isLoading) {
  //   return <p>Loading projects...</p>;
  // }

  if (error) {
    let message: string;
    if (axios.isAxiosError(error)) {
      // server error shape: { success: false, message: string }
      message = error.response?.data?.message ?? error.message;
    } else {
      // fallback for non-Axios errors
      message = (error as Error).message || "Unknown error";
    }
    return (
      <p className="p-6 text-red-600">Error loading projects: {message}</p>
    );
  }

  const totalPages = data?.meta.totalPages ?? 0;

  return (
    <div className="p-6">
      {/* heading and upload button */}
      <div className="flex justify-between items-center">
        <HeadingBlue25px>Projects Dashboard</HeadingBlue25px>

        <CustomButton
          icon={<Plus />}
          className="bg-custom-orange-1 hover:bg-custom-orange-2 text-custom-white"
        >
          Create New Project
        </CustomButton>
      </div>

      {/* search bar and date filter */}
      <div className="flex justify-between gap-4 my-6">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Search projects..."
            className="pl-9 rounded-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>

        {/* Date-range picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-[220px] justify-start text-left rounded-none"
            >
              {dateRange ? (
                <>
                  {format(dateRange[0], "dd/MM/yy")} –{" "}
                  {format(dateRange[1], "dd/MM/yy")}
                </>
              ) : (
                <span className="text-muted-foreground">
                  DD/MM/YY – DD/MM/YY
                </span>
              )}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0">
            <Calendar
              mode="range"
              // selected={dateRange}
              // onSelect={setDateRange}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex-grow mx-auto w-full">
        {projects.length > 0 ? (
          <div className="bg-white shadow-all-sides rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="flex-1">Project Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Moderator (Host)</TableHead>
                  <TableHead>Start Time</TableHead>
                  {/* <TableHead>Time Zone</TableHead> */}
                  <TableHead className="text-center">Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-200">
                {filtered.map((project) => (
                  <TableRow key={project._id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => router.push(`/view-project/${project._id}`)}
                  >
                    <TableCell className="flex-1">{project.name}</TableCell>
                    <TableCell>
                      {/* lightly-styled status badge */}
                      <Badge variant="outline">{project.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {project.moderators && project.moderators.length > 0
                        ? project.moderators.map((m) => m.firstName).join(", ")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {project.startDate
                        ? format(new Date(project.startDate), "HH:mm")
                        : "—"}
                    </TableCell>

                    {/* <TableCell>{project.timeZone}</TableCell> */}
                    <TableCell className="space-x-2 text-center">
                      <CustomButton size="sm" variant="outline">
                        Observer Link
                      </CustomButton>
                      <CustomButton size="sm" variant="outline">
                        Participant Link
                      </CustomButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="p-4">
              <CustomPagination
                totalPages={totalPages}
                currentPage={page}
                onPageChange={(p) => {
                  setPage(p);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </div>
          </div>
        ) : (
          <NoSearchResult />
        )}
      </div>
    </div>
  );
};

export default Projects;
