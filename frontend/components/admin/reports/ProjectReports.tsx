"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function Pager({
  page,
  setPage,
  total,
  limit,
}: {
  page: number;
  setPage: (n: number) => void;
  total: number;
  limit: number;
}) {
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, limit)));
  return (
    <div className="flex gap-2 items-center">
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => setPage(page - 1)}
      >
        Prev
      </Button>
      <span className="text-xs">
        Page {page} / {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => setPage(page + 1)}
      >
        Next
      </Button>
    </div>
  );
}

export default function ProjectReports({ projectId }: { projectId: string }) {
  const [tab, setTab] = useState<"sessions" | "participants" | "observers">(
    "sessions"
  );
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");

  const sessions = useQuery({
    queryKey: ["reports-sessions", projectId, page, limit, search],
    queryFn: async () => {
      const res = await api.get(
        `/api/v1/reports/project/${projectId}/sessions`,
        { params: { page, limit, search } }
      );
      return res.data as {
        success: boolean;
        data: unknown[];
        meta?: { totalItems: number; page: number; limit: number };
      };
    },
    enabled: tab === "sessions",
  });

  const participants = useQuery({
    queryKey: ["reports-participants", projectId, page, limit],
    queryFn: async () => {
      const res = await api.get(
        `/api/v1/reports/project/${projectId}/participants`,
        { params: { page, limit } }
      );
      return res.data as {
        success: boolean;
        data: unknown[];
        meta?: { totalItems: number; page: number; limit: number };
      };
    },
    enabled: tab === "participants",
  });

  const observers = useQuery({
    queryKey: ["reports-observers", projectId, page, limit],
    queryFn: async () => {
      const res = await api.get(
        `/api/v1/reports/project/${projectId}/observers`,
        { params: { page, limit } }
      );
      return res.data as {
        success: boolean;
        data: unknown[];
        meta?: { totalItems: number; page: number; limit: number };
      };
    },
    enabled: tab === "observers",
  });

  const active =
    tab === "sessions"
      ? sessions.data
      : tab === "participants"
      ? participants.data
      : observers.data;
  const items = active?.data || [];
  const meta = active?.meta || { totalItems: 0, page, limit };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant={tab === "sessions" ? "default" : "outline"}
          onClick={() => {
            setTab("sessions");
            setPage(1);
          }}
        >
          Sessions
        </Button>
        <Button
          variant={tab === "participants" ? "default" : "outline"}
          onClick={() => {
            setTab("participants");
            setPage(1);
          }}
        >
          Participants
        </Button>
        <Button
          variant={tab === "observers" ? "default" : "outline"}
          onClick={() => {
            setTab("observers");
            setPage(1);
          }}
        >
          Observers
        </Button>
      </div>
      {tab === "sessions" && (
        <div className="space-y-2">
          <input
            className="border rounded-md h-9 px-2 w-full max-w-sm"
            placeholder="Search sessions"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}
      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              {tab === "sessions" && (
                <>
                  <th className="text-left p-2">Title</th>
                  <th className="text-left p-2">Created</th>
                </>
              )}
              {tab !== "sessions" && (
                <>
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Email</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td className="p-4" colSpan={2}>
                  No data
                </td>
              </tr>
            ) : (
              items.map((r: unknown, idx: number) => (
                <tr key={idx} className="border-t">
                  {tab === "sessions" ? (
                    <>
                      <td className="p-2">
                        <Link
                          className="text-blue-600 hover:underline"
                          href={`/admin/sessions/${
                            (r as { _id?: string; sessionId?: string })?._id ||
                            (r as { _id?: string; sessionId?: string })
                              ?.sessionId
                          }/reports`}
                        >
                          {(r as { title?: string; name?: string })?.title ||
                            (r as { title?: string; name?: string })?.name ||
                            "Untitled"}
                        </Link>
                      </td>
                      <td className="p-2">
                        {(r as { createdAt?: string })?.createdAt
                          ? new Date(
                              (r as { createdAt?: string }).createdAt!
                            ).toLocaleString()
                          : ""}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-2">
                        {(r as { name?: string })?.name || ""}
                      </td>
                      <td className="p-2">
                        {(r as { email?: string })?.email || ""}
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pager
        page={page}
        setPage={setPage}
        total={meta.totalItems || 0}
        limit={meta.limit || limit}
      />
    </div>
  );
}
