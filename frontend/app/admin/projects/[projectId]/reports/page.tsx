import ReportsPageClient from "@/components/reports/ReportsPageClient";

export default async function Page({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Project Reports</h1>
      <ReportsPageClient projectId={projectId} />
    </div>
  );
}
