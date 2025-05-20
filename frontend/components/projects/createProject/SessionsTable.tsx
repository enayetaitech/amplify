"use client";

import React, { useState, useEffect } from "react";
import { Input } from "components/ui/input";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "components/ui/dropdown-menu";
import { MoreVertical, Plus, Trash } from "lucide-react";
import { Select, SelectTrigger, SelectContent, SelectItem } from "components/ui/select";
import { durationMapping, durationStep3 } from "constant";
import { IProjectSession, SessionRow } from "@shared/interface/ProjectInterface";

export default function SessionsTable({
  onChange,
  initialSessions = [],
}: {
  onChange: (rows: SessionRow[]) => void;
  initialSessions?: IProjectSession[];
}) {
  const [rows, setRows] = useState<SessionRow[]>(() => {
    if (initialSessions.length) {
      return initialSessions.map((s, i) => ({
        id: `${Date.now()}_${i}`,
        number: s.number,
        duration: s.duration,
      }));
    }
    return [
      { id: Date.now().toString(), number: 1, duration: durationStep3[0] },
    ];
  });

  // whenever rows change, notify parent
  useEffect(() => {
    onChange(rows);
  }, [rows, onChange]);

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { id: Date.now().toString(), number: 1, duration: durationStep3[0] },
    ]);
  };
  const deleteRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };
  const updateRow = <K extends keyof SessionRow>(
    id: string,
    field: K,
    value: SessionRow[K]
  ) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

    // Totals
  const totalSessions = rows.reduce((sum, r) => sum + r.number, 0);
  const totalMinutes = rows.reduce(
    (sum, r) => sum + r.number * (durationMapping[r.duration] || 0),
    0
  );
  const totalHoursDecimal = totalMinutes / 60;
  const hoursText =
    totalHoursDecimal % 1 === 0
      ? String(totalHoursDecimal)
      : totalHoursDecimal.toFixed(2);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Number of Sessions</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead /> 
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="p-2">
              <Input
                type="number"
                min={1}
                value={row.number}
                onChange={(e) =>
                  updateRow(row.id, "number", Number(e.target.value))
                }
                className="w-full"
              />
            </TableCell>
            <TableCell className="p-2">
              <Select
                value={row.duration}
                onValueChange={(val) =>
                  updateRow(row.id, "duration", val)
                }
              >
                <SelectTrigger className="w-full text-left">
                  {row.duration}
                </SelectTrigger>
                <SelectContent>
                  {durationStep3.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell className="p-2 text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <MoreVertical className="h-5 w-5 text-gray-500" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={addRow}>
                    <Plus className="mr-2 h-5 w-5 text-custom-orange-2 hover:text-custom-orange-1 cursor-help rounded-full border-custom-orange-2 border-[1px] p-0.5" />
                    Add Row
                   </DropdownMenuItem>
                  {rows.length > 1 && (
                    <DropdownMenuItem onSelect={() => deleteRow(row.id)}>
                      <Trash className="mr-2 h-4 w-4 text-red-500" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
        {/* Totals Row */}
        <TableRow className="bg-gray-50">
          <TableCell className="p-2 font-semibold">
            Total Sessions: {totalSessions}
          </TableCell>
          <TableCell className="p-2 font-semibold">
            Total Duration: {hoursText} hour{hoursText !== "1" ? "s" : ""} (
            {totalMinutes} minute{totalMinutes !== 1 ? "s" : ""})
          </TableCell>
          <TableCell /> {/* blank cell */}
        </TableRow>
      </TableBody>
    </Table>
  );
}
