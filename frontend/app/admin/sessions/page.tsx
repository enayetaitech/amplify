import { Suspense } from "react";
import SessionsTable from "@/components/admin/sessions/SessionsTable";

export default async function Page() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">All Sessions</h1>
      <Suspense>
        <SessionsTable />
      </Suspense>
    </div>
  );
}
