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

const formatDisplayName = (
  firstName?: string | null,
  lastName?: string | null,
  fallback?: string | null
): string | undefined => {
  const first = (firstName || "").trim();
  const last = (lastName || "").trim();

  if (first) {
    if (last) {
      const lastInitial = last.charAt(0).toUpperCase();
      return lastInitial ? `${first} ${lastInitial}` : first;
    }
    return first;
  }

  if (last && !first) {
    return last;
  }

  const safeFallback = (fallback || "").trim();
  return safeFallback || undefined;
};

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
  const displayName = me
    ? formatDisplayName(
        me.firstName,
        me.lastName,
        `${me.firstName || ""} ${me.lastName || ""}`.trim() || me.email || null
      )
    : undefined;

  const token = await issueRoomToken({
    identity: payload.userId,
    name: displayName,
    role,
    roomName,
    email: me?.email || undefined,
    firstName: me?.firstName || undefined,
    lastName: me?.lastName || undefined,
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

    // Look up participant from database to get firstName/lastName
    let firstName: string | undefined;
    let lastName: string | undefined;
    try {
      const { LiveSessionModel } = await import("../model/LiveSessionModel");
      const live = await LiveSessionModel.findOne({ sessionId }).lean();
      if (live) {
        // Check participantsList first (already admitted)
        const participant = live.participantsList?.find(
          (p) => (p.email || "").toLowerCase() === email.toLowerCase()
        );
        if (participant) {
          firstName = participant.firstName;
          lastName = participant.lastName;
        } else {
          // Check participantWaitingRoom (still waiting)
          const waiting = live.participantWaitingRoom?.find(
            (p) => (p.email || "").toLowerCase() === email.toLowerCase()
          );
          if (waiting) {
            firstName = waiting.firstName;
            lastName = waiting.lastName;
          }
        }
      }
    } catch (err) {
      // Non-critical: continue without firstName/lastName
      console.error("Failed to lookup firstName/lastName for LiveKit token", err);
    }

    const formattedName =
      formatDisplayName(firstName, lastName, name) || name || email;

    const token = await issueRoomToken({
      identity: participantIdentity(sessionId, email),
      name: formattedName,
      role: "Participant",
      roomName: sessionId,
      email,
      firstName,
      lastName,
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
