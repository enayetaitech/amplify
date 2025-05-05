import { Request, Response, NextFunction } from "express";
import { SessionDeliverableModel } from "../model/SessionDeliverableModel";
import ProjectModel from "../model/ProjectModel";
import ErrorHandler from "../../shared/utils/ErrorHandler";
import { sendResponse } from "../utils/ResponseHelpers";
import { uploadToS3 } from "../utils/uploadToS3";
import { SessionModel } from "../model/SessionModel";

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

