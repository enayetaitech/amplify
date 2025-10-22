import { Suspense } from "react";
import ProjectsTable from "@/components/admin/projects/ProjectsTable";

export default async function Page() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">All Projects</h1>
      <Suspense>
        <ProjectsTable />
      </Suspense>
    </div>
  );
}
