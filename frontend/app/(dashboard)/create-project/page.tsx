"use client";

import React from "react";
import ComponentContainer from "components/shared/ComponentContainer";
import CustomButton from "components/shared/CustomButton";
import clsx from "clsx";
import { useCreateProject } from "hooks/useCreateProject";

const CreateProjectPage: React.FC = () => {
   const {
    formData,
    updateFormData,
    currentStep,
    StepComponent,
    totalSteps,
    handleBack,
    handleNext,
    isNextButtonDisabled,
    isLastStep,
    isLoading,
    uniqueId
  } = useCreateProject();

    const stepTitles: Record<number, string[]> = {
    2: [
      "Choose Service",   
      "Project Information Request"
    ],
    3: [
      "Choose Service",   
      "Tell us about your project", 
      "Review & Pay" 
    ]
  };

  // fallback to "Create Project" if something unexpected happens
  const heading =
    stepTitles[totalSteps]?.[currentStep] ??
    "Create Project";

  return (
    <ComponentContainer>
      <div className="min-h-screen p-6 mx-5">
        <h1 className="text-3xl font-bold mb-4 text-center">{heading}</h1>
        <div className="mb-4 text-center">
          <p>
            Step {currentStep + 1} of {totalSteps}
          </p>
        </div>

        {/* Dynamic Step Rendering */}
        <StepComponent
          formData={formData}
          updateFormData={updateFormData}
          uniqueId={uniqueId}
        
        />

        <div className="flex justify-between mt-6  items-center">
          <CustomButton
            className={clsx(
              "bg-custom-teal hover:bg-custom-dark-blue-3",
              {
                "": currentStep === 2,
              },
              {
                "": currentStep === 1,
              }
            )}
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            Back
          </CustomButton>
          {/* Only show Next button if not on last step */}
          {!isLastStep && (
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
