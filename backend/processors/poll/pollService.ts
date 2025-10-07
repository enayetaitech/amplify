import { Types } from "mongoose";
import { PollModel } from "../../model/PollModel";
import { PollRunModel } from "../../model/PollRun";
import PollResponse from "../../model/PollResponse";

/**
 * Launch a poll run for a given pollId and sessionId.
 */
export async function launchPoll(
  pollId: string,
  sessionId: string,
  settings?: {
    anonymous?: boolean;
    shareResults?: string;
    timeLimitSec?: number;
  }
) {
  const p = await PollModel.findById(pollId).lean();
  if (!p) throw new Error("Poll not found");

  // ensure no open run exists for this poll/session
  const existingOpen = await PollRunModel.findOne({
    pollId: p._id,
    sessionId: new Types.ObjectId(sessionId),
    status: "OPEN",
  });
  if (existingOpen) throw new Error("Poll already running in this session");

  // compute next runNumber
  const last = await PollRunModel.find({ pollId: p._id })
    .sort({ runNumber: -1 })
    .limit(1)
    .lean();
  const nextRun = (last && last.length ? last[0].runNumber : 0) + 1;

  const run = await PollRunModel.create({
    pollId: p._id,
    sessionId: new Types.ObjectId(sessionId),
    runNumber: nextRun,
    status: "OPEN",
    launchedAt: new Date(),
    anonymous: settings?.anonymous ?? (p as any).anonymous ?? false,
    shareResults:
      (settings?.shareResults as any) ?? (p as any).shareResults ?? "onStop",
    timeLimitSec: settings?.timeLimitSec,
  });

  return { poll: p, run };
}

export async function stopPoll(pollId: string, sessionId: string) {
  const run = await PollRunModel.findOneAndUpdate(
    {
      pollId: new Types.ObjectId(pollId),
      sessionId: new Types.ObjectId(sessionId),
      status: "OPEN",
    },
    { $set: { status: "CLOSED", closedAt: new Date() } },
    { new: true }
  ).lean();
  if (!run) throw new Error("No open run found for poll in this session");

  const aggregates = await aggregateResults(pollId, String(run._id));
  return { run, aggregates };
}

export async function submitResponse(
  pollId: string,
  runId: string,
  sessionId: string,
  responder: { userId?: string; name?: string; email?: string },
  answers: any[]
) {
  // ensure run is open
  const run = await PollRunModel.findById(runId).lean();
  if (!run || run.status !== "OPEN") throw new Error("Poll run is not open");
  if (String(run.sessionId) !== String(sessionId))
    throw new Error("Run not bound to this session");

  // enforce single submission if userId exists
  if (responder?.userId) {
    const exists = await PollResponse.exists({
      pollId: new Types.ObjectId(pollId),
      runId: new Types.ObjectId(runId),
      "responder.userId": new Types.ObjectId(responder.userId),
    });
    if (exists) throw new Error("Already submitted");
  }

  const doc = await PollResponse.create({
    pollId: new Types.ObjectId(pollId),
    runId: new Types.ObjectId(runId),
    sessionId: new Types.ObjectId(sessionId),
    responder: {
      userId: responder?.userId
        ? new Types.ObjectId(responder.userId)
        : undefined,
      name: responder?.name,
      email: responder?.email,
    },
    answers,
    submittedAt: new Date(),
  });

  const aggregates = await aggregateResults(pollId, runId);
  return { doc, aggregates };
}

export async function aggregateResults(pollId: string, runId: string) {
  const { ObjectId } = Types;
  const pipeline = [
    { $match: { pollId: new ObjectId(pollId), runId: new ObjectId(runId) } },
    { $unwind: "$answers" },
    {
      $group: {
        _id: { questionId: "$answers.questionId", value: "$answers.value" },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: "$_id.questionId",
        counts: { $push: { value: "$_id.value", count: "$count" } },
        total: { $sum: "$count" },
      },
    },
  ];

  const res = await PollResponse.aggregate(pipeline).allowDiskUse(true).exec();
  // map into friendly object
  const out: Record<
    string,
    { total: number; counts: { value: any; count: number }[] }
  > = {};
  for (const r of res) {
    out[String(r._id)] = { total: r.total || 0, counts: r.counts || [] };
  }
  return out;
}
