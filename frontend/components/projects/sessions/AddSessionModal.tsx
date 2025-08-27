// components/projects/sessions/AddSessionModal.tsx

"use client";
import CustomButton from "components/shared/CustomButton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";
import React, { useEffect, useState } from "react";
import AddSessionStep1 from "./AddSessionStep1";
import AddSessionStep2 from "./AddSessionStep2";
import { IModerator } from "@shared/interface/ModeratorInterface";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "lib/api";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import { IProject } from "@shared/interface/ProjectInterface";

interface AddSessionModalProps {
  open: boolean;
  onClose: () => void;
}

export interface ISessionFormData {
  numberOfSessions: number;
  selectedModerators: string[];
  allModerators?: IModerator[];
  timeZone: string;
  sameModerator: boolean;
  sameSession: boolean;
  sessions: Array<{
    title: string;
    date: string;
    startTime: string;
    duration: string;
    moderators: string[];
  }>;
}

const initialFormData: ISessionFormData = {
  numberOfSessions: 0,
  selectedModerators: [],
  allModerators: [],
  timeZone: "",
  sameModerator: false,
  sameSession: false,
  sessions: [
    { title: "", date: "", startTime: "", duration: "0", moderators: [] },
  ],
};

const AddSessionModal: React.FC<AddSessionModalProps> = ({ open, onClose }) => {
  const params = useParams();
  if (!params.projectId || Array.isArray(params.projectId)) {
    throw new Error("projectId is required and must be a string");
  }
  const projectId = params.projectId;
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<ISessionFormData>(initialFormData);

  const { data: project } = useQuery<IProject, Error>({
    queryKey: ["project", projectId],
    queryFn: () =>
      api
        .get(`/api/v1/projects/get-project-by-id/${projectId}`)
        .then((res) => res.data.data),
    enabled: Boolean(projectId),
  });

  // When project defaults load, prefill the form
  useEffect(() => {
    if (!project) return;
    // Use project's IANA default timezone directly if provided
    if (project.defaultTimeZone) {
      setFormData((prev) => ({
        ...prev,
        timeZone: project.defaultTimeZone!,
      }));
    }
  }, [project]);

  // whenever numberOfSessions changes, resize the sessions array
  useEffect(() => {
    setFormData((f) => ({
      ...f,
      sessions: Array.from(
        { length: f.numberOfSessions },
        (_, i) =>
          f.sessions[i] || {
            title: "",
            date: "",
            startTime: "",
            duration: 0,
            moderators: [],
          }
      ),
    }));
  }, [formData.numberOfSessions]);

  const createSessions = useMutation({
    mutationFn: (payload: {
      projectId: string;
      timeZone: string;
      sameSession: boolean;
      sessions: {
        title: string;
        date: string;
        startTime: string;
        duration: number;
        moderators: string[];
      }[];
    }) => api.post("/api/v1/sessions", payload),

    onSuccess: () => {
      toast.success("Sessions created!");
      queryClient.invalidateQueries({
        queryKey: ["sessions", projectId],
      });
      setFormData(initialFormData);
      onClose();
      setStep(1);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unknown error");
    },
  });

  const handleSave = () => {
    // Required fields validation before conflict checks
    if (!formData.sessions || formData.sessions.length === 0) {
      toast.error("Please add at least one session.");
      return;
    }

    if (formData.sameSession) {
      const sharedDuration = Number(formData.sessions[0]?.duration);
      if (!sharedDuration || sharedDuration <= 0) {
        toast.error("Please select a session length.");
        return;
      }
    }

    // Per-session validation
    for (let i = 0; i < formData.sessions.length; i++) {
      const s = formData.sessions[i];
      const label = s.title?.trim() ? s.title.trim() : `Session ${i + 1}`;

      if (!s.title || !s.title.trim()) {
        toast.error(`Please enter a title for ${label}.`);
        return;
      }
      if (!s.date) {
        toast.error(`Please select a date for ${label}.`);
        return;
      }
      if (!s.startTime) {
        toast.error(`Please select a start time for ${label}.`);
        return;
      }
      if (!formData.sameSession) {
        const dur = Number(s.duration);
        if (!dur || dur <= 0) {
          toast.error(`Please select a duration for ${label}.`);
          return;
        }
      }
      if (!formData.sameModerator) {
        if (!s.moderators || s.moderators.length === 0) {
          toast.error(`Please select at least one moderator for ${label}.`);
          return;
        }
      } else {
        if (
          !formData.selectedModerators ||
          formData.selectedModerators.length === 0
        ) {
          toast.error("Please select at least one moderator in Step 1.");
          return;
        }
      }
    }

    // Frontend conflict check: ensure no overlapping sessions
    const parseToUtcMs = (dateStr: string, timeStr: string): number | null => {
      if (!dateStr || !timeStr) return null;
      const [y, m, d] = dateStr.split("-").map(Number);
      const [hh, mm] = timeStr.split(":").map(Number);
      if ([y, m, d, hh, mm].some((n) => Number.isNaN(n))) return null;
      // Treat entered local clock time as naive time and map to UTC epoch consistently
      return Date.UTC(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
    };

    const sessionsWithTimes = formData.sessions
      .map((s, idx) => {
        const durationMin = Number(
          formData.sameSession
            ? formData.sessions[0]?.duration ?? 0
            : s.duration ?? 0
        );
        const startMs = parseToUtcMs(s.date, s.startTime);
        const endMs =
          startMs !== null
            ? startMs + Math.max(0, durationMin) * 60 * 1000
            : null;
        const label = s.title?.trim() ? s.title.trim() : `Session ${idx + 1}`;
        return { idx, startMs, endMs, label } as const;
      })
      // consider only rows with complete timing info and positive duration
      .filter((r) => r.startMs !== null && r.endMs !== null) as Array<{
      idx: number;
      startMs: number;
      endMs: number;
      label: string;
    }>;

    if (sessionsWithTimes.length > 1) {
      const sorted = [...sessionsWithTimes].sort(
        (a, b) => a.startMs - b.startMs
      );
      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const curr = sorted[i];
        if (curr.startMs < prev.endMs) {
          toast.error(
            `Time conflict: "${prev.label}" overlaps with "${curr.label}".`
          );
          return;
        }
      }
    }

    if (project?.service === "Concierge") {
      const now = new Date();
      const cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() + 14);

      const tooSoon = formData.sessions.some((s) => {
        const sessionDate = new Date(s.date);
        return sessionDate < cutoff;
      });

      if (tooSoon) {
        toast.error(
          "You have selected Concierge Service for your project. " +
            "Sessions cannot be added for dates less than 2 weeks in the future. " +
            "Please contact info@amplifyresearch.com to check availability within this time window."
        );
        return;
      }
    }
    createSessions.mutate({
      projectId,
      timeZone: formData.timeZone,
      sameSession: formData.sameSession,
      sessions: formData.sessions.map((s) => ({
        title: s.title,
        date: s.date,
        startTime: s.startTime,
        duration: Number(s.duration),
        moderators: formData.sameModerator
          ? formData.selectedModerators
          : s.moderators,
      })),
    });
  };

  const handleNext = () => {
    if (formData.selectedModerators.length === 0) {
      return toast.error("Please select at least one moderator.");
    }
    if (formData.numberOfSessions < 1) {
      return toast.error("Please select the number of sessions (minimum 1).");
    }
    if (!formData.timeZone) {
      if (project?.defaultTimeZone) {
        setFormData((f) => ({ ...f, timeZone: project.defaultTimeZone! }));
      } else {
        return toast.error("Project time zone is loading. Please try again.");
      }
    }
    // If sessions share the same length, require a selection before continuing
    if (formData.sameSession) {
      const lengthValue = formData.sessions[0]?.duration;
      if (!lengthValue || Number(lengthValue) <= 0) {
        return toast.error("Please select a session length.");
      }
    }
    setStep(2);
  };

  const isSaving = createSessions.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setFormData(initialFormData);
          setStep(1);
          onClose();
        }
      }}
    >
      <DialogContent className="w-full max-w-5xl overflow-x-auto border-0">
        <DialogHeader>
          <DialogTitle>Add New Session</DialogTitle>
        </DialogHeader>
        {step === 1 && (
          <>
            <AddSessionStep1
              formData={formData}
              updateFormData={(fields) =>
                setFormData((f) => ({ ...f, ...fields }))
              }
            />
            <div className="flex justify-end">
              <CustomButton
                onClick={handleNext}
                disabled={
                  formData.sameSession &&
                  !(Number(formData.sessions[0]?.duration) > 0)
                }
                className="bg-custom-teal hover:bg-custom-dark-blue-3"
              >
                Next
              </CustomButton>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <AddSessionStep2
              formData={formData}
              updateFormData={(fields) =>
                setFormData((f) => ({ ...f, ...fields }))
              }
              isSaving={isSaving}
            />
            <div className="flex justify-between">
              <CustomButton
                onClick={() => setStep(1)}
                className="bg-custom-teal hover:bg-custom-dark-blue-3"
              >
                Back
              </CustomButton>
              <CustomButton
                onClick={handleSave}
                disabled={isSaving}
                className="bg-custom-orange-2 hover:bg-custom-orange-1"
              >
                {isSaving ? "Saving…" : "Save Sessions"}
              </CustomButton>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddSessionModal;
