import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "./authenticateJwt";
import ErrorHandler from "../utils/ErrorHandler";
import { PollModel } from "../model/PollModel";
import Project from "../model/ProjectModel";
import { SessionModel } from "../model/SessionModel";
import { Types } from "mongoose";

/**
 * Ensure the authenticated user is the project owner or a session/project moderator.
 * Expects pollId in req.params.id or sessionId in req.body.sessionId.
 */
export const authorizeProjectSessionOwner = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) return next(new ErrorHandler("Not authenticated", 401));

    const userId = req.user.userId;
    const pollId = req.params.id as string | undefined;
    const sessionIdFromBody = (req.body && req.body.sessionId) as
      | string
      | undefined;

    // If pollId provided, look up its project
    let projectId: Types.ObjectId | undefined;
    let sessionId: Types.ObjectId | undefined;
    if (pollId) {
      const poll = await PollModel.findById(pollId).lean();
      if (!poll) return next(new ErrorHandler("Poll not found", 404));
      projectId = poll.projectId as Types.ObjectId;
      if (poll.sessionId) sessionId = poll.sessionId as Types.ObjectId;
    }

    if (sessionIdFromBody) sessionId = new Types.ObjectId(sessionIdFromBody);

    // 1) If projectId known, check project createdBy or project moderators
    if (projectId) {
      const project = await Project.findById(projectId).lean();
      if (!project) return next(new ErrorHandler("Project not found", 404));
      if (String(project.createdBy) === String(userId)) return next();
      const isProjModerator = (project.moderators || []).some(
        (m: any) => String(m) === String(userId)
      );
      if (isProjModerator) return next();
    }

    // 2) If sessionId known, check session moderators
    if (sessionId) {
      const session = await SessionModel.findById(sessionId).lean();
      if (!session) return next(new ErrorHandler("Session not found", 404));
      const isSessionModerator = (session.moderators || []).some(
        (m: any) => String(m) === String(userId)
      );
      if (isSessionModerator) return next();
    }

    // fallback: forbidden
    return next(
      new ErrorHandler(
        "Forbidden: must be project owner or session moderator",
        403
      )
    );
  } catch (e: any) {
    return next(new ErrorHandler(e?.message || "internal_error", 500));
  }
};
