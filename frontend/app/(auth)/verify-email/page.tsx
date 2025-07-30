// app/(auth)/verify-email/page.tsx
import VerifyAccountClient from "../../../components/verify-email/VerifyAccountClient";

export default function Page() {
  // Pass token into a nested client component:
  return <VerifyAccountClient />;
}
