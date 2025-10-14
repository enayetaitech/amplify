"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "lib/api";
import { Button } from "components/ui/button";
import { IPoll, PollQuestion } from "@shared/interface/PollInterface";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";
import { toast } from "sonner";
import PollResults from "./PollResults";
import usePollResults from "hooks/usePollResults";
import usePollRuns from "hooks/usePollRuns";
import usePollResponses from "hooks/usePollResponses";

function PollResultsWrapper({
  pollId,
  runId,
  questions,
}: {
  pollId: string;
  runId: string | null;
  questions: PollQuestion[];
}) {
  const sessionIdFromWindow =
    typeof window !== "undefined"
      ? (window as unknown as { currentMeetingSessionId?: string })
          .currentMeetingSessionId
      : undefined;
  const q = usePollResults(pollId, runId, sessionIdFromWindow);
  if (!runId) return <div className="text-sm text-gray-500">No active run</div>;
  if (q.isLoading)
    return <div className="text-sm text-gray-500">Loading results…</div>;

  const mapping = q.data as
    | Record<
        string,
        { total: number; counts: { value: unknown; count: number }[] }
      >
    | undefined;

  return (
    <div className="space-y-4">
      {questions.map((quest) => (
        <div key={quest._id} className="border p-2 rounded">
          <div className="font-medium mb-2">{quest.prompt}</div>
          <PollResults
            aggregate={mapping ? mapping[quest._id] : undefined}
            question={quest as PollQuestion}
          />
        </div>
      ))}
      {/* Host-only: respondents list (if not anonymous) */}
      {/* This is a lightweight preview: first 10 responses */}
      {/* For a full list UI, we could expand to a modal later */}
    </div>
  );
}

function RunSelector({
  pollId,
  currentRunId,
  onChange,
  sessionId,
}: {
  pollId: string;
  currentRunId: string | null;
  onChange: (runId: string | null) => void;
  sessionId: string;
}) {
  const { data } = usePollRuns(pollId, sessionId);
  const runs = data || [];
  return (
    <div className="flex items-center gap-2">
      <select
        className="w-40 border rounded px-2 py-1 text-sm"
        value={currentRunId || ""}
        onChange={(e) => onChange(e.target.value || null)}
      >
        <option value="">Select run</option>
        {runs.map((r) => (
          <option
            key={r._id}
            value={r._id}
          >{`#${r.runNumber} (${r.status})`}</option>
        ))}
      </select>
    </div>
  );
}

