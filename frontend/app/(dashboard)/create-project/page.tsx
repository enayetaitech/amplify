"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { useGlobalContext } from "context/GlobalContext";
import { Button } from "components/ui/button";
import Step1 from "components/projects/createProject/Step1Component";
import Step2 from "components/projects/createProject/Step2Component";
import Step3 from "components/projects/createProject/Step3Component";
import Step4 from "components/projects/createProject/Step4Component";
import {
  IProjectFormState,
  StepProps,
} from "../../../../shared/interface/CreateProjectInterface";
import { toast } from "sonner";
import api from "lib/api";
import {
  ApiResponse,
  ErrorResponse,
} from "@shared/interface/ApiResponseInterface";
import ComponentContainer from "components/shared/ComponentContainer";
import CustomButton from "components/shared/CustomButton";

const CreateProjectPage: React.FC = () => {
  const { user } = useGlobalContext();
  const userId = user?._id || "";

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [uniqueId, setUniqueId] = useState<string | null>(null);

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
    sessionLength: "",
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

  // Dynamically compute which steps apply
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

  // Keep currentStep in range
  useEffect(() => {
    if (currentStep >= steps.length) {
      setCurrentStep(steps.length - 1);
    }
  }, [steps, currentStep]);

  const StepComponent = steps[currentStep];

  // const nextStep = () => setCurrentStep((prev) => prev + 1);
  const handleNext = () => saveMutation.mutate({ uniqueId, formData, userId });

  const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const isNextButtonDisabled = () => {
    if (currentStep === 0) {
      return !formData.service || !formData.firstDateOfStreaming;
    }
    return false;
  };

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

  return (
    <ComponentContainer>
      <div className="min-h-screen p-6 ml-8">
        <h1 className="text-3xl font-bold mb-4 text-center">Create Project</h1>
        <div className="mb-4 text-center">
          <p>
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>

        {/* Dynamic Step Rendering */}
        <StepComponent
          formData={formData}
          updateFormData={updateFormData}
          uniqueId={uniqueId}
        />

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            Back
          </Button>
          {/* Only show Next button if not on last step */}
          {!(formData.service === "Concierge" && currentStep === 1) &&
            !(formData.service === "Signature" && currentStep === 2) && (
              <CustomButton
                onClick={handleNext}
                disabled={isNextButtonDisabled() || isLoading}
                className="bg-custom-teal hover:bg-custom-dark-blue-3"
              >
                {isLoading ? "Saving..." : "Next"}
              </CustomButton>
            )}
        </div>
      </div>
    </ComponentContainer>
  );
};

export default CreateProjectPage;
