"use client";

import {
  keepPreviousData,
  useQuery
} from "@tanstack/react-query";
import api from "lib/api";
import { useParams } from "next/navigation";
import React, { useState } from "react";
import { IModerator } from "@shared/interface/ModeratorInterface";
import ComponentContainer from "components/shared/ComponentContainer";
import HeadingBlue25px from "components/HeadingBlue25pxComponent";
import { Plus } from "lucide-react";
import CustomButton from "components/shared/CustomButton";
import { IPaginationMeta } from "@shared/interface/PaginationInterface";
import ProjectTeamsTable from "components/projects/projectTeam/ProjectTeamsTable";
import AddModeratorModal from "components/projects/projectTeam/AddModeratorModal";

const ProjectTeam = () => {
  const { projectId } = useParams();

  const [openAddModeratorModal, setOpenAddModeratorModal] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, error } = useQuery<
    { data: IModerator[]; meta: IPaginationMeta },
    Error
  >({
    queryKey: ["projectTeam", projectId, page],
    queryFn: () =>
      api
        .get<{ data: IModerator[]; meta: IPaginationMeta }>(
          `/api/v1/moderators/project/${projectId}`,
          { params: { page, limit } }
        )
        .then((res) => res.data),
    placeholderData: keepPreviousData,
  });

    if (isLoading) return <p>Loading project team…</p>;

  if (error) return <p className="text-red-500">Error: {error.message}</p>;

  return (
    <ComponentContainer>
      <div className="flex justify-between items-center bg-none pb-5 ">
        <HeadingBlue25px>Project Team View</HeadingBlue25px>
        <CustomButton
          icon={<Plus />}
          text="Add Moderator"
          variant="default"
          className=" bg-custom-orange-2 text-white hover:bg-custom-orange-1 font-semibold px-2"
          onClick={() => {
            setOpenAddModeratorModal(true);
          }}
        />
      </div>

      <AddModeratorModal
        open={openAddModeratorModal}
        onClose={() => setOpenAddModeratorModal(false)}
      />

      {isLoading ? (
        <p className="text-custom-dark-blue-1 text-2xl text-center font-bold">
          Loading Sessions...
        </p>
      ) : (
        <div className="pt-5 bg-custom-white">
          <ProjectTeamsTable
            moderators={data!.data}
            meta={data!.meta}
            onPageChange={setPage}
          />
        </div>
      )}
    </ComponentContainer>
  );
};

export default ProjectTeam;
