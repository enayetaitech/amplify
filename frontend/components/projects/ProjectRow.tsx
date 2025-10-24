// frontend/components/projects/ProjectRow.tsx
"use client";

import React from "react";
import { IProject } from "@shared/interface/ProjectInterface";
import { TableRow, TableCell } from "components/ui/table";
import { Badge } from "components/ui/badge";
import CustomButton from "components/shared/CustomButton";
import { getFirstSessionDate } from "utils/getFirstSessionDate";
import { format } from "date-fns";

interface ProjectRowProps {
  project: IProject;
  onRowClick: (projectId: string) => void;
  onShareClick: (project: IProject, type: "observer" | "participant") => void;
}

const ProjectRow: React.FC<ProjectRowProps> = ({
  project,
  onRowClick,
  onShareClick,
}) => {
  const firstDate = getFirstSessionDate(project);

  const statusColors: Record<string, string> = {
    Draft: "#ff7014",
    Active: "#75d481",
    Archived: "#696969",
    Paused: "#fcd860",
    Inactive: "#fcd860",
    Closed: "#b44d79",
  };

  const statusColor = statusColors[project.status] || "#696969";

  return (
    <TableRow
      // Entire row is clickable:
      className="cursor-pointer hover:bg-gray-50"
      onClick={() => onRowClick(project._id)}
    >
      {/* 1) Project Name */}
      <TableCell className="flex-1">{project.name}</TableCell>

      {/* 2) Tags */}
      <TableCell className="flex flex-wrap gap-1">
        {project.tags && project.tags.length > 0
          ? project.tags.map((tag) => (
              <Badge
                key={tag._id}
                style={{
                  backgroundColor: tag.color,
                  color: "#fff",
                }}
                className="px-2 py-0.5 rounded"
              >
                {tag.title}
              </Badge>
            ))
          : "—"}
      </TableCell>

      {/* 3) Status */}
      <TableCell>
        <Badge
          variant="outline"
          style={{
            borderColor: statusColor,
            borderWidth: "3px",
            color: "#696969",
          }}
        >
          {project.status}
        </Badge>
      </TableCell>

      {/* 4) First Session / Start Date */}
      <TableCell>{firstDate ? format(firstDate, "MM/dd/yyyy") : "—"}</TableCell>

      {/* 5) Share Buttons: stop propagation so row click still works */}
      <TableCell
        className="space-x-2 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <CustomButton
          size="sm"
          variant="outline"
          className={
            project.status === "Archived"
              ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
              : "bg-custom-teal"
          }
          onClick={() =>
            project.status !== "Archived" && onShareClick(project, "observer")
          }
          disabled={project.status === "Archived"}
        >
          Observer Link
        </CustomButton>
        <CustomButton
          size="sm"
          variant="outline"
          className={
            project.status === "Archived"
              ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
              : "bg-custom-teal"
          }
          onClick={() =>
            project.status !== "Archived" &&
            onShareClick(project, "participant")
          }
          disabled={project.status === "Archived"}
        >
          Participant Link
        </CustomButton>
      </TableCell>
    </TableRow>
  );
};

export default ProjectRow;
