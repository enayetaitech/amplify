import { Suspense } from "react";
import ExternalAdminsTable from "@/components/admin/ExternalAdminsTable";

export default async function Page() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">External Admins</h1>
      <Suspense>
        <ExternalAdminsTable />
      </Suspense>
    </div>
  );
}
