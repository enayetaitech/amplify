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

        {formData.addOns?.includes("Top-Notch Recruiting") && (
          <>
            <FormInput
              label="What are the target recruitment specs? Please include as much information as possible."
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
          </>
        )}

        {/* Conditional: Multi-Language Services */}
        {formData.addOns.includes("Multi-Language Services") && (
          <>
            <FormInput
              label="What language(s)?"
              name="selectedLanguage"
              register={register}
              required
              error={errors.selectedLanguage}
              pattern={/^[a-zA-Z\s,]+$/}
  patternMessage="Please enter only letters, spaces, and commas"
            />

            <div className="space-y-2">
              <p className="text-sm">
                Amplify can provide in-language hosting services for check-in
                and participant assistance in many languages.
              </p>
              <FormRadioGroup
                label="Will you need in-language hosting?"
                name="inLanguageHosting"
                options={["yes", "no"]}
                register={register}
                error={errors.inLanguageHosting}
              />
            </div>

            {watchInLanguageHosting === "yes" && (
              <div className="space-y-2">
                <p className="text-sm">
                  Amplify can provide the technology for including an
                  interpreter in the session, as well as the audio service to
                  allow observers to listen to both in-language and interpreted
                  audio.
                </p>
                <FormRadioGroup
                  label="Will you provide an interpreter?"
                  name="provideInterpreter"
                  options={["yes", "no"]}
                  register={register}
                  error={errors.provideInterpreter}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                If some sessions will be in English and some will be
                non-English, please specify how many of each you will conduct:
              </label>
              <Textarea
                {...register("languageSessionBreakdown", { required: true })}
                className="mt-1 w-full"
              />
              {errors.languageSessionBreakdown && (
                <p className="text-red-500 text-xs">This field is required</p>
              )}
            </div>
          </>
        )}

        {/* Anything else */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Anything else we should know about the project?
          </label>
          <Textarea {...register("additionalInfo")} className="mt-1 w-full" />
        </div>

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
