"use client";

import { useQuery } from "@tanstack/react-query";
import api from "lib/api";
import { useParams } from "next/navigation";
import React from "react";
import { IPoll } from "@shared/interface/PollInterface";
import ComponentContainer from "components/shared/ComponentContainer";
import HeadingBlue25px from "components/HeadingBlue25pxComponent";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "components/ui/dialog";
import CustomButton from "components/shared/CustomButton";
import { Plus } from "lucide-react";
import { Input } from "components/ui/input";

const Polls = () => {
  const params = useParams();
  const projectId =
    !params.projectId || Array.isArray(params.projectId)
      ? null
      : params.projectId;

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

  console.log("polls", polls);

  if (isLoading) return <p>Loading polls…</p>;
  if (error) return <p className="text-red-500">Error: {error.message}</p>;

  return (
    <ComponentContainer>
      <div className="flex justify-between items-center bg-none pb-5 ">
        <HeadingBlue25px>Polls</HeadingBlue25px>
        <Dialog>
          <DialogTrigger asChild>
            <CustomButton
              className="bg-custom-orange-1 hover:bg-custom-orange-2 rounded-lg"
              icon={<Plus />}
              text="Add Poll"
              variant="default"
            />
          </DialogTrigger>

          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <div className="flex justify-between items-center mt-5">
                <DialogTitle>Add Poll</DialogTitle>
                <CustomButton
                  className="bg-custom-teal hover:bg-custom-dark-blue-3 rounded-lg"
                  text="Save"
                  variant="default"
                />
              </div>
            </DialogHeader>

            {/* ← NEW: Poll Title input */}
            <div className="mt-4 space-y-4">
                <Input
                  id="poll-title"
                  placeholder="Enter poll title"
                  className="mt-1 py-2"
                />
            </div>

            <DialogFooter>
              <DialogClose asChild></DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ComponentContainer>
  );
};

export default Polls;
