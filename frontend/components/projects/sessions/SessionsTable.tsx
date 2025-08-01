"use client";
import React, { useEffect, useRef, useState } from "react";
import { ISession } from "@shared/interface/SessionInterface";
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
  onRowClick: (sessionId: string) => void;
  onModerate: (sessionId: string) => void;
  onObserve: (sessionId: string) => void;
  onAction: (
    action: "edit" | "delete" | "duplicate",
    session: ISession
  ) => void;
}

// helper to format Date+Time in Pacific with the “Pacific” label
function formatDateTimeWithZone(
  date: Date | string,
  timeStr: string,
  timeZone: string
): string {
  // normalize to a Date object
  const dateObj = typeof date === "string" ? new Date(date) : date;

  // apply the hour/minute
  const [hour, minute] = timeStr.split(":").map(Number);
  const dt = new Date(dateObj);
  dt.setHours(hour, minute, 0, 0);

  // format the date part in that zone
  const formattedDate = dt.toLocaleDateString("en-US", {
    timeZone,
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // format the time part (e.g. “3 p.m.”)
  const formattedTime = dt
    .toLocaleTimeString("en-US", {
      timeZone,
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    })
    .toLowerCase()
    .replace(/:00/, "")
    .replace(/\s?pm$/, " p.m.")
    .replace(/\s?am$/, " a.m."); // if you want “a.m.” too

  // pull the region after the slash
  const region = timeZone.split("/").pop() ?? timeZone;

  return `${formattedDate}, ${formattedTime} ${region}`;
}




export const SessionsTable: React.FC<SessionsTableProps> = ({
  sessions,
  meta,
  onPageChange,
  onRowClick,
  onModerate,
  onObserve,
  onAction,
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
  
  return (
    <div className=" rounded-lg shadow-lg overflow-x-auto">
      <div className="bg-white rounded-lg shadow-lg">
        <Table className="min-w-full divide-y divide-gray-200 ">
          <TableHeader>
            <TableRow className="">
              {[
                "Session Title",
                "Start Date & Time",
                "Service Type",
                "Participant Count",
                "Observer Count",
                "Final Session Minutes",
                "Lunch",
              ].map((col) => (
                <TableHead
                  key={col}
                  className=" py-5 text-center text-xs font-semibold text-custom-dark-blue-1 uppercase tracking-wider whitespace-normal break-words"
                >
                  <div className="inline-flex items-center space-x-1">
                    <span>{col}</span>
                    <ChevronsUpDown className="h-4 w-4 text-gray-400" />
                  </div>
                </TableHead>
              ))}
              <TableHead className="px-6 py-3" /> 
            </TableRow>
          </TableHeader>

          <TableBody className="bg-white divide-y divide-gray-100">
            {sessions.map((s) => (
              <TableRow
                key={s._id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => onRowClick(s._id)}
              >
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {s.title}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {formatDateTimeWithZone(s.date, s.startTime, s.timeZone)}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {" "}
                  {typeof s.projectId !== "string"
                    ? (s.projectId as { service: string }).service
                    : ""}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {/* participant count */}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {/* observer count */}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {/* finalSessionMinutes */}
                </TableCell>

                <TableCell
                  className="px-6 py-4 whitespace-nowrap"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex space-x-2">
                    <Button 
                    className="bg-custom-orange-1"
                    size="sm" onClick={() => onModerate(s._id)}>
                      Moderate
                    </Button>
                    <Button size="sm" 
                    className="bg-custom-dark-blue-1"
                    onClick={() => onObserve(s._id)}>
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
