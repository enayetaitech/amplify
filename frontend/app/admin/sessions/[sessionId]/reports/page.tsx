import SessionReports from "@/components/admin/reports/SessionReports";

export default async function Page({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Session Reports</h1>
      <SessionReports sessionId={sessionId} />
    </div>
  );
}
