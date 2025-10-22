"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type User = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  role: string;
  status: "Active" | "Inactive";
};

export default function AdminListTable() {
  const [q, setQ] = useState("");
  const [companyName, setCompanyName] = useState("");
  // Fetch current user to gate create/action buttons; AmplifyAdmin or SuperAdmin only
  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await api.get("/api/v1/users/me");
      return res.data?.data as { user?: { role?: string } };
    },
  });
  const canAdmin = ["SuperAdmin", "AmplifyAdmin"].includes(
    (meData?.user?.role || "").toString()
  );

  const { data, isLoading } = useQuery({
    queryKey: ["admin-admin-list", q, companyName],
    queryFn: async () => {
      const res = await api.get("/api/v1/admin/users", {
        params: { q, companyName },
      });
      const all = (res.data?.data?.items || []) as User[];
      const opsRoles = new Set([
        "AmplifyModerator",
        "AmplifyObserver",
        "AmplifyParticipant",
        "AmplifyTechHost",
      ]);
      return all.filter((u) => opsRoles.has(u.role));
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Search name or email"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
        <Input
          placeholder="Filter by company"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className="max-w-xs"
        />
        {!canAdmin && (
          <span className="text-xs text-muted-foreground self-center">
            Read-only view
          </span>
        )}
      </div>
      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Email</th>
              <th className="text-left p-2">Company</th>
              <th className="text-left p-2">Role</th>
              <th className="text-left p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="p-4" colSpan={5}>
                  Loading...
                </td>
              </tr>
            ) : (data || []).length === 0 ? (
              <tr>
                <td className="p-4" colSpan={5}>
                  No users found
                </td>
              </tr>
            ) : (
              data!.map((u) => (
                <tr key={u._id} className="border-t">
                  <td className="p-2">
                    {u.firstName} {u.lastName}
                  </td>
                  <td className="p-2">{u.email}</td>
                  <td className="p-2">{u.companyName}</td>
                  <td className="p-2">
                    <Badge variant="secondary">{u.role}</Badge>
                  </td>
                  <td className="p-2">{u.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
