import { Request, Response, NextFunction } from "express";
import { sendResponse } from "../utils/responseHelpers";
import ProjectFormModel, {
  IProjectFormDocument,
} from "../model/ProjectFormModel";
import User from "../model/UserModel";
import ErrorHandler from "../utils/ErrorHandler";
import ProjectModel, { IProjectDocument } from "../model/ProjectModel";
import { TagModel } from "../model/TagModel";
import { resolveToIana } from "../processors/session/sessionTimeConflictChecker";
import mongoose, { PipelineStage, Types } from "mongoose";
import {
  projectCreateAndPaymentConfirmationEmailTemplate,
  projectInfoEmailTemplate,
} from "../constants/emailTemplates";
import { sendEmail } from "../processors/sendEmail/sendVerifyAccountEmailProcessor";
import { ProjectCreateAndPaymentConfirmationEmailTemplateParams } from "../../shared/interface/ProjectInfoEmailInterface";
import ModeratorModel, { IModeratorDocument } from "../model/ModeratorModel";
import { AuthRequest } from "../middlewares/authenticateJwt";

// ! the fields you really need to keep the payload light
const PROJECT_POPULATE = [
  { path: "moderators", select: "firstName lastName email" },
  { path: "meetings", select: "title date startTime duration timeZone " },
  { path: "createdBy", select: "firstName lastName email" },
  { path: "tags", select: "title color" },
];

export const saveProgress = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { uniqueId, formData, userId } = req.body;

  if (!userId) {
    sendResponse(res, null, "User ID is required", 400);
  }

  if (!formData || Object.keys(formData).length === 0) {
    sendResponse(res, null, "Form data is required", 400);
  }

  let savedForm: IProjectFormDocument;

  if (uniqueId) {
    // Look for an existing form document by its ID
    const existingForm = await ProjectFormModel.findById(uniqueId);

    if (!existingForm) {
      // If not found, create a new form entry
      const newForm = new ProjectFormModel({
        user: userId,
        ...formData,
      });
      savedForm = await newForm.save();

      sendResponse(
        res,
        { uniqueId: savedForm._id },
        "Form not found. New progress saved successfully.",
        201
      );
    } else {
      // If found, update the existing document with the provided form data
      existingForm.set(formData);
      savedForm = await existingForm.save();

      sendResponse(
        res,
        { uniqueId: savedForm._id },
        "Progress updated successfully",
        200
      );
    }
  } else {
    // Create a new form entry if no uniqueId is provided
    const newForm = new ProjectFormModel({
      user: userId,
      ...formData,
    });
    savedForm = await newForm.save();

    sendResponse(
      res,
      { uniqueId: savedForm._id },
      "Progress saved successfully",
      201
    );
  }
};

