import { Request, Response, NextFunction } from "express";
import { SessionModel } from "../model/SessionModel";
import WhiteboardSnapshot from "../model/WhiteboardSnapshot";
import { SessionDeliverableModel } from "../model/SessionDeliverableModel";
import ErrorHandler from "../utils/ErrorHandler";
import { sendResponse } from "../utils/responseHelpers";
import { uploadToS3 } from "../utils/uploadToS3";
import { Types } from "mongoose";

/**
 * POST /whiteboard/:sessionId/snapshot
 * multipart/form-data: file (PNG), width, height, takenBy (user _id)
 */
export const createSnapshot = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const file = req.file as Express.Multer.File | undefined;
    const width = Number(req.body.width || 0);
    const height = Number(req.body.height || 0);
    const takenBy = req.body.takenBy || req.body.uploadedBy;

    if (!file || !sessionId || !width || !height || !takenBy) {
      return next(
        new ErrorHandler(
          "file, sessionId, width, height and takenBy are required",
          400
        )
      );
    }

    const session = await SessionModel.findById(sessionId).lean();
    if (!session) return next(new ErrorHandler("Session not found", 404));

    const displayName =
      req.body.displayName || `whiteboard_${sessionId}_${Date.now()}.png`;

    // upload binary to S3
    const { url: s3Url, key: s3Key } = await uploadToS3(
      file.buffer,
      file.mimetype,
      displayName
    );

    // create snapshot doc
    const snap = await WhiteboardSnapshot.create({
      wbSessionId: String(sessionId),
      pngKey: s3Key,
      width,
      height,
      takenBy: new Types.ObjectId(String(takenBy)),
    });

    // register as deliverable
    const deliverable = await SessionDeliverableModel.create({
      sessionId: new Types.ObjectId(String(sessionId)),
      projectId: session.projectId,
      type: "WHITEBOARD",
      displayName,
      size: file.size,
      storageKey: s3Key,
      uploadedBy: new Types.ObjectId(String(takenBy)),
    });

    sendResponse(
      res,
      {
        snapshot: snap.toObject(),
        deliverable: deliverable.toObject(),
        url: s3Url,
      },
      "Whiteboard snapshot saved",
      201
    );
  } catch (e: any) {
    return next(new ErrorHandler(e?.message || "internal_error", 500));
  }
};
