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

const canStartOrEnd = (role?: string) => {
  // Admin/Moderator can start/end meetings
  return role === "Admin" || role === "Moderator";
};

export const startLiveSession = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const user = req.user;
  if (!user) return next(new ErrorHandler("Not authenticated", 401));

  if (!canStartOrEnd(user.role))
    return next(new ErrorHandler("Forbidden", 403));

  const { sessionId } = req.params;
  if (!sessionId) return next(new ErrorHandler("sessionId required", 400));

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

  if (!canStartOrEnd(user.role))
    return next(new ErrorHandler("Forbidden", 403));

  const { sessionId } = req.params;
  if (!sessionId) return next(new ErrorHandler("sessionId required", 400));

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
