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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultsMapping, setResultsMapping] = useState<Record<
    string,
    { total: number; counts: { value: unknown; count: number }[] }
  > | null>(null);
  const [sharedPoll, setSharedPoll] = useState<IPoll | null>(null);
  const [textErrors, setTextErrors] = useState<Record<string, string>>({});

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
      try {
        toast.success("Poll launched");
      } catch {}
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
        const currentPollId = (data as { poll?: IPoll })?.poll?._id;
        if (currentPollId && pl.pollId !== currentPollId) return;
        if (!pl.aggregates) return;
        const aggregates = pl.aggregates as Record<
          string,
          { total: number; counts: { value: unknown; count: number }[] }
        >;
        setResultsMapping(aggregates);

        // If the participant currently has no active poll mounted (run closed),
        // fetch the poll definition so we can render aggregate results UI.
        if (!currentPollId) {
          (async () => {
            try {
              const r = await api.get(`/api/v1/polls/${pl.pollId}`);
              const pollDoc = r?.data?.data as IPoll | undefined | null;
              if (pollDoc) setSharedPoll(pollDoc);
            } catch {}
          })();
        }
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

  // allow rendering when resultsMapping is present even if there's no active run
  if (!data && !resultsMapping) return null;
  const poll = (data as { poll?: IPoll })?.poll as IPoll | undefined;
  const run = (data as { run?: PollRun })?.run as PollRun | undefined;
  // prefer active poll, otherwise use sharedPoll fetched after share
  const pollToRender = poll ?? sharedPoll ?? undefined;
  if (!pollToRender && !resultsMapping) return null;

  const canSubmit = run ? !submittedRunIds[String(run._id)] : false;

  const onSubmit = async (answers: Answer[]) => {
    try {
      if (!run || !poll) {
        toast.error("No active run to submit to");
        return;
      }
      if (isSubmitting) return;
      setIsSubmitting(true);
      // capture participant identity from either authenticated user or local storage fallback
      let localName: string | undefined;
      let localEmail: string | undefined;
      try {
        const raw =
          typeof window !== "undefined"
            ? window.localStorage.getItem("liveSessionUser")
            : null;
        if (raw) {
          const obj = JSON.parse(raw || "{}");
          if (obj && typeof obj === "object") {
            localName = (obj as { name?: string }).name;
            localEmail = (obj as { email?: string }).email as
              | string
              | undefined;
          }
        }
      } catch {}
      const maybeResponder = {
        name: (user?.firstName || user?.name || localName) as
          | string
          | undefined,
        email: ((user?.email as string | undefined) || localEmail) as
          | string
          | undefined,
      };

      await api.post(`/api/v1/polls/${(poll as IPoll)._id}/respond`, {
        sessionId,
        runId: run._id,
        answers,
        responder: maybeResponder,
      });
      toast.success("Response recorded");
      setSubmittedRunIds((s) => ({ ...s, [run._id]: true }));
      // Clear local inputs and any text errors after successful submission
      setLocalAnswers({});
      setTextErrors({});
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Submit failed";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const titleText = pollToRender?.title || "Poll results";
  const runLabel = run ? `Run #${run.runNumber}` : null;

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="font-semibold text-lg">{titleText}</h3>
      {runLabel && <p className="text-sm text-gray-500">{runLabel}</p>}

      {/* Participant-shared results (shown when server emits poll:results) */}
      {resultsMapping && (
        <div className="mt-4 mb-4 border rounded p-3 bg-gray-50">
          {(pollToRender?.questions || []).map((q: PollQuestion) => (
            <div key={q._id} className="mb-4">
              <div className="font-medium mb-2">{q.prompt}</div>
              <PollResults aggregate={resultsMapping[q._id]} question={q} />
            </div>
          ))}
        </div>
      )}

      {/* Render question components per type with a single Submit All at bottom */}
      {/* Only render input controls when there is an active run to submit to */}
      {poll && run ? (
        <div className="mt-4 space-y-3">
          {poll.questions.map((q: PollQuestion, idx: number) => (
            <div key={q._id} className="border p-3 rounded">
              <div className="font-medium flex items-center gap-2">
                <div>
                  {idx + 1}. {q.prompt}
                </div>
                {(q as unknown as { required?: boolean }).required ? (
                  <div className="text-xs text-red-600 font-semibold">*</div>
                ) : null}
              </div>
              {/* SINGLE_CHOICE */}
              {q.type === "SINGLE_CHOICE" && (
                <div className="mt-2 space-y-2">
                  {q.answers.map((a: string, i: number) => (
                    <label key={i} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`single-${q._id}`}
                        disabled={!canSubmit}
                        onChange={() =>
                          setLocalAnswers((s) => ({ ...s, [q._id]: i }))
                        }
                        checked={Number(localAnswers[q._id]) === i}
                      />
                      <span>{a}</span>
                    </label>
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
                  {(() => {
                    const val = (
                      (localAnswers[q._id] as string) || ""
                    ).toString();
                    const min =
                      (q as unknown as { minChars?: number }).minChars ?? 0;
                    const max =
                      (q as unknown as { maxChars?: number }).maxChars ??
                      (q.type === "SHORT_ANSWER" ? 200 : 2000);
                    const len = val.trim().length;
                    return (
                      <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                        <span>
                          {min > 0 ? `Min ${min}` : null}
                          {min > 0 && Number.isFinite(max) ? " · " : null}
                          {Number.isFinite(max) ? `Max ${max}` : null}
                        </span>
                        <span>
                          {len}/
                          {Number.isFinite(max)
                            ? max
                            : q.type === "SHORT_ANSWER"
                            ? 200
                            : 2000}
                        </span>
                      </div>
                    );
                  })()}
                  {textErrors[q._id] ? (
                    <div className="text-xs text-rose-600 mt-1">
                      {textErrors[q._id]}
                    </div>
                  ) : null}
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
                                      ...((s[q._id] as Record<
                                        number,
                                        number
                                      >) || {}),
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
                </div>
              )}

              {/* RATING_SCALE */}
              {q.type === "RATING_SCALE" && (
                <div className="mt-2">
                  <div className="text-xs text-gray-500 mb-1">
                    {q.lowLabel || q.scoreFrom} … {q.highLabel || q.scoreTo}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Array.from({ length: q.scoreTo - q.scoreFrom + 1 }).map(
                      (_, idx) => {
                        const val = q.scoreFrom + idx;
                        const selected = Number(localAnswers[q._id]) === val;
                        return (
                          <label
                            key={val}
                            className={`relative inline-flex items-center justify-center rounded border px-2 py-0.5 cursor-pointer ${
                              selected
                                ? "bg-custom-dark-blue-1 text-white border-custom-dark-blue-1"
                                : "bg-white text-gray-700"
                            }`}
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
                              checked={selected}
                            />
                            <span className="relative z-10 text-sm">{val}</span>
                          </label>
                        );
                      }
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          {/* Submit all answers */}
          <div className="pt-2">
            <Button
              onClick={() => {
                if (!canSubmit) return;
                const answers: Answer[] = [];
                for (const q of poll.questions as PollQuestion[]) {
                  const v = (localAnswers as Record<string, unknown>)[q._id];
                  if (q.type === "SINGLE_CHOICE") {
                    if (typeof v === "number")
                      answers.push({ questionId: q._id, value: v });
                  } else if (q.type === "MULTIPLE_CHOICE") {
                    if (Array.isArray(v) && (v as unknown[]).length > 0)
                      answers.push({ questionId: q._id, value: v as number[] });
                  } else if (
                    q.type === "SHORT_ANSWER" ||
                    q.type === "LONG_ANSWER"
                  ) {
                    const txt = typeof v === "string" ? v : "";
                    const min =
                      (q as unknown as { minChars?: number }).minChars ?? 0;
                    const max =
                      (q as unknown as { maxChars?: number }).maxChars ??
                      Infinity;
                    const len = txt.trim().length;
                    if (len === 0) {
                      // handled by required check later; don't add empty
                    } else if (len < min) {
                      setTextErrors((s) => ({
                        ...s,
                        [q._id]: `Minimum ${min} characters required`,
                      }));
                      toast.error(
                        `Minimum ${min} characters required for: ${q.prompt}`
                      );
                      return;
                    } else if (len > max) {
                      setTextErrors((s) => ({
                        ...s,
                        [q._id]: `Maximum ${max} characters allowed`,
                      }));
                      toast.error(
                        `Maximum ${max} characters allowed for: ${q.prompt}`
                      );
                      return;
                    } else {
                      setTextErrors((s) => ({ ...s, [q._id]: "" }));
                      answers.push({ questionId: q._id, value: txt });
                    }
                  } else if (q.type === "FILL_IN_BLANK") {
                    if (
                      Array.isArray(v) &&
                      (v as unknown[]).some(
                        (s) =>
                          typeof s === "string" &&
                          (s as string).trim().length > 0
                      )
                    )
                      answers.push({ questionId: q._id, value: v as string[] });
                  } else if (q.type === "MATCHING") {
                    const map = (v as Record<number, number>) || {};
                    const pairs: Array<[number, number]> = Object.keys(map).map(
                      (k) => [Number(k), map[Number(k)]]
                    );
                    if (pairs.length > 0)
                      answers.push({ questionId: q._id, value: pairs });
                  } else if (q.type === "RANK_ORDER") {
                    const map = (v as Record<number, number>) || {};
                    const arr = q.rows.map((_, i) => map[i] ?? null);
                    if (arr.some((x) => x !== null))
                      answers.push({
                        questionId: q._id,
                        value: arr as unknown as number[],
                      });
                  } else if (q.type === "RATING_SCALE") {
                    if (typeof v === "number")
                      answers.push({ questionId: q._id, value: v });
                  }
                }
                // enforce required questions
                for (const qq of poll.questions as PollQuestion[]) {
                  // interpret 'required' flag if present on question
                  const isRequired =
                    (qq as unknown as { required?: boolean }).required === true;
                  if (isRequired) {
                    const v = (localAnswers as Record<string, unknown>)[qq._id];
                    const hasAnswer =
                      v !== undefined &&
                      v !== null &&
                      (!Array.isArray(v) || (v as unknown[]).length > 0) &&
                      !(typeof v === "string" && String(v).trim() === "");
                    if (!hasAnswer) {
                      toast.error(`Question ${qq.prompt} is required`);
                      return;
                    }
                    // additionally enforce min/max for required text answers
                    if (
                      (qq.type === "SHORT_ANSWER" ||
                        qq.type === "LONG_ANSWER") &&
                      typeof v === "string"
                    ) {
                      const min =
                        (qq as unknown as { minChars?: number }).minChars ?? 0;
                      const max =
                        (qq as unknown as { maxChars?: number }).maxChars ??
                        Infinity;
                      const len = v.trim().length;
                      if (len < min) {
                        setTextErrors((s) => ({
                          ...s,
                          [qq._id]: `Minimum ${min} characters required`,
                        }));
                        toast.error(
                          `Minimum ${min} characters required for: ${qq.prompt}`
                        );
                        return;
                      }
                      if (len > max) {
                        setTextErrors((s) => ({
                          ...s,
                          [qq._id]: `Maximum ${max} characters allowed`,
                        }));
                        toast.error(
                          `Maximum ${max} characters allowed for: ${qq.prompt}`
                        );
                        return;
                      }
                    }
                  }
                }

                if (answers.length === 0) {
                  toast.error("Please answer at least one question");
                  return;
                }
                onSubmit(answers);
              }}
              disabled={!canSubmit || isSubmitting}
              className="py-0.5 px-3 text-xs bg-custom-dark-blue-1 text-white hover:bg-custom-dark-blue-2 hover:text-white"
            >
              Submit All
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
