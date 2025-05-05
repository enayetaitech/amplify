import { Request, Response, NextFunction } from "express";
import { sendResponse } from "../utils/ResponseHelpers";
import ErrorHandler from "../../shared/utils/ErrorHandler";
import { SessionModel } from "../model/SessionModel";
import ProjectModel from "../model/ProjectModel";
import ModeratorModel from "../model/ModeratorModel";

export const createSessions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { projectId, timeZone, breakoutRoom, sessions } = req.body;

  // 1. Basic payload validation
  if (
    !Array.isArray(sessions) ||
    sessions.length === 0 ||
    !projectId ||
    typeof timeZone !== "string" ||
    breakoutRoom === undefined
  ) {
    return next(
      new ErrorHandler(
        "Sessions array, project id, time zone, breakout room information are required",
        400
      )
    );
  }

  // 2. Project existence check
  const project = await ProjectModel.findById(projectId);
  if (!project) {
    return next(new ErrorHandler("Project not found", 404));
  }

  // 3. Moderator existence check

  const allMods = await ModeratorModel.find({
    _id: { $in: sessions.flatMap((s) => s.moderators) },
  });
  if (allMods.length !== sessions.flatMap((s) => s.moderators).length) {
    return next(new ErrorHandler("One or more moderators not found", 404));
  }

  // 4. Map each session, injecting the shared fields
  const docs = sessions.map((s: any) => ({
    projectId,
    timeZone,
    breakoutRoom,
    title: s.title,
    date: s.date,
    startTime: s.startTime,
    duration: s.duration,
    moderators: s.moderators,
  }));

  // 5. Bulk insert into MongoDB
  const created = await SessionModel.insertMany(docs);

  // 6. Send uniform success response
  sendResponse(res, created, "Sessions created", 201);
};

export const updateSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sessionId = req.params.id;
    const allowed = [
      "title",
      "date",
      "startTime",
      "duration",
      "moderators",
      "timeZone",
      "breakoutRoom",
    ];

    // 1. Build an updates object only with allowed fields
    const updates: Partial<Record<string, any>> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    // 2. If nothing to update, reject
    if (Object.keys(updates).length === 0) {
      return next(
        new ErrorHandler("No valid fields provided for update", 400)
      );
    }

    // 3. Perform the update (returns the new document)
    const updated = await SessionModel.findByIdAndUpdate(
      sessionId,
      updates,
      { new: true }
    );

    // 4. If not found, 404
    if (!updated) {
      return next(new ErrorHandler("Session not found", 404));
    }

    // 5. Return the updated session
    sendResponse(res, updated, "Session updated", 200);
  } catch (err) {
    next(err);
  }
};

export const duplicateSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sessionId = req.params.id;

    // 1. Find the existing session
    const original = await SessionModel.findById(sessionId);
    if (!original) {
      return next(new ErrorHandler("Session not found", 404));
    }

    // 2. Create a plain object and remove mongoose‐managed fields
    const obj = original.toObject();
    delete obj._id;
    delete obj.createdAt;
    delete obj.updatedAt;

    // 3. Modify the title
    obj.title = `${original.title} (copy)`;

    // 4. Insert the new document
    const copy = await SessionModel.create(obj);

    // 5. Return the duplicated session
    sendResponse(res, copy, "Session duplicated", 201);
  } catch (err) {
    next(err);
  }
};

export const deleteSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sessionId = req.params.id;

    // 1. Attempt deletion
    const deleted = await SessionModel.findByIdAndDelete(sessionId);

    // 2. If nothing was deleted, the id was invalid
    if (!deleted) {
      return next(new ErrorHandler("Session not found", 404));
    }

    // 3. Success—return the deleted doc for confirmation
    sendResponse(res, deleted, "Session deleted", 200);
  } catch (err) {
    next(err);
  }
};