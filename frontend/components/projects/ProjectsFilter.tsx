// frontend/components/projects/ProjectsFilter.tsx
"use client";

import React from "react";
import { Input } from "components/ui/input";
import { SearchIcon, CalendarIcon } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "components/ui/popover";
import { Button } from "components/ui/button";
import { Calendar } from "components/ui/calendar";
import { format } from "date-fns";

export interface DateRange {
  from: Date | undefined;
  to?: Date | undefined;
}

interface ProjectsFilterProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  dateRange?: DateRange;
  onDateRangeChange: (range: DateRange | undefined) => void;
}

const ProjectsFilter: React.FC<ProjectsFilterProps> = ({
  searchTerm,
  onSearchChange,
  dateRange,
  onDateRangeChange,
}) => {
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

      {/* Date-range picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-[220px] justify-start text-left rounded-none"
          >
            {dateRange?.from && dateRange.to ? (
              <>
                {format(dateRange.from, "dd/MM/yy")} – {format(dateRange.to, "dd/MM/yy")}
              </>
            ) : (
              <span className="text-muted-foreground">DD/MM/YY – DD/MM/YY</span>
            )}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={onDateRangeChange}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ProjectsFilter;
