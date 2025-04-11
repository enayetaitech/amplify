"use client";

import React, { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useGlobalContext } from "context/GlobalContext";
import { Button } from "components/ui/button";
import Step1 from "components/projects/createProject/Step1Component";
import Step2 from "components/projects/createProject/Step2Component";
import Step3 from "components/projects/createProject/Step3Component";
import Step4 from "components/projects/createProject/Step4Component";
import { IProjectFormState, StepProps } from "../../../../shared/interface/CreateProjectInterface"

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

  const nextStep = () => setCurrentStep((prev) => prev + 1);
  const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const isNextButtonDisabled = () => {
    if (currentStep === 0) {
      return !formData.service || !formData.firstDateOfStreaming;
    }
    return false;
  };

  const { mutate, status } = useMutation({
    mutationFn: (data: {
      uniqueId: string | null;
      formData: IProjectFormState;
      userId: string;
    }) =>
      axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/v1/projects/save-progress`,
        data
      ),
    onSuccess: (res) => {
      const returnedId = res.data.data.uniqueId;
      if (returnedId) {
        setUniqueId(returnedId);
      }
      nextStep();
    },
    onError: (err) => {
      console.error("Error saving progress", err);
    },
  });

  const isLoading = status === "pending";

  // Compute steps based on the new logic
  const computeSteps = (): Array<React.FC<StepProps>> => {
    if (formData.service === "Signature") {
      // For Signature always use Step1, Step3, Step4.
      return [Step1, Step3, Step4];
    } else if (formData.service === "Concierge") {
      // For Concierge, we check the streaming date and addOns.
      if (formData.firstDateOfStreaming) {
        const streamingDate = new Date(formData.firstDateOfStreaming);
        const now = new Date();
        // Calculate difference in days
        const diffDays = (streamingDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
        const addOnsSelected = formData.addOns && formData.addOns.length > 0;
        // If streaming date is within 2 weeks OR any add–on is selected, render Step2.
        if (diffDays < 14 || addOnsSelected) {
          return [Step1, Step2];
        } else {
          // Otherwise, skip Step2 and go to Step3 and Step4.
          return [Step1, Step3, Step4];
        }
      }
      // If no streaming date, default to showing Step2.
      return [Step1, Step2];
    }
    // Fallback: if no service selected, only show Step1.
    return [Step1];
  };

  const steps = computeSteps();

  // Ensure currentStep is within bounds if steps change.
  useEffect(() => {
    if (currentStep >= steps.length) {
      setCurrentStep(steps.length - 1);
    }
  }, [steps, currentStep]);

  const StepComponent = steps[currentStep];

  const handleNext = () => {
    mutate({ uniqueId, formData, userId });
  };

  return (
    <div className="min-h-screen p-6">
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
        <Button variant="outline" onClick={handleBack} disabled={currentStep === 0}>
          Back
        </Button>
        {/* Only show Next button if not on last step */}
  {!(formData.service === "Concierge" && currentStep === 1) &&
    !(formData.service === "Signature" && currentStep === 2) && (
      <Button
        onClick={handleNext}
        disabled={isNextButtonDisabled() || isLoading}
      >
        {isLoading ? "Saving..." : "Next"}
      </Button>
  )}
      </div>
    </div>
  );
};

export default CreateProjectPage;
