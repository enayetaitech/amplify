// shared/utils/credits.ts

import { ISession } from "@shared/interface/SessionInterface"; 

/**
 * Sum all remaining meeting durations (in minutes)
 * and multiply by the per-minute credit rate.
 */
export function calculateRemainingScheduleCredits(
  meetings: ISession[],
  ratePerMinute = 2.75,
): number {
  const totalMinutes = meetings.reduce(
    (sum, { duration }) => sum + duration,
    0,
  );

  return totalMinutes * ratePerMinute;
}
