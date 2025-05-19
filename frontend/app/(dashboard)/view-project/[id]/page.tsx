"use client";

import { ApiResponse } from "@shared/interface/ApiResponseInterface";
import { IProject } from "@shared/interface/ProjectInterface";
import { useQuery } from "@tanstack/react-query";
import HeadingBlue25px from "components/HeadingBlue25pxComponent";
import ComponentContainer from "components/shared/ComponentContainer";
import CreditSummary from "components/viewProject/CreditSummary";
import ProjectSummary from "components/viewProject/ProjectSummary";
import SessionAccess from "components/viewProject/SessionAccess";
import TagModal from "components/viewProject/TagModel";
import api from "lib/api";
import { useParams } from "next/navigation";
import React, { useState } from "react";

const fetchProjectById = async (id: string) => {
  const res = await api.get<ApiResponse<IProject>>(
    `/api/v1/projects/get-project-by-id/${id}`
  );
  return res.data.data;
};

const ViewProject = () => {
  const { id: projectId } = useParams() as { id: string };
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);

  const {
    data: project,
    isPending: isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => fetchProjectById(projectId),
    enabled: !!projectId,
  });

 

  if (isLoading) return <p>Loading project…</p>;
  if (isError)
    return <p className="text-red-500">Error: {(error as Error).message}</p>;

  return (
    <ComponentContainer>
      <div className=" py-5 ">
        <HeadingBlue25px>{project!.name}</HeadingBlue25px>
        {/* two-column grid on md+ */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Project Summary */}
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
