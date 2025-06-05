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

  return (
    <ComponentContainer>
      <div className="min-h-screen p-6 ml-8">
        <h1 className="text-3xl font-bold mb-4 text-center">Create Project</h1>
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
                "ml-36": currentStep === 2,
              },
              {
                "ml-6": currentStep === 1,
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
