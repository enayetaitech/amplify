"use client";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { useState } from "react";

type Session = {
  _id: string;
  title?: string;
  projectId?: { name?: string };
  createdAt?: string;
};

export default function SessionsTable() {
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-sessions", q],
    queryFn: async () => {
      const res = await api.get("/api/v1/admin/sessions", { params: { q } });
      return res.data?.data as { items: Session[] };
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Search title"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
      </div>
      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left p-2">Title</th>
              <th className="text-left p-2">Project</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="p-4" colSpan={2}>
                  Loading...
                </td>
              </tr>
            ) : (data?.items || []).length === 0 ? (
              <tr>
                <td className="p-4" colSpan={2}>
                  No sessions found
                </td>
              </tr>
            ) : (
              data!.items.map((s) => (
                <tr key={s._id} className="border-t">
                  <td className="p-2">{s.title || "Untitled"}</td>
                  <td className="p-2">{s.projectId?.name || ""}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
