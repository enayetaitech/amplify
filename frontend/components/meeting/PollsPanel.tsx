"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "lib/api";
import { Button } from "components/ui/button";
import { IPoll } from "@shared/interface/PollInterface";
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

function PollResultsWrapper({
  pollId,
  runId,
  questions,
}: {
  pollId: string;
  runId: string | null;
  questions: { _id: string; prompt?: string }[];
}) {
  const q = usePollResults(pollId, runId);
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
          <PollResults aggregate={mapping ? mapping[quest._id] : undefined} />
        </div>
      ))}
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
    onSuccess: () => {
      toast.success("Poll stopped");
      qc.invalidateQueries({ queryKey: ["active-poll", sessionId] });
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "Stop failed";
      toast.error(msg);
    },
  });

  const [openLaunch, setOpenLaunch] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<string | null>(null);
  const [anon, setAnon] = useState(false);
  const [share, setShare] = useState<"never" | "onStop" | "immediate">(
    "onStop"
  );
  const [activeRunInfo, setActiveRunInfo] = useState<{
    pollId: string;
    runId: string;
  } | null>(null);
  const [openResults, setOpenResults] = useState<Record<string, boolean>>({});

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
          const pp = p as { poll?: { _id?: string }; run?: { _id?: string } };
          if (pp.run && pp.poll) {
            setActiveRunInfo({
              pollId: String(pp.poll._id),
              runId: String(pp.run._id),
            });
          }
        }
      };
      const onStopped = () => setActiveRunInfo(null);
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
        settings: { anonymous: anon, shareResults: share },
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
            <Button onClick={() => setOpenLaunch(true)}>Launch Poll</Button>
          </DialogTrigger>
          <DialogContent>
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

              <label className="block">
                <div className="text-sm">Share results</div>
                <Select
                  onValueChange={(v: string) =>
                    setShare(v as "never" | "onStop" | "immediate")
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never</SelectItem>
                    <SelectItem value="onStop">On Stop</SelectItem>
                    <SelectItem value="immediate">Immediate</SelectItem>
                  </SelectContent>
                </Select>
              </label>

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
          const runId = isActive ? activeRunInfo?.runId ?? null : null;
          return (
            <div key={p._id} className="border p-2 rounded">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium">{p.title}</div>
                  <div className="text-sm text-gray-500">
                    {isActive ? `Active run ${runId}` : null}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setSelectedPoll(p._id);
                      setOpenLaunch(true);
                    }}
                    disabled={!!activeRunInfo}
                  >
                    Launch
                  </Button>
                  <Button onClick={() => stopMutation.mutate(p._id)}>
                    Stop
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      setOpenResults((s) => ({ ...s, [p._id]: !s[p._id] }))
                    }
                    disabled={!isActive && !openResults[p._id]}
                  >
                    {openResults[p._id] ? "Hide results" : "View results"}
                  </Button>
                </div>
              </div>

              {openResults[p._id] && (
                <div className="mt-3">
                  <PollResultsWrapper
                    pollId={p._id}
                    runId={runId}
                    questions={p.questions.map((q) => ({
                      _id: q._id,
                      prompt: q.prompt,
                    }))}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
