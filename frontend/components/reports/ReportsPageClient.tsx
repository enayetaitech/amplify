"use client";

import React, { useEffect, useState } from "react";
import api from "lib/api";
import { Button } from "components/ui/button";
import { Dialog, DialogContent } from "components/ui/dialog";
import { Input } from "components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import SessionsReportTable from "components/reports/SessionsReportTable";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useProject } from "hooks/useProject";
import { resolveToIana } from "utils/timezones";
import { DateTime } from "luxon";
import { IPaginationMeta } from "@shared/interface/PaginationInterface";

export default function ReportsPageClient({
  projectId: projectIdProp,
}: { projectId?: string } = {}) {
  const params = useParams();
  // useParams can return string | string[] | undefined, type it explicitly
  const typedParams = params as Record<
    string,
    string | string[] | undefined
  > | null;
  const rawProjectId = typedParams?.projectId;
  const projectIdFromParams = Array.isArray(rawProjectId)
    ? rawProjectId[0] ?? ""
    : rawProjectId ?? "";
  const projectId = projectIdProp ?? projectIdFromParams;
  const searchParams = useSearchParams();
  const router = useRouter();

  const { data: project } = useProject(projectId);

  const [summary, setSummary] = useState<null | {
    projectName?: string;
    allModeratorNames?: string[];
    totalCreditsUsed?: number;
    totalParticipantCount?: number;
    totalObserverCount?: number;
  }>(null);
  type LiveParticipant = {
    userId?: string;
    name?: string;
    email?: string;
    role?: string;
    joinedAt?: string;
  };

  type LiveObserver = {
    userId?: string;
    observerName?: string;
    name?: string;
    email?: string;
    companyName?: string;
    joinedAt?: string;
    _id?: string;
  };

  type SessionRow = {
    _id: string;
    title?: string;
    name?: string;
    moderators?: string[];
    startDate?: string | null;
    endDate?: string | null;
    totalCreditsUsed?: number;
    participantCount?: number;
    observerCount?: number;
    durationMs?: number | null;
    liveSession?: {
      participantsList?: LiveParticipant[];
      observerList?: LiveObserver[];
      startTime?: string;
      endTime?: string;
      durationMs?: number;
    } | null;
  };

  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [meta, setMeta] = useState<IPaginationMeta | null>(null);
  const [searchInput, setSearchInput] = useState<string>(
    (searchParams?.get("q") as string) || ""
  );
  const [accessDenied, setAccessDenied] = useState(false);
  const [showProjectParticipants, setShowProjectParticipants] = useState(false);
  const [projectParticipants, setProjectParticipants] = useState<
    { _id?: string; name?: string; joinedAt?: string; sessions?: string[] }[]
  >([]);
  const [projectParticipantsLoading, setProjectParticipantsLoading] =
    useState(false);
  const [showProjectObservers, setShowProjectObservers] = useState(false);
  const [projectObservers, setProjectObservers] = useState<LiveObserver[]>([]);
  const [projectObserversLoading, setProjectObserversLoading] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    setAccessDenied(false);

    api
      .get(`/api/v1/reports/project/${projectId}/summary`)
      .then((r) => setSummary(r.data?.data))
      .catch((err) => {
        if (err?.response?.status === 403 || err?.response?.status === 401) {
          setAccessDenied(true);
        }
      });
  }, [projectId]);

  useEffect(() => {
    if (!showProjectParticipants || !projectId) return;
    let mounted = true;
    (async () => {
      try {
        setProjectParticipantsLoading(true);
        const res = await api.get<{
          success: boolean;
          message: string;
          data: LiveParticipant[];
        }>(`/api/v1/reports/project/${projectId}/participants`, {
          params: { page: 1, limit: 200 },
        });
        if (!mounted) return;
        setProjectParticipants(res.data?.data || []);
      } catch {
        if (!mounted) return;
        setProjectParticipants([]);
      } finally {
        if (mounted) setProjectParticipantsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [showProjectParticipants, projectId]);

  useEffect(() => {
    if (!showProjectObservers || !projectId) return;
    let mounted = true;
    (async () => {
      try {
        setProjectObserversLoading(true);
        const res = await api.get<{
          success: boolean;
          message: string;
          data: LiveObserver[];
        }>(`/api/v1/reports/project/${projectId}/observers`, {
          params: { page: 1, limit: 200 },
        });
        if (!mounted) return;
        setProjectObservers(res.data?.data || []);
      } catch {
        if (!mounted) return;
        setProjectObservers([]);
      } finally {
        if (mounted) setProjectObserversLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [showProjectObservers, projectId]);

  useEffect(() => {
    if (!projectId) return;
    const q = searchParams?.get("q") || "";
    setSearchInput(q as string);
    setAccessDenied(false);

    api
      .get<{
        success: boolean;
        message: string;
        data: SessionRow[];
        meta?: IPaginationMeta;
      }>(`/api/v1/reports/project/${projectId}/sessions`, {
        params: { search: q, page, limit },
      })
      .then((r) => {
        setSessions(r.data?.data || []);
        setMeta(r.data?.meta || null);
      })
      .catch((err) => {
        if (err?.response?.status === 403 || err?.response?.status === 401) {
          setAccessDenied(true);
        }
      });
  }, [projectId, searchParams, page, limit]);

  const doSearch = () => {
    const q = searchInput || "";
    const path = window.location.pathname;
    const url = q ? `${path}?q=${encodeURIComponent(q)}` : path;
    router.push(url);
  };

  const formatProjectDate = (v?: string | Date | null) => {
    if (!v) return "-";
    const iana = resolveToIana(project?.defaultTimeZone || "UTC") || "UTC";
    const iso =
      typeof v === "string"
        ? new Date(v).toISOString()
        : new Date(v as Date).toISOString();
    const dt = DateTime.fromISO(iso, { zone: iana });
    return dt.isValid ? dt.toFormat("LLL dd, yyyy | hh:mma") : "-";
  };

  if (accessDenied) {
    return (
      <div className="p-6">
        <div className="text-xl font-semibold">Access denied</div>
        <div className="text-muted-foreground mt-2">
          You don&apos;t have permission to view Reports.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center gap-2">
        <Input
          placeholder="Search sessions, moderators, participants..."
          value={searchInput}
          onChange={(e) => setSearchInput((e.target as HTMLInputElement).value)}
        />
        <Button onClick={doSearch}>Search</Button>
      </div>

      <section className="mb-6">
        <h2 className="text-lg font-semibold">Project Summary</h2>
        {summary ? (
          <div className="grid grid-cols-5 gap-4 mt-2">
            <div>
              <div className="text-sm text-muted-foreground">Project</div>
              <div className="font-medium">{summary.projectName}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Moderators</div>
              <div className="font-medium">
                {(summary.allModeratorNames || []).join(", ")}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Credits Used</div>
              <div className="font-medium">{summary.totalCreditsUsed}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Project Start</div>
              <div className="font-medium">
                {formatProjectDate(project?.startDate)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">
                Project Closed
              </div>
              <div className="font-medium">
                {project?.status === "Closed"
                  ? formatProjectDate(project?.closedAt)
                  : "-"}
              </div>
            </div>
          </div>
        ) : (
          <div>Loading summary...</div>
        )}
      </section>

      <div className="mb-6">
        <button
          className="text-sm text-blue-600 underline"
          onClick={() => setShowProjectParticipants(true)}
        >
          View all participants ({summary?.totalParticipantCount ?? 0})
        </button>
        <span className="mx-4" />
        <button
          className="text-sm text-blue-600 underline"
          onClick={() => setShowProjectObservers(true)}
        >
          View all observers ({summary?.totalObserverCount ?? 0})
        </button>

        <Dialog
          open={showProjectParticipants}
          onOpenChange={setShowProjectParticipants}
        >
          <DialogContent className="max-w-3xl h-[80vh] p-0">
            <div className="w-full h-full overflow-auto p-6">
              <h3 className="text-lg font-semibold">Project Participants</h3>
              <div className="mt-4">
                {projectParticipantsLoading ? (
                  <div>Loading...</div>
                ) : projectParticipants.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Sessions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projectParticipants.map((p) => (
                        <TableRow key={p._id || Math.random()}>
                          <TableCell>{p.name}</TableCell>
                          <TableCell>
                            {p.joinedAt
                              ? new Date(p.joinedAt).toLocaleString()
                              : ""}
                          </TableCell>
                          <TableCell>
                            {Array.isArray(p.sessions) && p.sessions.length
                              ? (
                                  p.sessions as {
                                    _id?: string;
                                    title?: string;
                                  }[]
                                )
                                  .map((s) =>
                                    s && s.title ? s.title : s._id || String(s)
                                  )
                                  .join(", ")
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div>No participants</div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={showProjectObservers}
          onOpenChange={setShowProjectObservers}
        >
          <DialogContent className="max-w-3xl h-[80vh] p-0">
            <div className="w-full h-full overflow-auto p-6">
              <h3 className="text-lg font-semibold">Project Observers</h3>
              <div className="mt-4">
                {projectObserversLoading ? (
                  <div>Loading...</div>
                ) : projectObservers.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projectObservers.map((p) => (
                        <TableRow key={p._id || p.email || Math.random()}>
                          <TableCell>{p.observerName || p.name}</TableCell>
                          <TableCell>{p.email}</TableCell>
                          <TableCell>{p.companyName || ""}</TableCell>
                          <TableCell>
                            {p.joinedAt
                              ? new Date(p.joinedAt).toLocaleString()
                              : ""}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div>No observers</div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-2">Sessions</h2>
        <div>
          <SessionsReportTable
            sessions={sessions}
            meta={meta}
            onPageChange={(p: number) => setPage(p)}
            timeZone={project?.defaultTimeZone}
          />
        </div>
      </section>
    </div>
  );
}
