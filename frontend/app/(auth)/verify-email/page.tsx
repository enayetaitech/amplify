// app/(auth)/verify-email/page.tsx
import VerifyAccountClient from "../../../components/verify-email/VerifyAccountClient";
import React, { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<p className="p-8 text-center">Loading…</p>}>
      <VerifyAccountClient />
    </Suspense>
  );
}
