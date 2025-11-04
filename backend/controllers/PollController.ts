import { Request, Response, NextFunction } from "express";
import mongoose, { Types } from "mongoose";
import { PollModel } from "../model/PollModel";
import ErrorHandler from "../utils/ErrorHandler";
import { sendResponse } from "../utils/responseHelpers";
import { validateQuestion } from "../processors/poll/QuestionValidationProcessor";
import { uploadToS3, getSignedUrl } from "../utils/uploadToS3";
import * as pollService from "../processors/poll/pollService";
import { emitToRoom } from "../socket/bus";
import { PollRunModel } from "../model/PollRun";
import PollResponse from "../model/PollResponse";
import { LiveSessionModel } from "../model/LiveSessionModel";
import { zLaunchPayload, zStopPayload, zRespondPayload } from "../schemas/poll";
import { zSharePayload } from "../schemas/poll";

/**
 * Helper to convert image keys to signed URLs.
 * Handles backward compatibility: if image is already a URL, return as-is.
 * Works with single poll or array of polls.
 */
function transformPollImages(pollOrPolls: any): any {
  if (!pollOrPolls) return pollOrPolls;

  // Handle arrays
  if (Array.isArray(pollOrPolls)) {
    return pollOrPolls.map((p) => transformPollImages(p));
  }

  // Handle single poll
  if (!pollOrPolls.questions) return pollOrPolls;

  const transformed = { ...pollOrPolls };
  transformed.questions = pollOrPolls.questions.map((q: any) => {
    if (!q.image) return q;

    // If it's already a URL (backward compatibility), keep it
    if (q.image.startsWith("http://") || q.image.startsWith("https://")) {
      return q;
    }

    // Otherwise, treat it as an S3 key and generate signed URL
    try {
      // Generate signed URL valid for 1 hour (3600 seconds)
      const signedUrl = getSignedUrl(q.image, 3600);
      return { ...q, image: signedUrl };
    } catch {
      // If signed URL generation fails, return original
      return q;
    }
  });

  return transformed;
}

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
      // Store the S3 key instead of URL for signed URL generation
      q.image = result.key;
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

  sendResponse(res, transformPollImages(poll), "Poll created", 201);
};

/**
 * GET /api/v1/polls/project/:projectId
 * Query params: ?page=1&limit=10&sortBy=title&sortOrder=asc
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

  // 3️⃣ Sorting params
  const sortBy = (req.query.sortBy as string) || "createdAt";
  const sortOrder = (req.query.sortOrder as string) || "desc";

  // Map frontend field names to database field names
  const sortFieldMap: Record<string, string> = {
    title: "title",
    lastModified: "lastModified",
    createdAt: "createdAt",
  };

  const sortField = sortFieldMap[sortBy] || "createdAt";
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  // 4️⃣ Fetch slice + count
  const [polls, total] = await Promise.all([
    PollModel.find({ projectId })
      .sort({ [sortField]: sortDirection })
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "firstName lastName")
      .lean(),
    PollModel.countDocuments({ projectId }),
  ]);

  // 5️⃣ Build meta
  const totalPages = Math.ceil(total / limit);
  const meta = {
    page,
    limit,
    totalItems: total,
    totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
  };

  sendResponse(res, transformPollImages(polls), "Polls fetched", 200, meta);
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
  sendResponse(res, transformPollImages(poll), "Poll fetched", 200);
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
        // Store the S3 key instead of URL for signed URL generation
        q.image = uploadResult.key;
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
  sendResponse(res, transformPollImages(updated), "Poll updated", 200);
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

  sendResponse(res, transformPollImages(copy), "Poll duplicated", 201);
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
      const transformedPoll = transformPollImages(poll);
      emitToRoom(String(sessionId), "poll:started", {
        poll: transformedPoll,
        run,
      });
    } catch {}

    sendResponse(
      res,
      { poll: transformPollImages(poll), run },
      "Poll launched",
      201
    );
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
 * POST /api/v1/polls/:pollId/share
 * Host-only: explicitly share results for a closed run to participants
 */
