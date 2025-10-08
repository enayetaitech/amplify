"use client";

import React from "react";
import { PollQuestion } from "@shared/interface/PollInterface";
// Option value may be string/number or structured; treat as unknown from API
type OptionCount = { value: unknown; count: number };

export default function PollResults({
  aggregate,
  question,
}: {
  aggregate: { total: number; counts: OptionCount[] } | null | undefined;
  question?: PollQuestion | null;
}) {
  if (!aggregate)
    return <div className="text-sm text-gray-500">No responses yet</div>;

  const total = aggregate?.total || 0;

  // sort counts descending
  const counts = (aggregate?.counts || [])
    .slice()
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-3">
      {counts.map((c, i) => {
        const pct = total ? Math.round((c.count / total) * 100) : 0;

        // derive a human-friendly label and correctness when question metadata is provided
        let labelText = String(c.value);
        let correctness: string | null = null;

        try {
          if (question) {
            const q = question as PollQuestion;
            switch (q.type) {
              case "SINGLE_CHOICE":
                if (typeof c.value === "number") {
                  labelText = q.answers?.[c.value as number] ?? String(c.value);
                  if (q.correctAnswer !== undefined)
                    correctness =
                      Number(c.value) === q.correctAnswer ? "Correct" : "Wrong";
                }
                break;

              case "MULTIPLE_CHOICE":
                if (Array.isArray(c.value)) {
                  const chosen = c.value as number[];
                  labelText = chosen
                    .map((idx) => q.answers?.[idx] ?? String(idx))
                    .join(", ");
                  const correct = q.correctAnswers || [];
                  const setA = new Set(chosen);
                  const setB = new Set(correct);
                  const eq =
                    setA.size === setB.size &&
                    [...setA].every((x) => setB.has(x));
                  correctness =
                    chosen.length === 0 ? null : eq ? "Correct" : "Wrong";
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
                  // consider correct if each left maps to same index (creator used aligned arrays)
                  const ok = pairs.every((p) => p[1] === p[0]);
                  correctness =
                    pairs.length === 0 ? null : ok ? "Correct" : "Wrong";
                }
                break;

              case "FILL_IN_BLANK":
                if (Array.isArray(c.value)) {
                  const vals = c.value as string[];
                  labelText = vals.join(", ");
                  const expected = q.answers || [];
                  const ok =
                    expected.length === vals.length &&
                    vals.every(
                      (v, idx) =>
                        (v ?? "").trim().toLowerCase() ===
                        (expected[idx] ?? "").trim().toLowerCase()
                    );
                  correctness = ok ? "Correct" : "Wrong";
                }
                break;

              case "RANK_ORDER":
                if (Array.isArray(c.value)) {
                  const arr = c.value as number[];
                  labelText = arr
                    .map((idx) => q.columns?.[idx] ?? String(idx))
                    .join(", ");
                  // correct if identity mapping (arr[i] === i)
                  const ok = arr.every((val, idx) => val === idx);
                  correctness =
                    arr.length === 0 ? null : ok ? "Correct" : "Wrong";
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
              <div className="truncate">
                {labelText}
                {correctness ? (
                  <span
                    className={`ml-2 text-xs ${
                      correctness === "Correct"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {`— ${correctness}`}
                  </span>
                ) : null}
              </div>
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
