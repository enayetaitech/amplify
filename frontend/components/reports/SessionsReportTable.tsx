"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import { Button } from "components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "components/ui/tabs";
import { Dialog, DialogContent, DialogTrigger } from "components/ui/dialog";
import api from "lib/api";
import { safeLocalGet } from "utils/storage";
import CustomPagination from "components/shared/Pagination";

type Participant = {
  userId?: string;
  name?: string;
  email?: string;
  deviceType?: string;
  device?: { os?: string };
  joinTime?: string;
  leaveTime?: string;
  ip?: string;
  location?: string;
};

type Observer = {
  _id?: string;
  observerName?: string;
  name?: string;
  email?: string;
  companyName?: string;
  joinTime?: string;
  ip?: string;
  location?: string;
};

// Removed unused LiveObserver type after switching to enriched fetch

// normalized shape for entries coming from participantHistory or participantsList
type ParticipantEntry = {
  id?: string;
  userId?: string;
  name?: string;
  email?: string;
  deviceType?: string;
  device?: { os?: string };
  joinedAt?: string | Date | null;
  leaveAt?: string | Date | null;
};

type SessionReportRow = {
  _id: string;
  title?: string;
  name?: string;
  moderators?: string[] | Array<{ firstName?: string; lastName?: string }>;
  moderatorsNames?: string[];
  startDate?: string | null;
  endDate?: string | null;
  participantCount?: number;
  observerCount?: number;
  totalCreditsUsed?: number;
  // optional: liveSession-derived lists (may be null)
  liveSession?: {
    participantsList?: {
      name?: string;
      email?: string;
      role?: string;
      joinedAt?: string;
    }[];
    observerList?: {
      name?: string;
      email?: string;
      role?: string;
      joinedAt?: string;
    }[];
    observerHistory?: {
      id?: string;
      name?: string;
      email?: string;
      joinedAt?: string;
      leaveAt?: string;
      reason?: "Left" | "Streaming Stopped";
    }[];
    startTime?: string;
    endTime?: string;
    durationMs?: number;
  } | null;
};

