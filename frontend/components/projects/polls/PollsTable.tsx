"use client";

import React from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableFooter,
} from "components/ui/table";
import { Button } from "components/ui/button";
import { Eye, Edit2, Trash2 } from "lucide-react";
import { IPoll } from "@shared/interface/PollInterface";
import { IPaginationMeta } from "@shared/interface/PaginationInterface";
import CustomPagination from "components/shared/Pagination";

interface PollsTableProps {
  polls: IPoll[];
  meta: IPaginationMeta;
  onPageChange: (newPage: number) => void;
  onDelete: (pollId: string) => void;
  onEdit: (poll: IPoll) => void;
}

const PollsTable: React.FC<PollsTableProps> = ({
  polls,
  meta,
  onPageChange,
  onDelete,
  onEdit
}) => {
  return (
    <div className=" rounded-lg shadow-lg overflow-x-auto ">
      <div className="bg-white rounded-lg shadow-lg">
        <Table className="min-w-full divide-y divide-gray-200">
          <TableHeader>
            <TableRow>
              {[
                "Title",
                "Question Count",
                "Created By",
                "Last Modified",
                "Responses",
                "Actions",
              ].map((col) => (
                <TableHead
                  key={col}
                  className=" py-5 text-center text-xs font-semibold text-custom-dark-blue-1 uppercase tracking-wider whitespace-normal break-words"
                >
                  <div className="inline-flex items-center space-x-1">
                    {col}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white divide-y divide-gray-100">
            {polls.map((poll) => (
              <TableRow key={poll._id}>
                <TableCell className="text-center">{poll.title}</TableCell>
                <TableCell className="text-center">
                  {poll.questions.length}
                </TableCell>
                <TableCell className="text-center">
                  {poll.createdByRole}
                </TableCell>
                <TableCell className="text-center">
                  {new Date(poll.lastModified).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-center">
                  {poll.isRun ? poll.responsesCount : "–"}
                </TableCell>
                <TableCell className="space-x-2 text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => console.log("Preview poll", poll._id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(poll)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(poll._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={6}>
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

export default PollsTable;
