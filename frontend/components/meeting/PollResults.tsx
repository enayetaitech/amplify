"use client";

import React from "react";
import { PollQuestion } from "@shared/interface/PollInterface";
// Option value may be string/number or structured; treat as unknown from API
type OptionCount = { value: unknown; count: number };

export default function PollResults({
  aggregate,
  question,
  totalParticipants,
}: {
  aggregate: { total: number; counts: OptionCount[] } | null | undefined;
  question?: PollQuestion | null;
  totalParticipants?: number;
}) {
  if (!aggregate)
    return <div className="text-sm text-gray-500">No responses yet</div>;

  const answered = aggregate?.total || 0;
  const total = totalParticipants || answered;

  // sort counts descending
  const counts = (aggregate?.counts || [])
    .slice()
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-3">
      {totalParticipants !== undefined && (
        <div className="text-xs text-gray-500 mb-2">
          {answered} answered / {total} total participants
        </div>
      )}
      {counts.map((c, i) => {
        // Percentage should be based on answered count, not total participants
        const pct = answered > 0 ? Math.round((c.count / answered) * 100) : 0;

        // derive a human-friendly label when question metadata is provided
        let labelText = String(c.value);

        try {
          if (question) {
            const q = question as PollQuestion;
            switch (q.type) {
              case "SINGLE_CHOICE":
                if (typeof c.value === "number") {
                  labelText = q.answers?.[c.value as number] ?? String(c.value);
                }
                break;

              case "MULTIPLE_CHOICE":
                if (Array.isArray(c.value)) {
                  const chosen = c.value as number[];
                  labelText = chosen
                    .map((idx) => q.answers?.[idx] ?? String(idx))
                    .join(", ");
                }
                break;

              case "MATCHING":
                if (Array.isArray(c.value)) {
                  // value is array of pairs [[left,right],...]
                  const pairs = c.value as Array<[number, number]>;
                  labelText = pairs
                    .map(
                      (p) =>
                        `${q.options?.[p[0]] ?? p[0]} → ${
                          q.answers?.[p[1]] ?? p[1]
                        }`
                    )
                    .join(", ");
                }
                break;

              case "FILL_IN_BLANK":
                if (Array.isArray(c.value)) {
                  const vals = c.value as string[];
                  labelText = vals.join(", ");
                }
                break;

              case "RANK_ORDER":
                if (Array.isArray(c.value)) {
                  const arr = c.value as number[];
                  labelText = arr
                    .map((idx) => q.columns?.[idx] ?? String(idx))
                    .join(", ");
                }
                break;

              default:
                // fallback: leave labelText as-is
                break;
            }
          }
        } catch {}

        return (
          <div key={i}>
            <div className="flex justify-between text-sm mb-1">
              <div className="truncate">{labelText}</div>
              <div className="text-gray-500">
                {c.count} ({pct}%)
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded h-3">
              <div
                className="bg-custom-teal h-3 rounded"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