export default function SessionsReportTable({
  sessions,
  meta,
  onPageChange,
  timeZone,
}: {
  sessions: SessionReportRow[];
  meta?: { page?: number; totalPages?: number } | null;
  onPageChange?: (p: number) => void;
  timeZone?: string; // reserved for future timezone-aware formatting
}) {
  const [openSession, setOpenSession] = useState<SessionReportRow | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [observers, setObservers] = useState<Observer[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [loadingObservers, setLoadingObservers] = useState(false);

  void safeLocalGet;
  // Format date like: "Feb 27, 2025 12:59:22 PM"
  const formatDate = (v?: string | number | null) => {
    if (v === undefined || v === null) return "";
    const d = new Date(v as unknown as number | string);
    if (isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(d as Date);
  };
  void timeZone;
  useEffect(() => {
    async function loadForSession(s: SessionReportRow | null) {
      if (!s) return;
      const sid = s._id || (s as unknown as { sessionId?: string }).sessionId;

      // Always use enriched backend endpoints for participants/observers

      try {
        setLoadingParticipants(true);
        const p = await api.get<{ data: Participant[] }>(
          `/api/v1/reports/session/${sid}/participants`
        );
        setParticipants(p.data?.data || []);
      } catch {
        setParticipants([]);
      } finally {
        setLoadingParticipants(false);
      }

      try {
        setLoadingObservers(true);
        const o = await api.get<{ data: Observer[] }>(
          `/api/v1/reports/session/${sid}/observers`
        );
        setObservers(o.data?.data || []);
      } catch {
        setObservers([]);
      } finally {
        setLoadingObservers(false);
      }
    }

    loadForSession(openSession);
  }, [openSession]);

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Session</TableHead>
            <TableHead>Moderators</TableHead>
            <TableHead>Start Time</TableHead>
            <TableHead>
              Duration <br /> (hh:mm:ss)
            </TableHead>
            <TableHead>End Time</TableHead>
            <TableHead>Participants</TableHead>
            <TableHead>Observers</TableHead>
            <TableHead>Credits</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((s) => (
            <TableRow key={s._id}>
              <TableCell>{s.title || s.name}</TableCell>
              <TableCell>
                {(s.moderatorsNames || (s.moderators as string[]) || []).join(
                  ", "
                )}
              </TableCell>
              <TableCell>{formatDate(s.startDate)}</TableCell>
              <TableCell>
                {/* durationMs may come from backend; format as hh:mm:ss */}
                {typeof (s as unknown as { durationMs?: number }).durationMs ===
                  "number" &&
                (s as unknown as { durationMs?: number }).durationMs !== null
                  ? new Date(
                      Number(
                        (s as unknown as { durationMs?: number }).durationMs
                      )
                    )
                      .toISOString()
                      .substr(11, 8)
                  : ""}
              </TableCell>
              <TableCell>{formatDate(s.endDate)}</TableCell>
              <TableCell>
                {s.liveSession
                  ? (() => {
                      const ls = s.liveSession as
                        | {
                            participantHistory?: ParticipantEntry[];
                            participantsList?: ParticipantEntry[];
                          }
                        | undefined;
                      const history: ParticipantEntry[] =
                        ls && Array.isArray(ls.participantHistory)
                          ? ls.participantHistory
                          : ls?.participantsList || [];
                      const emails = new Set<string>();
                      for (const e of history) {
                        if (!e) continue;
                        const em = (e.email || "").toString().toLowerCase();
                        if (em) emails.add(em);
                      }
                      return emails.size;
                    })()
                  : s.participantCount ?? 0}
              </TableCell>
              <TableCell>
                {s.liveSession
                  ? (() => {
                      const oh = (
                        s.liveSession as {
                          observerHistory?:
                            | {
                                name?: string;
                                email?: string;
                                joinedAt?: string;
                                leaveAt?: string;
                              }[]
                            | undefined;
                        }
                      ).observerHistory as
                        | Array<{
                            email?: string;
                            joinedAt?: string;
                            leaveAt?: string;
                          }>
                        | undefined;
                      if (Array.isArray(oh) && oh.length) {
                        return oh.length;
                      }
                      return (s.liveSession.observerList || []).length;
                    })()
                  : s.observerCount ?? 0}
              </TableCell>
              <TableCell>{s.totalCreditsUsed || 0}</TableCell>
              <TableCell>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={() => setOpenSession(s)}>
                      View
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl h-[80vh] p-0">
                    <div className="w-full h-full overflow-auto p-6">
                      <h3 className="text-lg font-semibold">
                        {s.title || s.name}
                      </h3>
                      <Tabs defaultValue="participants" className="mt-4">
                        <TabsList>
                          <TabsTrigger value="participants">
                            Participants
                          </TabsTrigger>
                          <TabsTrigger value="observers">Observers</TabsTrigger>
                        </TabsList>
                        <TabsContent value="participants">
                          {loadingParticipants ? (
                            <div>Loading participants...</div>
                          ) : participants.length ? (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Name</TableHead>
                                  <TableHead>Device</TableHead>
                                  <TableHead>Join</TableHead>
                                  <TableHead>Leave</TableHead>
                                  <TableHead>IP</TableHead>
                                  <TableHead>Location</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {participants.map((p) => (
                                  <TableRow
                                    key={p.userId || p.email || Math.random()}
                                  >
                                    <TableCell>{p.name || p.email}</TableCell>
                                    <TableCell>
                                      {p.deviceType || p.device?.os || ""}
                                    </TableCell>
                                    <TableCell>
                                      {p.joinTime
                                        ? new Date(p.joinTime).toLocaleString()
                                        : ""}
                                    </TableCell>
                                    <TableCell>
                                      {p.leaveTime
                                        ? new Date(p.leaveTime).toLocaleString()
                                        : ""}
                                    </TableCell>
                                    <TableCell>{p.ip || ""}</TableCell>
                                    <TableCell>{p.location || ""}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          ) : (
                            <div>No participants</div>
                          )}
                        </TabsContent>
                        <TabsContent value="observers">
                          {loadingObservers ? (
                            <div>Loading observers...</div>
                          ) : observers.length ? (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Name</TableHead>
                                  <TableHead>Email</TableHead>
                                  <TableHead>Company</TableHead>
                                  <TableHead>Join</TableHead>
                                  <TableHead>IP</TableHead>
                                  <TableHead>Location</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {observers.map((o) => (
                                  <TableRow
                                    key={o._id || o.email || Math.random()}
                                  >
                                    <TableCell>
                                      {o.observerName || o.name}
                                    </TableCell>
                                    <TableCell>{o.email}</TableCell>
                                    <TableCell>{o.companyName || ""}</TableCell>
                                    <TableCell>
                                      {o.joinTime
                                        ? new Date(o.joinTime).toLocaleString()
                                        : ""}
                                    </TableCell>
                                    <TableCell>{o.ip || ""}</TableCell>
                                    <TableCell>{o.location || ""}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          ) : (
                            <div>No observers</div>
                          )}
                        </TabsContent>
                      </Tabs>
                    </div>
                  </DialogContent>
                </Dialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {meta && (
        <div className="mt-4 flex justify-center">
          <CustomPagination
            currentPage={meta.page || 1}
            totalPages={meta.totalPages || 1}
            onPageChange={(p) => onPageChange?.(p)}
          />
        </div>
      )}
    </div>
  );
}
