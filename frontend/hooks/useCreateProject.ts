// hooks/useCreateProject.ts
"use client";

import { useState, useEffect, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import api from "lib/api";

import { ApiResponse, ErrorResponse } from "@shared/interface/ApiResponseInterface";
import { useGlobalContext } from "context/GlobalContext";
import Step1 from "components/projects/createProject/Step1Component";
import Step2 from "components/projects/createProject/Step2Component";
import Step3 from "components/projects/createProject/Step3Component";
import Step4 from "components/projects/createProject/Step4Component";
import { IProjectFormState, StepProps } from "@shared/interface/CreateProjectInterface";

/**
 * Custom hook that centralizes:
 *  - formData + updateFormData
 *  - currentStep / step logic
 *  - saveMutation (calling /api/v1/projects/save-progress)
 */
export function useCreateProject() {
  const { user } = useGlobalContext();
  const userId = user?._id || "";

  // 1) form data state
  const [formData, setFormData] = useState<IProjectFormState>({
    user: userId,
    name: "",
    service: "",
    addOns: [],
    respondentCountry: "",
    respondentLanguage: [],
    sessions: [],
    firstDateOfStreaming: "",
    projectDate: "",
    respondentsPerSession: 0,
    numberOfSessions: 0,
    sessionLength: 0,
    recruitmentSpecs: "",
    preWorkDetails: "",
    selectedLanguage: "",
    inLanguageHosting: "",
    provideInterpreter: "",
    languageSessionBreakdown: "",
    additionalInfo: "",
    emailSent: "",
  });

  const updateFormData = (fields: Partial<IProjectFormState>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  };

  // 2) dynamically decide which steps apply, based on service / date / addOns
  const steps = useMemo<React.FC<StepProps>[]>(() => {
    if (formData.service === "Signature") {
      return [Step1, Step3, Step4];
    }
    if (formData.service === "Concierge") {
      if (formData.firstDateOfStreaming) {
        const diffDays =
          (new Date(formData.firstDateOfStreaming).getTime() - Date.now()) /
          (1000 * 3600 * 24);
        if (diffDays < 14 || formData.addOns.length > 0) {
          return [Step1, Step2];
        }
        return [Step1, Step3, Step4];
      }
      return [Step1, Step2];
    }
    return [Step1];
  }, [formData.service, formData.firstDateOfStreaming, formData.addOns]);

  // 3) keep track of which step we’re on
  const [currentStep, setCurrentStep] = useState<number>(0);

  // if steps array shrinks, clamp currentStep to valid index
  useEffect(() => {
    if (currentStep >= steps.length) {
      setCurrentStep(steps.length - 1);
    }
  }, [steps, currentStep]);

  // 4) "save-progress" mutation
  const [uniqueId, setUniqueId] = useState<string | null>(null);

  const saveMutation = useMutation<
    ApiResponse<{ uniqueId: string }>,
    AxiosError<ErrorResponse>,
    { uniqueId: string | null; formData: IProjectFormState; userId: string }
  >({
    mutationFn: (payload) =>
      api
        .post<ApiResponse<{ uniqueId: string }>>(
          "/api/v1/projects/save-progress",
          payload
        )
        .then((res) => res.data),

    onSuccess: (resp) => {
      if (resp.data.uniqueId) {
        setUniqueId(resp.data.uniqueId);
      }
      setCurrentStep((prev) => prev + 1);
    },

    onError: (err) => {
      const msg =
        axios.isAxiosError(err) && err.response?.data.message
          ? err.response.data.message
          : err.message;
      toast.error(msg);
    },
  });

  const isLoading = saveMutation.isPending;

  // 5) helpers to navigate Back / Next
const isLastStep =
    (formData.service === "Concierge" && currentStep === steps.length - 1) ||
    (formData.service === "Signature" && currentStep === steps.length - 1);

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleNext = () => {
    saveMutation.mutate({ uniqueId, formData, userId });
  };

  const isNextButtonDisabled = () => {
    if (currentStep === 0) {
      return !formData.service || !formData.firstDateOfStreaming;
    }
    return false;
  };

   const totalSteps = steps.length;

  return {
    formData,
    updateFormData,
    currentStep,
    StepComponent: steps[currentStep],
    totalSteps,
    handleBack,
    handleNext,
    isNextButtonDisabled,
    isLastStep,
    isLoading,
      uniqueId,
  };
}
