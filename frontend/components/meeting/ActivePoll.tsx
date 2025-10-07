"use client";

import React, { useEffect, useState } from "react";
import { Button } from "components/ui/button";
import useActivePoll from "hooks/useActivePoll";
import socketLib from "lib/socket";
import api from "lib/api";
import { toast } from "sonner";
import { IPoll, PollQuestion } from "@shared/interface/PollInterface";

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

  useEffect(() => {
    // connect socket
    socketLib.connectSocket({
      sessionId,
      role: (user?.role as string) || "Participant",
      name: user?.firstName || user?.name,
      email: user?.email,
    });

    const onStarted = () => refetch();
    const onStopped = () => refetch();
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

    return () => {
      socketLib.off("poll:started", onStarted);
      socketLib.off("poll:stopped", onStopped);
      socketLib.off("poll:submission:ack", onAck);
      socketLib.disconnectSocket();
    };
  }, [
    sessionId,
    user?.role,
    user?.firstName,
    user?.name,
    user?.email,
    refetch,
  ]);

  if (!data) return null;
  const { poll, run } = data as { poll?: IPoll; run?: PollRun };
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

      {/* TODO: render question components per type; for now show placeholder */}
      <div className="mt-4 space-y-3">
        {poll.questions.map((q: PollQuestion, idx: number) => (
          <div key={q._id} className="border p-3 rounded">
            <div className="font-medium">
              {idx + 1}. {q.prompt}
            </div>
            {/* Simple single-choice demo: render options as buttons */}
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
            {/* TODO handle other types (MULTIPLE_CHOICE, TEXT, RATING, MATCHING, RANK_ORDER, FILL_IN_BLANK) */}
          </div>
        ))}
      </div>
    </div>
  );
}
