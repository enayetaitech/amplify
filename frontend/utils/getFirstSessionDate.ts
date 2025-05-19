import { IProject } from "@shared/interface/ProjectInterface";

export function getFirstSessionDate(project: IProject): Date | null {
  if (!project?.meetings?.length) {
    return project.startDate ? new Date(project.startDate) : null;
  }

  const sessionDateTimes = project.meetings
    .filter((m) => m?.startTime && m?.date)
    .map((m) => {
      const meetingDate = new Date(m.date);
      const [hour, minute] = m.startTime.split(":").map(Number);
      return new Date(
        meetingDate.getFullYear(),
        meetingDate.getMonth(),
        meetingDate.getDate(),
        hour,
        minute
      );
    });

  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const upcoming = sessionDateTimes.filter((dt) => dt >= todayMidnight);

  return upcoming.length
    ? upcoming.reduce((earliest, curr) => (curr < earliest ? curr : earliest), upcoming[0])
    : project.startDate
    ? new Date(project.startDate)
    : null;
}
