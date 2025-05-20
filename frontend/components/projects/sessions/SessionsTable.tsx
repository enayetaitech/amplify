"use client";
import React from "react";
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "components/ui/dropdown-menu";
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

export const SessionsTable: React.FC<SessionsTableProps> = ({
  sessions,
  meta,
  onPageChange,
  onRowClick,
  onModerate,
  onObserve,
  onAction,
}) => {
  return (
    <div className=" rounded-lg shadow-lg overflow-x-auto lg:ml-10">
      <div className="bg-white rounded-lg shadow-lg">
        <Table className="min-w-full divide-y divide-gray-200 ">
          <TableHeader>
            <TableRow className="">
              {[
                "Title",
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
              <TableHead className="px-6 py-3" /> {/* action menu */}
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
                  {new Date(s.date).toLocaleDateString()} {s.startTime}
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
                    <Button size="sm" onClick={() => onModerate(s._id)}>
                      Moderate
                    </Button>
                    <Button size="sm" onClick={() => onObserve(s._id)}>
                      Observe
                    </Button>
                  </div>
                </TableCell>

                <TableCell
                  className="px-6 py-4 whitespace-nowrap text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-5 w-5 text-gray-500 cursor-pointer" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onAction("edit", s)}
                         className="cursor-pointer"
                        >
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onAction("delete", s)}
                         className="cursor-pointer"
                        >
                        Delete
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onAction("duplicate", s)}
                        className="cursor-pointer"
                      >
                        Duplicate
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
