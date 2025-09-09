import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import ErrorHandler from "../utils/ErrorHandler";
import { sendResponse } from "../utils/responseHelpers";
import {
  enqueueUser,
  createLiveSession,
} from "../processors/liveSession/sessionService";
import { SessionModel } from "../model/SessionModel";
import ProjectModel from "../model/ProjectModel";
import { LiveSessionModel } from "../model/LiveSessionModel";

type JoinRole = "Participant" | "Observer" | "Moderator" | "Admin";

export const enqueue = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sessionId, name, email, role, passcode } = req.body as {
      sessionId?: string;
      name?: string;
      email?: string;
      role?: JoinRole;
      passcode?: string;
    };

    // Validate required fields
    if (!sessionId || !name || !email || !role) {
      return next(
        new ErrorHandler("sessionId, name, email, and role are required", 400)
      );
    }

    const allowedRoles: JoinRole[] = [
      "Participant",
      "Observer",
      "Moderator",
      "Admin",
    ];
    if (!allowedRoles.includes(role)) {
      return next(new ErrorHandler("Invalid role", 400));
    }

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return next(new ErrorHandler("Invalid session id", 400));
    }

    // Ensure session exists and load project for passcode verification
    const session = await SessionModel.findById(sessionId).lean();
    if (!session) {
      return next(new ErrorHandler("Session not found", 404));
    }

    const project = await ProjectModel.findById(session.projectId).lean();
    if (!project) {
      return next(new ErrorHandler("Project not found", 404));
    }

    // Observer requires project passcode
    if (role === "Observer") {
      if (!passcode) {
        return next(
          new ErrorHandler("Passcode is required for observers", 400)
        );
      }
      if (project.projectPasscode !== passcode) {
        return next(new ErrorHandler("Invalid observer passcode", 401));
      }
    }

    // Ensure a LiveSession doc exists (create if missing)
    await createLiveSession(sessionId);

    // Check live flags
    const live = await LiveSessionModel.findOne({ sessionId }).lean();
    const isStreaming = !!live?.streaming;

    // Enqueue user appropriately
    await enqueueUser(sessionId, { name, email, role });

    // Determine action for client
    let action: "waiting_room" | "stream" = "waiting_room";
    if (
      (role === "Observer" || role === "Moderator" || role === "Admin") &&
      isStreaming
    ) {
      action = "stream";
    }

    sendResponse(res, { action, sessionId }, "Enqueued", 200);
    return;
  } catch (err) {
    next(err);
  }
};
