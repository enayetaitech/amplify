// frontend/components/projects/ProjectsTable.tsx
import React from "react";
import { IProject } from "@shared/interface/ProjectInterface";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import ProjectRow from "./ProjectRow";

interface ProjectsTableProps {
  filteredProjects: IProject[];
  isLoading: boolean;
  onRowClick: (projectId: string) => void;
  onShareClick: (project: IProject, type: "observer" | "participant") => void;
}

const ProjectsTable: React.FC<ProjectsTableProps> = ({
  filteredProjects,
  isLoading,
  onRowClick,
  onShareClick,
}) => {
  return (
    <div className="bg-white shadow-all-sides overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="flex-1">Project Name</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead className="text-center">Share</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-gray-200">
          {isLoading
            ? // same skeleton rows as before…
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
                    <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
            : filteredProjects.map((project) => (
                <ProjectRow
                  key={project._id}
                  project={project}
                  onRowClick={onRowClick}
                  onShareClick={onShareClick}
                />
              ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProjectsTable;