export const createProjectByExternalAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const {
    userId,
    uniqueId,
    projectData,
    totalPurchasePrice,
    totalCreditsNeeded,
  } = req.body;

  if (!userId || !projectData) {
    throw new ErrorHandler("User ID and project data are required", 400);
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(userId).session(session);

    if (!user) throw new ErrorHandler("User not found", 404);

    if (["AmplifyTechHost", "AmplifyModerator"].includes(user.role)) {
      throw new ErrorHandler("You are not authorized to create a project", 403);
    }

    // Create the project
    // const createdProject = await ProjectModel.create(
    //   [{ ...projectData, createdBy: userId }],
    //   { session }
    // );

    // Validate defaultTimeZone presence and validity
    const displayTz = projectData?.defaultTimeZone as string | undefined;
    const ianaTz = resolveToIana(displayTz);

    if (!displayTz || !ianaTz) {
      throw new ErrorHandler(
        "A valid project time zone is required (use a listed option like '(UTC-05) Eastern Time' or a valid IANA zone).",
        400
      );
    }

    const project = new ProjectModel({
      ...projectData,
      createdBy: userId,
    } as Partial<IProjectDocument>);

    await project.save({ session });

    // 3️⃣ Add external admin as moderator
    const moderator = new ModeratorModel({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      companyName: user.companyName,
      roles: ["Admin"], // new roles array
      adminAccess: true, // if you still use this legacy flag
      projectId: project._id,
      isVerified: true,
      isActive: true,
    } as Partial<IModeratorDocument>);
    await moderator.save({ session });

    // 4️⃣ Push moderator._id into project.moderators
    project.moderators.push(moderator._id as Types.ObjectId);
    await project.save({ session });

    // Delete draft if uniqueId exists
    if (uniqueId) {
      await ProjectModel.findByIdAndDelete(uniqueId).session(session);
    }
    await session.commitTransaction();
    session.endSession();

    // Populate tags outside the transaction (optional)
    // !This should be uncommented once the tag collection is created
    // const populatedProject = await ProjectModel.findById(createdProject[0]._id).populate("tags");

    // ---- Send the confirmation email below ---- //

    // Extract the payment information (with defaults if missing)
    const purchaseAmount = totalPurchasePrice || 0;
    const creditsPurchased = totalCreditsNeeded || 0;
    // Current date as transaction date (formatted as needed)
    const transactionDate = new Date().toLocaleDateString();

    // If your user model stores a credit balance, compute the new balance; otherwise, use creditsPurchased as the balance.
    const newCreditBalance =
      (user.credits ? user.credits : 0) + creditsPurchased;

    // Prepare the parameters for the confirmation email template
    const emailParams: ProjectCreateAndPaymentConfirmationEmailTemplateParams =
      {
        firstName: user.firstName || "Customer",
        purchaseAmount,
        creditsPurchased,
        transactionDate,
        newCreditBalance,
      };

    // Build the email content using the separate template function
    const emailContent =
      projectCreateAndPaymentConfirmationEmailTemplate(emailParams);
    const emailSubject =
      "Success! Your Project Has Been Created for Amplify’s Virtual Backroom";

    // Send the email using your email processor function
    await sendEmail({
      to: user.email,
      subject: emailSubject,
      html: emailContent,
    });

    sendResponse(res, project, "Project created successfully", 201);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const emailProjectInfo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { userId, uniqueId, formData } = req.body;

  // Validate presence of required fields
  if (!userId || !uniqueId) {
    return next(new ErrorHandler("User ID and Unique ID are required", 400));
  }

  // Find user
  const user = await User.findById(userId);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Format sessions
  const formattedSessions = (formData.sessions || [])
    .map(
      (session: any, index: number) =>
        `<p>Session ${index + 1}: ${session.number} sessions - Duration: ${
          session.duration
        }</p>`
    )
    .join("");

  // Build HTML email template
  const emailContent = projectInfoEmailTemplate({
    user,
    formData,
    formattedSessions,
  });

  // Send email
  await sendEmail({
    to: "enayetflweb@gmail.com",
    subject: "New Project Information Submission",
    html: emailContent,
  });

  // Delete project form from DB
  await ProjectFormModel.findByIdAndDelete(uniqueId);

  res.status(200).json({
    success: true,
    message: "Project information emailed and progress form removed",
  });
};

