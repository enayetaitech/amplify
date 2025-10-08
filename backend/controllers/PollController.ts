import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { PollModel } from "../model/PollModel";
import ErrorHandler from "../utils/ErrorHandler";
import { sendResponse } from "../utils/responseHelpers";
import { validateQuestion } from "../processors/poll/QuestionValidationProcessor";
import { uploadToS3 } from "../utils/uploadToS3";
import * as pollService from "../processors/poll/pollService";
import { emitToRoom } from "../socket/bus";
import { PollRunModel } from "../model/PollRun";
import { zLaunchPayload, zStopPayload, zRespondPayload } from "../schemas/poll";

/* ───────────────────────────────────────────────────────────── */
/*  Controller – Create Poll                                    */
/* ───────────────────────────────────────────────────────────── */
export const createPoll = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { projectId, sessionId, title, questions, createdBy, createdByRole } =
    req.body;

  /* 1. Basic payload validation ------------------------------------ */
  if (!projectId || !title || !createdBy || !createdByRole) {
    return next(
      new ErrorHandler(
        "projectId,  title, createdBy, createdByRole are required",
        400
      )
    );
  }

  if (!["Admin", "Moderator"].includes(createdByRole)) {
    return next(
      new ErrorHandler("Only Admin or Moderator can create polls", 403)
    );
  }
  // ── 2) Parse questions JSON ───────────────────────────────────────
  let questionsPayload: any[] = req.body.questions;
  if (typeof questionsPayload === "string") {
    try {
      questionsPayload = JSON.parse(questionsPayload);
    } catch {
      return next(new ErrorHandler("Invalid questions JSON", 400));
    }
  }

  if (!Array.isArray(questionsPayload) || questionsPayload.length === 0) {
    return next(new ErrorHandler("questions array is required", 400));
  }

  // ── 3) Upload images to S3 & stitch into questions ───────────────
  //    Expect front-end to send each File under field "images" and
  //    each question to have a tempImageName === file.originalname
  const files = (req.files as Express.Multer.File[]) || [];
  for (const file of files) {
    let result;
    try {
      result = await uploadToS3(file.buffer, file.mimetype, file.originalname);
    } catch (err) {
      return next(
        new ErrorHandler(`Failed to upload image ${file.originalname}`, 500)
      );
    }
    // find the matching question by your tempImageName
    const q = questionsPayload.find(
      (q) => q.tempImageName === file.originalname
    );
    if (q) {
      q.image = result.url;
      // optionally store the S3 key if you need it:
      // q.imageKey = result.key;
      delete q.tempImageName;
    }
  }

  // ── 4) Per-question validation ────────────────────────────────────
  for (let i = 0; i < questionsPayload.length; i++) {
    if (validateQuestion(questionsPayload[i], i, next)) {
      return; // stops on first error
    }
  }
  /* 3. Create poll -------------------------------------------------- */

  const poll = await PollModel.create({
    projectId,
    // sessionId,
    title: title.trim(),
    questions: questionsPayload,
    createdBy,
    createdByRole,
  });

  sendResponse(res, poll, "Poll created", 201);
};

/**
 * GET /api/v1/polls/project/:projectId
 * Query params: ?page=1&limit=10
 */
export const getPollsByProjectId = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { projectId } = req.params;

  // 2️⃣ Pagination params
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.max(Number(req.query.limit) || 10, 1);
  const skip = (page - 1) * limit;

  // 3️⃣ Fetch slice + count
  const [polls, total] = await Promise.all([
    PollModel.find({ projectId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "firstName lastName")
      .lean(),
    PollModel.countDocuments({ projectId }),
  ]);

  // 4️⃣ Build meta
  const totalPages = Math.ceil(total / limit);
  const meta = {
    page,
    limit,
    totalItems: total,
    totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
  };

  sendResponse(res, polls, "Polls fetched", 200, meta);
};

/**
 * GET /api/v1/polls/:id
 * Fetch a single poll by its ID.
 */
