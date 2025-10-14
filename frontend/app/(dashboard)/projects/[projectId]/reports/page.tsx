import ReportsPageClient from "components/reports/ReportsPageClient";

// Server wrapper; let the client component read params itself via useParams
export default function Page() {
  return <ReportsPageClient />;
}
