import { Request, Response, NextFunction } from "express";
import ModeratorModel, { IModeratorDocument } from "../model/ModeratorModel";
import { sendResponse } from "../utils/responseHelpers";
import ErrorHandler from "../utils/ErrorHandler";
import ProjectModel from "../model/ProjectModel";
import User from "../model/UserModel";

import config from "../config";
import { sendEmail } from "../processors/sendEmail/sendVerifyAccountEmailProcessor";
import {
  moderatorAddedEmailTemplate,
  invitationToRegisterEmailTemplate,
} from "../constants/emailTemplates";
import mongoose, { PipelineStage, Types } from "mongoose";

const ALLOWED_ROLES = ["Admin", "Moderator", "Observer"] as const;
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
  const {
    firstName,
    lastName,
    email,
    companyName,
    adminAccess,
    roles,
    projectId,
  } = req.body;

  // 1️⃣ Validate required fields
  if (
    !firstName ||
    !lastName ||
    !email ||
    !companyName ||
    !projectId ||
    !Array.isArray(roles)
  ) {
    return next(
      new ErrorHandler(
        "firstName, lastName, email, companyName, roles[] and projectId are required",
        400
      )
    );
  }

  // 1a️⃣ Validate roles values
  for (const r of roles) {
    if (!ALLOWED_ROLES.includes(r as (typeof ALLOWED_ROLES)[number])) {
      return next(
        new ErrorHandler(
          `Invalid role "${r}". Must be one of: ${ALLOWED_ROLES.join(", ")}`,
          400
        )
      );
    }
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

  const session = await mongoose.startSession();
  session.startTransaction();
  let moderator: IModeratorDocument;
  try {
    const existingUser = await User.findOne({ email }).session(session);
    // 5️⃣ Create and save the new moderator document
    moderator = new ModeratorModel({
      firstName,
      lastName,
      email,
      companyName,
      roles,
      adminAccess: !!adminAccess,
      projectId,
      isVerified: !!existingUser,
    });

    // 2️⃣ Save it, passing the session as part of save-options
    await moderator.save({ session });

    // 2️⃣ push into project's moderators array in the same session
    project.moderators.push(moderator._id as Types.ObjectId);
    await project.save({ session });

    // 3️⃣ commit the transaction
    await session.commitTransaction();
  } catch (err) {
    console.error("error adding moderator", err);
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }

  const addedByName = `${creator.firstName} ${creator.lastName}`;

  // 6️⃣ Send either login notification (existing user) or registration invitation (new email)
  const existingUserNow = await User.findOne({ email });
  if (existingUserNow) {
    const emailHtml = moderatorAddedEmailTemplate({
      moderatorName: firstName,
      addedByName,
      projectName: project.name,
      loginUrl: `${config.frontend_base_url}/login`,
      roles,
    });

    await sendEmail({
      to: email,
      subject: `You’ve been added to "${project.name}"`,
      html: emailHtml,
    });
  } else {
    const registerUrl = `${
      config.frontend_base_url
    }/create-user?email=${encodeURIComponent(email)}`;
    const inviteHtml = invitationToRegisterEmailTemplate({
      inviteeFirstName: firstName,
      projectName: project.name,
      registerUrl,
      roles,
    });
    await sendEmail({
      to: email,
      subject: `Invitation to join "${project.name}" on Amplify`,
      html: inviteHtml,
    });
  }

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
  const { firstName, lastName, email, companyName, adminAccess, isActive } =
    req.body;

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
          "Member is verified: only admin access and active status may be updated",
          400
        )
      );
    }

    if (typeof isActive === "boolean") {
      moderator.isActive = isActive;
    } else {
      return next(
        new ErrorHandler(
          "Member is verified: only admin access and active status may be updated",
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
    if (typeof isActive === "boolean") moderator.isActive = isActive;
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

  // pagination
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.max(Number(req.query.limit) || 10, 1);
  const skip = (page - 1) * limit;

  // 1) count total active/inactive moderators for meta
  const total = await ModeratorModel.countDocuments({ projectId });

  // 2) aggregation: compute roleRank, then sort & paginate
  const moderators = await ModeratorModel.aggregate<IModeratorDocument>([
    // only this project
    { $match: { projectId: new Types.ObjectId(projectId) } },

    // add a numeric rank based on roles & isActive
    {
      $addFields: {
        roleRank: {
          $switch: {
            branches: [
              // 1. Admin only
              {
                case: {
                  $and: [
                    { $eq: [{ $size: "$roles" }, 1] },
                    { $in: ["Admin", "$roles"] },
                    { $eq: ["$isActive", true] },
                  ],
                },
                then: 1,
              },
              // 2. Admin + Moderator
              {
                case: {
                  $and: [
                    { $eq: [{ $size: "$roles" }, 2] },
                    { $in: ["Admin", "$roles"] },
                    { $in: ["Moderator", "$roles"] },
                    { $eq: ["$isActive", true] },
                  ],
                },
                then: 2,
              },
              // 3. Admin + Moderator + Observer
              {
                case: {
                  $and: [
                    { $eq: [{ $size: "$roles" }, 3] },
                    { $in: ["Admin", "$roles"] },
                    { $in: ["Moderator", "$roles"] },
                    { $in: ["Observer", "$roles"] },
                    { $eq: ["$isActive", true] },
                  ],
                },
                then: 3,
              },
              // 4. Moderator only
              {
                case: {
                  $and: [
                    { $eq: [{ $size: "$roles" }, 1] },
                    { $in: ["Moderator", "$roles"] },
                    { $eq: ["$isActive", true] },
                  ],
                },
                then: 4,
              },
              // 5. Moderator + Observer
              {
                case: {
                  $and: [
                    { $eq: [{ $size: "$roles" }, 2] },
                    { $in: ["Moderator", "$roles"] },
                    { $in: ["Observer", "$roles"] },
                    { $eq: ["$isActive", true] },
                  ],
                },
                then: 5,
              },
              // 6. Observer only
              {
                case: {
                  $and: [
                    { $eq: [{ $size: "$roles" }, 1] },
                    { $in: ["Observer", "$roles"] },
                    { $eq: ["$isActive", true] },
                  ],
                },
                then: 6,
              },
              // 7. De‑activated (any roles but isActive=false)
              {
                case: { $eq: ["$isActive", false] },
                then: 7,
              },
              // 8. Active but no roles assigned
              {
                case: {
                  $and: [
                    { $eq: ["$isActive", true] },
                    { $eq: [{ $size: "$roles" }, 0] },
                  ],
                },
                then: 8,
              },
            ],
            // any unexpected combination
            default: 9,
          },
        },
      },
    },

    // finally sort by our custom rank, then alphabetically by lastName
    { $sort: { roleRank: 1, lastName: 1 } },

    // pagination
    { $skip: skip },
    { $limit: limit },
  ]);

  // build meta
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
