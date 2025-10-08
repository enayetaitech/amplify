"use client";

import React, { useEffect, useState } from "react";
import { Button } from "components/ui/button";
import { Checkbox } from "components/ui/checkbox";
import { Textarea } from "components/ui/textarea";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from "components/ui/select";
import useActivePoll from "hooks/useActivePoll";
import socketLib from "lib/socket";
import api from "lib/api";
import { toast } from "sonner";
import { IPoll, PollQuestion } from "@shared/interface/PollInterface";
import PollResults from "./PollResults";

type PollRun = {
  _id: string;
  runNumber: number;
  status: "OPEN" | "CLOSED";
  anonymous?: boolean;
  shareResults?: "never" | "onStop" | "immediate";
};

type User = {
  _id: string;
  role?: string;
  firstName?: string;
  name?: string;
  email?: string;
} | null;

type Answer = {
  questionId: string;
  value: number | number[] | string | string[] | Array<[number, number]>;
};

export default function ActivePoll({
  sessionId,
  user,
}: {
  sessionId: string;
  user?: User;
}) {
  const { data, refetch } = useActivePoll(sessionId);
  const [submittedRunIds, setSubmittedRunIds] = useState<
    Record<string, boolean>
  >({});
  const [localAnswers, setLocalAnswers] = useState<Record<string, unknown>>({});
  const [resultsMapping, setResultsMapping] = useState<Record<
    string,
    { total: number; counts: { value: unknown; count: number }[] }
  > | null>(null);

  useEffect(() => {
    // connect socket
    socketLib.connectSocket({
      sessionId,
      role: (user?.role as string) || "Participant",
      name: user?.firstName || user?.name,
      email: user?.email,
    });

    const onStarted = () => {
      refetch();
      setResultsMapping(null);
    };
    const onStopped = () => refetch();
    const onResults = (payload: unknown) => {
      try {
        if (typeof payload !== "object" || payload === null) return;
        const pl = payload as {
          pollId?: string;
          runId?: string;
          aggregates?: Record<
            string,
            { total: number; counts: { value: unknown; count: number }[] }
          >;
        };
        if (!pl.pollId) return;
        const currentPollId = (data as { poll?: IPoll }).poll?._id;
        if (!currentPollId) return;
        if (pl.pollId !== currentPollId) return;
        if (!pl.aggregates) return;
        setResultsMapping(
          pl.aggregates as Record<
            string,
            { total: number; counts: { value: unknown; count: number }[] }
          >
        );
      } catch {}
    };
    const onAck = (p: unknown) => {
      if (
        typeof p === "object" &&
        p !== null &&
        (p as { runId?: string }).runId
      ) {
        const runId = (p as { runId?: string }).runId!;
        setSubmittedRunIds((s) => ({ ...s, [runId]: true }));
      }
    };

    socketLib.on("poll:started", onStarted);
    socketLib.on("poll:stopped", onStopped);
    socketLib.on("poll:submission:ack", onAck as (...args: unknown[]) => void);
    socketLib.on("poll:results", onResults as (...args: unknown[]) => void);

    return () => {
      socketLib.off("poll:started", onStarted);
      socketLib.off("poll:stopped", onStopped);
      socketLib.off("poll:submission:ack", onAck);
      socketLib.off("poll:results", onResults as (...args: unknown[]) => void);
      socketLib.disconnectSocket();
    };
  }, [
    sessionId,
    user?.role,
    user?.firstName,
    user?.name,
    user?.email,
    refetch,
    data,
  ]);

  if (!data) return null;
  const poll = (data as { poll?: IPoll })?.poll as IPoll | undefined;
  const run = (data as { run?: PollRun })?.run as PollRun | undefined;
  if (!poll || !run) return null;

  const canSubmit = !submittedRunIds[String(run._id)];

  const onSubmit = async (answers: Answer[]) => {
    try {
      await api.post(`/api/v1/polls/${(poll as IPoll)._id}/respond`, {
        sessionId,
        runId: run._id,
        answers,
      });
      toast.success("Response recorded");
      setSubmittedRunIds((s) => ({ ...s, [run._id]: true }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Submit failed";
      toast.error(msg);
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="font-semibold text-lg">{poll.title}</h3>
      <p className="text-sm text-gray-500">Run #{run.runNumber}</p>

      {/* Participant-shared results (shown when server emits poll:results) */}
      {resultsMapping && (
        <div className="mt-4 mb-4 border rounded p-3 bg-gray-50">
          {poll.questions.map((q: PollQuestion) => (
            <div key={q._id} className="mb-4">
              <div className="font-medium mb-2">{q.prompt}</div>
              <PollResults aggregate={resultsMapping[q._id]} />
            </div>
          ))}
        </div>
      )}

      {/* TODO: render question components per type; for now show placeholder */}
      <div className="mt-4 space-y-3">
        {poll.questions.map((q: PollQuestion, idx: number) => (
          <div key={q._id} className="border p-3 rounded">
            <div className="font-medium">
              {idx + 1}. {q.prompt}
            </div>
            {/* SINGLE_CHOICE (immediate submit) */}
            {q.type === "SINGLE_CHOICE" && (
              <div className="mt-2 flex flex-col gap-2">
                {q.answers.map((a: string, i: number) => (
                  <Button
                    key={i}
                    disabled={!canSubmit}
                    onClick={() => onSubmit([{ questionId: q._id, value: i }])}
                  >
                    {a}
                  </Button>
                ))}
              </div>
            )}

            {/* MULTIPLE_CHOICE */}
            {q.type === "MULTIPLE_CHOICE" && (
              <div className="mt-2 space-y-2">
                {q.answers.map((a: string, i: number) => {
                  const selected =
                    Array.isArray(localAnswers[q._id]) &&
                    (localAnswers[q._id] as number[]).includes(i);
                  return (
                    <label key={i} className="flex items-center gap-2">
                      <Checkbox
                        checked={!!selected}
                        onCheckedChange={(v) => {
                          setLocalAnswers((s) => {
                            const prev = Array.isArray(s[q._id])
                              ? (s[q._id] as number[])
                              : [];
                            const next = v
                              ? [...prev, i]
                              : prev.filter((x) => x !== i);
                            return { ...s, [q._id]: next };
                          });
                        }}
                        disabled={!canSubmit}
                      />
                      <span>{a}</span>
                    </label>
                  );
                })}
                <div className="mt-2">
                  <Button
                    onClick={() =>
                      onSubmit([
                        {
                          questionId: q._id,
                          value: (localAnswers[q._id] as number[]) || [],
                        },
                      ])
                    }
                    disabled={!canSubmit}
                  >
                    Submit
                  </Button>
                </div>
              </div>
            )}

            {/* SHORT_ANSWER / LONG_ANSWER */}
            {(q.type === "SHORT_ANSWER" || q.type === "LONG_ANSWER") && (
              <div className="mt-2">
                {q.type === "SHORT_ANSWER" ? (
                  <input
                    className="w-full border rounded px-2 py-1"
                    value={(localAnswers[q._id] as string) || ""}
                    onChange={(e) =>
                      setLocalAnswers((s) => ({
                        ...s,
                        [q._id]: e.target.value,
                      }))
                    }
                    disabled={!canSubmit}
                  />
                ) : (
                  <Textarea
                    value={(localAnswers[q._id] as string) || ""}
                    onChange={(e) =>
                      setLocalAnswers((s) => ({
                        ...s,
                        [q._id]: e.target.value,
                      }))
                    }
                    disabled={!canSubmit}
                  />
                )}
                <div className="mt-2">
                  <Button
                    onClick={() =>
                      onSubmit([
                        {
                          questionId: q._id,
                          value: (localAnswers[q._id] as string) || "",
                        },
                      ])
                    }
                    disabled={!canSubmit}
                  >
                    Submit
                  </Button>
                </div>
              </div>
            )}

            {/* FILL_IN_BLANK */}
            {q.type === "FILL_IN_BLANK" && (
              <div className="mt-2 space-y-2">
                {q.answers.map((_: string, i: number) => (
                  <input
                    key={i}
                    className="w-full border rounded px-2 py-1"
                    placeholder={`Answer ${i + 1}`}
                    value={
                      Array.isArray(localAnswers[q._id])
                        ? (localAnswers[q._id] as string[])[i] || ""
                        : ""
                    }
                    onChange={(e) =>
                      setLocalAnswers((s) => {
                        const arr = Array.isArray(s[q._id])
                          ? [...(s[q._id] as string[])]
                          : [];
                        arr[i] = e.target.value;
                        return { ...s, [q._id]: arr };
                      })
                    }
                    disabled={!canSubmit}
                  />
                ))}
                <div className="mt-2">
                  <Button
                    onClick={() =>
                      onSubmit([
                        {
                          questionId: q._id,
                          value: (localAnswers[q._id] as string[]) || [],
                        },
                      ])
                    }
                    disabled={!canSubmit}
                  >
                    Submit
                  </Button>
                </div>
              </div>
            )}

            {/* MATCHING */}
            {q.type === "MATCHING" && (
              <div className="mt-2 space-y-2">
                {q.options.map((opt: string, i: number) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>{opt}</div>
                    <Select
                      onValueChange={(v: string) =>
                        setLocalAnswers((s) => ({
                          ...s,
                          [q._id]: {
                            ...((s[q._id] as Record<number, number>) || {}),
                            [i]: Number(v),
                          },
                        }))
                      }
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {q.answers.map((ans: string, j: number) => (
                          <SelectItem key={j} value={String(j)}>
                            {ans}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
                <div className="mt-2">
                  <Button
                    onClick={() => {
                      const map =
                        (localAnswers[q._id] as Record<number, number>) || {};
                      const pairs: Array<[number, number]> = Object.keys(
                        map
                      ).map((k) => [Number(k), map[Number(k)]]);
                      onSubmit([{ questionId: q._id, value: pairs }]);
                    }}
                    disabled={!canSubmit}
                  >
                    Submit
                  </Button>
                </div>
              </div>
            )}

            {/* RANK_ORDER */}
            {q.type === "RANK_ORDER" && (
              <div className="mt-2 overflow-x-auto">
                <table className="w-full table-fixed text-sm">
                  <thead>
                    <tr>
                      <th className="p-2 text-left"></th>
                      {q.columns.map((col: string, ci: number) => (
                        <th key={ci} className="p-2 text-center">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {q.rows.map((row: string, ri: number) => (
                      <tr key={ri} className="border-t">
                        <td className="p-2">{row}</td>
                        {q.columns.map((col, ci) => (
                          <td key={ci} className="p-2 text-center">
                            <input
                              type="radio"
                              name={`rank-${q._id}-${ri}`}
                              disabled={!canSubmit}
                              onChange={() =>
                                setLocalAnswers((s) => ({
                                  ...s,
                                  [q._id]: {
                                    ...((s[q._id] as Record<number, number>) ||
                                      {}),
                                    [ri]: ci,
                                  },
                                }))
                              }
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-2">
                  <Button
                    onClick={() => {
                      const map =
                        (localAnswers[q._id] as Record<number, number>) || {};
                      const arr = q.rows.map((_, i) => map[i] ?? null);
                      onSubmit([{ questionId: q._id, value: arr }]);
                    }}
                    disabled={!canSubmit}
                  >
                    Submit
                  </Button>
                </div>
              </div>
            )}

            {/* RATING_SCALE */}
            {q.type === "RATING_SCALE" && (
              <div className="mt-2">
                <div className="text-xs text-gray-500 mb-1">
                  {q.lowLabel || q.scoreFrom} … {q.highLabel || q.scoreTo}
                </div>
                <div className="flex space-x-2">
                  {Array.from({ length: q.scoreTo - q.scoreFrom + 1 }).map(
                    (_, idx) => {
                      const val = q.scoreFrom + idx;
                      return (
                        <label
                          key={val}
                          className="relative inline-flex items-center justify-center rounded border px-3 py-1 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name={`rating-${q._id}`}
                            value={String(val)}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={() =>
                              setLocalAnswers((s) => ({ ...s, [q._id]: val }))
                            }
                            disabled={!canSubmit}
                          />
                          <span className="relative z-10 text-sm">{val}</span>
                        </label>
                      );
                    }
                  )}
                </div>
                <div className="mt-2">
                  <Button
                    onClick={() => {
                      const ratingValue = localAnswers[q._id] as
                        | number
                        | undefined;
                      if (ratingValue === undefined) {
                        toast.error("Please select a rating");
                        return;
                      }
                      onSubmit([
                        {
                          questionId: q._id,
                          value: ratingValue,
                        },
                      ]);
                    }}
                    disabled={!canSubmit}
                  >
                    Submit
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
