// src/controllers/LiveReadController.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/authenticateJwt';
import {LiveSessionModel} from '../model/LiveSessionModel';
import {SessionModel} from '../model/SessionModel';
import ErrorHandler from '../utils/ErrorHandler';
import { sendResponse } from '../utils/responseHelpers';

export const getObserverHls = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { sessionId } = req.params;
  const session = await SessionModel.findById(sessionId);
  if (!session) return next(new ErrorHandler('Session not found', 404));

  const live = await LiveSessionModel.findOne({ sessionId });
  if (!live?.hlsPlaybackUrl) return next(new ErrorHandler('HLS not available', 404));

  sendResponse(res, { url: live.hlsPlaybackUrl }, 'HLS URL');
};
