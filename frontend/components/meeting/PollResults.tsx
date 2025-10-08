"use client";

import React from "react";
// Option value may be string/number or structured; treat as unknown from API
type OptionCount = { value: unknown; count: number };

export default function PollResults({
  aggregate,
}: {
  aggregate: { total: number; counts: OptionCount[] } | null | undefined;
}) {
  if (!aggregate)
    return <div className="text-sm text-gray-500">No responses yet</div>;

  const total = aggregate.total || 0;

  // sort counts descending
  const counts = (aggregate.counts || [])
    .slice()
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-3">
      {counts.map((c, i) => {
        const pct = total ? Math.round((c.count / total) * 100) : 0;
        return (
          <div key={i}>
            <div className="flex justify-between text-sm mb-1">
              <div className="truncate">{String(c.value)}</div>
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
