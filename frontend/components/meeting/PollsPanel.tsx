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

  const onLaunch = () => {
    if (!selectedPoll) return toast.error("Select a poll");
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
        {(polls || []).map((p: IPoll) => (
          <div
            key={p._id}
            className="flex items-center justify-between border p-2 rounded"
          >
            <div>{p.title}</div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setSelectedPoll(p._id);
                  setOpenLaunch(true);
                }}
              >
                Launch
              </Button>
              <Button onClick={() => stopMutation.mutate(p._id)}>Stop</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
