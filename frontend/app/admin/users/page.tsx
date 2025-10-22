import { Suspense } from "react";
import UsersTable from "@/components/admin/UsersTable";

export default async function Page() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Users</h1>
      <Suspense>
        {/* Server component wrapper; table fetches via client hooks */}
        <UsersTable />
      </Suspense>
    </div>
  );
}
