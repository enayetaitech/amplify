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
exports.deleteDeliverable = exports.downloadMultipleDeliverable = exports.downloadDeliverable = exports.getDeliverablesByProjectId = exports.createDeliverable = void 0;
const SessionDeliverableModel_1 = require("../model/SessionDeliverableModel");
const ProjectModel_1 = __importDefault(require("../model/ProjectModel"));
const ErrorHandler_1 = __importDefault(require("../../shared/utils/ErrorHandler"));
const ResponseHelpers_1 = require("../utils/ResponseHelpers");
const uploadToS3_1 = require("../utils/uploadToS3");
const SessionModel_1 = require("../model/SessionModel");
/**
 * POST /api/v1/deliverables
 * multipart/form-data:
 *   file         (binary)
 *   sessionId    (string)
 *   projectId    (string)
 *   type         (AUDIO | VIDEO | ...)
 *   uploadedBy   (string)  ← user _id
 *
 * Optional:
 *   displayName  (string)  ← if omitted, we auto-generate
 */
const createDeliverable = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    /* ── pull fields & file ─────────────────────────── */
    const { sessionId, projectId, type, uploadedBy, displayName } = req.body;
    const file = req.file;
    if (!file || !sessionId || !projectId || !type || !uploadedBy) {
        return next(new ErrorHandler_1.default("file, sessionId, projectId, type and uploadedBy are required", 400));
    }
    /* ── sanity checks (optional but recommended) ───── */
    const [projectExists, sessionExists] = yield Promise.all([
        ProjectModel_1.default.exists({ _id: projectId }),
        SessionModel_1.SessionModel.exists({ _id: sessionId }),
    ]);
    if (!projectExists)
        return next(new ErrorHandler_1.default("Project not found", 404));
    if (!sessionExists)
        return next(new ErrorHandler_1.default("Session not found", 404));
    /* ── upload binary to S3 ───────────────────────── */
    const { url: s3Url, key: s3Key } = yield (0, uploadToS3_1.uploadToS3)(file.buffer, file.mimetype, file.originalname);
    /* ── create doc ──────────────────────────────────── */
    const doc = yield SessionDeliverableModel_1.SessionDeliverableModel.create({
        sessionId,
        projectId,
        type,
        displayName,
        size: file.size,
        storageKey: s3Key,
        uploadedBy,
    });
    /* ── respond ───────────────────────────────────── */
    (0, ResponseHelpers_1.sendResponse)(res, Object.assign(Object.assign({}, doc.toObject()), { url: s3Url }), "Deliverable uploaded", 201);
});
exports.createDeliverable = createDeliverable;
/**
 * List deliverables for a project with skip/limit pagination
 * and optional ?type=AUDIO | VIDEO | …
 */
const getDeliverablesByProjectId = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { projectId } = req.params;
    const { type } = req.query;
    /* ––– pagination params ––– */
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;
    /* ––– verify project exists (optional safety) ––– */
    const projectExists = yield ProjectModel_1.default.exists({ _id: projectId });
    if (!projectExists)
        return next(new ErrorHandler_1.default("Project not found", 404));
    /* ––– build filter ––– */
    const filter = { projectId };
    if (type)
        filter.type = type; // e.g. ?type=AUDIO
    /* ––– query slice + total in parallel ––– */
    const [rows, total] = yield Promise.all([
        SessionDeliverableModel_1.SessionDeliverableModel.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        SessionDeliverableModel_1.SessionDeliverableModel.countDocuments(filter),
    ]);
    /* ––– meta payload ––– */
    const totalPages = Math.ceil(total / limit);
    const meta = {
        page,
        limit,
        totalItems: total,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages,
    };
    (0, ResponseHelpers_1.sendResponse)(res, rows, "Deliverables fetched", 200, meta);
});
exports.getDeliverablesByProjectId = getDeliverablesByProjectId;
const downloadDeliverable = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const deliverable = yield SessionDeliverableModel_1.SessionDeliverableModel.findById(id).lean();
    if (!deliverable)
        return next(new ErrorHandler_1.default("Not found", 404));
    const url = (0, uploadToS3_1.getSignedUrl)(deliverable.storageKey, 300);
    res.redirect(url);
});
exports.downloadDeliverable = downloadDeliverable;
const downloadMultipleDeliverable = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    /* 1️⃣ request-body sanity check */
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
        return next(new ErrorHandler_1.default("ids array is required", 400));
    }
    /* 2️⃣ fetch matching docs */
    const docs = yield SessionDeliverableModel_1.SessionDeliverableModel.find({ _id: { $in: ids } }).lean();
    if (docs.length === 0) {
        return next(new ErrorHandler_1.default("No deliverables found for the given ids", 404));
    }
    /* 3️⃣ compute signed URLs */
    const keys = docs.map((d) => d.storageKey);
    const links = (0, uploadToS3_1.getSignedUrls)(keys, 300);
    (0, ResponseHelpers_1.sendResponse)(res, links, "Signed URLs", 200);
});
exports.downloadMultipleDeliverable = downloadMultipleDeliverable;
const deleteDeliverable = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    /* ── find doc first ────────────────────────────────────────── */
    const doc = yield SessionDeliverableModel_1.SessionDeliverableModel.findById(id);
    if (!doc)
        return next(new ErrorHandler_1.default("Deliverable not found", 404));
    yield (0, uploadToS3_1.deleteFromS3)(doc.storageKey);
    /* ── delete DB row ────────────────────────────────────────── */
    yield doc.deleteOne();
    (0, ResponseHelpers_1.sendResponse)(res, doc, "Deliverable deleted", 200);
});
exports.deleteDeliverable = deleteDeliverable;
