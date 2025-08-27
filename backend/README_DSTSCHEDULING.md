# Scheduling and DST Policy

- Project time zone

  - `defaultTimeZone` (IANA, e.g., `America/Los_Angeles`) is required and locked after creation.
  - All sessions within a project use this time zone.

- DST rules

  - Nonexistent times (spring-forward) are rejected with 400. Example: `2025-03-09 02:30` in `America/Los_Angeles`.
  - Ambiguous times (fall-back repeated hour) are rejected with 400. Example: `2025-11-02 01:30` in `America/Los_Angeles`.

- Overlap rules

  - Two sessions cannot overlap. Overlap test is done on absolute epochs: `startA < endB && startB < endA`.
  - Checks run both for sessions in the same request and against existing sessions.

- Storage

  - Sessions store `date` (calendar day), `startTime` (HH:mm), `duration` (minutes), and computed `startAtEpoch`/`endAtEpoch`.
  - Index `{ projectId, startAtEpoch, endAtEpoch }` supports overlap queries.

- Display

  - Frontend uses Intl formatting with the project IANA zone for DST-aware display.

- Errors

  - 400: invalid, nonexistent, or ambiguous times with clear messages.
  - 409: scheduling conflict with the conflicting session name.

- Utilities
  - `toTimestampStrict` enforces DST rules and computes epochs.
  - `validateIanaZone` verifies IANA zone strings.
