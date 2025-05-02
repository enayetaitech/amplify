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
