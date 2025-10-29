"use client";
import React, { useEffect, useRef, useState } from "react";
import { resolveToIana } from "../../../utils/timezones";
import { DateTime } from "luxon";
import { ISession } from "@shared/interface/SessionInterface";
import { ILiveSession } from "@shared/interface/LiveSessionInterface";
import { IPaginationMeta } from "@shared/interface/PaginationInterface";
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
} from "components/ui/table";
import { Button } from "components/ui/button";
import { ChevronsUpDown, MoreVertical } from "lucide-react";
import CustomPagination from "components/shared/Pagination";

export interface SessionsTableProps {
  sessions: ISession[];
  meta: IPaginationMeta;
  onPageChange: (newPage: number) => void;
  // onRowClick: (sessionId: string) => void;
  onModerate: (sessionId: string) => void;
  onObserve: (sessionId: string) => void;
  onAction: (
    action: "edit" | "delete" | "duplicate",
    session: ISession
  ) => void;
  sortBy: "title" | "startAtEpoch" | "moderator";
  sortOrder: "asc" | "desc";
  onSortChange: (
    field: "title" | "startAtEpoch" | "moderator",
    order: "asc" | "desc"
  ) => void;
}

// helper to format Date+Time in Pacific with the “Pacific” label
function formatDateTimeWithZone(
  date: Date | string,
  timeStr: string,
  timeZone: string
): string {
  // resolve UI label (e.g., "Buenos Aires") to IANA (e.g., "America/Argentina/Buenos_Aires")
  const ianaZone = resolveToIana(timeZone) || "UTC";

  // Build the local date-time in the target zone
  const dateISO =
    typeof date === "string"
      ? date.split("T")[0]
      : DateTime.fromJSDate(date).toISODate()!;
  const dt = DateTime.fromISO(`${dateISO}T${timeStr}`, { zone: ianaZone });
  if (!dt.isValid) return "";

  // Format like "Mar 06, 2025 | 03:00PM"
  return dt.toFormat("LLL dd, yyyy | hh:mma");
}