export const getPollById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;

  // 1️⃣  Lookup
  const poll = await PollModel.findById(id);
  if (!poll) {
    return next(new ErrorHandler("Poll not found", 404));
  }

  // 2️⃣ Return it
  sendResponse(res, poll, "Poll fetched", 200);
};

/**
 * PATCH /api/v1/polls/:id
 * Body may include any of: title, questions (full array), isRun
 */
export const updatePoll = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;

  // Build updatable fields
  const updates: any = { lastModified: new Date() };
  // parse + validate title / isRun as before…
  if (req.body.title) updates.title = req.body.title.trim();
  if (req.body.isRun !== undefined) updates.isRun = req.body.isRun;

  // 1) parse questions JSON
  if (req.body.questions) {
    let questionsPayload: any[] = req.body.questions;
    if (typeof questionsPayload === "string") {
      try {
        questionsPayload = JSON.parse(questionsPayload);
      } catch {
        return next(new ErrorHandler("Invalid questions JSON", 400));
      }
    }

    if (!Array.isArray(questionsPayload) || !questionsPayload.length) {
      return next(new ErrorHandler("questions must be a non-empty array", 400));
    }

    // 2) upload any new files and stitch
    const files = (req.files as Express.Multer.File[]) || [];
    for (const file of files) {
      let uploadResult;
      try {
        uploadResult = await uploadToS3(
          file.buffer,
          file.mimetype,
          file.originalname
        );
      } catch {
        return next(
          new ErrorHandler(`Failed to upload image ${file.originalname}`, 500)
        );
      }

      // now that your JSON has tempImageName, this will work:
      const q = questionsPayload.find(
        (qq) => qq.tempImageName === file.originalname
      );
      if (q) {
        q.image = uploadResult.url;
        delete q.tempImageName;
      }
    }

    // 3) validate each question…
    for (let i = 0; i < questionsPayload.length; i++) {
      if (validateQuestion(questionsPayload[i], i, next)) return;
    }

    updates.questions = questionsPayload;
  }

  // if nothing to update
  if (Object.keys(updates).length === 1 /* only lastModified */) {
    return next(new ErrorHandler("No valid fields provided for update", 400));
  }

  // 4) perform the mongo update
  const updated = await PollModel.findByIdAndUpdate(id, updates, { new: true });
  if (!updated) return next(new ErrorHandler("Poll not found", 404));
  sendResponse(res, updated, "Poll updated", 200);
};

/**
 * POST /api/v1/polls/:id/duplicate
 * Clone an existing poll (questions, metadata) into a new document.
 */
export const duplicatePoll = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;

  // 1️⃣  find original
  const original = await PollModel.findById(id).lean();
  if (!original) {
    return next(new ErrorHandler("Poll not found", 404));
  }

  // 2️⃣ prepare copy (strip mongoose fields)
  const copyData: any = {
    projectId: original.projectId,
    sessionId: original.sessionId,
    title: `${original.title} (copy)`,
    questions: original.questions,
    createdBy: original.createdBy,
    createdByRole: original.createdByRole,
    isRun: false,
    responsesCount: 0,
    lastModified: new Date(),
  };

  // 3️⃣insert new document
  const copy = await PollModel.create(copyData);

  sendResponse(res, copy, "Poll duplicated", 201);
};

/**
 * POST /api/v1/polls/:pollId/launch
 */
export const launchPoll = async (req: any, res: any, next: any) => {
  try {
    // Host permission: only Admin or Moderator may launch
    const actor = (req as any).user;
    if (!actor || !["Admin", "Moderator"].includes(actor.role))
      return next(
        new ErrorHandler("Only Admin or Moderator can launch polls", 403)
      );

    const parsed = zLaunchPayload.safeParse(req.body);
    if (!parsed.success) return next(new ErrorHandler("Invalid payload", 400));
    const { sessionId, settings } = parsed.data;

    const pollId = String(req.params.id);
    const { poll, run } = await pollService.launchPoll(
      pollId,
      sessionId,
      settings
    );

    // Emit socket: poll started to session room
    try {
      emitToRoom(String(sessionId), "poll:started", { poll, run });
    } catch {}

    sendResponse(res, { poll, run }, "Poll launched", 201);
  } catch (e: any) {
    next(new ErrorHandler(e?.message || "internal_error", 500));
  }
};

