// shared/timezones.ts
import { DateTime, IANAZone } from "luxon";

// Map your UI labels to canonical IANA zones (same mapping you used on backend)
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

  "Paris": "Europe/Paris",
  "(UTC+01) Paris": "Europe/Paris",

  "Athens": "Europe/Athens",
  "(UTC+02) Athens": "Europe/Athens",

  "Moscow": "Europe/Moscow",
  "(UTC+03) Moscow": "Europe/Moscow",

  "Dubai": "Asia/Dubai",
  "(UTC+04) Dubai": "Asia/Dubai",

  "Pakistan": "Asia/Karachi",
  "(UTC+05) Pakistan": "Asia/Karachi",

  "Delhi": "Asia/Kolkata",
  "(UTC+05.5) Delhi": "Asia/Kolkata",

  "Bangladesh": "Asia/Dhaka",
  "(UTC+06) Bangladesh": "Asia/Dhaka",

  "Bangkok": "Asia/Bangkok",
  "(UTC+07) Bangkok": "Asia/Bangkok",

  "Beijing": "Asia/Shanghai",
  "(UTC+08) Beijing": "Asia/Shanghai",

  "Tokyo": "Asia/Tokyo",
  "(UTC+09) Tokyo": "Asia/Tokyo",

  "Sydney": "Australia/Sydney",
  "(UTC+10) Sydney": "Australia/Sydney",

  "Solomon Islands": "Pacific/Guadalcanal",
  "(UTC+11) Solomon Islands": "Pacific/Guadalcanal",

  "Auckland": "Pacific/Auckland",
  "(UTC+12) Auckland": "Pacific/Auckland",
};

export const resolveToIana = (label?: string | null): string | null => {
  if (!label) return null;
  if (IANAZone.isValidZone(label)) return label; // already IANA
  const trimmed = label.trim();
  const direct = DISPLAY_TZ_TO_IANA[trimmed];
  if (direct) return direct;
  const withoutPrefix = trimmed.replace(/^\(UTC[+-]?\d+(?:\.\d+)?\)\s*/, "");
  return DISPLAY_TZ_TO_IANA[withoutPrefix] ?? null;
};

export const formatUtcOffset = (iana: string, at: Date | string | number): string => {
  const dt = typeof at === "string" || typeof at === "number"
    ? DateTime.fromISO(String(at), { zone: iana })
    : DateTime.fromJSDate(at, { zone: iana });
  const minutes = dt.isValid ? dt.offset : DateTime.now().setZone(iana).offset;
  const sign = minutes >= 0 ? "+" : "-";
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `UTC${sign}${h}${m ? ":" + String(m).padStart(2, "0") : ""}`;
};

export const formatUiTimeZone = (displayLabel: string, at?: Date | string | number): string => {
  const iana = resolveToIana(displayLabel);
  if (!iana) return displayLabel; // fallback
  const when = at ?? new Date();
  const offset = formatUtcOffset(iana, when);
  const cleanName = displayLabel.replace(/^\(UTC[^\)]+\)\s*/, "");
  return `${offset} ${cleanName}`;
};