export default function PollsPanel({
  projectId,
  sessionId,
}: {
  projectId: string;
  sessionId: string;
}) {
  const qc = useQueryClient();
  const { data: polls } = useQuery<IPoll[]>({
    queryKey: ["polls", projectId],
    queryFn: async () => {
      const r = await api.get(`/api/v1/polls/project/${projectId}`);
      return r.data.data as IPoll[];
    },
    enabled: !!projectId,
  });

  const launchMutation = useMutation({
    mutationFn: (vars: { pollId: string; payload: unknown }) =>
      api
        .post(`/api/v1/polls/${vars.pollId}/launch`, vars.payload)
        .then((r) => r.data),
    onSuccess: () => {
      toast.success("Poll launched");
      qc.invalidateQueries({ queryKey: ["active-poll", sessionId] });
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "Launch failed";
      toast.error(msg);
    },
  });

  const stopMutation = useMutation({
    mutationFn: (pollId: string) =>
      api
        .post(`/api/v1/polls/${pollId}/stop`, { sessionId })
        .then((r) => r.data),
    onSuccess: (_data, pollId) => {
      toast.success("Poll stopped");
      qc.invalidateQueries({ queryKey: ["active-poll", sessionId] });
      try {
        // invalidate runs for this poll so RunSelector refreshes immediately
        qc.invalidateQueries({ queryKey: ["poll-runs", pollId, sessionId] });
      } catch {}
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "Stop failed";
      toast.error(msg);
    },
  });

  const shareMutation = useMutation({
    mutationFn: (vars: { pollId: string; runId: string }) =>
      api
        .post(`/api/v1/polls/${vars.pollId}/share`, {
          sessionId,
          runId: vars.runId,
        })
        .then((r) => r.data),
    onSuccess: () => {
      toast.success("Results shared");
      qc.invalidateQueries({ queryKey: ["active-poll", sessionId] });
      qc.invalidateQueries({ queryKey: ["poll-runs"] });
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "Share failed";
      toast.error(msg);
    },
  });

  const [openLaunch, setOpenLaunch] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<string | null>(null);
  const [anon, setAnon] = useState(false);
  const [shareConfirm, setShareConfirm] = useState<{
    open: boolean;
    pollId?: string | null;
    runId?: string | null;
  }>({ open: false, pollId: null, runId: null });
  const [activeRunInfo, setActiveRunInfo] = useState<{
    pollId: string;
    runId: string;
  } | null>(null);
  const [openResults, setOpenResults] = useState<Record<string, boolean>>({});
  // track latest runId per poll, even after stop
  const [latestRunByPoll, setLatestRunByPoll] = useState<
    Record<string, string>
  >({});
  const [openRespondents, setOpenRespondents] = useState<
    Record<string, boolean>
  >({});

  // fetch current active poll for session
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await api.get(
          `/api/v1/liveSessions/${sessionId}/active-poll`
        );
        const d = r.data?.data;
        if (mounted && d?.poll && d?.run)
          setActiveRunInfo({ pollId: d.poll._id, runId: d.run._id });
      } catch {
        if (mounted) setActiveRunInfo(null);
      }
    })();
    const socket = (window as unknown as { __meetingSocket?: unknown })
      .__meetingSocket;
    if (socket && typeof socket === "object") {
      const onStarted = (p: unknown) => {
        if (typeof p === "object" && p !== null) {
          const pp = p as {
            poll?: { _id?: string } | undefined;
            run?: { _id?: string } | undefined;
          };
          if (
            pp &&
            typeof pp === "object" &&
            (pp as { poll?: unknown }).poll &&
            (pp as { run?: unknown }).run &&
            (pp as { poll: { _id?: unknown } }).poll._id &&
            (pp as { run: { _id?: unknown } }).run._id
          ) {
            const pollId = String((pp.poll as { _id?: string })._id as string);
            const runId = String((pp.run as { _id?: string })._id as string);
            setActiveRunInfo({ pollId, runId });
            setLatestRunByPoll((s) => ({ ...s, [pollId]: runId }));
          }
        }
      };
      const onStopped = (p: unknown) => {
        setActiveRunInfo(null);
        if (typeof p === "object" && p !== null) {
          const pp = p as { pollId?: string; runId?: string };
          if (pp.pollId && pp.runId) {
            setLatestRunByPoll((s) => ({
              ...s,
              [pp.pollId as string]: String(pp.runId),
            }));
          }
        }
      };
      try {
        (
          socket as {
            on?:
              | ((ev: string, cb: (...args: unknown[]) => void) => void)
              | undefined;
          }
        ).on?.("poll:started", onStarted);
        (
          socket as {
            on?:
              | ((ev: string, cb: (...args: unknown[]) => void) => void)
              | undefined;
          }
        ).on?.("poll:stopped", onStopped);
      } catch {}
      return () => {
        mounted = false;
        try {
          (
            socket as {
              off?:
                | ((ev: string, cb: (...args: unknown[]) => void) => void)
                | undefined;
            }
          ).off?.("poll:started", onStarted);
          (
            socket as {
              off?:
                | ((ev: string, cb: (...args: unknown[]) => void) => void)
                | undefined;
            }
          ).off?.("poll:stopped", onStopped);
        } catch {}
      };
    }
    return () => {
      mounted = false;
    };
  }, [sessionId]);

  const onLaunch = () => {
    if (!selectedPoll) return toast.error("Select a poll");
    if (activeRunInfo) return toast.error("Another poll run is already active");
    launchMutation.mutate({
      pollId: selectedPoll,
      payload: {
        sessionId,
        settings: { anonymous: anon },
      },
    });
    setOpenLaunch(false);
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-semibold">Polls</h4>
        <Dialog open={openLaunch} onOpenChange={setOpenLaunch}>
          <DialogTrigger asChild>
            <Button
              className="py-0.5 px-3 text-xs bg-custom-dark-blue-1 text-white hover:bg-custom-dark-blue-2 hover:text-white"
              onClick={() => setOpenLaunch(true)}
            >
              Launch Poll
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Launch Poll</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <label className="block">
                <div className="text-sm">Select Poll</div>
                <Select onValueChange={(v: string) => setSelectedPoll(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(polls || []).map((p: IPoll) => (
                      <SelectItem key={p._id} value={p._id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <label className="block">
                <div className="text-sm">Anonymous</div>
                <input
                  type="checkbox"
                  checked={anon}
                  onChange={(e) => setAnon(e.target.checked)}
                />
              </label>

              {/* Share results option removed at launch by design */}

              <div className="flex justify-end gap-2">
                <Button onClick={onLaunch}>Launch</Button>
                <Button variant="ghost" onClick={() => setOpenLaunch(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {(polls || []).map((p: IPoll) => {
          const isActive = activeRunInfo?.pollId === p._id;
          const runId = isActive
            ? activeRunInfo?.runId ?? null
            : latestRunByPoll[p._id] ?? null;
          return (
            <div key={p._id} className="border p-3 rounded">
              <div className="flex flex-col gap-2">
                {/* Title + status */}
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0 font-medium text-sm truncate">
                    {p.title}
                  </div>
                  <div className="mr-2">
                    {isActive ? (
                      <span className="inline-block rounded px-2 py-1 text-white text-xs bg-custom-dark-blue-1">
                        Active
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500">Closed</span>
                    )}
                  </div>
                  <div>
                    <Button
                      className="bg-custom-dark-blue-1 text-white disabled:opacity-50 disabled:cursor-not-allowed py-0.5 px-3 text-xs"
                      onClick={() => stopMutation.mutate(p._id)}
                      disabled={!isActive}
                    >
                      Stop
                    </Button>
                  </div>
                </div>

                {/* Stop button (new line) */}

                {/* Run selector (next line) */}
                <div className="flex items-center gap-2">
                  <div className="text-sm text-gray-700 mb-1">Run</div>
                  <RunSelector
                    pollId={p._id}
                    currentRunId={runId}
                    sessionId={sessionId}
                    onChange={(rid) =>
                      setLatestRunByPoll((s) => ({ ...s, [p._id]: rid || "" }))
                    }
                  />
                </div>

                {/* View results + show/hide respondents (next line) */}
                <div className="flex items-center gap-2">
                  <Button
                    className="border border-custom-dark-blue-1 text-custom-dark-blue-1 bg-white hover:bg-custom-dark-blue-1 hover:text-white py-0.5 px-3 text-xs"
                    onClick={() =>
                      setOpenResults((s) => ({ ...s, [p._id]: !s[p._id] }))
                    }
                    disabled={!runId && !openResults[p._id]}
                  >
                    {openResults[p._id] ? "Hide results" : "View results"}
                  </Button>
                  {/* Share results (next line) */}
                  {!isActive && runId && (
                    <Button
                      className="border border-custom-dark-blue-1 text-custom-dark-blue-1 bg-white hover:bg-custom-dark-blue-1 hover:text-white py-0.5 px-3 text-xs"
                      onClick={() =>
                        setShareConfirm({ open: true, pollId: p._id, runId })
                      }
                      disabled={shareMutation.status === "pending"}
                    >
                      Share results
                    </Button>
                  )}
                </div>
                <Button
                  variant="ghost"
                  onClick={() =>
                    setOpenRespondents((s) => ({ ...s, [p._id]: !s[p._id] }))
                  }
                  className="py-0.5 px-3 text-xs"
                  disabled={!runId && !openRespondents[p._id]}
                >
                  {openRespondents[p._id]
                    ? "Hide respondents"
                    : "Show respondents"}
                </Button>

                <div></div>
              </div>

              {/* collapsible results / respondents previews */}
              {openResults[p._id] && (
                <div className="mt-3">
                  <PollResultsWrapper
                    pollId={p._id}
                    runId={runId}
                    questions={p.questions || []}
                  />
                </div>
              )}
              {openRespondents[p._id] && (
                <div className="mt-3">
                  <RespondentsWrapper
                    pollId={p._id}
                    runId={runId}
                    sessionId={sessionId}
                    questions={p.questions || []}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Share confirmation modal */}
      {shareConfirm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-30" />
          <div className="relative bg-white rounded p-4 z-10 shadow max-w-md w-full">
            <div className="font-semibold mb-2">Share results</div>
            <div className="mb-4 text-sm">
              Are you sure you want to share the poll results to participants?
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-3 py-1 rounded border"
                onClick={() =>
                  setShareConfirm({ open: false, pollId: null, runId: null })
                }
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-3 py-1 rounded bg-custom-dark-blue-1 text-white"
                onClick={() => {
                  if (shareConfirm.pollId && shareConfirm.runId)
                    shareMutation.mutate({
                      pollId: shareConfirm.pollId,
                      runId: shareConfirm.runId,
                    });
                  setShareConfirm({ open: false, pollId: null, runId: null });
                }}
              >
                Share
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RespondentsWrapper({
  pollId,
  runId,
  sessionId,
  questions,
}: {
  pollId: string;
  runId: string | null;
  sessionId: string;
  questions: PollQuestion[];
}) {
  const q = usePollResponses(pollId, runId, sessionId);
  if (!runId)
    return <div className="text-sm text-gray-500">No run selected</div>;
  if (q.isLoading)
    return <div className="text-sm text-gray-500">Loading respondents…</div>;
  const data = q.data as
    | {
        run?: { anonymous?: boolean };
        responses?: {
          responder?: { name?: string; email?: string };
          answers: { questionId: string; value?: unknown }[];
          submittedAt: string;
        }[];
      }
    | undefined;
  const anonym =
    !!data?.run && (data!.run as { anonymous?: boolean }).anonymous === true;
  const responses = (data?.responses || []).slice(0, 20);
  const qById = new Map(questions.map((q) => [q._id, q]));
  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-600">
        {anonym
          ? "Anonymous run – identities hidden"
          : "Respondents (first 20)"}
      </div>
      <div className="border rounded divide-y">
        {responses.map((r, idx) => (
          <div key={idx} className="p-2">
            {!anonym && (
              <div className="text-sm font-medium">
                {r.responder?.name || "Unnamed"}
              </div>
            )}
            <div className="text-xs text-gray-600 mt-1 min-w-0">
              {questions.map((qdef) => {
                const ans = r.answers.find((a) => a.questionId === qdef._id);
                const v = ans?.value as unknown;
                const def = qById.get(qdef._id);
                let label = "";

                if (def) {
                  // SINGLE_CHOICE: show option text + correctness
                  if (def.type === "SINGLE_CHOICE") {
                    const chosen = typeof v === "number" ? (v as number) : null;
                    const correct = (
                      def as Extract<PollQuestion, { type: "SINGLE_CHOICE" }>
                    ).correctAnswer;
                    const text =
                      chosen !== null
                        ? def.answers?.[chosen] ?? String(chosen)
                        : "—";
                    if (chosen === null) label = "—";
                    else if (correct !== undefined)
                      label = `${text} — ${
                        chosen === correct ? "Correct" : "Wrong"
                      }`;
                    else label = text;

                    // MULTIPLE_CHOICE: show chosen options and correctness
                  } else if (def.type === "MULTIPLE_CHOICE") {
                    const chosen = Array.isArray(v) ? (v as number[]) : [];
                    const chosenText = chosen
                      .map((i) => def.answers?.[i] ?? String(i))
                      .join(", ");
                    const correctArr =
                      (
                        def as Extract<
                          PollQuestion,
                          { type: "MULTIPLE_CHOICE" }
                        >
                      ).correctAnswers || [];
                    const setA = new Set(chosen);
                    const setB = new Set(correctArr);
                    const eq =
                      setA.size === setB.size &&
                      [...setA].every((x) => setB.has(x));
                    if (chosen.length === 0) label = "—";
                    else if (correctArr.length)
                      label = `${chosenText} — ${eq ? "Correct" : "Wrong"}`;
                    else label = chosenText;

                    // MATCHING: value is array of pairs
                  } else if (def.type === "MATCHING") {
                    if (Array.isArray(v)) {
                      const pairs = v as Array<[number, number]>;
                      const txt = pairs
                        .map(
                          (p) =>
                            `${def.options?.[p[0]] ?? p[0]} → ${
                              def.answers?.[p[1]] ?? p[1]
                            }`
                        )
                        .join(", ");
                      const ok = pairs.every((p) => p[1] === p[0]);
                      label =
                        pairs.length === 0
                          ? "—"
                          : `${txt} — ${ok ? "Correct" : "Wrong"}`;
                    } else label = String(v ?? "");

                    // FILL_IN_BLANK: value is array of strings
                  } else if (def.type === "FILL_IN_BLANK") {
                    if (Array.isArray(v)) {
                      const vals = v as string[];
                      const txt = vals.join(", ");
                      const expected = def.answers || [];
                      const ok =
                        expected.length === vals.length &&
                        vals.every(
                          (vv, idx) =>
                            (vv ?? "").trim().toLowerCase() ===
                            (expected[idx] ?? "").trim().toLowerCase()
                        );
                      label = `${txt} — ${ok ? "Correct" : "Wrong"}`;
                    } else label = String(v ?? "");

                    // RANK_ORDER: value is array of indices
                  } else if (def.type === "RANK_ORDER") {
                    if (Array.isArray(v)) {
                      const arr = v as number[];
                      const txt = arr
                        .map((idx) => def.columns?.[idx] ?? String(idx))
                        .join(", ");
                      const ok = arr.every((val, idx) => val === idx);
                      label =
                        arr.length === 0
                          ? "—"
                          : `${txt} — ${ok ? "Correct" : "Wrong"}`;
                    } else label = String(v ?? "");

                    // RATING_SCALE or others: show value
                  } else if (def.type === "RATING_SCALE") {
                    label = String(v ?? "");
                  } else {
                    // fallback: stringify
                    if (Array.isArray(v)) label = JSON.stringify(v);
                    else if (typeof v === "object" && v !== null)
                      label = JSON.stringify(v as object);
                    else if (v === undefined || v === null) label = "";
                    else label = String(v);
                  }
                } else {
                  // no question def found
                  if (Array.isArray(v)) label = JSON.stringify(v);
                  else if (typeof v === "object" && v !== null)
                    label = JSON.stringify(v as object);
                  else if (v === undefined || v === null) label = "";
                  else label = String(v);
                }

                return (
                  <div key={qdef._id} className="truncate">
                    <span className="font-semibold">{qdef.prompt}:</span>{" "}
                    {label || "—"}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