export const SessionsTable: React.FC<SessionsTableProps> = ({
  sessions,
  meta,
  onPageChange,
  // onRowClick,
  onModerate,
  onObserve,
  onAction,
  sortBy,
  sortOrder,
  onSortChange,
}) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        openMenuId &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuId]);

  function handleHeaderClick(
    field: "title" | "startAtEpoch" | "moderator"
  ): void {
    const nextOrder: "asc" | "desc" =
      sortBy === field && sortOrder === "asc" ? "desc" : "asc";
    onSortChange(field, nextOrder);
  }



  return (
    <div className=" rounded-lg shadow-lg overflow-x-auto">
      <div className="bg-white rounded-lg shadow-lg">
        <Table className="min-w-full divide-y divide-gray-200 ">
          <TableHeader>
            <TableRow className="">
              <TableHead className=" py-5 text-center text-xs font-semibold text-custom-dark-blue-1 uppercase tracking-wider whitespace-normal break-words">
                <button
                  type="button"
                  className="inline-flex items-center space-x-1 cursor-pointer"
                  onClick={() => handleHeaderClick("title")}
                >
                  <span>Session Title</span>
                  <ChevronsUpDown
                    className={
                      "h-4 w-4 " +
                      (sortBy === "title"
                        ? "text-custom-dark-blue-1"
                        : "text-gray-400")
                    }
                  />
                </button>
              </TableHead>
              <TableHead className=" py-5 text-center text-xs font-semibold text-custom-dark-blue-1 uppercase tracking-wider whitespace-normal break-words">
                <button
                  type="button"
                  className="inline-flex items-center space-x-1 cursor-pointer"
                  onClick={() => handleHeaderClick("startAtEpoch")}
                >
                  <span>Start Date & Time</span>
                  <ChevronsUpDown
                    className={
                      "h-4 w-4 " +
                      (sortBy === "startAtEpoch"
                        ? "text-custom-dark-blue-1"
                        : "text-gray-400")
                    }
                  />
                </button>
              </TableHead>
              <TableHead className=" py-5 text-center text-xs font-semibold text-custom-dark-blue-1 uppercase tracking-wider whitespace-normal break-words">
                <button
                  type="button"
                  className="inline-flex items-center space-x-1 cursor-pointer"
                  onClick={() => handleHeaderClick("moderator")}
                >
                  <span>Moderator</span>
                  <ChevronsUpDown
                    className={
                      "h-4 w-4 " +
                      (sortBy === "moderator"
                        ? "text-custom-dark-blue-1"
                        : "text-gray-400")
                    }
                  />
                </button>
              </TableHead>
              <TableHead className=" py-5 text-center text-xs font-semibold text-custom-dark-blue-1 uppercase tracking-wider whitespace-normal break-words">
                <div className="inline-flex items-center space-x-1">
                  <span>Participant Count</span>
                </div>
              </TableHead>
              <TableHead className=" py-5 text-center text-xs font-semibold text-custom-dark-blue-1 uppercase tracking-wider whitespace-normal break-words">
                <div className="inline-flex items-center space-x-1">
                  <span>Observer Count</span>
                </div>
              </TableHead>
              <TableHead className=" py-5 text-center text-xs font-semibold text-custom-dark-blue-1 uppercase tracking-wider whitespace-normal break-words">
                <div className="inline-flex items-center space-x-1">
                  <span>Final Session Minutes</span>
                </div>
              </TableHead>
              <TableHead className=" py-5 text-center text-xs font-semibold text-custom-dark-blue-1 uppercase tracking-wider whitespace-normal break-words">
                <div className="inline-flex items-center space-x-1">
                  <span>Launch</span>
                </div>
              </TableHead>
              <TableHead className="px-6 py-3" />
            </TableRow>
          </TableHeader>

          <TableBody className="bg-white divide-y divide-gray-100">
            {sessions.map((s) => (
              <TableRow
                key={s._id}
                className="cursor-pointer hover:bg-gray-50"
                // onClick={() => onRowClick(s._id)}
              >
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {s.title}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {formatDateTimeWithZone(s.date, s.startTime, s.timeZone)}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {(() => {
                    const sortDir = sortBy === "moderator" ? sortOrder : "asc";
                    const mods = (s as unknown as { moderators?: unknown })
                      .moderators;
                    if (Array.isArray(mods) && mods.length > 0) {
                      const entries = (
                        mods as Array<{ firstName?: string; lastName?: string }>
                      )
                        .map((m) => ({
                          first: (m.firstName || "").trim(),
                          last: (m.lastName || "").trim(),
                        }))
                        .map((m) => ({
                          key: `${m.last.toLowerCase()} ${m.first.toLowerCase()}`,
                          label: `${m.first} ${m.last}`.trim(),
                        }));
                      entries.sort((a, b) =>
                        sortDir === "desc"
                          ? b.key.localeCompare(a.key)
                          : a.key.localeCompare(b.key)
                      );
                      const labels = entries
                        .map((e) => e.label)
                        .filter(Boolean);
                      return labels.length > 0 ? labels.join(", ") : "—";
                    }
                    const fallback = (
                      s as unknown as { moderatorNames?: string[] }
                    ).moderatorNames;
                    if (Array.isArray(fallback) && fallback.length > 0) {
                      const arr = [...fallback];
                      arr.sort((a, b) =>
                        sortDir === "desc"
                          ? b.toLowerCase().localeCompare(a.toLowerCase())
                          : a.toLowerCase().localeCompare(b.toLowerCase())
                      );
                      return arr.join(", ");
                    }
                    return "—";
                  })()}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {(() => {
                    // prefer liveSession derived lists when available
                    const ls = (
                      s as unknown as { liveSession?: ILiveSession | null }
                    ).liveSession;
                    if (ls) {
                      // participant count: prefer unique emails from history or list
                      const history = Array.isArray(ls.participantHistory)
                        ? ls.participantHistory
                        : Array.isArray(ls.participantsList)
                        ? ls.participantsList
                        : [];
                      const emails = new Set<string>();
                      for (const p of history) {
                        const em = (p?.email || "").toString().toLowerCase();
                        if (em) emails.add(em);
                      }
                      return emails.size;
                    }
                    return "—";
                  })()}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {(() => {
                    const ls = (
                      s as unknown as { liveSession?: ILiveSession | null }
                    ).liveSession;
                    if (ls) {
                      // observer count: prefer observerHistory length fallback to observerList
                      if (
                        Array.isArray(ls.observerHistory) &&
                        ls.observerHistory.length
                      ) {
                        return ls.observerHistory.length;
                      }
                      if (Array.isArray(ls.observerList))
                        return ls.observerList.length;
                      return 0;
                    }
                    return "—";
                  })()}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {(() => {
                    const ls = (
                      s as unknown as { liveSession?: ILiveSession | null }
                    ).liveSession;
                    // final session minutes: compute from liveSession.startTime and endTime if present,
                    // otherwise fall back to session.duration (minutes)
                    if (ls && ls.startTime && ls.endTime) {
                      try {
                        const start = new Date(ls.startTime).getTime();
                        const end = new Date(ls.endTime).getTime();
                        if (!isNaN(start) && !isNaN(end) && end >= start) {
                          const mins = Math.round((end - start) / 60000);
                          return mins;
                        }
                      } catch {}
                      return "—";
                    }
                    // fallback to session.duration (minutes)
                    return  "—";
                  })()}
                </TableCell>

                <TableCell
                  className="px-6 py-4 whitespace-nowrap"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex space-x-2">
                    <Button
                      className="bg-custom-orange-1"
                      size="sm"
                      onClick={() => onModerate(s._id)}
                    >
                      Moderate
                    </Button>
                    <Button
                      size="sm"
                      className="bg-custom-dark-blue-1"
                      onClick={() => onObserve(s._id)}
                    >
                      Observe
                    </Button>
                  </div>
                </TableCell>

                <TableCell
                  className="px-6 py-4 whitespace-nowrap text-right relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* trigger */}
                  <button
                    onClick={() =>
                      setOpenMenuId(openMenuId === s._id ? null : s._id)
                    }
                    className="p-2 rounded hover:bg-gray-100 focus:outline-none cursor-pointer"
                    aria-haspopup="true"
                    aria-expanded={openMenuId === s._id}
                  >
                    <MoreVertical className="h-5 w-5 text-gray-500 cursor-pointer" />
                  </button>

                  {/* custom pop-over */}
                  {openMenuId === s._id && (
                    <div
                      ref={menuRef}
                      className="absolute right-10 top-5 mt-2 w-32 bg-white border border-gray-200 rounded shadow-lg z-10 cursor-pointer"
                    >
                      <button
                        onClick={() => {
                          onAction("edit", s);
                          setOpenMenuId(null);
                        }}
                        className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          onAction("delete", s);
                          setOpenMenuId(null);
                        }}
                        className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => {
                          onAction("duplicate", s);
                          setOpenMenuId(null);
                        }}
                        className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      >
                        Duplicate
                      </button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={8}>
                <div className="flex justify-center">
                  <CustomPagination
                    currentPage={meta.page}
                    totalPages={meta.totalPages}
                    onPageChange={onPageChange}
                  />
                </div>
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
};
