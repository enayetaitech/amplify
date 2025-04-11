"use client";

import React from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Textarea } from "components/ui/textarea"; 
import { useRouter } from "next/navigation";
import axios from "axios";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { IProjectFormState, Step2FormValues, Step2Props } from "@shared/interface/CreateProjectInterface";

const Step2: React.FC<Step2Props> = ({ formData, updateFormData, uniqueId }) => {
  const router = useRouter();

  const {
    register,
    handleSubmit,
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
      inLanguageHosting: formData.inLanguageHosting as "yes" | "no" || undefined,
      recruitmentSpecs: formData.recruitmentSpecs || "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: { userId: string; uniqueId: string | null; formData: IProjectFormState }) =>
      axios.post(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/v1/projects/email-project-info`, data),

    onSuccess: () => {
      toast.success("Project information sent successfully");
      router.push("/projects");
    },

    onError: (error: unknown) => {
      console.error("Error sending project info", error);
      
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Something went wrong");
      } else {
        toast.error("An unexpected error occurred.");
      }
    },
  });


  const onSubmit: SubmitHandler<Step2FormValues> = (data) => {
    const mergedData = { ...formData, ...data };
    updateFormData(data); 

    mutation.mutate({
      userId: formData.user,
      uniqueId, 
      formData: mergedData,
    });
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-gray-100 p-4 rounded-md">
        <h2 className="text-xl font-bold mb-2 text-center">
          Project Information Request
        </h2>
        <p className="text-sm text-center">
          An Amplify Team member will be in touch by the end of the next business day with a quote,
          or to gather more information so that we can provide you with the best pricing and service.
          If you need costs sooner or have more information to provide, please feel free to email
          info@amplifyresearch.com. Thank you!
        </p>
      </div>

      {/* Basic Project Info Fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700">
            Number of Respondents per Session
          </label>
          <Input
            type="number"
            {...register("respondentsPerSession", { required: true, valueAsNumber: true })}
            className="mt-1 w-full"
          />
          {errors.respondentsPerSession && <p className="text-red-500 text-xs">This field is required</p>}
        </div>
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700">
            Number of Sessions
          </label>
          <Input
            type="number"
            {...register("numberOfSessions", { required: true, valueAsNumber: true })}
            className="mt-1 w-full"
          />
          {errors.numberOfSessions && <p className="text-red-500 text-xs">This field is required</p>}
        </div>
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700">
            Length(s) of Sessions (minutes)
          </label>
          <Input
            type="number"
            {...register("sessionLength", { required: true })}
            className="mt-1 w-full"
          />
          {errors.sessionLength && <p className="text-red-500 text-xs">This field is required</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Will there be any pre–work or additional assignments?
        </label>
        <Input
          type="text"
          {...register("preWorkDetails", { required: true })}
          className="mt-1 w-full"
        />
        {errors.preWorkDetails && <p className="text-red-500 text-xs">This field is required</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            What language?
          </label>
          <Input
            type="text"
            {...register("selectedLanguage", { required: true })}
            className="mt-1 w-full"
          />
          {errors.selectedLanguage && <p className="text-red-500 text-xs">This field is required</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            If some sessions will be in English and some will be non–English, please specify how many of each:
          </label>
          <Textarea
            {...register("languageSessionBreakdown", { required: true })}
            className="mt-1 w-full"
          />
          {errors.languageSessionBreakdown && <p className="text-red-500 text-xs">This field is required</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Anything else we should know about the project?
        </label>
        <Textarea
          {...register("additionalInfo")}
          className="mt-1 w-full"
        />
      </div>

      {/* Conditional Field: If Multi–Language Services was selected */}
      {formData.addOns.includes("Multi-Language Services") && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Will you need hosting in a language other than English?
          </label>
          <div className="flex items-center space-x-4 mt-1">
            <label className="flex items-center space-x-1">
              <input
                type="radio"
                value="yes"
                {...register("inLanguageHosting", { required: true })}
                className="cursor-pointer"
              />
              <span className="text-sm">Yes</span>
            </label>
            <label className="flex items-center space-x-1">
              <input
                type="radio"
                value="no"
                {...register("inLanguageHosting", { required: true })}
                className="cursor-pointer"
              />
              <span className="text-sm">No</span>
            </label>
          </div>
          {errors.inLanguageHosting && <p className="text-red-500 text-xs">Please select an option</p>}
        </div>
      )}

      {/* Conditional Field: If Top–Notch Recruiting was selected */}
      {formData.addOns.includes("Top-Notch Recruiting") && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            What are the target recruitment specs? Please include as much information as possible:
          </label>
          <Textarea
            {...register("recruitmentSpecs", { required: true })}
            className="mt-1 w-full"
          />
          {errors.recruitmentSpecs && <p className="text-red-500 text-xs">This field is required</p>}
        </div>
      )}

      <div className="text-center">
        <Button type="submit" className="mt-4">
          Submit Project Information
        </Button>
      </div>
    </form>
  );
};

export default Step2;
