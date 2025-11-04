import { Request, Response, NextFunction } from "express";
import { SessionDeliverableModel } from "../model/SessionDeliverableModel";
import ProjectModel from "../model/ProjectModel";
import ErrorHandler from "../utils/ErrorHandler";
import { sendResponse } from "../utils/responseHelpers";
import {
  deleteFromS3,
  getSignedUrl,
  getSignedUrlInline,
  getSignedUrls,
  getTextContentFromS3,
  uploadToS3,
} from "../utils/uploadToS3";
import { SessionModel } from "../model/SessionModel";
import { AuthRequest } from "../middlewares/authenticateJwt";

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
export const createDeliverable = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  /* ── pull fields & file ─────────────────────────── */
  const { sessionId, projectId, type, uploadedBy, displayName } = req.body;

  const file = req.file as Express.Multer.File | undefined;

  if (!file || !sessionId || !projectId || !type || !uploadedBy) {
    return next(
      new ErrorHandler(
        "file, sessionId, projectId, type and uploadedBy are required",
        400
      )
    );
  }

  /* ── sanity checks (optional but recommended) ───── */
  const [projectExists, sessionExists] = await Promise.all([
    ProjectModel.exists({ _id: projectId }),
    SessionModel.exists({ _id: sessionId }),
  ]);

  if (!projectExists) return next(new ErrorHandler("Project not found", 404));

  if (!sessionExists) return next(new ErrorHandler("Session not found", 404));

  /* ── upload binary to S3 ───────────────────────── */
  const { url: s3Url, key: s3Key } = await uploadToS3(
    file.buffer,
    file.mimetype,
    file.originalname
  );

  /* ── create doc ──────────────────────────────────── */
  const doc = await SessionDeliverableModel.create({
    sessionId,
    projectId,
    type,
    displayName,
    size: file.size,
    storageKey: s3Key,
    uploadedBy,
  });

  /* ── respond ───────────────────────────────────── */
  sendResponse(
    res,
    { ...doc.toObject(), url: s3Url },
    "Deliverable uploaded",
    201
  );
};

/**
 * List deliverables for a project with skip/limit pagination
 * and optional ?type=AUDIO | VIDEO | …
 */
export const getDeliverablesByProjectId = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { projectId } = req.params;
  const { type } = req.query;
  const includeDeleted = String(req.query.includeDeleted || "false") === "true";
  /* ––– pagination params ––– */
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.max(Number(req.query.limit) || 10, 1);
  const skip = (page - 1) * limit;

  /* ––– verify project exists (optional safety) ––– */
  const projectExists = await ProjectModel.exists({ _id: projectId });
  if (!projectExists) return next(new ErrorHandler("Project not found", 404));

  /* ––– build filter ––– */
  const filter: Record<string, unknown> = { projectId };
  if (!includeDeleted) {
    filter.deletedAt = null;
  }
  if (type) filter.type = type; // e.g. ?type=AUDIO

  /* ––– query slice + total in parallel ––– */
  const [rows, total] = await Promise.all([
    SessionDeliverableModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    SessionDeliverableModel.countDocuments(filter),
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

  sendResponse(res, rows, "Deliverables fetched", 200, meta);
};

export const downloadDeliverable = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;
  const deliverable = await SessionDeliverableModel.findOne({
    _id: id,
    deletedAt: null,
  }).lean();

  if (!deliverable) return next(new ErrorHandler("Not found", 404));

  const url = getSignedUrl(deliverable.storageKey, 300);
  res.redirect(url);
};

/**
 * GET /api/v1/sessionDeliverables/:id/preview
 * Returns a 302 redirect to an inline signed URL so the browser can preview (e.g., PNG).
 */
export const previewDeliverable = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;
  const deliverable = await SessionDeliverableModel.findOne({
    _id: id,
    deletedAt: null,
  }).lean();

  if (!deliverable) return next(new ErrorHandler("Not found", 404));

  const url = getSignedUrlInline(deliverable.storageKey, 300);
  res.redirect(url);
};

