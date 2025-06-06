// frontend/utils/hooks/useProjectFilter.ts
import { useMemo } from "react";
import { IProject } from "@shared/interface/ProjectInterface";
import { ISession } from "@shared/interface/SessionInterface";


export interface DateRange {
  from: Date | undefined;
  to?: Date | undefined;
}

export function useProjectFilter(
  projects: IProject[],
  search: string,
  dateRange?: DateRange
): IProject[] {
  return useMemo(() => {
    return (projects as (IProject & { meetingObjects?: ISession[] })[]).filter(
      (project) => {
        const matchesSearch = project.name.toLowerCase().includes(search.toLowerCase());
        if (!dateRange?.from || !dateRange.to) return matchesSearch;

        const rangeStart = new Date(dateRange.from);
        const rangeEnd = new Date(dateRange.to);

       const projectStart = new Date(project.startDate);
    const isProjectDateInRange =
      projectStart >= rangeStart && projectStart <= rangeEnd;

        const inAnyMeetingRange = project.meetingObjects?.some((session) => {
          const date = new Date(session.date);
          const [h, m] = session.startTime?.split(":").map(Number) || [0, 0];
          date.setHours(h, m);
           date.setMinutes(m);
          return date >= rangeStart && date <= rangeEnd;
        });

        return matchesSearch && (isProjectDateInRange || inAnyMeetingRange);
      }
    );
  }, [projects, search, dateRange]);
}
