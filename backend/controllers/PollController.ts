import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { PollModel } from "../model/PollModel";
import ErrorHandler from "../../shared/utils/ErrorHandler";
import { sendResponse } from "../utils/responseHelpers";
import { validateQuestion } from "../processors/poll/QuestionValidationProcessor";



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

    console.log('req.body', req.body)

  /* 1. Basic payload validation ------------------------------------ */
  if (!projectId  || !title || !createdBy || !createdByRole) {
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
  if (!Array.isArray(questions) || questions.length === 0) {
    return next(new ErrorHandler("questions array is required", 400));
  }
 
  
  /* 2. Per-question validation ------------------------------------- */
  for (let i = 0; i < questions.length; i++) {
    if (validateQuestion(questions[i], i, next)) return; // stop on first error
  }
 console.log('done')
  /* 3. Create poll -------------------------------------------------- */

    const poll = await PollModel.create({
      projectId,
      // sessionId,
      title: title.trim(),
      questions,
      createdBy,
      createdByRole,
    });

    console.log('poll', poll)
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
    const page  = Math.max(Number(req.query.page)  || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);
    const skip  = (page - 1) * limit;

    // 3️⃣ Fetch slice + count
    const [polls, total] = await Promise.all([
      PollModel.find({ projectId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
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


  // 2️⃣ Build updates from allowed fields
  const allowed: Array<keyof typeof req.body> = ["title", "questions", "isRun"];
  const updates: Partial<Record<typeof allowed[number], any>> = {};

  for (const field of allowed) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return next(new ErrorHandler("No valid fields provided for update", 400));
  }

  // 3️⃣ If questions are being updated, validate them
  if (updates.questions) {
    if (!Array.isArray(updates.questions) || updates.questions.length === 0) {
      return next(new ErrorHandler("questions must be a non-empty array", 400));
    }
    for (let i = 0; i < updates.questions.length; i++) {
      if (validateQuestion(updates.questions[i], i, next)) return;
    }
  }

  // 4️⃣ Update lastModified timestamp
  updates.lastModified = new Date();

  // 5️⃣ Perform the update
 
    const updated = await PollModel.findByIdAndUpdate(id, updates, {
      new: true,
    });
    if (!updated) {
      return next(new ErrorHandler("Poll not found", 404));
    }
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
    projectId:      original.projectId,
    sessionId:      original.sessionId,
    title:          `${original.title} (copy)`,
    questions:      original.questions,
    createdBy:      original.createdBy,
    createdByRole:  original.createdByRole,
    isRun:          false, 
    responsesCount: 0,  
    lastModified:   new Date(),
  };

  // 3️⃣insert new document
  const copy = await PollModel.create(copyData);

  sendResponse(res, copy, "Poll duplicated", 201);
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
