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

  // Get the earliest meeting date (or fall back to project.startDate if no meetings)
  const firstSessionDate = React.useMemo(() => {
    if (!project?.meetings?.length) {
      return;
    }

    // 1. Build a Date object for each meeting (date + startTime)
    const sessionDateTimes = project.meetings.map((m) => {
      const meetingDate = new Date(m.date);
      const [hour, minute] = m.startTime.split(":").map(Number);
      return new Date(
        meetingDate.getFullYear(),
        meetingDate.getMonth(),
        meetingDate.getDate(),
        hour,
        minute
      );
    });

    // 2. Compute “today at midnight”
    const now = new Date();
    const todayMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    // 3. Keep only sessions on or after today
    const upcoming = sessionDateTimes.filter((dt) => dt >= todayMidnight);

    // 4. If there are any, pick the earliest; otherwise fall back
    if (upcoming.length) {
      return upcoming.reduce(
        (earliest, curr) => (curr < earliest ? curr : earliest),
        upcoming[0]
      );
    } else {
      return new Date(project!.startDate);
    }
  }, [project]);

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
            firstSessionDate={firstSessionDate!}
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