export const getProjectByUserId = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { userId } = req.params;
  const {
    search = "",
    tag = "",
    status = "",
    page = 1,
    limit = 10,
    from,
    to,
    sortBy,
    sortDir,
  } = req.query;

  if (!userId) {
    return next(new ErrorHandler("User ID is required", 400));
  }

  // ── pagination params ───────────────────────────────────────
  const pageNum = Math.max(Number(page), 1);
  const limitNum = Math.max(Number(limit), 1);
  const skip = (pageNum - 1) * limitNum;
  // Convert incoming from/to to epoch millis to compare against Session.startAtEpoch
  let fromEpoch: number | undefined;
  let toEpoch: number | undefined;
  if (typeof from === "string") {
    const d = new Date(from);
    if (!isNaN(d.getTime())) fromEpoch = d.getTime();
  }
  if (typeof to === "string") {
    const d = new Date(to);
    if (!isNaN(d.getTime())) toEpoch = d.getTime();
  }

  const searchRegex = new RegExp(search as string, "i");
  const tagRegex = new RegExp(tag as string, "i");

  const baseMatch: PipelineStage.Match = {
    $match: {
      createdBy: new mongoose.Types.ObjectId(userId),
    },
  };

  const searchMatch: PipelineStage.Match = {
    $match: {
      $or: [
        { name: { $regex: searchRegex } },
        { "moderators.firstName": { $regex: searchRegex } },
        { "moderators.lastName": { $regex: searchRegex } },
        { "moderators.companyName": { $regex: searchRegex } },
      ],
    },
  };

  const tagMatch: PipelineStage.Match = {
    $match: {
      ...(tag ? { "tags.title": { $regex: tagRegex } } : {}),
    },
  };
  const aggregationPipeline: PipelineStage[] = [
    baseMatch,
    ...(status ? [{ $match: { status: status } }] : []),
    {
      $lookup: {
        from: "moderators",
        localField: "_id",
        foreignField: "projectId",
        as: "moderators",
      },
    },
    { $unwind: { path: "$moderators", preserveNullAndEmptyArrays: true } },
    searchMatch,
    {
      $lookup: {
        from: "sessions",
        localField: "meetings",
        foreignField: "_id",
        as: "meetingObjects",
      },
    },
    // Filter by sessions (meetingObjects) start time window when provided
    ...(fromEpoch || toEpoch
      ? [
          {
            $match: {
              "meetingObjects.startAtEpoch": {
                ...(fromEpoch !== undefined ? { $gte: fromEpoch } : {}),
                ...(toEpoch !== undefined ? { $lte: toEpoch } : {}),
              },
            },
          },
        ]
      : []),
    {
      $lookup: {
        from: "tags",
        localField: "tags",
        foreignField: "_id",
        as: "tags",
      },
    },
    ...(tag ? [{ $match: { "tags.title": { $regex: tagRegex } } }] : []),
    {
      $group: {
        _id: "$_id",
        doc: { $first: "$$ROOT" },
      },
    },
    { $replaceRoot: { newRoot: "$doc" } },
    // Compute earliest session startAtEpoch (if any) and sort by it, then name
    {
      $addFields: {
        earliestSession: {
          $cond: {
            if: { $gt: [{ $size: { $ifNull: ["$meetingObjects", []] } }, 0] },
            then: { $min: "$meetingObjects.startAtEpoch" },
            else: null,
          },
        },
      },
    },
    {
      $addFields: {
        earliestSession: {
          $ifNull: ["$earliestSession", Number.MAX_SAFE_INTEGER],
        },
      },
    },
    // dynamic, safe sort stage based on query params
    (() => {
      // normalize incoming sort params
      const sortByStr = typeof sortBy === "string" ? sortBy : undefined;
      const sortDirStr = sortDir === "desc" ? "desc" : "asc";
      const sortDirNum = sortDirStr === "desc" ? -1 : 1;

      // whitelist fields that are safe to sort by in aggregation
      const allowedSortFields = new Set([
        "name",
        "earliestSession",
        "createdAt",
        "status",
      ]);

      // build sort object: primary = requested, secondary = fallback
      const sortObj: Record<string, number> = {};
      if (sortByStr && allowedSortFields.has(sortByStr)) {
        if (sortByStr === "earliestSession") {
          sortObj["earliestSession"] = sortDirNum;
          // tie-breaker
          sortObj["name"] = 1;
        } else {
          // default to sorting by requested field, then earliestSession
          sortObj[sortByStr] = sortDirNum;
          sortObj["earliestSession"] = 1;
        }
      } else {
        // original default: earliestSession then name
        sortObj["earliestSession"] = 1;
        sortObj["name"] = 1;
      }

      return { $sort: sortObj } as PipelineStage;
    })(),
    { $skip: skip },
    { $limit: limitNum },
  ];

  const projects = await ProjectModel.aggregate(aggregationPipeline);

  // Separate aggregation for count
  const totalAgg: PipelineStage[] = [
    baseMatch,
    ...(status ? [{ $match: { status } }] : []),
    {
      $lookup: {
        from: "moderators",
        localField: "_id",
        foreignField: "projectId",
        as: "moderators",
      },
    },
    { $unwind: { path: "$moderators", preserveNullAndEmptyArrays: true } },
    searchMatch,
    {
      $lookup: {
        from: "sessions",
        localField: "meetings",
        foreignField: "_id",
        as: "meetingObjects",
      },
    },
    ...(fromEpoch || toEpoch
      ? [
          {
            $match: {
              "meetingObjects.startAtEpoch": {
                ...(fromEpoch !== undefined ? { $gte: fromEpoch } : {}),
                ...(toEpoch !== undefined ? { $lte: toEpoch } : {}),
              },
            },
          },
        ]
      : []),
    {
      $lookup: {
        from: "tags",
        localField: "tags",
        foreignField: "_id",
        as: "tags",
      },
    },
    ...(tag ? [tagMatch] : []),
    {
      $group: {
        _id: "$_id",
      },
    },
    {
      $count: "total",
    },
  ];

  const totalCountAgg = await ProjectModel.aggregate(totalAgg);
  const totalCount = totalCountAgg[0]?.total || 0;
  const totalPages = Math.ceil(totalCount / limitNum);

  const meta = {
    page: pageNum,
    limit: limitNum,
    totalItems: totalCount,
    totalPages,
    hasPrev: pageNum > 1,
    hasNext: pageNum < totalPages,
  };

  // Send the result back to the frontend using your sendResponse utility
  sendResponse(res, projects, "Projects retrieved successfully", 200, meta);
};

