"use client";

import HeadingBlue25px from "components/HeadingBlue25pxComponent";
import ComponentContainer from "components/shared/ComponentContainer";
import CreditSummary from "components/viewProject/CreditSummary";
import ProjectSummary from "components/viewProject/ProjectSummary";
import SessionAccess from "components/viewProject/SessionAccess";
import TagModal from "components/viewProject/TagModel";
import { useProject } from "hooks/useProject";
import { useParams } from "next/navigation";
import React, { useState } from "react";


const ViewProject = () => {
  const { id: projectId } = useParams() as { id: string };
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);

  const {
    data: project,
    isLoading,
    isError,
    error,
  } = useProject(projectId);
 
  if (isLoading) return <p>Loading project…</p>;
  if (isError)
    return <p className="text-red-500">Error: {(error as Error).message}</p>;

  return (
    <ComponentContainer>
      <div className=" py-5 ">
        <HeadingBlue25px>Project Details: {project!.name}</HeadingBlue25px>
       
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
       
          <ProjectSummary
            project={project!}
            onTagEditClick={() => setIsTagModalOpen(true)}
          />

          <CreditSummary project={project!} />
        </div>
        <div className="w-full"> 
          <SessionAccess
          project={project!}
          />
        </div>
      </div>
      <TagModal
        projectId={project!._id!}
        open={isTagModalOpen}
        onOpenChange={setIsTagModalOpen}
        existingTags={project!.tags}
      />
    </ComponentContainer>
  );
};

export default ViewProject;
