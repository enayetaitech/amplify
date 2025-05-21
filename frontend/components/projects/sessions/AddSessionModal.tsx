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
  breakoutRoom: boolean;
  sameModerator: boolean;  
  sessions: Array<{
    title: string;
    date: string;
    startTime: string;
    duration: string;
    moderators: string[];
  }>;
}

const initialFormData: ISessionFormData = {
  numberOfSessions: 1,
  selectedModerators: [],
  allModerators: [],
  timeZone: "",
  breakoutRoom: false,
  sameModerator: false,
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

  const { data: project} = useQuery<IProject, Error>({
    queryKey: ['project', projectId],
    queryFn: () =>
      api
        .get(`/api/v1/projects/get-project-by-id/${projectId}`)
        .then((res) => res.data.data),
    enabled: Boolean(projectId),
  })


  
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
      breakoutRoom: boolean;
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
        queryKey: ["sessions", projectId, 'project', projectId],
      });
      setFormData(initialFormData);
      onClose();
      setStep(1);
    },
    onError: (error) => {
    toast.error(error instanceof Error ? error.message : "Unknown error");
  }
  });

  const handleSave = () => {
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
      breakoutRoom: formData.breakoutRoom,
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
      return toast.error("Please select a time zone.");
    }
    setStep(2);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-6xl overflow-x-auto border-0">
        <DialogHeader>
          <DialogTitle>Add Session</DialogTitle>
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
                disabled={createSessions.isPending}
                className="bg-custom-orange-2 hover:bg-custom-orange-1"
              >
                {createSessions.isPending ? "Saving…" : "Save Sessions"}
              </CustomButton>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddSessionModal;
