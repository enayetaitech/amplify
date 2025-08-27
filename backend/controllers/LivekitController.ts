// src/controllers/LivekitController.ts
import { Response, NextFunction } from 'express';
import { sendResponse } from '../utils/responseHelpers';
import { issueRoomToken, LivekitRole } from '../processors/livekit/livekitService';
import { AuthRequest } from '../middlewares/authenticateJwt';
import User from '../model/UserModel';
import ErrorHandler from "../utils/ErrorHandler";

export const getLivekitToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const payload = req.user;
  if (!payload) {
    
    return next(new ErrorHandler('Not authenticated', 401));
  }

  const { roomName, role } = req.body as { roomName?: string; role?: LivekitRole };
  if (!roomName || !role) {
    return next(new ErrorHandler('roomName and role are required', 400));
  }

  const me = await User.findById(payload.userId);
  const displayName = me ? `${me.firstName} ${me.lastName}`.trim() : undefined;

  const token = await issueRoomToken({
    identity: payload.userId,
    name: displayName,
    role,
    roomName,
  });

  sendResponse(res, { token }, 'LiveKit token issued');
};
