// src/controllers/LiveReadController.ts
import {Request, Response, NextFunction } from "express";
import { LiveSessionModel } from "../model/LiveSessionModel";
import { SessionModel } from "../model/SessionModel";
import { startHlsEgress } from "../processors/livekit/livekitService";
import ErrorHandler from "../utils/ErrorHandler";
import { sendResponse } from "../utils/responseHelpers";

export const getObserverHls = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { sessionId } = req.params;
  const session = await SessionModel.findById(sessionId);
  if (!session) return next(new ErrorHandler("Session not found", 404));

  let live = await LiveSessionModel.findOne({ sessionId });
  if (!live?.hlsPlaybackUrl) {
    // Try constructing from sessionId (roomName = sessionId)
    const { playbackUrl } = await startHlsEgress(String(sessionId));
    if (!playbackUrl) return next(new ErrorHandler("HLS not available", 404));
    sendResponse(res, { url: playbackUrl }, "HLS URL");
    return 
  }

  sendResponse(res, { url: live.hlsPlaybackUrl }, "HLS URL");
};
