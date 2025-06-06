// frontend/components/projects/ProjectRow.tsx
"use client";

import React from "react";
import { IProject } from "@shared/interface/ProjectInterface";
import {
  TableRow,
  TableCell,
} from "components/ui/table";
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

  return (
    <TableRow
      // Entire row is clickable:
      className="cursor-pointer hover:bg-gray-50"
      onClick={() => onRowClick(project._id)}
    >
      {/* 1) Project Name */}
      <TableCell className="flex-1">
        {project.name}
      </TableCell>

      {/* 2) Tags */}
      <TableCell>
        {project.tags.length > 0
          ? project.tags.map((t) => t.title).join(", ")
          : "—"}
      </TableCell>

      {/* 3) Status */}
      <TableCell>
        <Badge variant="outline">{project.status}</Badge>
      </TableCell>

      {/* 4) First Session / Start Date */}
      <TableCell>
        {firstDate ? format(firstDate, "MM/dd/yyyy") : "—"}
      </TableCell>

      {/* 5) Share Buttons: stop propagation so row click still works */}
      <TableCell
        className="space-x-2 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <CustomButton
          size="sm"
          variant="outline"
          className="bg-custom-teal"
          onClick={() => onShareClick(project, "observer")}
        >
          Observer Link
        </CustomButton>
        <CustomButton
          size="sm"
          variant="outline"
          className="bg-custom-teal"
          onClick={() => onShareClick(project, "participant")}
        >
          Participant Link
        </CustomButton>
      </TableCell>
    </TableRow>
  );
};

export default ProjectRow;
