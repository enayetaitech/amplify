import { Request, Response, NextFunction } from "express";
import ModeratorModel from "../model/ModeratorModel";
import { sendResponse } from "../utils/ResponseHelpers";
import ErrorHandler from "../../shared/utils/ErrorHandler";
import ProjectModel from "../model/ProjectModel";
import User from "../model/UserModel";

import config from "../config";
import { sendEmail } from "../processors/sendEmail/SendVerifyAccountEmailProcessor";
import { moderatorAddedEmailTemplate } from "../constants/emailTemplates";

/**
 * Controller to add a new moderator to a project.
 * - Validates input
 * - Prevents duplicate moderators on the same project
 * - Verifies project existence
 * - Looks up the project owner’s name
 * - Saves the new moderator
 * - Sends a “you’ve been added” email
 * - Returns a standardized success response
 */
export const addModerator = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { firstName, lastName, email, companyName, adminAccess, projectId } =
    req.body;

  // 1️⃣ Validate required fields
  if (!firstName || !lastName || !email || !companyName || !projectId) {
    return next(
      new ErrorHandler(
        "firstName, lastName, email, companyName, and projectId are required",
        400
      )
    );
  }

  // 2️⃣ Prevent adding the same email twice to a single project
  const alreadyModerator = await ModeratorModel.findOne({ email, projectId });
  if (alreadyModerator) {
    return next(
      new ErrorHandler(
        "A moderator with the same email is already assigned to this project",
        409
      )
    );
  }

  // 3️⃣ Fetch the target project by ID
  const project = await ProjectModel.findById(projectId);
  if (!project) {
    return next(new ErrorHandler("Project not found", 404));
  }

  // 4️⃣ Lookup the project owner (creator) to get their full name
  const creator = await User.findById(project.createdBy);
  if (!creator) {
    return next(new ErrorHandler("Project owner not found", 500));
  }

  const addedByName = `${creator.firstName} ${creator.lastName}`;

  // 5️⃣ Create and save the new moderator document
  const moderator = new ModeratorModel({
    firstName,
    lastName,
    email,
    companyName,
    adminAccess: adminAccess || false,
    projectId,
  });

  await moderator.save();

  // 6️⃣ Build and send the notification email
  const emailHtml = moderatorAddedEmailTemplate({
    moderatorName: firstName,
    addedByName,
    projectName: project.name,
    loginUrl: `${config.frontend_base_url}/login`,
  });

  await sendEmail({
    to: email,
    subject: `You’ve been added to "${project.name}"`,
    html: emailHtml,
  });

  // 7️⃣ Respond to the API client with the newly created moderator
  sendResponse(res, moderator, "Moderator added successfully", 201);
};


/**
 * Edit a moderator’s details.
 * - If the moderator.isVerified === true, only adminAccess can be updated.
 * - Otherwise, firstName, lastName, email, companyName, and adminAccess are all editable.
 */
export const editModerator = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { moderatorId } = req.params;
  const { firstName, lastName, email, companyName, adminAccess } = req.body;

  // 1️⃣ Find the moderator
  const moderator = await ModeratorModel.findById(moderatorId);
  if (!moderator) {
    return next(new ErrorHandler("Moderator not found", 404));
  }

  // 2️⃣ Determine which fields may be updated
  if (moderator.isVerified) {
    // Once verified, only adminAccess can change
    if (typeof adminAccess === "boolean") {
      moderator.adminAccess = adminAccess;
    } else {
      return next(
        new ErrorHandler(
          "Moderator is verified: only adminAccess may be updated",
          400
        )
      );
    }
  } else {
    // Not yet verified: allow personal fields + adminAccess
    if (firstName !== undefined) moderator.firstName = firstName;
    if (lastName !== undefined) moderator.lastName = lastName;
    if (email !== undefined) moderator.email = email;
    if (companyName !== undefined) moderator.companyName = companyName;
    if (typeof adminAccess === "boolean") moderator.adminAccess = adminAccess;
  }

  // 3️⃣ Save and respond
  await moderator.save();
  sendResponse(res, moderator, "Moderator updated successfully", 200);
};

/**
 * Get a single moderator by ID.
 */
export const getModeratorById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { moderatorId } = req.params;
  const moderator = await ModeratorModel.findById(moderatorId);
  if (!moderator) {
    return next(new ErrorHandler("Moderator not found", 404));
  }
  sendResponse(res, moderator, "Moderator retrieved successfully", 200);
};

/**
 * Toggle a moderator’s active status.
 * - If currently active, deactivates them.
 * - If currently inactive, reactivates them.
 */
export const toggleModeratorStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { moderatorId } = req.params;

  // 1️⃣ Find the moderator
  const moderator = await ModeratorModel.findById(moderatorId);
  if (!moderator) {
    return next(new ErrorHandler("Moderator not found", 404));
  }

  // 2️⃣ Flip the flag
  moderator.isActive = !moderator.isActive;

  // 3️⃣ Save and respond
  await moderator.save();
  const status = moderator.isActive ? "re-activated" : "deactivated";
  sendResponse(res, moderator, `Moderator ${status} successfully`, 200);
};

/**
 * Get all moderators for a given project.
 */
export const getModeratorsByProjectId = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { projectId } = req.params;
  
      /* ── pagination params ────────────────────────────── */
      const page  = Math.max(Number(req.query.page)  || 1, 1);   
      const limit = Math.max(Number(req.query.limit) || 10, 1);  
      const skip  = (page - 1) * limit;
  
      /* ── parallel queries: data + count ───────────────── */
      const [moderators, total] = await Promise.all([
        ModeratorModel.find({ projectId })
          .sort({ name: 1 })      
          .skip(skip)
          .limit(limit)
          .lean(),     
        ModeratorModel.countDocuments({ projectId }),
      ]);
  
      /* ── meta payload ─────────────────────────────────── */
      const totalPages = Math.ceil(total / limit);
      const meta = {
        page,
        limit,
        totalItems: total,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages,
      };
  
      sendResponse(res, moderators, "Moderators for project retrieved", 200, meta);

};