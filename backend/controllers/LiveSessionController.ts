import { Request, Response, NextFunction } from "express";
import { sendResponse } from "../utils/ResponseHelpers";
import * as sessionService from "../processors/liveSession/sessionService";


export const startSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { sessionId } = req.params;
  const live = await sessionService.startSession(sessionId);
  sendResponse(res, live, "Meeting started", 200);
};

export const endSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { sessionId } = req.params;
  const live = await sessionService.endSession(sessionId);
  sendResponse(res, { sessionId: live.sessionId }, "Meeting ended", 200);
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
