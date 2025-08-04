// frontend/components/projects/ProjectsHeader.tsx
"use client";

import React from "react";
import { Plus } from "lucide-react";
import HeadingBlue25px from "components/shared/HeadingBlue25pxComponent";
import CustomButton from "components/shared/CustomButton";

interface ProjectsHeaderProps {
  onCreateClick: () => void;
}

const ProjectsHeader: React.FC<ProjectsHeaderProps> = ({ onCreateClick }) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <HeadingBlue25px>Projects Dashboard</HeadingBlue25px>
      <CustomButton
        icon={<Plus />}
        className="bg-custom-orange-1 hover:bg-custom-orange-2 text-custom-white"
        onClick={onCreateClick}
      >
        Create New Project
      </CustomButton>
    </div>
  );
};

export default ProjectsHeader;
