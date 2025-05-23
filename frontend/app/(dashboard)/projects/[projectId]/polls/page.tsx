"use client";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import api from "lib/api";
import { useParams } from "next/navigation";
import React, { useState } from "react";
import { IPoll } from "@shared/interface/PollInterface";
import ComponentContainer from "components/shared/ComponentContainer";
import HeadingBlue25px from "components/HeadingBlue25pxComponent";
import { useGlobalContext } from "context/GlobalContext";
import AddPollDialog from "components/projects/polls/AddPollDialog";
import PollsTable from "components/projects/polls/PollsTable";
import { IPaginationMeta } from "@shared/interface/PaginationInterface";
import { toast } from "sonner";
import axios from "axios";
import EditPollDialog from "components/projects/polls/EditPollDialog";
import PreviewPollDialog from "components/projects/polls/PreviewPollDialog";

const Polls = () => {
  const { projectId } = useParams() as { projectId?: string };
  const { user } = useGlobalContext();
  const queryClient = useQueryClient();
  const limit = 10;
  const [page, setPage] = useState(1);
  const [editingPoll, setEditingPoll] = useState<IPoll | null>(null);
  const [previewing, setPreviewing] = useState<IPoll | null>(null);

  const { data, isLoading, error } = useQuery<
    { data: IPoll[]; meta: IPaginationMeta },
    Error
  >({
    queryKey: ["polls", projectId, page],
    queryFn: () =>
      api
        .get<{ data: IPoll[]; meta: IPaginationMeta }>(
          `/api/v1/polls/project/${projectId}`,
          { params: { page, limit } }
        )
        .then((res) => res.data),
    placeholderData: keepPreviousData,
  });

  // Delete mutation
  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: (pollId: string) => api.delete(`/api/v1/polls/${pollId}`),
    onSuccess: () => {
      toast.success("Poll deleted");
      queryClient.invalidateQueries({ queryKey: ["polls", projectId] });
    },
    onError: (err) => {
      const msg = axios.isAxiosError(err)
        ? err.response?.data.message ?? err.message
        : "Could not delete poll";
      toast.error(msg);
    },
  });

  if (error) return <p className="text-red-500">Error: {error.message}</p>;

  return (
    <ComponentContainer>
      <div className="flex justify-between items-center bg-none pb-5 ">
        <HeadingBlue25px>Polls</HeadingBlue25px>
        {projectId && user && (
          <AddPollDialog projectId={projectId} user={user} />
        )}
      </div>
      {isLoading ? (
        <p className="text-custom-dark-blue-1 text-2xl text-center font-bold">
          Loading Sessions...
        </p>
      ) : (
        <div className="pt-5 bg-custom-white">
          <PollsTable
            polls={data!.data}
            meta={data!.meta}
            onPageChange={setPage}
            onDelete={(pollId) => deleteMutation.mutate(pollId)}
            onEdit={poll => setEditingPoll(poll)}
            onPreview={(p) => setPreviewing(p)}
          />
        </div>
      )}
      {editingPoll && (
        <EditPollDialog
          poll={editingPoll}
          onClose={() => setEditingPoll(null)}
        />
      )}

      {previewing && (
        <PreviewPollDialog
          poll={previewing}
          onClose={() => setPreviewing(null)}
        />
      )}
    </ComponentContainer>
  );
};

export default Polls;
