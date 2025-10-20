import { Request, Response, NextFunction } from "express";
import { sendResponse } from "../utils/responseHelpers";
import * as sessionService from "../processors/liveSession/sessionService";
import ErrorHandler from "../utils/ErrorHandler";
import { AuthRequest } from "../middlewares/authenticateJwt";
import {
  endMeeting,
  startMeeting,
} from "../processors/livekit/meetingProcessor";
import { emitToRoom } from "../socket/bus";
import { Types } from "mongoose";
import { PollRunModel } from "../model/PollRun";
import { PollModel } from "../model/PollModel";
import { SessionModel } from "../model/SessionModel";
import ProjectModel from "../model/ProjectModel";
import User from "../model/UserModel";

// Deprecated: role-based start/end; moved to per-session moderator or project owner check
const canStartOrEnd = (_role?: string) => false;

export const startLiveSession = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const user = req.user;
  if (!user) return next(new ErrorHandler("Not authenticated", 401));

  const { sessionId } = req.params;
  if (!sessionId) return next(new ErrorHandler("sessionId required", 400));

  // New authorization: user must be in session.moderators list (by name+email) OR be the project owner
  const dbUser = await User.findById(user.userId).lean();
  if (!dbUser) return next(new ErrorHandler("User not found", 404));

  const session = await SessionModel.findById(sessionId)
    .populate("moderators", "firstName lastName email projectId")
    .lean();
  if (!session) return next(new ErrorHandler("Session not found", 404));

  const project = await ProjectModel.findById(session.projectId).lean();
  if (!project) return next(new ErrorHandler("Project not found", 404));

  const normalized = (s: string) => s.trim().toLowerCase();
  const userFullName = normalized(`${dbUser.firstName} ${dbUser.lastName}`);
  const userEmail = normalized(dbUser.email);

  const isSessionModerator =
    Array.isArray(session.moderators) &&
    (
      session.moderators as unknown as Array<{
        firstName?: string;
        lastName?: string;
        email?: string;
      }>
    ).some((m) => {
      if (!m) return false;
      const mName = normalized(`${m.firstName || ""} ${m.lastName || ""}`);
      const mEmail = normalized(m.email || "");
      return mEmail === userEmail && mName === userFullName;
    });

  const isProjectOwner = String(project.createdBy) === String(dbUser._id);

  if (!isSessionModerator && !isProjectOwner) {
    return next(new ErrorHandler("Forbidden", 403));
  }

  const result = await startMeeting(sessionId, user.userId);
  sendResponse(res, result, "Meeting started");
};

export const endLiveSession = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const user = req.user;
  if (!user) return next(new ErrorHandler("Not authenticated", 401));

  const { sessionId } = req.params;
  if (!sessionId) return next(new ErrorHandler("sessionId required", 400));

  // New authorization: user must be in session.moderators list (by name+email) OR be the project owner
  const dbUser = await User.findById(user.userId).lean();
  if (!dbUser) return next(new ErrorHandler("User not found", 404));

  const session = await SessionModel.findById(sessionId)
    .populate("moderators", "firstName lastName email projectId")
    .lean();
  if (!session) return next(new ErrorHandler("Session not found", 404));

  const project = await ProjectModel.findById(session.projectId).lean();
  if (!project) return next(new ErrorHandler("Project not found", 404));

  const normalized = (s: string) => s.trim().toLowerCase();
  const userFullName = normalized(`${dbUser.firstName} ${dbUser.lastName}`);
  const userEmail = normalized(dbUser.email);

  const isSessionModerator =
    Array.isArray(session.moderators) &&
    (
      session.moderators as unknown as Array<{
        firstName?: string;
        lastName?: string;
        email?: string;
      }>
    ).some((m) => {
      if (!m) return false;
      const mName = normalized(`${m.firstName || ""} ${m.lastName || ""}`);
      const mEmail = normalized(m.email || "");
      return mEmail === userEmail && mName === userFullName;
    });

  const isProjectOwner = String(project.createdBy) === String(dbUser._id);

  if (!isSessionModerator && !isProjectOwner) {
    return next(new ErrorHandler("Forbidden", 403));
  }

  const result = await endMeeting(sessionId, user.userId);
  try {
    emitToRoom(String(sessionId), "meeting:ended", {});
    emitToRoom(`observer::${String(sessionId)}`, "observer:stream:stopped", {});
  } catch {}
  sendResponse(res, result, "Meeting ended");
};

export const getSessionHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { sessionId } = req.params;
  const history = await sessionService.getSessionHistory(sessionId);
  sendResponse(res, history, "Session history retrieved", 200);
};

/**
 * GET /api/v1/liveSessions/:sessionId/active-poll
 * Returns the currently OPEN poll run for a session along with its poll.
 */
export const getActivePoll = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { sessionId } = req.params;
  if (!sessionId) return next(new ErrorHandler("sessionId required", 400));

  const run = await PollRunModel.findOne({
    sessionId: new Types.ObjectId(sessionId),
    status: "OPEN",
  })
    .sort({ launchedAt: -1 })
    .lean();

  if (!run) {
    sendResponse(res, null, "No active poll", 200);
    return;
  }

  const poll = await PollModel.findById(run.pollId).lean();
  if (!poll) {
    sendResponse(res, null, "Poll not found", 404);
    return;
  }

  sendResponse(res, { poll, run }, "Active poll fetched", 200);
};