/**
 * GET /api/v1/sessionDeliverables/:id/view
 * Returns the text content of a deliverable (for SESSION_CHAT, BACKROOM_CHAT, TRANSCRIPT).
 */
export const viewTextContent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;
  const deliverable = await SessionDeliverableModel.findOne({
    _id: id,
    deletedAt: null,
  }).lean();

  if (!deliverable) return next(new ErrorHandler("Not found", 404));

  // Only allow text-based deliverables (include CSV poll results)
  const textTypes = [
    "SESSION_CHAT",
    "BACKROOM_CHAT",
    "TRANSCRIPT",
    "POLL_RESULT",
  ];
  if (!textTypes.includes(deliverable.type)) {
    return next(
      new ErrorHandler("This deliverable type does not support text viewing", 400)
    );
  }

  try {
    const content = await getTextContentFromS3(deliverable.storageKey);
    sendResponse(
      res,
      { content, displayName: deliverable.displayName },
      "Content retrieved",
      200
    );
  } catch (error) {
    return next(
      new ErrorHandler(
        `Failed to retrieve content: ${error instanceof Error ? error.message : "Unknown error"}`,
        500
      )
    );
  }
};

export const downloadMultipleDeliverable = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  /* 1️⃣ request-body sanity check */
  const { ids } = req.body as { ids?: unknown };
  if (!Array.isArray(ids) || ids.length === 0) {
    return next(new ErrorHandler("ids array is required", 400));
  }

  /* 2️⃣ fetch matching docs */
  const docs = await SessionDeliverableModel.find({ _id: { $in: ids } }).lean();

  if (docs.length === 0) {
    return next(
      new ErrorHandler("No deliverables found for the given ids", 404)
    );
  }

  /* 3️⃣ compute signed URLs */
  const keys = docs.map((d) => d.storageKey);

  const links = getSignedUrls(keys, 300);

  sendResponse(res, links, "Signed URLs", 200);
};

export const deleteDeliverable = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;

  /* ── find doc first ────────────────────────────────────────── */
  const doc = await SessionDeliverableModel.findById(id);
  if (!doc) return next(new ErrorHandler("Deliverable not found", 404));

  // Soft delete: set deletedAt and purgeAfterAt (configurable retention)
  const retentionDays = Number(process.env.DELIVERABLE_RETENTION_DAYS || 15);
  const now = new Date();
  const purgeAfterAt = new Date(
    now.getTime() + retentionDays * 24 * 60 * 60 * 1000
  );

  doc.deletedAt = now;
  doc.purgeAfterAt = purgeAfterAt;
  if (req.user?.userId) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore store as ObjectId string
    doc.deletedBy = req.user.userId;
  }
  await doc.save();

  sendResponse(res, doc, "Deliverable scheduled for deletion", 200);
};

export const restoreDeliverable = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;
  const doc = await SessionDeliverableModel.findById(id);
  if (!doc) return next(new ErrorHandler("Deliverable not found", 404));
  if (!doc.deletedAt) {
    sendResponse(res, doc, "Deliverable not deleted", 200);
    return;
  }
  if (doc.purgeAfterAt && doc.purgeAfterAt < new Date()) {
    return next(new ErrorHandler("Deliverable purge window has passed", 410));
  }
  doc.deletedAt = null as unknown as Date; // set to null
  doc.purgeAfterAt = null as unknown as Date;
  doc.deletedBy = null as unknown as never;
  await doc.save();
  sendResponse(res, doc, "Deliverable restored", 200);
};

export const renameDeliverable = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;
  const { displayName } = req.body as { displayName?: string };
  if (!displayName || !displayName.trim()) {
    return next(new ErrorHandler("displayName is required", 400));
  }
  const doc = await SessionDeliverableModel.findOne({
    _id: id,
    deletedAt: null,
  });
  if (!doc) return next(new ErrorHandler("Deliverable not found", 404));
  doc.displayName = displayName.trim();
  await doc.save();
  sendResponse(res, doc, "Deliverable renamed", 200);
};
