// backend/processors/session/sessionTimeConflictChecker.ts
import { DateTime } from "luxon";

/**
 * Combines a date (Date or ISO “YYYY-MM-DD”) and a “HH:mm” time string
 * into a millisecond timestamp in the given IANA timeZone.
 */
export const toTimestamp = (
  dateVal: Date | string,
  timeStr: string,
  timeZone: string
): number => {
  // Normalize date to “YYYY-MM-DD”
  const dateISO =
    typeof dateVal === "string"
      ? dateVal
      : DateTime.fromJSDate(dateVal).toISODate()!;

  const dt = DateTime.fromISO(`${dateISO}T${timeStr}`, { zone: timeZone });
  if (!dt.isValid) {
    throw new Error(
      `Invalid date/time/timeZone: ${dateISO} ${timeStr} ${timeZone}`
    );
  }
  return dt.toMillis();
};