/**
 * POST /api/v1/polls/:pollId/stop
 */
export const stopPoll = async (req: any, res: any, next: any) => {
  try {
    // Host permission: only Admin or Moderator may stop
    const actor = (req as any).user;
    if (!actor || !["Admin", "Moderator"].includes(actor.role))
      return next(
        new ErrorHandler("Only Admin or Moderator can stop polls", 403)
      );

    const parsed = zStopPayload.safeParse(req.body);
    if (!parsed.success) return next(new ErrorHandler("Invalid payload", 400));
    const { sessionId } = parsed.data;

    const pollId = String(req.params.id);
    const { run, aggregates } = await pollService.stopPoll(pollId, sessionId);

    // Emit poll stopped
    try {
      emitToRoom(String(sessionId), "poll:stopped", { pollId, runId: run._id });
      if (run.shareResults === "onStop" || run.shareResults === "immediate") {
        emitToRoom(String(sessionId), "poll:results", {
          pollId,
          runId: run._id,
          aggregates,
        });
      }
    } catch {}

    sendResponse(res, { run, aggregates }, "Poll stopped", 200);
  } catch (e: any) {
    next(new ErrorHandler(e?.message || "internal_error", 500));
  }
};

/**
 * POST /api/v1/polls/:pollId/respond
 */
export const respondToPoll = async (req: any, res: any, next: any) => {
  try {
    const parsed = zRespondPayload.safeParse(req.body);
    if (!parsed.success) return next(new ErrorHandler("Invalid payload", 400));
    const { sessionId, runId, answers } = parsed.data;

    const pollId = String(req.params.id);

    // derive responder info from req.user if exists, else from body (allow anonymous)
    const user = (req as any).user as any | undefined;
    const responder = user
      ? {
          userId: String(user._id),
          name: user.firstName || user.name,
          email: user.email,
        }
      : req.body.responder || {};

    const { doc, aggregates } = await pollService.submitResponse(
      pollId,
      runId,
      sessionId,
      responder,
      answers as any[]
    );

    // ack to participant
    try {
      emitToRoom(String(sessionId), "poll:submission:ack", {
        pollId,
        runId,
        responder: responder.userId
          ? { userId: responder.userId }
          : { anonymous: true },
      });
      // emit partial results to moderators only
      emitToRoom(String(sessionId) + ":moderators", "poll:partialResults", {
        pollId,
        runId,
        aggregates,
      });
      // if shareResults is immediate, also broadcast to participants
      try {
        const runDoc = await PollRunModel.findById(runId).lean();
        if (runDoc && runDoc.shareResults === "immediate") {
          emitToRoom(String(sessionId), "poll:results", {
            pollId,
            runId,
            aggregates,
          });
        }
      } catch {}
    } catch {}

    sendResponse(res, { ok: true }, "Response saved", 201);
  } catch (e: any) {
    next(new ErrorHandler(e?.message || "internal_error", 500));
  }
};

/**
 * GET /api/v1/polls/:id/results?runId=...
 * Returns aggregated results for a given poll run. Host/moderator only.
 */
export const getPollResults = async (req: any, res: any, next: any) => {
  try {
    const pollId = String(req.params.id);
    const runId = String(req.query.runId || "");
    if (!runId) return next(new ErrorHandler("runId required", 400));
    const aggregates = await pollService.aggregateResults(pollId, runId);
    sendResponse(res, aggregates, "Results fetched", 200);
  } catch (e: any) {
    next(new ErrorHandler(e?.message || "internal_error", 500));
  }
};

/**
 * DELETE /api/v1/polls/:id
 * Remove a poll by its ID.
 */
export const deletePoll = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;

  // 1️⃣  attempt deletion
  const deleted = await PollModel.findByIdAndDelete(id);
  if (!deleted) {
    return next(new ErrorHandler("Poll not found", 404));
  }

  sendResponse(res, deleted, "Poll deleted", 200);
};
