// components/ResetPasswordForm.tsx
"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import PasswordField from "../createAccount/PasswordField";
import { Button } from "components/ui/button";
import { Alert, AlertDescription } from "components/ui/alert";
import {
  ResetPasswordInputs,
  resetPasswordSchema,
} from "schemas/resetPasswordSchema";
import useResetPassword from "hooks/useResetPassword";
import { Form } from "../../components/ui/form";

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const form = useForm<ResetPasswordInputs>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const {
    mutate: reset,
    isPending,
    isError,
    isSuccess,
    error,
    data,
  } = useResetPassword();

  const { handleSubmit, control } = form;

  const onSubmit = (values: ResetPasswordInputs) => {
    if (!token) {
      return;
    }
    reset(
      { token, newPassword: values.newPassword },
      {
        onSuccess: () => {
          setTimeout(() => router.push("/login"), 1500);
        },
      }
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="py-20 flex-grow flex items-center justify-center">
        <div className="max-w-md w-full mx-auto p-8 bg-white rounded-xl shadow-lg">
          <h1 className="text-2xl font-bold text-center mb-6">
            Reset Password
          </h1>
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <PasswordField
                control={control}
                name="newPassword"
                label="New Password"
                placeholder="••••••••"
                disabled={isPending}
              />
              <PasswordField
                control={control}
                name="confirmPassword"
                label="Confirm New Password"
                placeholder="••••••••"
                disabled={isPending}
              />

              <Button type="submit" 
              disabled={isPending}
               className="w-full bg-orange-500 hover:bg-orange-600"
              >
                {isPending ? "Resetting…" : "Reset Password"}

              </Button>
            </form>
          </Form>
          {isSuccess && (
            <Alert variant="default" className="mt-4 bg-green-50">
              <AlertDescription className="text-green-600 text-center">
                {data!.message} – redirecting to login…
              </AlertDescription>
            </Alert>
          )}

          {isError && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription className="text-center">
                {error.response?.data.message || error.message}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}
