"use client";

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { IProjectForm } from "../../../../shared/interface/projectForm.interface";
import { useGlobalContext } from "context/GlobalContext";
import { Button } from "components/ui/button";
import Step1 from "components/projects/createProject/Step1";
import Step2 from "components/projects/createProject/Step2";
import Step3 from "components/projects/createProject/Step3";
import Step4 from "components/projects/createProject/Step4";

// Local state type override: treat Date fields as strings to allow initial empty values
export type IProjectFormState = Omit<IProjectForm, "firstDateOfStreaming" | "projectDate"> & {
  firstDateOfStreaming: string;
  projectDate: string;
};

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

  // Steps:
  // If service is Signature: Step1, Step3, Step4
  // If service is Concierge: Step1, Step2
  const steps = formData.service === "Signature"
    ? [Step1, Step3, Step4]
    : [Step1, Step2];

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
