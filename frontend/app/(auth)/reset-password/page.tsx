// app/reset-password/page.tsx
import React, { Suspense } from "react";
import ResetPasswordForm from "../../../components/reset-password/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center">Loading…</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
