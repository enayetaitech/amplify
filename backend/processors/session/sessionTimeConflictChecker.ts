// backend/processors/session/sessionTimeConflictChecker.ts
import { DateTime, IANAZone } from "luxon";

// Map your UI labels to canonical IANA zones.
// Include both the naked name and the "(UTC±..) Name" variant for resilience.
const DISPLAY_TZ_TO_IANA: Record<string, string> = {
  "Eastern Time": "America/New_York",
  "(UTC-05) Eastern Time": "America/New_York",

  "Central Time": "America/Chicago",
  "(UTC-06) Central Time": "America/Chicago",

  "Mountain Time": "America/Denver",
  "(UTC-07) Mountain Time": "America/Denver",

  "Pacific Time": "America/Los_Angeles",
  "(UTC-08) Pacific Time": "America/Los_Angeles",

  "Alaska Time": "America/Anchorage",
  "(UTC-09) Alaska Time": "America/Anchorage",

  "Hawaii Time": "Pacific/Honolulu",
  "(UTC-10) Hawaii Time": "Pacific/Honolulu",

  "London Time": "Europe/London",
  "(UTC-00) London Time": "Europe/London",

  "Cape Verde": "Atlantic/Cape_Verde",
  "(UTC-01) Cape Verde": "Atlantic/Cape_Verde",

  "Sandwich Islands": "Atlantic/South_Georgia",
  "(UTC-02) Sandwich Islands": "Atlantic/South_Georgia",

  "Rio de Janeiro": "America/Sao_Paulo",
  "(UTC-03) Rio de Janeiro": "America/Sao_Paulo",

  "Buenos Aires": "America/Argentina/Buenos_Aires",
  "(UTC-04) Buenos Aires": "America/Argentina/Buenos_Aires",

  Paris: "Europe/Paris",
  "(UTC+01) Paris": "Europe/Paris",

  Athens: "Europe/Athens",
  "(UTC+02) Athens": "Europe/Athens",

  Moscow: "Europe/Moscow",
  "(UTC+03) Moscow": "Europe/Moscow",

  Dubai: "Asia/Dubai",
  "(UTC+04) Dubai": "Asia/Dubai",

  Pakistan: "Asia/Karachi",
  "(UTC+05) Pakistan": "Asia/Karachi",

  Delhi: "Asia/Kolkata",
  "(UTC+05.5) Delhi": "Asia/Kolkata",

  Bangladesh: "Asia/Dhaka",
  "(UTC+06) Bangladesh": "Asia/Dhaka",

  Bangkok: "Asia/Bangkok",
  "(UTC+07) Bangkok": "Asia/Bangkok",

  Beijing: "Asia/Shanghai",
  "(UTC+08) Beijing": "Asia/Shanghai",

  Tokyo: "Asia/Tokyo",
  "(UTC+09) Tokyo": "Asia/Tokyo",

  Sydney: "Australia/Sydney",
  "(UTC+10) Sydney": "Australia/Sydney",

  "Solomon Islands": "Pacific/Guadalcanal",
  "(UTC+11) Solomon Islands": "Pacific/Guadalcanal",

  Auckland: "Pacific/Auckland",
  "(UTC+12) Auckland": "Pacific/Auckland",
};

/** Try to resolve a UI timezone label to an IANA zone. */
export const resolveToIana = (
  tzLabel: string | undefined | null
): string | null => {
  if (!tzLabel) return null;

  // If caller already gave an IANA zone, accept it.
  if (validateIanaZone(tzLabel)) return tzLabel;

  const trimmed = tzLabel.trim();

  // Direct map hit?
  const direct = DISPLAY_TZ_TO_IANA[trimmed];
  if (direct) return direct;

  // If it's "(UTC±..) Name", strip the prefix and try again.
  const withoutPrefix = trimmed.replace(/^\(UTC[+-]?\d+(?:\.\d+)?\)\s*/, "");
  if (withoutPrefix !== trimmed) {
    const byName = DISPLAY_TZ_TO_IANA[withoutPrefix];
    if (byName) return byName;
  }

  return null;
};

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
      : // interpret stored Date in the target zone to avoid server-local shifts
        DateTime.fromJSDate(dateVal).setZone(timeZone).toISODate()!;

  const dt = DateTime.fromISO(`${dateISO}T${timeStr}`, { zone: timeZone });
  if (!dt.isValid) {
    throw new Error(
      `Invalid date/time/timeZone: ${dateISO} ${timeStr} ${timeZone}`
    );
  }
  return dt.toMillis();
};

/** Validate an IANA time zone identifier */
export const validateIanaZone = (zone: string): boolean => {
  return IANAZone.isValidZone(zone);
};

/**
 * Compute timestamp with strict DST policy:
 * - Reject nonexistent times (spring-forward) -> throw Error
 * - Reject ambiguous times (fall-back repeated hour) -> throw Error
 */
export const toTimestampStrict = (
  dateVal: Date | string,
  timeStr: string,
  timeZone: string
): number => {
  // Normalize date to “YYYY-MM-DD”
  const dateISO =
    typeof dateVal === "string"
      ? DateTime.fromISO(dateVal).toISODate()!
      : // interpret stored Date in the target zone to avoid server-local shifts
        DateTime.fromJSDate(dateVal).setZone(timeZone).toISODate()!;

  // First attempt: Luxon will flag nonexistent times as invalid
  const dt = DateTime.fromISO(`${dateISO}T${timeStr}`, { zone: timeZone });
  if (!dt.isValid) {
    throw new Error(
      `Selected time does not exist in ${timeZone} on ${dateISO} due to daylight saving time. Please choose a different time.`
    );
  }

  // Detect ambiguous fall-back hour on this date by locating the offset transition
  const transition = findDailyOffsetTransition(dateISO, timeZone);
  if (transition && transition.newOffset < transition.oldOffset) {
    const ambiguousStartMin = transition.minuteOfDay; // inclusive
    const ambiguousLen = transition.oldOffset - transition.newOffset; // typically 60
    const ambiguousEndMin = ambiguousStartMin + ambiguousLen; // exclusive

    const [h, m] = timeStr.split(":").map(Number);
    const selectedMin = h * 60 + m;
    if (selectedMin >= ambiguousStartMin && selectedMin < ambiguousEndMin) {
      const window = `${formatMinutes(ambiguousStartMin)}–${formatMinutes(
        ambiguousEndMin
      )}`;
      throw new Error(
        `Selected time is ambiguous in ${timeZone} on ${dateISO} (${window}) due to the end of daylight saving time. Please choose a time outside this window.`
      );
    }
  }

  return dt.toMillis();
};

/**
 * Scan the local day to find the first minute where the time zone offset changes.
 * Returns null if there is no transition that day.
 */
const findDailyOffsetTransition = (
  dateISO: string,
  timeZone: string
): { minuteOfDay: number; oldOffset: number; newOffset: number } | null => {
  let prev = DateTime.fromISO(`${dateISO}T00:00`, { zone: timeZone });
  let prevOffset = prev.offset; // minutes
  for (let minute = 1; minute < 24 * 60; minute++) {
    const cur = DateTime.fromISO(`${dateISO}T00:00`, { zone: timeZone }).plus({
      minutes: minute,
    });
    const curOffset = cur.offset;
    if (curOffset !== prevOffset) {
      return {
        minuteOfDay: minute,
        oldOffset: prevOffset,
        newOffset: curOffset,
      };
    }
    prevOffset = curOffset;
  }
  return null;
};

const formatMinutes = (mins: number): string => {
  const h = Math.floor(mins / 60)
    .toString()
    .padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};
