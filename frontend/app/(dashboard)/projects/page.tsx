"use client";
import React, { useState } from "react";
import { useGlobalContext } from "context/GlobalContext";
import { IProject } from "@shared/interface/ProjectInterface";
import NoSearchResult from "components/projects/NoSearchResult";
import { useRouter } from "next/navigation";
import { Card } from "components/ui/card";
import { toast } from "sonner";
import { useMembershipProjects, useProjects } from "hooks/useProjects";
import ProjectsHeader from "components/projects/ProjectsHeader";
import ProjectsFilter from "components/projects/ProjectsFilter";
import ProjectsPagination from "components/projects/ProjectsPagination";
import ProjectsTable from "components/projects/ProjectsTable";
import ShareProjectModal from "components/projects/ShareProjectModal";

interface DateRange {
  from: Date | undefined;
  to?: Date | undefined;
}

const Projects: React.FC = () => {
  const { user } = useGlobalContext();
  const router = useRouter();
  const userId = user?._id;
  const [searchTerm, setSearchTerm] = useState("");
  const [tagTerm, setTagTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined
  );
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortDir, setSortDir] = useState<"asc" | "desc" | undefined>(undefined);
  // Modal state
  const [activeShareType, setActiveShareType] = useState<
    "observer" | "participant" | null
  >(null);
  const [shareProject, setShareProject] = useState<IProject | null>(null);
  // ---- useProjects hook ----

  const fromISO = dateRange?.from?.toISOString();
  const toISO = dateRange?.to?.toISOString();

  const { projects, meta, isLoading, error } = useProjects({
    userId,
    page,
    limit,
    search: searchTerm,
    tag: tagTerm,
    status: statusFilter,
    from: fromISO,
    to: toISO,
    sortBy,
    sortDir,
  });

  const { projects: sharedProjects, isLoading: sharedLoading } =
    useMembershipProjects(userId);

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

      <ProjectsFilter
        searchTerm={searchTerm}
        onSearchChange={(v) => {
          setSearchTerm(v);
          setPage(1);
        }}
        tagSearchTerm={tagTerm}
        onTagSearchChange={(v) => {
          setTagTerm(v);
          setPage(1);
        }}
        dateRange={dateRange}
        onDateRangeChange={(r) => {
          setDateRange(r);
          setPage(1);
        }}
        status={statusFilter}
        onStatusChange={(s) => {
          setStatusFilter(s);
          setPage(1);
        }}
      />
      <Card className="shadow-all-sides border-0 rounded-md">
        <div className="shadow-all-sides border-0 rounded-md">
          {projects.length === 0 && !isLoading ? (
            <NoSearchResult />
          ) : (
            <>
              <ProjectsTable
                filteredProjects={projects}
                isLoading={isLoading}
                sortBy={sortBy}
                sortDir={sortDir}
                onSortChange={(column, dir) => {
                  setSortBy(column);
                  setSortDir(dir);
                  setPage(1);
                }}
                // ← here is the “row click” navigation:
                onRowClick={(projectId: string) => {
                  router.push(`/view-project/${projectId}`);
                }}
                onShareClick={(project, type) => {
                  setShareProject(project);
                  setActiveShareType(type);
                }}
              />

              <ProjectsPagination
                totalPages={meta.totalPages}
                currentPage={page}
                onPageChange={(newPage) => {
                  setPage(newPage);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </>
          )}
        </div>
      </Card>

      {/* Shared with me */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-3">Shared with me</h3>
        <Card className="shadow-all-sides border-0 rounded-md">
          <div className="shadow-all-sides border-0 rounded-md">
            {(!sharedProjects || sharedProjects.length === 0) &&
            !sharedLoading ? (
              <div className="p-6 text-sm text-gray-500">
                No shared projects.
              </div>
            ) : (
              <ProjectsTable
                filteredProjects={sharedProjects}
                isLoading={sharedLoading}
                sortBy={undefined}
                sortDir={undefined}
                onSortChange={undefined}
                onRowClick={(projectId: string) => {
                  router.push(`/view-project/${projectId}`);
                }}
                onShareClick={(project) => {
                  // only allow Observe; reuse existing modal but default to observer type
                  setShareProject(project);
                  setActiveShareType("observer");
                }}
              />
            )}
          </div>
        </Card>
      </div>
      {/* Share Modal */}
      <ShareProjectModal
        open={Boolean(activeShareType && shareProject)}
        shareType={activeShareType}
        project={shareProject}
        onClose={() => {
          setActiveShareType(null);
          setShareProject(null);
        }}
      />
    </div>
  );
};

export default Projects;
