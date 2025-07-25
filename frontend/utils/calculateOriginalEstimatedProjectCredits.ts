import { IProjectSession } from "@shared/interface/ProjectInterface";


export function calculateOriginalEstimatedProjectCredits(
  sessions: IProjectSession[],
  ratePerMinute = 2.75,
): number {
  const totalMinutes = sessions.reduce((sum, { number, duration }) => {

    const match = duration.match(/^\s*(\d+)\s*/);
    const minutes = match ? parseInt(match[1], 10) : 0;
    return sum + number * minutes;
  }, 0);

  return totalMinutes * ratePerMinute;
}