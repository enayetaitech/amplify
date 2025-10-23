"use client";
import React, { useEffect, useState } from "react";
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
import { personalFields, addressFields } from "constant";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "components/ui/dialog";
import { Input } from "components/ui/input";
import api from "lib/api";
import { toast } from "sonner";

const Page: React.FC = () => {
  const { id } = useParams() as { id: string };
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingEmailData, setPendingEmailData] =
    useState<EditUserFormValues | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

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
      email: "",
      phoneNumber: "",
      companyName: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
    },
  });

  const { data: fullUser, isLoading, isError, error } = useUserById(id);
  const updateMutation = useUpdateUser(id);

  useEffect(() => {
    if (fullUser) {
      reset({
        firstName: fullUser.firstName,
        lastName: fullUser.lastName,
        email: fullUser.email,
        phoneNumber: fullUser.phoneNumber || "",
        companyName: fullUser.companyName || "",
        address: fullUser.billingInfo?.address || "",
        city: fullUser.billingInfo?.city || "",
        state: fullUser.billingInfo?.state || "",
        postalCode: fullUser.billingInfo?.postalCode || "",
        country: fullUser.billingInfo?.country || "",
      });
    }
  }, [fullUser, reset]);

  const onSubmit = async (data: EditUserFormValues) => {
    // Check if email was changed
    if (fullUser && data.email.toLowerCase() !== fullUser.email.toLowerCase()) {
      // Email changed - trigger 2FA flow
      setPendingEmailData(data);
      try {
        await api.post(`/api/v1/users/${id}/request-email-change`, {
          newEmail: data.email,
        });
        toast.success("Verification code sent to new email");
        setShowEmailVerification(true);
      } catch (err: unknown) {
        toast.error(
          (err as { message?: string })?.message ||
            "Failed to send verification code"
        );
      }
    } else {
      // Email not changed - proceed with normal update
      updateMutation.mutate(data);
    }
  };

  const handleVerifyEmail = async () => {
    if (!verificationCode || !pendingEmailData) return;

    setIsVerifying(true);
    try {
      // Verify the email change
      await api.post(`/api/v1/users/${id}/verify-email-change`, {
        verificationCode,
      });

      toast.success("Email verified successfully");
      setShowEmailVerification(false);
      setVerificationCode("");

      // Now update all other fields
      updateMutation.mutate(pendingEmailData);

      // Refresh user data
      setTimeout(() => {
        window.location.href = `/my-profile/${id}`;
      }, 1000);
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message || "Invalid verification code"
      );
    } finally {
      setIsVerifying(false);
    }
  };

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
                    value={field.value || ""}
                    error={errors[name]?.message}
                    disabled={isSaving}
                  />
                )}
              />
            ))}
          </div>

          <h2 className="text-2xl font-semibold text-[#00293C] pt-7">
            Address Details
          </h2>
          <div className="space-y-7 mt-5">
            {addressFields.map(({ name, label }) => (
              <Controller
                key={name}
                name={name}
                control={control}
                render={({ field }) => (
                  <InputFieldComponent
                    label={label}
                    {...field}
                    value={field.value || ""}
                    error={errors[name]?.message}
                    disabled={isSaving}
                  />
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Email Verification Dialog */}
      <Dialog
        open={showEmailVerification}
        onOpenChange={setShowEmailVerification}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verify New Email Address</DialogTitle>
            <DialogDescription>
              We sent a 6-digit verification code to your new email address (
              {pendingEmailData?.email}). Please enter it below to confirm the
              change.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Verification Code</label>
              <Input
                type="text"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
                className="text-center text-2xl tracking-widest"
              />
            </div>
            <p className="text-xs text-gray-500">
              The code will expire in 15 minutes. Didn&apos;t receive it? Check
              your spam folder.
            </p>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowEmailVerification(false);
                setVerificationCode("");
                setPendingEmailData(null);
              }}
              disabled={isVerifying}
            >
              Cancel
            </Button>
            <Button
              variant="teal"
              onClick={handleVerifyEmail}
              disabled={
                !verificationCode ||
                verificationCode.length !== 6 ||
                isVerifying
              }
            >
              {isVerifying ? "Verifying..." : "Verify"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
};

export default Page;
