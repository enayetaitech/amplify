"use client";
import React from "react";
import { Textarea } from "../../ui/textarea";
import {
  Step2FormValues,
  Step2Props,
} from "@shared/interface/CreateProjectInterface";
import ComponentContainer from "../../shared/ComponentContainer";
import CustomButton from "../../shared/CustomButton";
import { useStep2 } from "hooks/useStep2";
import { FormInput } from "./step2Component/FormInput";
import { FormRadioGroup } from "./step2Component/FormRadioGroup";
import { validate } from "../../../schemas/validators";
import {
  alphanumericRules,
  alphaRules,
} from "../../../schemas/validationConfigs";
import { RegisterOptions, UseFormRegister } from "react-hook-form";
import { numberFields, recruitingFields } from "../../../constant/index";

export type FieldConfig = { name: keyof Step2FormValues; label: string };



// Simple textarea wrapper
function FormTextarea({
  name,
  label,
  register,
  rules,
  disabled,
  error,
}: {
  name: keyof Step2FormValues;
  label: string;
  register: UseFormRegister<Step2FormValues>;
  rules?: RegisterOptions<Step2FormValues>;
  disabled: boolean;
  error?: { message?: string };
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <Textarea
        {...register(name, rules)}
        className="mt-1 w-full"
        disabled={disabled}
      />
      {error && <p className="text-red-500 text-xs mt-2">{error.message}</p>}
    </div>
  );
}
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
        {/* Numeric inputs */}
        {numberFields.map(({ name, label }) => (
          <FormInput
            key={name}
            label={label}
            name={name}
            type="number"
            register={register}
            required
            disabled={isLoading}
            error={errors[name]}
          />
        ))}

        {formData.addOns?.includes("Top-Notch Recruiting") &&
          recruitingFields.map(({ name, label }) => (
            <FormInput
              key={name}
              label={label}
              name={name}
              register={register}
              required={name === "recruitmentSpecs"}
              disabled={isLoading}
              error={errors[name]}
              regexRules={alphanumericRules}
            />
          ))}

        {/* Conditional: Multi-Language Services */}
        {formData.addOns.includes("Multi-Language Services") && (
          <>
            <FormInput
              label="What language(s)?"
              name="selectedLanguage"
              register={register}
              required
              disabled={isLoading}
              error={errors.selectedLanguage}
              regexRules={alphaRules}
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
                disabled={isLoading}
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
                  disabled={isLoading}
                  error={errors.provideInterpreter}
                />
              </div>
            )}

            <FormTextarea
              name="languageSessionBreakdown"
              label="If some sessions will be in English and some will be non-English, please specify how many of each you will conduct:"
              register={register}
              rules={{
                required: "This field is required", // now v is inferred as string|number|undefined:
                validate: (v) => {
                  if (typeof v !== "string") return true;
                  return (
                    validate(
                      v,
                      alphanumericRules.map((r) => r.fn)
                    ) || "Only letters, numbers & single spaces allowed."
                  );
                },
              }}
              disabled={isLoading}
              error={errors.languageSessionBreakdown}
            />
          </>
        )}

        {/* Anything else */}
        <FormTextarea
          name="additionalInfo"
          label="Anything else we should know about the project?"
          register={register}
          rules={{
            validate: (v) => {
              if (typeof v !== "string") return true;
              return (
                validate(
                  v,
                  alphanumericRules.map((r) => r.fn)
                ) || "Only letters, numbers & single spaces allowed."
              );
            },
          }}
          disabled={isLoading}
          error={errors.additionalInfo}
        />

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
