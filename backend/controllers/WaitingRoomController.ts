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
import ModeratorModel from "../model/ModeratorModel";
import User from "../model/UserModel";
import { invitationToRegisterEmailTemplate } from "../constants/emailTemplates";
import config from "../config";

type JoinRole = "Participant" | "Observer" | "Moderator" | "Admin";

export const enqueue = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sessionId, firstName, lastName, email, role, passcode } =
      req.body as {
        sessionId?: string;
        firstName?: string;
        lastName?: string;
        email?: string;
        role?: JoinRole;
        passcode?: string;
      };

    // Validate required fields
    if (!sessionId || !firstName || !lastName || !email || !role) {
      return next(
        new ErrorHandler(
          "sessionId, firstName, lastName, email, and role are required",
          400
        )
      );
    }

    // Combine firstName and lastName for name field
    const firstNameTrimmed = firstName.trim();
    const lastNameTrimmed = lastName.trim();
    const name = `${firstNameTrimmed} ${lastNameTrimmed}`;

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

    // Build formatted device info from middleware (if present)
    const di = (
      req as unknown as {
        deviceInfo?: {
          ip?: string;
          deviceType?: string;
          platform?: string;
          browser?: string;
          location?: {
            city?: string | null;
            region?: string | null;
            country?: string | null;
          };
        };
      }
    ).deviceInfo;

    const locationString = (() => {
      const parts: string[] = [];
      if (di?.location?.city) parts.push(String(di.location.city));
      if (di?.location?.region) parts.push(String(di.location.region));
      if (di?.location?.country) parts.push(String(di.location.country));
      return parts.join(", ");
    })();

    const deviceInfo = di
      ? {
          ip: di.ip || "",
          deviceType: di.deviceType || "",
          platform: di.platform || "",
          browser: di.browser || "",
          location: locationString,
        }
      : undefined;

    // Enqueue user appropriately (also persists activity with device info)
    await enqueueUser(
      sessionId,
      {
        firstName: firstNameTrimmed,
        lastName: lastNameTrimmed,
        name,
        email,
        role,
      },
      deviceInfo
    );

    // Auto-add Observer to project team if not already present
    if (role === "Observer") {
      const existingMember = await ModeratorModel.findOne({
        email: emailNormalized(email),
        projectId: project._id,
      });

      if (!existingMember) {
        const existingUser = await User.findOne({
          email: emailNormalized(email),
        });
        // Fallback company name: project owner's company when the joining user has none
        let fallbackCompany = "";
        try {
          const owner = await User.findById(project.createdBy);
          fallbackCompany = owner?.companyName || "";
        } catch {}

        const created = await ModeratorModel.create({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: emailNormalized(email),
          companyName: existingUser?.companyName || fallbackCompany,
          roles: ["Observer"],
          adminAccess: false,
          projectId: project._id,
          isVerified: !!existingUser,
          isActive: true,
        });

        await ProjectModel.updateOne(
          { _id: project._id },
          { $addToSet: { moderators: created._id } }
        );

        if (!existingUser) {
          const registerUrl = `${
            config.frontend_base_url
          }/create-user?email=${encodeURIComponent(emailNormalized(email))}`;
          const inviteHtml = invitationToRegisterEmailTemplate({
            inviteeFirstName: firstName.trim(),
            projectName: project.name,
            registerUrl,
            roles: ["Observer"],
          });
          try {
            // reuse existing sendEmail processor
            const { sendEmail } = await import(
              "../processors/sendEmail/sendVerifyAccountEmailProcessor"
            );
            await sendEmail({
              to: emailNormalized(email),
              subject: `Invitation to join "${project.name}" on Amplify`,
              html: inviteHtml,
            });
          } catch (e) {
            try {
              console.error("Failed to send observer invite email", e);
            } catch {}
          }
        }
      }
    }

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

function emailNormalized(e: string) {
  return e.trim().toLowerCase();
}
