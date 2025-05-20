"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "lib/api";
import { useParams, useRouter } from "next/navigation";
import React, { useState } from "react";
import { ISession } from "@shared/interface/SessionInterface";

import ComponentContainer from "components/shared/ComponentContainer";
import HeadingBlue25px from "components/HeadingBlue25pxComponent";
import CustomButton from "components/shared/CustomButton";
import { Plus } from "lucide-react";
import { SessionsTable } from "components/projects/sessions/SessionsTable";
import { IPaginationMeta } from "@shared/interface/PaginationInterface";
import AddSessionModal from "components/projects/sessions/AddSessionModal";
import { toast } from "sonner";
import axios from "axios";

const Sessions = () => {
  const { projectId } = useParams();
   const queryClient = useQueryClient(); 
  const router = useRouter();
  const [openAddSessionModal, setOpenAddSessionModal] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, error } = useQuery<
    { data: ISession[]; meta: IPaginationMeta },
    Error
  >({
    queryKey: ["sessions", projectId, page],
    queryFn: () =>
      api
        .get<{ data: ISession[]; meta: IPaginationMeta }>(
          `/api/v1/sessions/project/${projectId}`,
          { params: { page, limit } }
        )
        .then((res) => res.data),
    placeholderData: keepPreviousData,
  });


  // 2️⃣ Mutation to start a session
  // const startSessionMutation = useMutation<ILiveSession, Error, string>({
  //   // 1️⃣ the actual mutation function, which takes the sessionId
  //   mutationFn: (sessionId) =>
  //     api
  //       .post<{ data: ILiveSession }>(`/api/v1/liveSessions/${sessionId}/start`)
  //       .then((res) => {
  //         console.log("Live session response", res.data.data);
  //         return res.data.data;
  //       }),

  //   // 2️⃣ what to do when it succeeds
  //   onSuccess: (liveSession) => {
  //     console.log("moderator navigated to ->", liveSession._id);
  //     router.push(`/meeting/${liveSession._id}`);
  //   },

  //   // 3️⃣ optional error handling
  //   onError: (err) => {
  //     toast.error(err.message || "Could not start session");
  //   },
  // });

  const deleteSession = useMutation({
    mutationFn: (sessionId: string) =>
      api.delete(`/api/v1/sessions/${sessionId}`),
    onSuccess: () => {
      toast.success("Session deleted");
      queryClient.invalidateQueries({ queryKey: ["sessions", projectId] });
    },
    onError: (err) => {

       const msg = axios.isAxiosError(err)
       ? err.response?.data.message ?? err.message
       : "Could not delete session"
      toast.error(msg);
    },
  });

    // 🔁 Mutation to duplicate a session
  const duplicateSession = useMutation<ISession, Error, string>({
    mutationFn: (sessionId) =>
      api
        .post<{ data: ISession }>(`/api/v1/sessions/${sessionId}/duplicate`)
        .then(res => res.data.data),
    onSuccess: () => {
      toast.success("Session duplicated");
      // refetch list so our new one appears
      queryClient.invalidateQueries({ queryKey: ["sessions", projectId] });
      
    },
    onError: err => {
      toast.error(err.message || "Could not duplicate session");
    },
  });

  if (error) return <p className="text-red-500">Error: {error.message}</p>;

  return (
    <ComponentContainer>
      <div className="flex justify-between items-center bg-none pb-5 lg:ml-10">
        <HeadingBlue25px>Session</HeadingBlue25px>
        <CustomButton
          icon={<Plus />}
          text="Add Session"
          variant="default"
          className=" bg-custom-orange-2 text-white hover:bg-custom-orange-1 font-semibold px-2"
          onClick={() => {
            setOpenAddSessionModal(true);
          }}
        />
      </div>
      {isLoading ? (
        <p className="text-custom-dark-blue-1 text-2xl text-center font-bold">
          Loading Sessions...
        </p>
      ) : (
        <div className="pt-5 bg-custom-white">
          <SessionsTable
            sessions={data!.data}
            meta={data!.meta}
            onPageChange={setPage}
            onRowClick={(id) => router.push(`/session-details/${id}`)}
            onModerate={(id) => router.push(`/session-details/${id}/moderate`)}
            onObserve={(id) => router.push(`/session-details/${id}/observe`)}
            onAction={(action, session) => {
              switch (action) {
                case "edit":
                  router.push(`/session-details/${session._id}/edit`);
                  break;
                case "delete":
                  if (
                    window.confirm(
                      "Are you sure you want to delete this session?"
                    )
                  ) {
                    deleteSession.mutate(session._id);
                  }
                  break;
                case "duplicate":
                  duplicateSession.mutate(session._id);
                  break;
              }
            }}
          />
        </div>
      )}
      <AddSessionModal
        open={openAddSessionModal}
        onClose={() => setOpenAddSessionModal(false)}
      />
    </ComponentContainer>
  );
};

export default Sessions;
