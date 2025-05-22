// controllers/ObserverDocumentController.ts
import { Request, Response, NextFunction } from "express";
import { deleteFromS3, getSignedUrl, getSignedUrls, uploadToS3 } from "../utils/uploadToS3";  
import { ObserverDocumentModel } from "../model/ObserverDocumentModel";
import ErrorHandler from "../../shared/utils/ErrorHandler";
import { sendResponse } from "../utils/ResponseHelpers";
import mongoose from "mongoose";

export const createObserverDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
 
    /* 1️⃣ pull form-data fields */
    const { projectId, sessionId, addedBy, addedByRole } = req.body;
    const file = req.file as Express.Multer.File | undefined;
    console.log('req.body', req.body)

    /* 2️⃣ basic validations */
    if (!file) {
      return next(new ErrorHandler("File is required", 400));
    }
    if (!projectId || !addedBy || !addedByRole || !sessionId) {
      return next(
        new ErrorHandler("projectId,sessionId, addedBy, and addedByRole are required", 400)
      );
    }
      
    if (!["Admin", "Moderator", "Observer"].includes(addedByRole)) {
      return next(new ErrorHandler("Only Admin, Moderator Or Observer can upload", 403));
    }

    /* 3️⃣ upload binary to S3 */
    const { key: storageKey } = await uploadToS3(
      file.buffer,
      file.mimetype,
      file.originalname
    );

    /* 4️⃣ create DB row */
    const doc = await ObserverDocumentModel.create({
      projectId,
      sessionId,
      displayName: file.originalname,
      size: file.size,
      storageKey,
      addedBy,
      addedByRole,
    });

    /* 5️⃣ success response */
    sendResponse(res, doc, "Observer document uploaded", 201);
 
};


/**
 * GET /api/v1/observer-documents/project/:projectId?page=&limit=
 * Returns observer documents for a project with pagination.
 */
export const getObserverDocumentsByProjectId = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { projectId } = req.params;

    /* 1️⃣ validate projectId format */
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return next(new ErrorHandler("Invalid project ID", 400));
    }

    /* 2️⃣ pagination params */
    const page  = Math.max(Number(req.query.page)  || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);
    const skip  = (page - 1) * limit;

    /* 3️⃣ query slice + total in parallel */
    const [docs, total] = await Promise.all([
      ObserverDocumentModel.find({ projectId })
        .sort({ createdAt: -1 })                // newest first
        .skip(skip)
        .limit(limit)
        .populate("addedBy", "firstName lastName role") // optional: show uploader
        .lean(),
      ObserverDocumentModel.countDocuments({ projectId }),
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

    sendResponse(res, docs, "Observer documents fetched", 200, meta);
  } catch (err) {
    next(err);
  }
};


/*───────────────────────────────────────────────────────────────*/
/*  GET  /api/v1/observer-documents/:id/download                 */
/*───────────────────────────────────────────────────────────────*/
export const downloadObserverDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;

  const doc = await ObserverDocumentModel.findById(id).lean();
  if (!doc) return next(new ErrorHandler("Observer document not found", 404));

  const url = getSignedUrl(doc.storageKey, 720); 

  // Option A – redirect (starts download immediately)
  return res.redirect(url);

  // Option B – send JSON (uncomment if you prefer)
  // sendResponse(res, { url }, "Signed URL generated", 200);
};

/*───────────────────────────────────────────────────────────────*/
/*  POST /api/v1/observer-documents/download   { ids: string[] } */
/*───────────────────────────────────────────────────────────────*/
export const downloadObserverDocumentsBulk = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { ids } = req.body as { ids?: unknown };

  if (!Array.isArray(ids) || ids.length === 0) {
    return next(new ErrorHandler("ids array is required", 400));
  }

  /* validate & keep only proper ObjectIds */
  const validIds = ids
    .filter((id): id is string => typeof id === "string")
    .filter((id) => mongoose.Types.ObjectId.isValid(id));

  if (validIds.length === 0) {
    return next(new ErrorHandler("No valid Mongo IDs supplied in ids[]", 400));
  }

  const docs = await ObserverDocumentModel.find({
    _id: { $in: validIds },
  }).lean();

  if (docs.length === 0) {
    return next(
      new ErrorHandler("No observer documents found for given ids", 404)
    );
  }

  const keys = docs.map((d) => d.storageKey);
  const signedUrls = getSignedUrls(keys, 300);          

  /* build meta for any ids that didn’t resolve */
  const foundIds = new Set(docs.map((d) => d._id.toString()));
  const notFound = validIds.filter((id) => !foundIds.has(id));

  sendResponse(
    res,
    signedUrls,
    "Signed URLs generated",
    200,
    notFound.length ? { notFound } : undefined
  );
};

/**
 * DELETE /api/v1/observer-documents/:id
 * 1. Delete the file from S3
 * 2. Remove the MongoDB row
 * 3. Return the deleted doc
 */
export const deleteObserverDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {

    const { id } = req.params;

    /* 1️⃣ validate ID format */
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ErrorHandler("Invalid document ID", 400));
    }

    /* 2️⃣ find doc */
    const doc = await ObserverDocumentModel.findById(id);
    if (!doc) return next(new ErrorHandler("Observer document not found", 404));

    /* 3️⃣ delete from S3 */
    try {
      await deleteFromS3(doc.storageKey);
    } catch (err) {
      return next(
        new ErrorHandler(
          `Failed to delete file from S3: ${(err as Error).message}`,
          502  
        )
      );
    }

    /* 4️⃣ delete DB row */
    await doc.deleteOne();

    /* 5️⃣ success response */
    sendResponse(res, doc, "Observer document deleted", 200);
  
};