"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePoll = exports.duplicatePoll = exports.updatePoll = exports.getPollById = exports.getPollsByProjectId = exports.createPoll = void 0;
const PollModel_1 = require("../model/PollModel");
const ErrorHandler_1 = __importDefault(require("../../shared/utils/ErrorHandler"));
const responseHelpers_1 = require("../utils/responseHelpers");
const QuestionValidationProcessor_1 = require("../processors/poll/QuestionValidationProcessor");
/* ───────────────────────────────────────────────────────────── */
/*  Controller – Create Poll                                    */
/* ───────────────────────────────────────────────────────────── */
const createPoll = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { projectId, sessionId, title, questions, createdBy, createdByRole } = req.body;
    console.log('req.body', req.body);
    /* 1. Basic payload validation ------------------------------------ */
    if (!projectId || !title || !createdBy || !createdByRole) {
        return next(new ErrorHandler_1.default("projectId,  title, createdBy, createdByRole are required", 400));
    }
    if (!["Admin", "Moderator"].includes(createdByRole)) {
        return next(new ErrorHandler_1.default("Only Admin or Moderator can create polls", 403));
    }
    if (!Array.isArray(questions) || questions.length === 0) {
        return next(new ErrorHandler_1.default("questions array is required", 400));
    }
    /* 2. Per-question validation ------------------------------------- */
    for (let i = 0; i < questions.length; i++) {
        if ((0, QuestionValidationProcessor_1.validateQuestion)(questions[i], i, next))
            return; // stop on first error
    }
    console.log('done');
    /* 3. Create poll -------------------------------------------------- */
    const poll = yield PollModel_1.PollModel.create({
        projectId,
        // sessionId,
        title: title.trim(),
        questions,
        createdBy,
        createdByRole,
    });
    console.log('poll', poll);
    (0, responseHelpers_1.sendResponse)(res, poll, "Poll created", 201);
});
exports.createPoll = createPoll;
/**
 * GET /api/v1/polls/project/:projectId
 * Query params: ?page=1&limit=10
 */
const getPollsByProjectId = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { projectId } = req.params;
    // 2️⃣ Pagination params
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;
    // 3️⃣ Fetch slice + count
    const [polls, total] = yield Promise.all([
        PollModel_1.PollModel.find({ projectId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        PollModel_1.PollModel.countDocuments({ projectId }),
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
    (0, responseHelpers_1.sendResponse)(res, polls, "Polls fetched", 200, meta);
});
exports.getPollsByProjectId = getPollsByProjectId;
/**
 * GET /api/v1/polls/:id
 * Fetch a single poll by its ID.
 */
const getPollById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    // 1️⃣  Lookup
    const poll = yield PollModel_1.PollModel.findById(id);
    if (!poll) {
        return next(new ErrorHandler_1.default("Poll not found", 404));
    }
    // 2️⃣ Return it
    (0, responseHelpers_1.sendResponse)(res, poll, "Poll fetched", 200);
});
exports.getPollById = getPollById;
/**
 * PATCH /api/v1/polls/:id
 * Body may include any of: title, questions (full array), isRun
 */
const updatePoll = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    // 2️⃣ Build updates from allowed fields
    const allowed = ["title", "questions", "isRun"];
    const updates = {};
    for (const field of allowed) {
        if (req.body[field] !== undefined) {
            updates[field] = req.body[field];
        }
    }
    if (Object.keys(updates).length === 0) {
        return next(new ErrorHandler_1.default("No valid fields provided for update", 400));
    }
    // 3️⃣ If questions are being updated, validate them
    if (updates.questions) {
        if (!Array.isArray(updates.questions) || updates.questions.length === 0) {
            return next(new ErrorHandler_1.default("questions must be a non-empty array", 400));
        }
        for (let i = 0; i < updates.questions.length; i++) {
            if ((0, QuestionValidationProcessor_1.validateQuestion)(updates.questions[i], i, next))
                return;
        }
    }
    // 4️⃣ Update lastModified timestamp
    updates.lastModified = new Date();
    // 5️⃣ Perform the update
    const updated = yield PollModel_1.PollModel.findByIdAndUpdate(id, updates, {
        new: true,
    });
    if (!updated) {
        return next(new ErrorHandler_1.default("Poll not found", 404));
    }
    (0, responseHelpers_1.sendResponse)(res, updated, "Poll updated", 200);
});
exports.updatePoll = updatePoll;
/**
 * POST /api/v1/polls/:id/duplicate
 * Clone an existing poll (questions, metadata) into a new document.
 */
const duplicatePoll = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    // 1️⃣  find original
    const original = yield PollModel_1.PollModel.findById(id).lean();
    if (!original) {
        return next(new ErrorHandler_1.default("Poll not found", 404));
    }
    // 2️⃣ prepare copy (strip mongoose fields)
    const copyData = {
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
    const copy = yield PollModel_1.PollModel.create(copyData);
    (0, responseHelpers_1.sendResponse)(res, copy, "Poll duplicated", 201);
});
exports.duplicatePoll = duplicatePoll;
/**
 * DELETE /api/v1/polls/:id
 * Remove a poll by its ID.
 */
const deletePoll = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    // 1️⃣  attempt deletion
    const deleted = yield PollModel_1.PollModel.findByIdAndDelete(id);
    if (!deleted) {
        return next(new ErrorHandler_1.default("Poll not found", 404));
    }
    (0, responseHelpers_1.sendResponse)(res, deleted, "Poll deleted", 200);
});
exports.deletePoll = deletePoll;
