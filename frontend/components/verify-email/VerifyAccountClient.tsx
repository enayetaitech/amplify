// pages/verify-email.tsx
"use client";

import React, { useEffect } from "react";
import {  useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useVerifyEmail } from "../../hooks/useVerifyEmail";
import { Button } from "../../components/ui/button";

const VerifyAccountClient = () => {
  
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";

  const verifyEmail = useVerifyEmail();

  useEffect(() => {
    if (!token) {
      toast.error("No verification token found in URL");
      return;
    }

    verifyEmail.mutate(token, {
      onSuccess: () => {
        toast.success("Email verified! Redirecting to login…");
        setTimeout(() => router.replace("/login"), 1500);
      },
      onError: (err) => {
        const msg = err.response?.data?.message ?? err.message;
        toast.error(`Verification failed: ${msg}`);
      },
    });
  }, [token]);

  // Render different states:
  if (verifyEmail.isPending) {
    return <p className="p-8 text-center">Verifying your email…</p>;
  }

  if (verifyEmail.isError) {
    return (
      <div className="p-8 max-w-md mx-auto text-center space-y-4">
        <p className="text-red-600">
          {verifyEmail.error?.response?.data?.message ??
            verifyEmail.error?.message ??
            "Something went wrong."}
        </p>
        {token && (
          <Button onClick={() => verifyEmail.mutate(token)}>
            Try Again
          </Button>
        )}
      </div>
    );
  }

  // On success we already navigated away, but just in case:
  return (
    <div className="p-8 max-w-md mx-auto text-center">
      <p className="mb-4">Email verified! Redirecting…</p>
      <Button onClick={() => router.replace("/login")}>
        Go to Login
      </Button>
    </div>
  );
};

export default VerifyAccountClient;
