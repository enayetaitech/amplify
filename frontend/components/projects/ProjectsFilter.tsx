// frontend/components/projects/ProjectsFilter.tsx
"use client";

import React from "react";
import { Input } from "components/ui/input";
import { SearchIcon, CalendarIcon, TagIcon } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "components/ui/popover";
import { Button } from "components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "components/ui/select";
import { format } from "date-fns";

export interface DateRange {
  from: Date | undefined;
  to?: Date | undefined;
}

interface ProjectsFilterProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  tagSearchTerm: string;
  onTagSearchChange: (val: string) => void;
  dateRange?: DateRange;
  onDateRangeChange: (range: DateRange | undefined) => void;
  status?: string | undefined;
  onStatusChange: (status: string | undefined) => void;
}

const ProjectsFilter: React.FC<ProjectsFilterProps> = ({
  searchTerm,
  onSearchChange,
  tagSearchTerm,
  onTagSearchChange,
  dateRange,
  onDateRangeChange,
  status,
  onStatusChange,
}) => {
  // NOTE: Replaced the DayPicker with native date inputs below. The
  // DayPicker handler is no longer used but kept here commented in case
  // we revert to the calendar UI later.
  /*
  const handleSelect = (
    val: Date | { from?: Date | undefined; to?: Date | undefined } | undefined
  ) => {
    if (!val) {
      onDateRangeChange(undefined);
      return;
    }
    if (val instanceof Date) {
      onDateRangeChange({ from: val, to: undefined });
      return;
    }
    const fromDate = val.from;
    const toDate = val.to;

    if (fromDate && toDate && fromDate.getTime() === toDate.getTime()) {
      onDateRangeChange({ from: fromDate, to: undefined });
    } else {
      onDateRangeChange({ from: fromDate, to: toDate });
    }
  };
  */
  return (
    <div className="flex justify-between gap-4 mb-6">
      {/* Search input */}
      <div className="relative flex-1 max-w-sm">
        <Input
          placeholder="Search projects..."
          className="pl-9 rounded-none"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      </div>

      {/* Search tags */}
      <div className="relative flex-1 max-w-sm">
        <Input
          placeholder="Search tags..."
          className="pl-9 rounded-none"
          value={tagSearchTerm}
          onChange={(e) => onTagSearchChange(e.target.value)}
        />
        <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      </div>

      {/* Status dropdown */}
      <div className="w-[180px]">
        <Select
          value={status ?? "__all__"}
          onValueChange={(val) =>
            onStatusChange(val === "__all__" ? undefined : val)
          }
        >
          <SelectTrigger className="rounded-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
            <SelectItem value="Closed">Closed</SelectItem>
            <SelectItem value="Archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Date-range picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-[220px] justify-start text-left rounded-none"
          >
            {dateRange?.from && dateRange.to ? (
              <>
                {format(dateRange.from, "dd/MM/yy")} –{" "}
                {format(dateRange.to, "dd/MM/yy")}
              </>
            ) : (
              <span className="text-muted-foreground">DD/MM/YY – DD/MM/YY</span>
            )}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent align="start" className="w-auto p-4">
          <div className="flex gap-2 items-center">
            <label className="flex flex-col text-sm">
              <span className="text-xs text-muted-foreground">From</span>
              <input
                type="date"
                value={
                  dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : ""
                }
                onChange={(e) => {
                  const v = e.target.value; // expected format: yyyy-mm-dd
                  if (!v) {
                    onDateRangeChange(undefined);
                    return;
                  }
                  const [y, m, d] = v.split("-").map((n) => Number(n));
                  const parsed = new Date(y, m - 1, d, 0, 0, 0); // local midnight
                  onDateRangeChange({ from: parsed, to: dateRange?.to });
                }}
                className="border rounded px-2 py-1"
              />
            </label>

            <label className="flex flex-col text-sm">
              <span className="text-xs text-muted-foreground">To</span>
              <input
                type="date"
                value={dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : ""}
                onChange={(e) => {
                  const v = e.target.value; // expected format: yyyy-mm-dd
                  if (!v) {
                    onDateRangeChange({ from: dateRange?.from, to: undefined });
                    return;
                  }
                  const [y, m, d] = v.split("-").map((n) => Number(n));
                  const parsedEnd = new Date(y, m - 1, d, 23, 59, 59);
                  onDateRangeChange({ from: dateRange?.from, to: parsedEnd });
                }}
                className="border rounded px-2 py-1"
              />
            </label>

            <div className="flex items-end">
              <button
                className="text-sm text-red-600 underline"
                onClick={() => onDateRangeChange(undefined)}
              >
                Clear
              </button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ProjectsFilter;
