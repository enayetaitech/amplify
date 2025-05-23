"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toTimestamp = void 0;
// backend/processors/session/sessionTimeConflictChecker.ts
const luxon_1 = require("luxon");
/**
 * Combines a date (Date or ISO “YYYY-MM-DD”) and a “HH:mm” time string
 * into a millisecond timestamp in the given IANA timeZone.
 */
const toTimestamp = (dateVal, timeStr, timeZone) => {
    // Normalize date to “YYYY-MM-DD”
    const dateISO = typeof dateVal === "string"
        ? dateVal
        : luxon_1.DateTime.fromJSDate(dateVal).toISODate();
    const dt = luxon_1.DateTime.fromISO(`${dateISO}T${timeStr}`, { zone: timeZone });
    if (!dt.isValid) {
        throw new Error(`Invalid date/time/timeZone: ${dateISO} ${timeStr} ${timeZone}`);
    }
    return dt.toMillis();
};
exports.toTimestamp = toTimestamp;
