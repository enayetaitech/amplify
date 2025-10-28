"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import CustomPagination from "@/components/shared/Pagination";

type Project = {
  _id: string;
  name: string;
  internalProjectName?: string;
  description?: string;
  createdAt?: string;
  status?: string;
};

export default function ProjectsTable() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-projects", q, status, page, pageSize],
    queryFn: async () => {
      const res = await api.get("/api/v1/admin/projects", {
        params: { q, status, page, pageSize },
      });
      return res.data?.data as {
        items: Project[];
        total?: number;
        page?: number;
        pageSize?: number;
      };
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Search by name/description"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
        <select
          className="border rounded-md h-9 px-2"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Closed">Closed</option>
          <option value="Archived">Archived</option>
        </select>
      </div>
      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Internal</th>
              <th className="text-left p-2">Description</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="p-4" colSpan={5}>
                  Loading...
                </td>
              </tr>
            ) : (data?.items || []).length === 0 ? (
              <tr>
                <td className="p-4" colSpan={5}>
                  No projects found
                </td>
              </tr>
            ) : (
              data!.items.map((p) => (
                <tr key={p._id} className="border-t">
                  <td className="p-2">
                    <Link
                      className="text-blue-600 hover:underline"
                      href={`/admin/projects/${p._id}/reports`}
                    >
                      {p.name}
                    </Link>
                  </td>
                  <td className="p-2">{p.internalProjectName || "-"}</td>
                  <td className="p-2">{p.description || ""}</td>
                  <td className="p-2">{p.status || "-"}</td>
                  <td className="p-2">
                    {p.status === "Closed" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          await api.post(`/api/v1/projects/${p._id}/activate`);
                          // invalidate the exact query so current filters/pages refresh
                          queryClient.invalidateQueries({
                            queryKey: [
                              "admin-projects",
                              q,
                              status,
                              page,
                              pageSize,
                            ],
                          });
                        }}
                      >
                        Activate
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          const isPaused = p.status === "Inactive";
                          await api.post(
                            `/api/v1/projects/${p._id}/${
                              isPaused ? "unpause" : "pause"
                            }`
                          );
                          queryClient.invalidateQueries({
                            queryKey: [
                              "admin-projects",
                              q,
                              status,
                              page,
                              pageSize,
                            ],
                          });
                        }}
                      >
                        {p.status === "Inactive" ? "Unpause" : "Pause"}
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="p-2">
          <CustomPagination
            totalPages={Math.max(
              1,
              Math.ceil((data?.total ?? 0) / (data?.pageSize || pageSize))
            )}
            currentPage={data?.page || page}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      </div>
    </div>
  );
}
