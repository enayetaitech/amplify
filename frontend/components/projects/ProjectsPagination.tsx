// frontend/components/projects/ProjectsPagination.tsx
"use client";

import React from "react";
import CustomPagination from "components/shared/Pagination";

interface ProjectsPaginationProps {
  totalPages: number;
  currentPage: number;
  onPageChange: (newPage: number) => void;
}

const ProjectsPagination: React.FC<ProjectsPaginationProps> = ({
  totalPages,
  currentPage,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-4">
      <CustomPagination
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={onPageChange}
      />
    </div>
  );
};

export default ProjectsPagination;
