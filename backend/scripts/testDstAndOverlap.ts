import { toTimestampStrict } from "../processors/session/sessionTimeConflictChecker";

function assertThrows(fn: () => unknown, msg: string) {
  let threw = false;
  try {
    fn();
  } catch (e) {
    threw = true;
  }
  if (!threw) {
    console.error(`Expected throw: ${msg}`);
    process.exit(1);
  }
}

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`Assertion failed: ${msg}`);
    process.exit(1);
  }
}

// Zone with DST
const zone = "America/Los_Angeles";

// 1) Spring-forward nonexistent example (second Sunday in March)
// For 2025, DST starts Mar 9 at 02:00 -> clocks jump to 03:00, so 02:30 doesn't exist
assertThrows(
  () => toTimestampStrict("2025-03-09", "02:30", zone),
  "Nonexistent spring-forward time should be rejected"
);

// 2) Fall-back ambiguous example (first Sunday in November)
// For 2025, DST ends Nov 2 ~ 02:00 repeats; 01:30 is ambiguous
assertThrows(
  () => toTimestampStrict("2025-11-02", "01:30", zone),
  "Ambiguous fall-back time should be rejected"
);

// 3) Valid normal time should pass
const t1 = toTimestampStrict("2025-01-15", "10:00", zone);
const t2 = toTimestampStrict("2025-01-15", "11:00", zone);
assert(t2 > t1, "Later time should have greater epoch");

// 4) Overlap logic across midnight (no DST)
// A: 23:30 -> 120 minutes (till 01:30 next day)
const aStart = toTimestampStrict("2025-01-10", "23:30", zone);
const aEnd = aStart + 120 * 60_000;
// B: 00:30 next day -> 30 minutes; should overlap with A
const bStart = toTimestampStrict("2025-01-11", "00:30", zone);
const bEnd = bStart + 30 * 60_000;
const overlaps = aStart < bEnd && bStart < aEnd;
assert(overlaps, "Cross-midnight sessions should overlap");

