"use client";
import React, { useState } from "react";
import { useGlobalContext } from "context/GlobalContext";
import { IProject } from "@shared/interface/ProjectInterface";
import NoSearchResult from "components/NoSearchResult";
import CustomButton from "components/shared/CustomButton";
import { CalendarIcon,  SearchIcon } from "lucide-react";
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
import { useRouter } from "next/navigation";
import { Card } from "components/ui/card";
import { getFirstSessionDate } from "utils/getFirstSessionDate";
import ShareDialog from "components/viewProject/ShareDialog";
import { toast } from "sonner";
import { useProjectFilter } from "hooks/useProjectFilter";
import { useProjects } from "hooks/useProjects";
import ProjectsHeader from "components/projects/ProjectsHeader";

interface DateRange {
  from: Date | undefined;
  to?: Date | undefined;
}

const Projects: React.FC = () => {
  const { user } = useGlobalContext();
  const router = useRouter();
  const userId = user?._id;
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [page, setPage] = useState(1);
  const limit = 10;
  // Modal state
  const [activeShareType, setActiveShareType] = useState<
    "observer" | "participant" | null
  >(null);
  const [shareProject, setShareProject] = useState<IProject | null>(null);
  // ---- useProjects hook ----
  const { projects, meta, isLoading, error } = useProjects({
    userId,
    page,
    limit,
    search: searchTerm,
  });
  const totalPages = meta.totalPages;

  const filtered = useProjectFilter(projects, searchTerm, dateRange);

  if (!userId) {
    return <p>User not found or not authenticated.</p>;
  }

  if (error) {
    toast.error(error instanceof Error ? error.message : "Unknown error");
    return <p className="p-6 text-red-600"></p>;
  }

  return (
    <div className="p-6">
      {/* heading and upload button */}

      <ProjectsHeader onCreateClick={() => router.push("/create-project")} />
        
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
              {dateRange?.from && dateRange.to ? (
                <>
                  {format(dateRange.from, "dd/MM/yy")} –{" "}
                  {format(dateRange.to, "dd/MM/yy")}
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
              selected={dateRange}
              onSelect={setDateRange}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      <Card className="shadow-all-sides border-0 rounded-md">
        <div className="flex-grow mx-auto w-full">
          {projects.length > 0 ? (
            <div className="bg-white shadow-all-sides  overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="flex-1">Project Name</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Date</TableHead>
                    {/* <TableHead>Time Zone</TableHead> */}
                    <TableHead className="text-center">Share</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-200 ">
                  {isLoading
                    ? // Show loading skeleton rows
                      [...Array(5)].map((_, idx) => (
                        <TableRow key={`skeleton-${idx}`}>
                          <TableCell>
                            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                          </TableCell>
                          <TableCell>
                            <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
                          </TableCell>
                          <TableCell>
                            <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
                          </TableCell>
                          <TableCell>
                            <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
                          </TableCell>
                          <TableCell>
                            <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse mx-auto" />
                          </TableCell>
                        </TableRow>
                      ))
                    : filtered.map((project) => (
                        <TableRow
                          key={project._id}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() =>
                            router.push(`/view-project/${project._id}`)
                          }
                        >
                          <TableCell className="flex-1">
                            {project.name}
                          </TableCell>
                          <TableCell className="flex-1">
                            {" "}
                            {project.tags.length > 0
                              ? project.tags.map((t) => t.title).join(", ")
                              : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{project.status}</Badge>
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const firstDate = getFirstSessionDate(project);
                              return firstDate
                                ? format(firstDate, "MM/dd/yyyy")
                                : "—";
                            })()}
                          </TableCell>
                          <TableCell
                            className="space-x-2 text-center "
                            onClick={(e) => e.stopPropagation()}
                          >
                            <CustomButton
                              size="sm"
                              variant="outline"
                              className="bg-custom-teal"
                              onClick={() => {
                                setShareProject(project);
                                setActiveShareType("observer");
                              }}
                            >
                              Observer Link
                            </CustomButton>
                            <CustomButton
                              size="sm"
                              variant="outline"
                              className="bg-custom-teal"
                              onClick={() => {
                                setShareProject(project);
                                setActiveShareType("participant");
                              }}
                            >
                              Participant Link
                            </CustomButton>
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>

              <div className="">
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
      </Card>
      {/* Share Modal */}
      {activeShareType && shareProject && (
        <ShareDialog
          open={true}
          onOpenChange={() => {
            setActiveShareType(null);
            setShareProject(null);
          }}
          triggerLabel=""
          badgeLabel={
            activeShareType === "observer"
              ? "Observer Link"
              : "Participant Link"
          }
          description={
            activeShareType === "observer"
              ? `You have been invited to the observer for ${shareProject.name}.`
              : "You have been invited to participate in an upcoming research session. Please check the confirmation details from your recruiter for the time and date of your session."
          }
          fields={
            activeShareType === "observer"
              ? [
                  {
                    label: "Meeting Link:",
                    value: `${window.location.origin}/join/observer/${shareProject._id}`,
                  },
                  {
                    label: "Passcode:",
                    value: shareProject.projectPasscode ?? "",
                  },
                ]
              : [
                  { label: "Project:", value: shareProject.name },
                  {
                    label: "Session Link:",
                    value: `${window.location.origin}/join/participant/${shareProject._id}`,
                  },
                ]
          }
          copyPayload={
            activeShareType === "observer"
              ? `Link: ${window.location.origin}/join/observer/${
                  shareProject._id
                }\nPasscode: ${shareProject.projectPasscode ?? ""}`
              : `${window.location.origin}/join/participant/${shareProject._id}`
          }
          footerText={
            activeShareType === "observer"
              ? "Once you click the link and enter your passcode, you will be prompted to create an account or login to your existing account. After completing this process once, you may then access your meeting via the link or your account login."
              : undefined
          }
        />
      )}
    </div>
  );
};

export default Projects;
