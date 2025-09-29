"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import api from "lib/api";
import { useParams, useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";
import { ISession } from "@shared/interface/SessionInterface";
import ComponentContainer from "components/shared/ComponentContainer";
import HeadingBlue25px from "components/shared/HeadingBlue25pxComponent";
import CustomButton from "components/shared/CustomButton";
import { Plus } from "lucide-react";
import { SessionsTable } from "components/projects/sessions/SessionsTable";
import { IPaginationMeta } from "@shared/interface/PaginationInterface";
import AddSessionModal from "components/projects/sessions/AddSessionModal";
import { toast } from "sonner";
import axios from "axios";
import EditSessionModal, {
  EditSessionValues,
} from "components/projects/sessions/EditSessionModal";
import ConfirmationModalComponent from "components/shared/ConfirmationModalComponent";
import { useProject } from "hooks/useProject";
import { formatUiTimeZone } from "utils/timezones";
import { IUser } from "@shared/interface/UserInterface";
import { flagsFromProject } from "constant/featureFlags";
import { buildMeetingUrl } from "utils/meetingUrl";
import { safeLocalGet } from "utils/storage";

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
  const [sortBy, setSortBy] = useState<"title" | "startAtEpoch">(
    "startAtEpoch"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [sessionToEdit, setSessionToEdit] = useState<ISession | null>(null);
  const [toDeleteId, setToDeleteId] = useState<string | null>(null);

  const { data: project, isLoading: isProjectLoading } = useProject(
    projectId as string
  );

  const tzPretty = useMemo(() => {
    if (!project?.defaultTimeZone) return "";
    // Use the project's startDate if you want the offset for that exact date (DST-correct),
    // otherwise omit the 2nd arg to use "now".
    const atDate = project.startDate ?? undefined;
    return formatUiTimeZone(project.defaultTimeZone, atDate);
  }, [project?.defaultTimeZone, project?.startDate]);

  // ✅ read logged-in user (already set elsewhere via /api/v1/users/me)
  const me: IUser | null = safeLocalGet<IUser>("user");

  // Getting session data for session table
  const { data, isLoading, error } = useQuery<
    { data: ISession[]; meta: IPaginationMeta },
    Error
  >({
    queryKey: ["sessions", projectId, page, sortBy, sortOrder],
    queryFn: () =>
      api
        .get<{ data: ISession[]; meta: IPaginationMeta }>(
          `/api/v1/sessions/project/${projectId}`,
          { params: { page, limit, sortBy, sortOrder } }
        )
        .then((res) => res.data),
    placeholderData: keepPreviousData,
  });

  // Open a blank window synchronously on user gesture to avoid Safari popup blocking.
  // We then navigate that window when the mutation completes.
  const handleModerateClick = (sessionId: string) => {
    // Use a named window so we can target the same tab later instead of opening a second one.
    const windowName = `session_${sessionId}`;
    let newWin: Window | null = null;
    try {
      // Open the blank window without `noopener` so the named window can be reused
      // (passing `noopener` forces a new tab and prevents reusing the named target in Chrome).
      newWin = window.open("", windowName);
      if (!newWin) {
        toast.error("Popup blocked. Please allow popups for this site.");
      }
    } catch {
      newWin = null;
    }

    startMeeting.mutate(sessionId, {
      onSuccess: (data, id) => {
        const success = data?.success;
        const message = data?.message;

        if (success === false && message === "Session already ongoing") {
          toast.message("Session already ongoing — opening meeting");
        } else {
          toast.success("Session started");
        }

        queryClient.invalidateQueries({ queryKey: ["sessions", projectId] });

        const ff = flagsFromProject(project as unknown);
        const url = buildMeetingUrl(id, ff);

        if (newWin) {
          // Try to navigate the already-opened named window directly. If that's
          // blocked for any reason, fall back to opening the named target.
          try {
            newWin.location.href = url;
            try {
              newWin.focus();
            } catch {
              // ignore focus errors
            }
          } catch {
            // If setting location fails, try opening the named target (should reuse the tab).
            try {
              window.open(url, windowName);
            } catch {
              window.open(url, "_blank", "noopener,noreferrer");
            }
          }
        } else {
          window.open(url, "_blank", "noopener,noreferrer");
        }
      },
      onError: (err, id) => {
        if (newWin) {
          try {
            newWin.close();
          } catch {
            // ignore
          }
        }

        // If server returned non-2xx with the same message, still proceed
        if (axios.isAxiosError(err)) {
          const msg = err.response?.data?.message;
          if (msg === "Session already ongoing") {
            toast.message("Session already ongoing — opening meeting");
            const ff = flagsFromProject(project as unknown);
            const url = buildMeetingUrl(id, ff);
            window.open(url, "_blank", "noopener,noreferrer");
            return;
          }
        }

        const fallback = axios.isAxiosError(err)
          ? err.response?.data?.message ?? err.message
          : "Could not start the session";
        toast.error(fallback);
      },
    });
  };

  // Start live session then navigate
  // NOTE: We intentionally do NOT open a window inside the mutation handlers because
  // browsers (especially Safari) block popups that are not initiated synchronously
  // from a user gesture. Instead the caller should open a blank window synchronously
  // and pass it in so we can set its location when the request completes.
  const startMeeting = useMutation<
    { success?: boolean; message?: string },
    unknown,
    string
  >({
    mutationFn: async (sessionId: string) => {
      const res = await api.post<{ success?: boolean; message?: string }>(
        `/api/v1/liveSessions/${sessionId}/start`
      );
      return res.data;
    },
    onSuccess: () => {
      // keep UI state in caller; no default navigation here to avoid popup blocking
      queryClient.invalidateQueries({ queryKey: ["sessions", projectId] });
    },
    onError: () => {
      // errors are handled per-call
    },
  });

  // Handle observe session

  const handleObserveClick = async (sessionId: string) => {
    const name = me?.firstName + " " + me?.lastName;
    const email = me?.email;

    try {
      // Try one-time enqueue as Observer (uses your existing /enqueue controller)
      const resp = await api.post<{
        data: { action: "stream" | "waiting_room"; sessionId: string };
      }>("/api/v1/waiting-room/enqueue", {
        sessionId,
        name,
        email,
        role: "Observer",
        passcode: project?.projectPasscode,
      });

      const action = resp.data?.data?.action;
      if (action === "stream") {
        const ff = flagsFromProject(project as unknown);
        router.push(buildMeetingUrl(sessionId, ff, { role: "observer" }));
      } else {
        router.push(`/waiting-room/observer/${sessionId}`);
      }
    } catch (err) {
      // If passcode is required or invalid, gracefully route to your existing join page
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message || "";
        if (
          msg.includes("Passcode is required") ||
          msg.includes("Invalid observer passcode")
        ) {
          toast.message("Observer passcode required — continue to join");
          // Reuse your observer join page where user can enter passcode
          router.push(`/join/observer/${sessionId}`);
          return;
        }
        if (
          msg.includes("Session not found") ||
          msg.includes("Project not found")
        ) {
          toast.error(msg);
          return;
        }
      }
      toast.error("Could not open session");
    }
  };

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
        .then((res) => res.data.data),

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

  const isEditSessionSaving = editSession.isPending;

  if (error) return <p className="text-red-500">Error: {error.message}</p>;

  return (
    <ComponentContainer>
      <div className="flex justify-between items-center bg-none pb-5 ">
        <HeadingBlue25px>
          Sessions (All Times{" "}
          {isProjectLoading
            ? "Loading..."
            : tzPretty || project?.defaultTimeZone}
          )
        </HeadingBlue25px>
        <CustomButton
          icon={<Plus />}
          text="Add Sessions"
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
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={(field, order) => {
              setSortBy(field);
              setSortOrder(order);
              setPage(1);
            }}
            // onRowClick={(id) => router.push(`/session-details/${id}`)}
            onModerate={handleModerateClick}
            onObserve={handleObserveClick}
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
          // Simple overlap precheck with currently loaded page (exclude the edited one)
          try {
            const current = data?.data || [];
            const others = current.filter((s) => s._id !== sessionToEdit?._id);
            const parseToUtcMs = (
              dateStr: string,
              timeStr: string
            ): number | null => {
              if (!dateStr || !timeStr) return null;
              const [y, m, d] = dateStr.split("-").map(Number);
              const [hh, mm] = timeStr.split(":").map(Number);
              if ([y, m, d, hh, mm].some((n) => Number.isNaN(n))) return null;
              return Date.UTC(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0);
            };
            const startNew = parseToUtcMs(values.date, values.startTime);
            const endNew =
              startNew !== null ? startNew + values.duration * 60 * 1000 : null;
            if (startNew !== null && endNew !== null) {
              for (const ex of others) {
                const startEx = parseToUtcMs(
                  new Date(ex.date).toISOString().slice(0, 10),
                  ex.startTime
                );
                const endEx =
                  startEx !== null ? startEx + ex.duration * 60 * 1000 : null;
                if (startEx !== null && endEx !== null) {
                  if (startNew < endEx && startEx < endNew) {
                    toast.error(
                      `Time conflict with existing session "${ex.title}" on this page.`
                    );
                    return;
                  }
                }
              }
            }
          } catch {}
          if (sessionToEdit) {
            editSession.mutate({ id: sessionToEdit._id, values });
          }
        }}
        isSaving={isEditSessionSaving}
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
        cancelText="No"
      />
    </ComponentContainer>
  );
};

export default Sessions;
