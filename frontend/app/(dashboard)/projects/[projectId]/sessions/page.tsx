"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
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
import EditSessionModal, { EditSessionValues } from "components/projects/sessions/EditSessionModal";
import ConfirmationModalComponent from "components/ConfirmationModalComponent";


interface EditSessionInput {
  id: string;
  values: EditSessionValues;
}

const Sessions = () => {
  const { projectId } = useParams();
  const queryClient = useQueryClient();
  const router = useRouter();
  const limit = 10;

  const [openAddSessionModal, setOpenAddSessionModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  
  const [page, setPage] = useState(1);
  const [sessionToEdit, setSessionToEdit] = useState<ISession | null>(null);
  const [toDeleteId, setToDeleteId] = useState<string | null>(null);


  // Getting session data for session table
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


  // Mutation to delete session
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
        : "Could not delete session";
      toast.error(msg);
    },
  });

  // 🔁 Mutation to duplicate a session
  const duplicateSession = useMutation<ISession, Error, string>({
    mutationFn: (sessionId) =>
      api
        .post<{ data: ISession }>(`/api/v1/sessions/${sessionId}/duplicate`)
        .then((res) => res.data.data),
    onSuccess: () => {
      toast.success("Session duplicated");
      queryClient.invalidateQueries({ queryKey: ["sessions", projectId] });
    },
    onError: (err) => {
      toast.error(err.message || "Could not duplicate session");
    },
  });

  // ❗️ Mutation to save edits
 const editSession = useMutation<ISession, Error, EditSessionInput>({
  // 1. mutationFn instead of positional args
  mutationFn: ({ id, values }) =>
    api
      .patch<{ data: ISession }>(`/api/v1/sessions/${id}`, values)
      .then(res => res.data.data),

  // 2. onSuccess now receives (data, variables, context)
   onSuccess() {
    toast.success("Session updated");
    queryClient.invalidateQueries({ queryKey: ["sessions", projectId] });
    setOpenEditModal(false);
  },

  // 4. onError only takes the Error it needs
  onError(error) {
    toast.error(error.message || "Could not update session");
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
                  setSessionToEdit(session);
                  setOpenEditModal(true);
                  break;
                case "delete":
                   setToDeleteId(session._id);
                  setConfirmOpen(true);
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

       <EditSessionModal
        open={openEditModal}
        session={sessionToEdit}
        onClose={() => setOpenEditModal(false)}
        onSave={(values) => {
          if (sessionToEdit) {
            editSession.mutate({ id: sessionToEdit._id, values });
          }
        }}
      />

        <ConfirmationModalComponent
        open={confirmOpen}
        onCancel={() => {
          setConfirmOpen(false);
          setToDeleteId(null);
        }}
        onYes={() => {
          if (toDeleteId) {
            deleteSession.mutate(toDeleteId);
          }
          setConfirmOpen(false);
          setToDeleteId(null);
        }}
        heading="Delete Session?"
        text="Are you sure you want to delete this session? This action cannot be undone."
      />
    </ComponentContainer>
  );
};

export default Sessions;
