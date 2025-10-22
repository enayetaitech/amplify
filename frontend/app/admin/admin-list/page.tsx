import { Suspense } from "react";
import AdminListTable from "@/components/admin/AdminListTable";

export default async function Page() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Admin List</h1>
      <Suspense>
        <AdminListTable />
      </Suspense>
    </div>
  );
}
