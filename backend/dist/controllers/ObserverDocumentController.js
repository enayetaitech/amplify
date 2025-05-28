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
exports.deleteObserverDocument = exports.downloadObserverDocumentsBulk = exports.downloadObserverDocument = exports.getObserverDocumentsByProjectId = exports.createObserverDocument = void 0;
const uploadToS3_1 = require("../utils/uploadToS3");
const ObserverDocumentModel_1 = require("../model/ObserverDocumentModel");
const ErrorHandler_1 = __importDefault(require("../../shared/utils/ErrorHandler"));
const responseHelpers_1 = require("../utils/responseHelpers");
const mongoose_1 = __importDefault(require("mongoose"));
const createObserverDocument = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    /* 1️⃣ pull form-data fields */
    const { projectId, sessionId, addedBy, addedByRole } = req.body;
    const file = req.file;
    console.log('req.body', req.body);
    /* 2️⃣ basic validations */
    if (!file) {
        return next(new ErrorHandler_1.default("File is required", 400));
    }
    if (!projectId || !addedBy || !addedByRole || !sessionId) {
        return next(new ErrorHandler_1.default("projectId,sessionId, addedBy, and addedByRole are required", 400));
    }
    if (!["Admin", "Moderator", "Observer"].includes(addedByRole)) {
        return next(new ErrorHandler_1.default("Only Admin, Moderator Or Observer can upload", 403));
    }
    /* 3️⃣ upload binary to S3 */
    const { key: storageKey } = yield (0, uploadToS3_1.uploadToS3)(file.buffer, file.mimetype, file.originalname);
    /* 4️⃣ create DB row */
    const doc = yield ObserverDocumentModel_1.ObserverDocumentModel.create({
        projectId,
        sessionId,
        displayName: file.originalname,
        size: file.size,
        storageKey,
        addedBy,
        addedByRole,
    });
    /* 5️⃣ success response */
    (0, responseHelpers_1.sendResponse)(res, doc, "Observer document uploaded", 201);
});
exports.createObserverDocument = createObserverDocument;
/**
 * GET /api/v1/observer-documents/project/:projectId?page=&limit=
 * Returns observer documents for a project with pagination.
 */
const getObserverDocumentsByProjectId = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { projectId } = req.params;
        /* 1️⃣ validate projectId format */
        if (!mongoose_1.default.Types.ObjectId.isValid(projectId)) {
            return next(new ErrorHandler_1.default("Invalid project ID", 400));
        }
        /* 2️⃣ pagination params */
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.max(Number(req.query.limit) || 10, 1);
        const skip = (page - 1) * limit;
        /* 3️⃣ query slice + total in parallel */
        const [docs, total] = yield Promise.all([
            ObserverDocumentModel_1.ObserverDocumentModel.find({ projectId })
                .sort({ createdAt: -1 }) // newest first
                .skip(skip)
                .limit(limit)
                .populate("addedBy", "firstName lastName role") // optional: show uploader
                .lean(),
            ObserverDocumentModel_1.ObserverDocumentModel.countDocuments({ projectId }),
        ]);
        /* 4️⃣ meta payload */
        const totalPages = Math.ceil(total / limit);
        const meta = {
            page,
            limit,
            totalItems: total,
            totalPages,
            hasPrev: page > 1,
            hasNext: page < totalPages,
        };
        (0, responseHelpers_1.sendResponse)(res, docs, "Observer documents fetched", 200, meta);
    }
    catch (err) {
        next(err);
    }
});
exports.getObserverDocumentsByProjectId = getObserverDocumentsByProjectId;
/*───────────────────────────────────────────────────────────────*/
/*  GET  /api/v1/observer-documents/:id/download                 */
/*───────────────────────────────────────────────────────────────*/
const downloadObserverDocument = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const doc = yield ObserverDocumentModel_1.ObserverDocumentModel.findById(id).lean();
    if (!doc)
        return next(new ErrorHandler_1.default("Observer document not found", 404));
    const url = (0, uploadToS3_1.getSignedUrl)(doc.storageKey, 720);
    // Option A – redirect (starts download immediately)
    return res.redirect(url);
    // Option B – send JSON (uncomment if you prefer)
    // sendResponse(res, { url }, "Signed URL generated", 200);
});
exports.downloadObserverDocument = downloadObserverDocument;
/*───────────────────────────────────────────────────────────────*/
/*  POST /api/v1/observer-documents/download   { ids: string[] } */
/*───────────────────────────────────────────────────────────────*/
const downloadObserverDocumentsBulk = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
        return next(new ErrorHandler_1.default("ids array is required", 400));
    }
    /* validate & keep only proper ObjectIds */
    const validIds = ids
        .filter((id) => typeof id === "string")
        .filter((id) => mongoose_1.default.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
        return next(new ErrorHandler_1.default("No valid Mongo IDs supplied in ids[]", 400));
    }
    const docs = yield ObserverDocumentModel_1.ObserverDocumentModel.find({
        _id: { $in: validIds },
    }).lean();
    if (docs.length === 0) {
        return next(new ErrorHandler_1.default("No observer documents found for given ids", 404));
    }
    const keys = docs.map((d) => d.storageKey);
    const signedUrls = (0, uploadToS3_1.getSignedUrls)(keys, 300);
    /* build meta for any ids that didn’t resolve */
    const foundIds = new Set(docs.map((d) => d._id.toString()));
    const notFound = validIds.filter((id) => !foundIds.has(id));
    (0, responseHelpers_1.sendResponse)(res, signedUrls, "Signed URLs generated", 200, notFound.length ? { notFound } : undefined);
});
exports.downloadObserverDocumentsBulk = downloadObserverDocumentsBulk;
/**
 * DELETE /api/v1/observer-documents/:id
 * 1. Delete the file from S3
 * 2. Remove the MongoDB row
 * 3. Return the deleted doc
 */
const deleteObserverDocument = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    /* 1️⃣ validate ID format */
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        return next(new ErrorHandler_1.default("Invalid document ID", 400));
    }
    /* 2️⃣ find doc */
    const doc = yield ObserverDocumentModel_1.ObserverDocumentModel.findById(id);
    if (!doc)
        return next(new ErrorHandler_1.default("Observer document not found", 404));
    /* 3️⃣ delete from S3 */
    try {
        yield (0, uploadToS3_1.deleteFromS3)(doc.storageKey);
    }
    catch (err) {
        return next(new ErrorHandler_1.default(`Failed to delete file from S3: ${err.message}`, 502));
    }
    /* 4️⃣ delete DB row */
    yield doc.deleteOne();
    /* 5️⃣ success response */
    (0, responseHelpers_1.sendResponse)(res, doc, "Observer document deleted", 200);
});
exports.deleteObserverDocument = deleteObserverDocument;
