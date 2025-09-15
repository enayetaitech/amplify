// src/controllers/LivekitController.ts
import { Request, Response, NextFunction } from "express";
import { sendResponse } from "../utils/responseHelpers";
import {
  issueRoomToken,
  LivekitRole,
} from "../processors/livekit/livekitService";
import { AuthRequest } from "../middlewares/authenticateJwt";
import User from "../model/UserModel";
import ErrorHandler from "../utils/ErrorHandler";
import {
  participantIdentity,
  verifyAdmitToken,
} from "../processors/livekit/admitTokenService";

export const getLivekitToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const payload = req.user;
  if (!payload) {
    return next(new ErrorHandler("Not authenticated", 401));
  }

  const { roomName, role } = req.body as {
    roomName?: string;
    role?: LivekitRole;
  };
  if (!roomName || !role) {
    return next(new ErrorHandler("roomName and role are required", 400));
  }

  const me = await User.findById(payload.userId);
  const displayName = me ? `${me.firstName} ${me.lastName}`.trim() : undefined;

  const token = await issueRoomToken({
    identity: payload.userId,
    name: displayName,
    role,
    roomName,
    email: me?.email || undefined,
  });

  sendResponse(res, { token }, "LiveKit token issued");
};

export const exchangeAdmitForLivekitToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { admitToken } = req.body as { admitToken?: string };
  if (!admitToken) return next(new ErrorHandler("admitToken required", 400));

  try {
    const { sessionId, email, name } = verifyAdmitToken(admitToken);

    const token = await issueRoomToken({
      identity: participantIdentity(sessionId, email),
      name,
      role: "Participant",
      roomName: sessionId,
      email,
    });

    sendResponse(res, { token }, "LiveKit token issued");
  } catch (err: any) {
    return next(
      new ErrorHandler(err?.message || "Invalid/expired admitToken", 401)
    );
  }
};