export const getProjectById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { projectId } = req.params;

  if (!projectId) {
    return next(new ErrorHandler("Project ID is required", 400));
  }

  // findById + populate all related paths
  const project = await ProjectModel.findById(projectId)
    .populate(PROJECT_POPULATE)
    .exec();

  if (!project) {
    return next(new ErrorHandler("Project not found", 404));
  }

  sendResponse(res, project, "Project retrieved successfully", 200);
};

/**
 * GET /api/v1/projects/for-user/:userId
 * Returns projects where the user is a team member (Moderator collection) based on email.
 */
export const getProjectsForUserMembership = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { userId } = req.params as { userId?: string };

  if (!userId) return next(new ErrorHandler("User ID is required", 400));

  const user = await User.findById(userId).lean();
  if (!user) return next(new ErrorHandler("User not found", 404));

  // Find all moderator rows where email matches (active only)
  const mods = await ModeratorModel.find({ email: user.email, isActive: true })
    .select("projectId")
    .lean();
  const projectIds = Array.from(new Set(mods.map((m) => String(m.projectId))));

  if (projectIds.length === 0) {
    sendResponse(res, [], "No membership projects", 200, {
      totalItems: 0,
      totalPages: 0,
      page: 1,
      limit: 0,
      hasPrev: false,
      hasNext: false,
    });
  }

  const projects = await ProjectModel.find({
    _id: { $in: projectIds },
    // exclude projects created by the same user to avoid duplicates on dashboard
    createdBy: { $ne: user._id },
  })
    .populate(PROJECT_POPULATE)
    .lean();

  sendResponse(res, projects, "Membership projects retrieved", 200, {
    totalItems: projects.length,
    totalPages: 1,
    page: 1,
    limit: projects.length,
    hasPrev: false,
    hasNext: false,
  });
};

export const editProject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Expecting projectId in body along with the fields to be updated.
  const { projectId, internalProjectName, description, defaultTimeZone } =
    req.body;

  if (!projectId) {
    return next(new ErrorHandler("Project ID is required", 400));
  }

  // Ensure at least one field to update is provided.
  if (!internalProjectName && !description) {
    return next(new ErrorHandler("No update data provided", 400));
  }

  // Find the project by its ID.
  const project = await ProjectModel.findById(projectId);
  if (!project) {
    return next(new ErrorHandler("Project not found", 404));
  }

  // Disallow timezone updates (locked)
  if (defaultTimeZone !== undefined) {
    return next(
      new ErrorHandler("Project timezone is locked and cannot be changed", 400)
    );
  }

  // Update only the allowed fields if they are provided.
  if (internalProjectName) {
    project.internalProjectName = internalProjectName;
  }
  if (description) {
    project.description = description;
  }

  // Save the updated project.
  const updatedProject = await project.save();
  sendResponse(res, updatedProject, "Project updated successfully", 200);
};

export const toggleRecordingAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { projectId } = req.body;

  if (!projectId) {
    return next(new ErrorHandler("Project ID is required", 400));
  }

  // Find the project by its ID
  const project = await ProjectModel.findById(projectId);
  if (!project) {
    return next(new ErrorHandler("Project not found", 404));
  }

  // Toggle the recordingAccess field
  project.recordingAccess = !project.recordingAccess;

  // Save the updated project
  const updatedProject = await project.save();
  sendResponse(
    res,
    updatedProject,
    "Recording access toggled successfully",
    200
  );
};

export const updateProjectTags = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      projectId,
      tagsToAdd = [],
      tagsToRemove = [],
    } = req.body as {
      projectId: string;
      tagsToAdd?: string[];
      tagsToRemove?: string[];
    };

    if (!projectId) {
      return next(new ErrorHandler("Project ID is required", 400));
    }

    const project = await ProjectModel.findById(projectId);
    if (!project) {
      return next(new ErrorHandler("Project not found", 404));
    }

    // Ensure tags exist before adding
    if (Array.isArray(tagsToAdd) && tagsToAdd.length > 0) {
      const validAddIds = await TagModel.find({
        _id: { $in: tagsToAdd },
      }).distinct("_id");
      if (validAddIds.length > 0) {
        await ProjectModel.updateOne(
          { _id: projectId },
          { $addToSet: { tags: { $each: validAddIds } } }
        );
      }
    }

    if (Array.isArray(tagsToRemove) && tagsToRemove.length > 0) {
      await ProjectModel.updateOne(
        { _id: projectId },
        { $pull: { tags: { $in: tagsToRemove } } }
      );
    }

    const updated = await ProjectModel.findById(projectId)
      .populate(PROJECT_POPULATE)
      .exec();

    sendResponse(res, updated, "Project tags updated", 200);
  } catch (error) {
    next(error);
  }
};