export const sharePollResults = async (req: any, res: any, next: any) => {
  try {
    const actor = (req as any).user;
    if (!actor || !["Admin", "Moderator"].includes(actor.role))
      return next(
        new ErrorHandler("Only Admin or Moderator can share results", 403)
      );

    const parsed = zSharePayload.safeParse(req.body);
    if (!parsed.success) return next(new ErrorHandler("Invalid payload", 400));
    const { sessionId, runId } = parsed.data;

    const pollId = String(req.params.id);
    // ensure run belongs to poll and is closed
    const run = await PollRunModel.findById(runId).lean();
    if (!run || String(run.pollId) !== pollId)
      return next(new ErrorHandler("Run not found", 404));
    if (String(run.sessionId) !== String(sessionId))
      return next(new ErrorHandler("Forbidden: wrong session", 403));
    if (run.status !== "CLOSED")
      return next(new ErrorHandler("Run not closed", 400));

    const aggregates = await pollService.aggregateResults(pollId, runId);

    // broadcast to participants in session (and redundantly to meeting room)
    try {
      // log for diagnostics
      try {
        console.log(
          `sharePollResults: emitting poll:results for session=${sessionId} poll=${pollId} run=${runId}`
        );
      } catch {}
      emitToRoom(String(sessionId), "poll:results", {
        pollId,
        runId,
        aggregates,
      });
      // persist sharedAt timestamp on run
      try {
        await PollRunModel.findByIdAndUpdate(runId, {
          $set: { sharedAt: new Date() },
        });
      } catch {}
      try {
        // redundant emit to meeting room name (some clients may be listening there)
        emitToRoom(`meeting::${String(sessionId)}`, "poll:results", {
          pollId,
          runId,
          aggregates,
        });
      } catch {}
    } catch (e) {
      try {
        console.error("sharePollResults: emit failed", e);
      } catch {}
    }

    sendResponse(res, { ok: true, aggregates }, "Results shared", 200);
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

    // always derive responder from body (client supplies name/email)
    const responderFromBody = req.body.responder || {};

    // normalize strings
    const nameRaw = (responderFromBody.name || "").toString();
    const emailRaw = (responderFromBody.email || "").toString();
    const name = nameRaw.trim();
    const email = emailRaw.trim().toLowerCase();

    // attempt to match participant in LiveSession.participantsList by name+email
    let sessionParticipantId: any = undefined;
    try {
      const runDoc = await PollRunModel.findById(runId).lean();
      if (runDoc) {
        const live = await LiveSessionModel.findOne({
          sessionId: runDoc.sessionId,
        }).lean();
        if (live && Array.isArray(live.participantsList)) {
          const found = (live.participantsList as any[]).find((p) => {
            if (!p) return false;
            const pn = (p.name || "").toString().trim();
            const pe = (p.email || "").toString().trim().toLowerCase();
            return pn === name && pe === email;
          });
          if (found) sessionParticipantId = found._id;
        }
      }
    } catch {}

    const responder: { userId?: string; name?: string; email?: string } = {
      name,
      email,
    };

    // Enforce min/max for text answers (SHORT_ANSWER, LONG_ANSWER) using poll definition
    try {
      const pollDoc = await PollModel.findById(pollId).lean();
      if (pollDoc && Array.isArray(pollDoc.questions)) {
        const qById = new Map(
          (pollDoc.questions as any[]).map((q: any) => [String(q._id), q])
        );
        for (const a of answers as any[]) {
          const q = qById.get(String(a.questionId));
          if (q && (q.type === "SHORT_ANSWER" || q.type === "LONG_ANSWER")) {
            const min = typeof q.minChars === "number" ? q.minChars : 0;
            const max = typeof q.maxChars === "number" ? q.maxChars : Infinity;
            const txt = (a?.value ?? "") as string;
            const len = typeof txt === "string" ? txt.trim().length : 0;
            if (len === 0) {
              // allow empty here; required is handled separately by frontend; backend accepts empty text unless required enforcement is added server-side later
            } else if (len < min) {
              return next(
                new ErrorHandler(
                  `Minimum ${min} characters required for: ${
                    q.prompt || "question"
                  }`,
                  400
                )
              );
            } else if (len > max) {
              return next(
                new ErrorHandler(
                  `Maximum ${max} characters allowed for: ${
                    q.prompt || "question"
                  }`,
                  400
                )
              );
            }
          }
        }
      }
    } catch {}

    const { doc, aggregates } = await pollService.submitResponse(
      pollId,
      runId,
      sessionId,
      responder,
      answers as any[],
      sessionParticipantId
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
      // lightweight debug log for identity capture
      try {
        const idStr =
          responder?.userId ||
          responder?.email ||
          responder?.name ||
          "anonymous";
        console.log(
          `[poll:respond] pollId=${pollId} runId=${runId} from=${idStr}`
        );
      } catch {}
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
    const sessionId = String(req.query.sessionId || "");
    if (!runId) return next(new ErrorHandler("runId required", 400));
    if (!sessionId) return next(new ErrorHandler("sessionId required", 400));

    const run = await PollRunModel.findById(runId).lean();
    if (!run || String(run.pollId) !== String(pollId))
      return next(new ErrorHandler("Run not found", 404));
    if (String(run.sessionId) !== String(sessionId))
      return next(new ErrorHandler("Forbidden: wrong session", 403));

    const aggregates = await pollService.aggregateResults(pollId, runId);

    // Get total participants count from LiveSession
    let totalParticipants: number | undefined = undefined;
    try {
      const LiveSessionModel =
        require("../model/LiveSessionModel").LiveSessionModel ||
        require("../model/LiveSessionModel").default ||
        require("../model/LiveSessionModel");
      const live = await LiveSessionModel.findOne({
        sessionId: new Types.ObjectId(sessionId),
      }).lean();

      if (live) {
        const pHistory = Array.isArray(live.participantHistory)
          ? live.participantHistory
          : [];
        const pList = Array.isArray(live.participantsList)
          ? live.participantsList
          : [];

        if (pHistory.length > 0) {
          const emails = new Set<string>();
          for (const p of pHistory) {
            const em = (p?.email || "").toString().toLowerCase();
            if (em) emails.add(em);
          }
          totalParticipants = emails.size;
        } else if (pList.length > 0) {
          const emails = new Set<string>();
          for (const p of pList) {
            const em = (p?.email || "").toString().toLowerCase();
            if (em) emails.add(em);
          }
          totalParticipants = emails.size;
        }
      }
    } catch {}

    sendResponse(
      res,
      { aggregates, totalParticipants },
      "Results fetched",
      200
    );
  } catch (e: any) {
    next(new ErrorHandler(e?.message || "internal_error", 500));
  }
};

/**
 * GET /api/v1/polls/:id/runs
 * List runs for a poll (newest first)
 */
export const getPollRuns = async (req: any, res: any, next: any) => {
  try {
    const pollId = String(req.params.id);
    const sessionId = String(req.query.sessionId || "");
    if (!sessionId) return next(new ErrorHandler("sessionId required", 400));
    const runs = await PollRunModel.find({ pollId, sessionId })
      .sort({ runNumber: -1 })
      .lean();
    sendResponse(res, runs, "Runs fetched", 200);
  } catch (e: any) {
    next(new ErrorHandler(e?.message || "internal_error", 500));
  }
};

/**
 * GET /api/v1/polls/:id/responses?runId=...
 * Host-only: returns raw responses (omits identities if anonymous)
 */
export const getPollResponses = async (req: any, res: any, next: any) => {
  try {
    const pollId = String(req.params.id);
    const runId = String(req.query.runId || "");
    const sessionId = String(req.query.sessionId || "");
    if (!runId) return next(new ErrorHandler("runId required", 400));
    if (!sessionId) return next(new ErrorHandler("sessionId required", 400));

    const run = await PollRunModel.findById(runId).lean();
    if (!run || String(run.pollId) !== String(pollId))
      return next(new ErrorHandler("Run not found", 404));
    if (String(run.sessionId) !== String(sessionId))
      return next(new ErrorHandler("Forbidden: wrong session", 403));

    const docs = await PollResponse.find({ pollId, runId })
      .sort({ submittedAt: 1 })
      .lean();

    type RespShape = {
      responder?: { name?: string; email?: string };
      sessionParticipantId?: string;
      answers: any[];
      submittedAt: Date;
    };

    let data: RespShape[] = [];
    if (run.anonymous) {
      data = docs.map((d) => ({
        answers: d.answers,
        submittedAt: d.submittedAt,
      }));
    } else {
      // Enhance with name/email and include sessionParticipantId when present
      let live: any = null;
      try {
        live = await LiveSessionModel.findOne({
          sessionId: run.sessionId,
        }).lean();
      } catch {}
      data = docs.map((d) => {
        let name = d?.responder?.name;
        let email = d?.responder?.email;
        let sessionParticipantId: string | undefined = undefined;
        if (d?.sessionParticipantId)
          sessionParticipantId = String(d.sessionParticipantId);
        if ((!name || !email) && live && Array.isArray(live.participantsList)) {
          const found = (live.participantsList as any[]).find(
            (p) =>
              p &&
              p.email &&
              d?.responder?.email &&
              String(p.email).trim().toLowerCase() ===
                String(d.responder?.email).trim().toLowerCase() &&
              String((p.name || "").toString().trim()) ===
                String((d.responder?.name || "").toString().trim())
          );
          if (found) {
            name = name || found.name;
            email = email || found.email;
            sessionParticipantId = sessionParticipantId || String(found._id);
          }
        }
        return {
          responder: { name, email },
          sessionParticipantId,
          answers: d.answers,
          submittedAt: d.submittedAt,
        };
      });
    }
    sendResponse(res, { run, responses: data }, "Responses fetched", 200);
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
