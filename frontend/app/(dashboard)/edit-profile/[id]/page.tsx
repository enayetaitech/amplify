"use client";
import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { FaSave } from "react-icons/fa";
import { Button } from "components/ui/button";
import InputFieldComponent from "components/shared/InputFieldComponent";
import { useUserById } from "hooks/useUserById";
import { useUpdateUser } from "hooks/useUpdateUser";
import { Controller, useForm } from "react-hook-form";
import { EditUserFormValues, editUserSchema } from "schemas/editUserSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { personalFields } from "constant";

const Page: React.FC = () => {
  const { id } = useParams() as { id: string };
  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      companyName: "",
      phoneNumber: "",
    },
  });

  const { data: fullUser, isLoading, isError, error } = useUserById(id);
  const updateMutation = useUpdateUser(id);

  useEffect(() => {
    if (fullUser) {
      reset({
        firstName: fullUser.firstName,
        lastName: fullUser.lastName,
        companyName: fullUser.companyName || "",
        phoneNumber: fullUser.phoneNumber || "",
      });
    }
  }, [fullUser, reset]);

  const onSubmit = (data: EditUserFormValues) => updateMutation.mutate(data);

  if (isLoading) return <p className="px-6 py-4">Loading profile…</p>;

  if (isError) {
    console.error("Error fetching user:", error);
    return (
      <p className="px-6 py-4 text-red-500">
        {error?.message || "Failed to load profile"}
      </p>
    );
  }

  const isSaving = updateMutation.isPending;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="my_profile_main_section_shadow pb-16 bg-[#fafafb] bg-opacity-90 h-full min-h-screen flex flex-col items-center"
    >
      {/* navbar */}
      <div className="bg-white h-20 w-full">
        <div className="px-10 flex justify-between items-center pt-3">
          <h1 className="text-2xl font-bold text-[#1E656D]">Edit Profile</h1>

          <div className="fixed right-5 md:static md:flex gap-4">
            <Button
              type="submit"
              variant="teal"
              disabled={isSaving}
              className="rounded-xl py-6 w-full md:w-[100px] shadow-[0px_3px_6px_#FF66004D] md:shadow-[0px_3px_6px_#2976a54d]   
    "
            >
              <FaSave className="md:mr-1" />
              <span className="hidden md:inline">
                {isSaving ? "Saving" : "Save"}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* body */}
      <div className="w-full md:w-[450px] px-5 md:px-0 md:ml-6 md:mr-auto">
        <div className="pt-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <Image
              src="/placeholder-image.png"
              alt="user image"
              height={70}
              width={70}
              className="rounded-full"
            />
            <Controller
              name="firstName"
              control={control}
              render={({ field }) => (
                <div className="flex-grow">
                  <h2 className="text-3xl font-semibold text-[#1E656D]">
                    {field.value}
                  </h2>
                  <p className="text-gray-400">{fullUser?.role}</p>
                </div>
              )}
            />
          </div>

          <h2 className="text-2xl font-semibold text-[#00293C] pt-7">
            Personal Details
          </h2>
          <div className="space-y-7 mt-5">
            {personalFields.map(({ name, label }) => (
              <Controller
                key={name}
                name={name}
                control={control}
                render={({ field }) => (
                  <InputFieldComponent
                    label={label}
                    {...field}
                    error={errors[name]?.message}
                    disabled={isSaving}
                  />
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </form>
  );
};

export default Page;
