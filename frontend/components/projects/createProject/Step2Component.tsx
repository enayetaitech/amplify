"use client";
import React from "react";
import { Textarea } from "components/ui/textarea";
import { Step2Props } from "@shared/interface/CreateProjectInterface";
import ComponentContainer from "components/shared/ComponentContainer";
import CustomButton from "components/shared/CustomButton";
import { useStep2 } from "hooks/useStep2";
import { FormInput } from "./step2Component/FormInput";
import { FormRadioGroup } from "./step2Component/FormRadioGroup";

const Step2: React.FC<Step2Props> = ({
  formData,
  updateFormData,
  uniqueId,
}) => {
  const { register, handleSubmit, watch, errors, onSubmit, isLoading } =
    useStep2({
      formData,
      updateFormData,
      uniqueId,
    });

  const watchInLanguageHosting = watch("inLanguageHosting");

  return (
    <ComponentContainer>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-gray-100 p-4 rounded-md">
          <h2 className="text-xl font-bold mb-2 text-center">
            Project Information Request
          </h2>
          <p className="text-sm text-center">
            An Amplify Team member will be in touch by the end of the next
            business day with a quote, or to gather more information so that we
            can provide you with the best pricing and service. If you need costs
            sooner or have more information to provide, please feel free to
            email info@amplifyresearch.com. Thank you!
          </p>
        </div>

        {/* Basic Project Info Fields */}
        <FormInput
          label="Number of Respondents per Session"
          name="respondentsPerSession"
          type="number"
          register={register}
          required
          error={errors.respondentsPerSession}
        />
        <FormInput
          label="Number of Sessions"
          name="numberOfSessions"
          type="number"
          register={register}
          required
          error={errors.numberOfSessions}
        />

        <FormInput
          label="Length(s) of Sessions (minutes)"
          name="sessionLength"
          type="number"
          register={register}
          required
          error={errors.sessionLength}
        />

        <FormInput
          label="What are the target recruitment spaces?"
          name="recruitmentSpecs"
          register={register}
          required
          error={errors.recruitmentSpecs}
        />

        <FormInput
          label="Will there be any pre–work or additional assignments?"
          name="preWorkDetails"
          register={register}
          required
          error={errors.preWorkDetails}
        />

        <FormInput
          label="What language?"
          name="selectedLanguage"
          register={register}
          required
          error={errors.selectedLanguage}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700">
            If some sessions will be in English and some will be non–English,
            please specify how many of each:
          </label>
          <Textarea
            {...register("languageSessionBreakdown", { required: true })}
            className="mt-1 w-full"
          />
          {errors.languageSessionBreakdown && (
            <p className="text-red-500 text-xs">This field is required</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Anything else we should know about the project?
          </label>
          <Textarea {...register("additionalInfo")} className="mt-1 w-full" />
        </div>

        {formData.addOns.includes("Multi-Language Services") && (
          <FormRadioGroup
            label="Will you need hosting in a language other than English?"
            name="inLanguageHosting"
            options={["yes", "no"]}
            register={register}
            error={errors.inLanguageHosting}
          />
        )}

        {watchInLanguageHosting === "yes" && (
          <FormRadioGroup
            label="Will you provide an interpreter?"
            name="provideInterpreter"
            options={["yes", "no"]}
            register={register}
            error={errors.provideInterpreter}
          />
        )}

        {/* Conditional Field: If Top–Notch Recruiting was selected */}
        {formData.addOns.includes("Top-Notch Recruiting") && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              What are the target recruitment specs? Please include as much
              information as possible:
            </label>
            <Textarea
              {...register("recruitmentSpecs", { required: true })}
              className="mt-1 w-full"
            />
            {errors.recruitmentSpecs && (
              <p className="text-red-500 text-xs">This field is required</p>
            )}
          </div>
        )}

        <div className="text-center">
          <CustomButton
            type="submit"
            className="bg-custom-teal hover:bg-custom-dark-blue-3"
            disabled={isLoading}
          >
            {isLoading ? "Submitting..." : "Submit Project Information"}
          </CustomButton>
        </div>
      </form>
    </ComponentContainer>
  );
};

export default Step2;
