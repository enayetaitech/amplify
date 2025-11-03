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

// Public endpoint for observers (no authentication required)
export const getObserverLivekitToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { sessionId } = req.params;
  const { name, email } = req.body as { name?: string; email?: string };

  if (!sessionId) {
    return next(new ErrorHandler("sessionId is required", 400));
  }

  // Generate a stable identity from email if provided, otherwise use random
  const identity = email
    ? participantIdentity(sessionId, email)
    : `observer_${sessionId}_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const token = await issueRoomToken({
    identity,
    name: name || email || "Observer",
    role: "Observer",
    roomName: sessionId,
    email: email || undefined,
  });

  sendResponse(res, { token }, "Observer LiveKit token issued");
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
  } catch (err: unknown) {
    return next(
      new ErrorHandler(
        err instanceof Error ? err.message : "Invalid/expired admitToken",
        401
      )
    );
  }
};
