// hooks/useStep2.ts
"use client";

import { useRouter } from "next/navigation";
import { useForm, SubmitHandler} from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import {
  IProjectFormState,
  Step2FormValues,
} from "@shared/interface/CreateProjectInterface";

interface UseStep2Props {
  formData: IProjectFormState;
  updateFormData: (fields: Partial<IProjectFormState>) => void;
  uniqueId: string | null;
}

export function useStep2({
  formData,
  updateFormData,
  uniqueId,
}: UseStep2Props) {
  const router = useRouter();

  // 1) Initialize React Hook Form
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Step2FormValues>({
    defaultValues: {
      respondentsPerSession: formData.respondentsPerSession,
      numberOfSessions: formData.numberOfSessions,
      sessionLength: formData.sessionLength,
      preWorkDetails: formData.preWorkDetails,
      selectedLanguage: formData.selectedLanguage,
      languageSessionBreakdown: formData.languageSessionBreakdown,
      additionalInfo: formData.additionalInfo,
      inLanguageHosting: (formData.inLanguageHosting as "yes" | "no") || undefined,
      recruitmentSpecs: formData.recruitmentSpecs || "",
      provideInterpreter: formData.provideInterpreter || "",
    },
  });

  // 2) Set up the mutation that emails project info
  const mutation = useMutation({
    mutationFn: (data: {
      userId: string;
      uniqueId: string | null;
      formData: IProjectFormState;
    }) =>
      axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/v1/projects/email-project-info`,
        data
      ),
    onSuccess: () => {
      toast.success("Project information sent successfully");
      router.push("/projects");
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Unknown error");
    },
  });

  const isLoading = mutation.isPending;

  // 3) onSubmit merges Step2 values into formData and triggers mutation
  const onSubmit: SubmitHandler<Step2FormValues> = (data) => {
    const { respondentsPerSession, numberOfSessions, sessionLength } = data;

 // ① Prevent zero‐values right at submit time
    if (
      respondentsPerSession === 0 ||
      numberOfSessions === 0 ||
      sessionLength === 0
    ) {
      toast.error(
        "Respondents per session, Number of session and session length all three fields must have value at least 1."
      );
      return; // stop here
    }

    const mergedData: IProjectFormState = { ...formData, ...data };
    updateFormData(data);

    mutation.mutate({
      userId: formData.user,
      uniqueId,
      formData: mergedData,
    });
  };

  // 4) Expose everything needed by the component
  return {
    register,
    handleSubmit,
    watch,
    errors,
    onSubmit,
    isLoading,
  };
}
