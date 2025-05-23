"use client";

import {  useQuery } from "@tanstack/react-query";
import api from "lib/api";
import { useParams } from "next/navigation";
import React from "react";
import { IPoll } from "@shared/interface/PollInterface";
import ComponentContainer from "components/shared/ComponentContainer";
import HeadingBlue25px from "components/HeadingBlue25pxComponent";
import { useGlobalContext } from "context/GlobalContext";
import AddPollDialog from "components/projects/polls/AddPollDialog";



const Polls = () => {
  const { projectId } = useParams() as { projectId?: string };
  const { user } = useGlobalContext();
  
  const {
    data: polls,
    isLoading,
    error,
  } = useQuery<IPoll[], Error>({
    queryKey: ["polls", projectId],
    queryFn: () =>
      api
        .get(`/api/v1/polls/project/${projectId}`)
        .then((res) => res.data.data),
    enabled: Boolean(projectId),
  });

    console.log("Polls", polls);

  if (isLoading) return <p>Loading polls…</p>;
  if (error) return <p className="text-red-500">Error: {error.message}</p>;

  return (
    <ComponentContainer>
      <div className="flex justify-between items-center bg-none pb-5 ">
        <HeadingBlue25px>Polls</HeadingBlue25px>
         {projectId && user && (
          <AddPollDialog projectId={projectId} user={user} />
        )}
      </div>
    </ComponentContainer>
  );
};

export default Polls;
