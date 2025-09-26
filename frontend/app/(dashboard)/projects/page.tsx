"use client";
import React, { useState } from "react";
import { useGlobalContext } from "context/GlobalContext";
import { IProject } from "@shared/interface/ProjectInterface";
import NoSearchResult from "components/projects/NoSearchResult";
import { useRouter } from "next/navigation";
import { Card } from "components/ui/card";
import { toast } from "sonner";
import { useProjects } from "hooks/useProjects";
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
    from: fromISO,
    to: toISO,
    sortBy,
    sortDir,
  });

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
