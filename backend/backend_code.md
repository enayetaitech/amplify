---
// src/config/nodemailer.config.ts
import nodemailer from 'nodemailer';
import config from "./index"
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.SMTP_USER,
    pass: config.SMTP_PASS,
  },
});


export default transporter;


---
// src/config/db.ts
import mongoose from "mongoose";
import config from "./index";

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(config.database_url as string);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error}`);
    process.exit(1);
  }
};

export default connectDB;


---
// src/config/index.ts

import dotenv from "dotenv";
dotenv.config();


if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  throw new Error("Both JWT_SECRET and JWT_REFRESH_SECRET must be set");
}

export default {
  port: process.env.PORT,
  database_url: process.env.MONGO_URI,
  NODE_ENV: process.env.NODE_ENV,
  
  jwt_secret: process.env.JWT_SECRET,
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET, 

  jwt_access_token_expires_in : process.env.ACCESS_TOKEN_EXPIRES_IN!,
  jwt_refresh_token_expires_in : process.env.REFRESH_TOKEN_EXPIRES_IN!,


  session_secret: process.env.SESSION_SECRET,
  
  frontend_base_url: process.env.FRONTEND_BASE_URL,
  
  cloudinary_cloud_name: process.env.CLOUDINARY_NAME,
  cloudinary_api_key: process.env.CLOUDINARY_API_KEY,
  cloudinary_api_secret: process.env.CLOUDINARY_SECRET,
  
  next_payment_gateway_public_key: process.env.NEXT_PAYMENT_GATEWAY_PUBLIC_KEY,
  stripe_secret_key: process.env.STRIPE_SECRET_KEY,
  
  s3_access_key: process.env.S3_ACCESS_KEY,
  s3_secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
  s3_bucket_name: process.env.S3_BUCKET_NAME,
  s3_bucket_region: process.env.S3_BUCKET_REGION,
  
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,

  SMTP_USER:process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM
};


---
// src/constants/emailTemplates.ts

import config from "../config/index";
import { ProjectCreateAndPaymentConfirmationEmailTemplateParams, TemplateParams } from "../../shared/interface/ProjectInfoEmailInterface"
import { ModeratorAddedEmailParams} from "../../shared/interface/ModeratorAddedEmailInterface"

export const verificationEmailTemplate = (name: string, verificationLink : string): string => `
  <p>Dear ${name},</p>
  <p>Thank you for signing up to host your project on the Amplify Research Virtual Backroom platform. Please click the link below to verify your account information:</p>
   <p style="text-align: center; margin: 24px 0;">
      <a
        href="${verificationLink }"
        style="
          background-color:  #FC6E15;
          color: #ffffff;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 4px;
          display: inline-block;
          font-weight: bold;
        "
      >
        Verify Your Account
      </a>
    </p>
  <p>You will not be able to set up project details or conduct any sessions until this step is complete, so we encourage you to do this immediately upon receipt of this email.</p>
  <p>Thank you!</p>
  <p>The Amplify Team</p>
`;


export const resetPasswordEmailTemplate = (name: string, token: string): string => `
  <p>Hi ${name},</p>
  <p>Please copy the link below to reset your password:</p>
  <p>
    <a href="${process.env.FRONTEND_BASE_URL}/reset-password?token=${token}">
      Reset Your Password
    </a>
  </p>
  <p>If you did not request a password reset, please ignore this email.</p>
  <p>Thank you!</p>
  <p>The Amplify Team</p>
`;

export const projectInfoEmailTemplate = ({ 
  user,
  formData,
  formattedSessions,
}: TemplateParams): string => `
  <h2>Project Information</h2>
  <p><strong>First Name:</strong> ${user.firstName}</p>
  <p><strong>Last Name:</strong> ${user.lastName}</p>
  <p><strong>Email:</strong> ${user.email}</p>
  <h3>Form Data:</h3>
  <p><strong>Service:</strong> ${formData.service}</p>
  <p><strong>Add-Ons:</strong> ${formData.addOns?.join(", ")}</p>
  <p><strong>Market:</strong> ${formData.respondentCountry}</p>
  <p><strong>Language:</strong> ${formData.respondentLanguage}</p>
  <h4>Sessions:</h4>
  ${formattedSessions}
  <p><strong>First Date of Streaming:</strong> ${formData.firstDateOfStreaming}</p>
  <p><strong>Respondents per Session:</strong> ${formData.respondentsPerSession}</p>
  <p><strong>Number of Sessions:</strong> ${formData.numberOfSessions}</p>
  <p><strong>Session Length:</strong> ${formData.sessionLength}</p>
  <p><strong>Pre-Work Details:</strong> ${formData.preWorkDetails}</p>
  <p><strong>Selected Language:</strong> ${formData.selectedLanguage}</p>
  <p><strong>Additional Info:</strong> ${formData.additionalInfo}</p>
  <p class="mt-4">The Amplify Team</p>
`;

export const projectCreateAndPaymentConfirmationEmailTemplate = ({
  firstName,
  purchaseAmount,
  creditsPurchased,
  transactionDate,
  newCreditBalance,
}: ProjectCreateAndPaymentConfirmationEmailTemplateParams): string => `
  <p>Dear ${firstName || "Customer"},</p>
  <p>
    Thank you for purchasing credit for Amplify’s Virtual Backroom. Your transaction has been successfully processed,
    and the credits have been added to your account.
  </p>
  <p><strong>Transaction Details:</strong></p>
  <ul>
    <li>Purchase Amount: $${purchaseAmount}</li>
    <li>Number of Credits: ${creditsPurchased}</li>
    <li>Transaction Date: ${transactionDate}</li>
    <li>New Credit Balance: ${newCreditBalance}</li>
  </ul>
  <p>
    You can now access and use your credits for our Virtual Backroom services at any time. If you have any questions or need assistance,
    please don’t hesitate to reach out to our support team at support@amplifyresearch.com.
  </p>
  <p>Cheers!</p>
  <p>The Amplify Team</p>
`;

export const moderatorAddedEmailTemplate = ({ 
  moderatorName,
  addedByName,
  projectName,
  loginUrl,
  roles
}: ModeratorAddedEmailParams): string => { 
  const list = roles.length > 1
    ? roles.slice(0, -1).join(", ") + " and " + roles.slice(-1)
    : roles[0];
  const roleWord = roles.length > 1 ? "roles" : "role";
  return `
  <p>Hi ${moderatorName},</p>

  <p>${addedByName} has just assigned you the following ${roleWord} on the project <strong>"${projectName}"</strong> in the Amplify platform.</p>

   <ul>
      ${roles.map(r => `<li>${r}</li>`).join("\n")}
    </ul>

  <p>You can log in to your account here to view and manage your permissions:</p>
  <p><a href="${loginUrl}">Go to Amplify Dashboard</a></p>

  <p>If you have any questions, feel free to reach out to support@amplifyresearch.com.</p>

  <p>Cheers,<br/>The Amplify Team</p>
`;
}



---
// src/constants/roles.ts
export enum Roles {
  Admin = "Admin",
  Participant = "Participant",
  Moderator = "Moderator",
  Observer = "Observer",
  AmplifyAdmin = "AmplifyAdmin",
  AmplifyModerator = "AmplifyModerator",
  AmplifyTechHost = "AmplifyTechHost",
  AmplifyObserver = "AmplifyObserver",
  AmplifyParticipant = "AmplifyParticipant",
  SuperAdmin = "SuperAdmin",
}


---
// src/controllers/LiveSessionController.ts

import { Request, Response, NextFunction } from "express";
import { sendResponse } from "../utils/responseHelpers";
import * as sessionService from "../processors/liveSession/sessionService";

export const startSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { sessionId } = req.params;
  const live = await sessionService.startSession(sessionId);
  sendResponse(res, live, "Meeting started", 200);
};

export const endSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { sessionId } = req.params;
  const live = await sessionService.endSession(sessionId);
  sendResponse(res, { sessionId: live.sessionId }, "Meeting ended", 200);
};

export const getSessionHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { sessionId } = req.params;
  const history = await sessionService.getSessionHistory(sessionId);
  sendResponse(res, history, "Session history retrieved", 200);
};


---
// src/controllers/ModeratorController.ts

import { Request, Response, NextFunction } from "express";
import ModeratorModel, { IModeratorDocument } from "../model/ModeratorModel";
import { sendResponse } from "../utils/responseHelpers";
import ErrorHandler from "../utils/ErrorHandler";
import ProjectModel from "../model/ProjectModel";
import User from "../model/UserModel";

import config from "../config";
import { sendEmail } from "../processors/sendEmail/sendVerifyAccountEmailProcessor";
import { moderatorAddedEmailTemplate } from "../constants/emailTemplates";
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

  // console.log(req.body, project, creator) 

  const session = await mongoose.startSession();
  session.startTransaction();
  let moderator: IModeratorDocument;
  // console.log('let moderator', moderator)
  try {
    // 5️⃣ Create and save the new moderator document
    moderator = new ModeratorModel({
      firstName,
      lastName,
      email,
      companyName,
      roles,
      adminAccess: !!adminAccess,
      projectId,
    });

    // 2️⃣ Save it, passing the session as part of save-options
    await moderator.save({ session });

    // 2️⃣ push into project's moderators array in the same session
    project.moderators.push(moderator._id as Types.ObjectId);
    await project.save({ session });

    // 3️⃣ commit the transaction
    await session.commitTransaction();
  } catch (err) {
    console.log("error", err);
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }

  const addedByName = `${creator.firstName} ${creator.lastName}`;

  // 6️⃣ Build and send the notification email
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
  const { firstName, lastName, email, companyName, adminAccess, isActive } = req.body;

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
  const page  = Math.max(Number(req.query.page)  || 1, 1);
  const limit = Math.max(Number(req.query.limit) || 10, 1);
  const skip  = (page - 1) * limit;

  // 1) count total active/inactive moderators for meta
  const total = await ModeratorModel.countDocuments({ projectId });

  // 2) aggregation: compute roleRank, then sort & paginate
  const moderators = await ModeratorModel.aggregate<IModeratorDocument>([
    // only this project
    { $match: { projectId: new Types.ObjectId(projectId) } },

    // add a numeric rank based on roles & isActive
    { $addFields: {
        roleRank: {
          $switch: {
            branches: [
              // 1. Admin only
              {
                case: {
                  $and: [
                    { $eq: [ { $size: "$roles" }, 1 ] },
                    { $in: [ "Admin",    "$roles" ] },
                    { $eq: [ "$isActive", true       ] }
                  ]
                },
                then: 1
              },
              // 2. Admin + Moderator
              {
                case: {
                  $and: [
                    { $eq: [ { $size: "$roles" }, 2 ] },
                    { $in: [ "Admin",     "$roles" ] },
                    { $in: [ "Moderator", "$roles" ] },
                    { $eq: [ "$isActive", true        ] }
                  ]
                },
                then: 2
              },
              // 3. Admin + Moderator + Observer
              {
                case: {
                  $and: [
                    { $eq: [ { $size: "$roles" }, 3 ] },
                    { $in: [ "Admin",     "$roles" ] },
                    { $in: [ "Moderator", "$roles" ] },
                    { $in: [ "Observer",  "$roles" ] },
                    { $eq: [ "$isActive", true         ] }
                  ]
                },
                then: 3
              },
              // 4. Moderator only
              {
                case: {
                  $and: [
                    { $eq: [ { $size: "$roles" }, 1 ] },
                    { $in: [ "Moderator", "$roles" ] },
                    { $eq: [ "$isActive", true         ] }
                  ]
                },
                then: 4
              },
              // 5. Moderator + Observer
              {
                case: {
                  $and: [
                    { $eq: [ { $size: "$roles" }, 2 ] },
                    { $in: [ "Moderator", "$roles" ] },
                    { $in: [ "Observer",  "$roles" ] },
                    { $eq: [ "$isActive", true         ] }
                  ]
                },
                then: 5
              },
              // 6. Observer only
              {
                case: {
                  $and: [
                    { $eq: [ { $size: "$roles" }, 1 ] },
                    { $in: [ "Observer", "$roles" ] },
                    { $eq: [ "$isActive", true       ] }
                  ]
                },
                then: 6
              },
              // 7. De‑activated (any roles but isActive=false)
              {
                case: { $eq: [ "$isActive", false ] },
                then: 7
              },
              // 8. Active but no roles assigned
              {
                case: {
                  $and: [
                    { $eq: [ "$isActive", true         ] },
                    { $eq: [ { $size: "$roles" }, 0 ] }
                  ]
                },
                then: 8
              }
            ],
            // any unexpected combination
            default: 9
          }
        }
      }
    },

    // finally sort by our custom rank, then alphabetically by lastName
    { $sort: { roleRank: 1, lastName: 1 } },

    // pagination
    { $skip:  skip },
    { $limit: limit }
  ]);

  // build meta
  const totalPages = Math.ceil(total / limit);
  const meta = {
    page,
    limit,
    totalItems: total,
    totalPages,
    hasPrev: page > 1,
    hasNext:  page < totalPages
  };

  sendResponse(res, moderators, "Moderators for project retrieved", 200, meta);
};


---
// src/controllers/ObserverDocumentController.ts

// controllers/ObserverDocumentController.ts
import { Request, Response, NextFunction } from "express";
import {
  deleteFromS3,
  getSignedUrl,
  getSignedUrls,
  uploadToS3,
} from "../utils/uploadToS3";
import { ObserverDocumentModel } from "../model/ObserverDocumentModel";
import ErrorHandler from "../utils/ErrorHandler";
import { sendResponse } from "../utils/responseHelpers";
import mongoose from "mongoose";

export const createObserverDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  /* 1️⃣ pull form-data fields */
  const {projectId, sessionId, addedBy, addedByRole} = req.body;
  const file = req.file as Express.Multer.File | undefined;
  console.log("req.body", req.body);

  /* 2️⃣ basic validations */
  if (!file) {
    return next(new ErrorHandler("File is required", 400));
  }
  if (!projectId || !addedBy || !addedByRole || !sessionId) {
    return next(
      new ErrorHandler(
        "projectId,sessionId, addedBy, and addedByRole are required",
        400
      )
    );
  }

  if (!["Admin", "Moderator", "Observer"].includes(addedByRole)) {
    return next(
      new ErrorHandler("Only Admin, Moderator Or Observer can upload", 403)
    );
  }

  /* 3️⃣ upload binary to S3 */
  const { key: storageKey } = await uploadToS3(
    file.buffer,
    file.mimetype,
    file.originalname
  );

  /* 4️⃣ create DB row */
  const doc = await ObserverDocumentModel.create({
    projectId,
    sessionId,
    displayName: file.originalname,
    size: file.size,
    storageKey,
    addedBy,
    addedByRole,
  });

  /* 5️⃣ success response */
  sendResponse(res, doc, "Observer document uploaded", 201);
};

/**
 * GET /api/v1/observer-documents/project/:projectId?page=&limit=
 * Returns observer documents for a project with pagination.
 */
export const getObserverDocumentsByProjectId = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { projectId } = req.params;

    /* 1️⃣ validate projectId format */
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return next(new ErrorHandler("Invalid project ID", 400));
    }

    /* 2️⃣ pagination params */
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    /* 3️⃣ query slice + total in parallel */
    const [docs, total] = await Promise.all([
      ObserverDocumentModel.find({ projectId })
        .sort({ createdAt: -1 }) // newest first
        .skip(skip)
        .limit(limit)
        .populate("addedBy", "firstName lastName role") // optional: show uploader
        .lean(),
      ObserverDocumentModel.countDocuments({ projectId }),
    ]);

    /* 4️⃣ meta payload */
    const totalPages = Math.ceil(total / limit);
    const meta = {
      page,
      limit,
      totalItems: total,
      totalPages,
      hasPrev: page > 1,
      hasNext: page < totalPages,
    };

    sendResponse(res, docs, "Observer documents fetched", 200, meta);
  } catch (err) {
    next(err);
  }
};

/*───────────────────────────────────────────────────────────────────────────*/
/*  GET  /api/v1/observer-documents/:id/download                 */
/*───────────────────────────────────────────────────────────────────────────*/
export const downloadObserverDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;

  const doc = await ObserverDocumentModel.findById(id).lean();
  if (!doc) return next(new ErrorHandler("Observer document not found", 404));

  const url = getSignedUrl(doc.storageKey, 720);

  // Option A – redirect (starts download immediately)
  return res.redirect(url);

  // Option B – send JSON (uncomment if you prefer)
  // sendResponse(res, { url }, "Signed URL generated", 200);
};

/*───────────────────────────────────────────────────────────────────────────*/
/*  POST /api/v1/observer-documents/download   { ids: string[] } */
/*───────────────────────────────────────────────────────────────────────────*/
export const downloadObserverDocumentsBulk = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { ids } = req.body as { ids?: unknown };

  if (!Array.isArray(ids) || ids.length === 0) {
    return next(new ErrorHandler("ids array is required", 400));
  }

  /* validate & keep only proper ObjectIds */
  const validIds = ids
    .filter((id): id is string => typeof id === "string")
    .filter((id) => mongoose.Types.ObjectId.isValid(id));

  if (validIds.length === 0) {
    return next(new ErrorHandler("No valid Mongo IDs supplied in ids[]", 400));
  }

  const docs = await ObserverDocumentModel.find({
    _id: { $in: validIds },
  }).lean();

  if (docs.length === 0) {
    return next(
      new ErrorHandler("No observer documents found for given ids", 404)
    );
  }

  const keys = docs.map((d) => d.storageKey);
  const signedUrls = getSignedUrls(keys, 300);

  /* build meta for any ids that didn’t resolve */
  const foundIds = new Set(docs.map((d) => d._id.toString()));
  const notFound = validIds.filter((id) => !foundIds.has(id));

  sendResponse(
    res,
    signedUrls,
    "Signed URLs generated",
    200,
    notFound.length ? { notFound } : undefined
  );
};

/**
 * DELETE /api/v1/observer-documents/:id
 * 1. Delete the file from S3
 * 2. Remove the MongoDB row
 * 3. Return the deleted doc
 */
export const deleteObserverDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;

  /* 1️⃣ validate ID format */
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid document ID", 400));
  }

  /* 2️⃣ find doc */
  const doc = await ObserverDocumentModel.findById(id);
  if (!doc) return next(new ErrorHandler("Observer document not found", 404));

  /* 3️⃣ delete from S3 */
  try {
    await deleteFromS3(doc.storageKey);
  } catch (err) {
    return next(
      new ErrorHandler(
        `Failed to delete file from S3: ${(err as Error).message}`, 
        502
      )
    );
  }

  /* 4️⃣ delete DB row */
  await doc.deleteOne();

  /* 5️⃣ success response */
  sendResponse(res, doc, "Observer document deleted", 200);
};


---
// src/controllers/PaymentController.ts

import { Request, Response, NextFunction } from "express";
import { sendResponse } from "../utils/responseHelpers";
import User from "../model/UserModel";
import ErrorHandler from "../utils/ErrorHandler";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

/**
 * Create or update a Stripe customer.
 * Expects `userId` and (optionally) `billingInfo` (conforming to IBillingInfo)
 * in req.body.
 */
export const createCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { userId, billingInfo } = req.body;
  if (!userId) {
    return next(new ErrorHandler("User ID is required", 400));
  }
  try {
    const user = await User.findById(userId);
    if (!user) {
      return next(new ErrorHandler("User Not Found", 400));
    }

    // If user does not have a Stripe customer, create one
    if (!user.stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        address: billingInfo,
      });
      user.stripeCustomerId = customer.id;
    }
    // Update billing info regardless if provided
    if (billingInfo) {
      user.billingInfo = billingInfo;
    }
    await user.save();

    sendResponse(
      res,
      { stripeCustomerId: user.stripeCustomerId },
      "Customer created/updated successfully",
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Create a PaymentIntent for a charge.
 * Expects `customerId`, `amount` (in cents), and `currency` in req.body.
 */
export const createPaymentIntent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { customerId, amount, currency } = req.body;
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      customer: customerId,
      payment_method_types: ["card"],
      setup_future_usage: "off_session",
    });
    sendResponse(
      res,
      { clientSecret: paymentIntent.client_secret },
      "PaymentIntent created successfully",
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Save a payment method: attach the provided paymentMethodId to the customer,
 * update it as the default payment method, and update the user document
 * with card information.
 *
 * Expects `customerId` and `paymentMethodId` in req.body.
 */
export const savePaymentMethod = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { customerId, paymentMethodId } = req.body;
  try {
    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Set it as the default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    // Update user record with card info if available
    const user = await User.findOne({ stripeCustomerId: customerId });

    if (user && paymentMethod.card) {
      user.creditCardInfo = {
        last4: paymentMethod.card.last4,
        brand: paymentMethod.card.brand,
        expiryMonth: paymentMethod.card.exp_month.toString(),
        expiryYear: paymentMethod.card.exp_year.toString(),
      };
      await user.save();
    }
    console.log("last 4", paymentMethod.card);
    sendResponse(
      res,
      { last4: paymentMethod.card?.last4, user: user },
      "Card saved as default",
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Create a SetupIntent for saving/updating card information.
 * This endpoint expects an authenticated user (req.userId set via auth middleware).
 */
export const createSetupIntent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Use our extended Request type so that userId exists.
    const userId = req.body.userId;
    if (!userId) {
      return next(new ErrorHandler("User ID is required", 400));
    }

    const user = await User.findById(userId);
    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    // If the user does not have a Stripe customer, create one first.
    if (!user.stripeCustomerId) {
      const stripeAddress = user.billingInfo
        ? {
            line1: user.billingInfo.address,
            city: user.billingInfo.city,
            state: user.billingInfo.state,
            postal_code: user.billingInfo.postalCode,
            country: user.billingInfo.country,
          }
        : undefined;

      try {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          address: stripeAddress,
        });
        user.stripeCustomerId = customer.id;
        await user.save();
      } catch (innerError) {
        console.error("Error during stripe.customers.create:", innerError);
        return next(innerError);
      }
      // console.log('customer', customer)
      // user.stripeCustomerId = customer.id;
      await user.save();
    }

    // Create the SetupIntent
    const setupIntent = await stripe.setupIntents.create({
      customer: user.stripeCustomerId,
      payment_method_types: ["card"],
    });
    console.log("user setup intent", setupIntent.client_secret);

    sendResponse(
      res,
      { clientSecret: setupIntent.client_secret },
      "SetupIntent created successfully",
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve a PaymentMethod by its ID.
 * Expects `paymentMethodId` in req.body.
 */
export const retrievePaymentMethod = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { paymentMethodId, userId } = req.body;
  try {
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    if (!paymentMethod) {
      throw new ErrorHandler("Invalid payment method ID", 400);
    }

    const user = await User.findById(userId);
    console.log("user", user);
    sendResponse(
      res,
      { paymentMethod, user },
      "Payment method retrieved successfully",
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Charge the customer using the saved default payment method.
 * Expects `customerId`, `amount` (in cents), and `currency` in req.body.
 */
export const chargeCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { customerId, amount, currency, userId, purchasedCredit } = req.body;
  try {
    const customer = (await stripe.customers.retrieve(
      customerId
    )) as Stripe.Customer;
    // Determine the default payment method ID. It might be a string or an object.
    let defaultPaymentMethodId: string | undefined;
    if (typeof customer.invoice_settings.default_payment_method === "string") {
      defaultPaymentMethodId = customer.invoice_settings.default_payment_method;
    } else if (
      typeof customer.invoice_settings.default_payment_method === "object" &&
      customer.invoice_settings.default_payment_method !== null
    ) {
      defaultPaymentMethodId =
        customer.invoice_settings.default_payment_method.id;
    }

    if (!defaultPaymentMethodId) {
      return next(
        new ErrorHandler("Customer has no default payment method.", 400)
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      customer: customerId,
      payment_method: defaultPaymentMethodId,
      off_session: true,
      confirm: true,
    });

    // Find the user using userId and add the purchased credits
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $inc: { credits: purchasedCredit } },
      { new: true }
    );

    console.log("updated user", updatedUser);
    if (!updatedUser) {
      return next(new ErrorHandler("User not found", 404));
    }

    sendResponse(res, { user: updatedUser }, "Charge successful", 200);
  } catch (error) {
    next(error);
  }
};

export const saveBillingInfo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { userId, billingInfo } = req.body;
  // console.log( billingData)
  // Validate required fields
  if (!userId) {
    return next(new ErrorHandler("User ID is required", 400));
  }
  if (!billingInfo) {
    return next(new ErrorHandler("Billing information is required", 400));
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    // Update the user's billingData field
    user.billingInfo = billingInfo;
    await user.save();
    console.log("user", user);
    sendResponse(
      res,
      { billingInfo: user.billingInfo },
      "Billing info saved successfully",
      200
    );
  } catch (error) {
    next(error);
  }
};


---
// src/controllers/PollController.ts

import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { PollModel } from "../model/PollModel";
import ErrorHandler from "../utils/ErrorHandler";
import { sendResponse } from "../utils/responseHelpers";
import { validateQuestion } from "../processors/poll/QuestionValidationProcessor";
import { uploadToS3 } from "../utils/uploadToS3";

/* ───────────────────────────────────────────────────────────── */
/*  Controller – Create Poll                                    */
/* ───────────────────────────────────────────────────────────── */
export const createPoll = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { projectId, sessionId, title, questions, createdBy, createdByRole } = 
    req.body;

  console.log("req.body", req.body);

  /* 1. Basic payload validation ------------------------------------ */
  if (!projectId || !title || !createdBy || !createdByRole) {
    return next(
      new ErrorHandler(
        "projectId,  title, createdBy, createdByRole are required",
        400
      )
    );
  }

  if (!["Admin", "Moderator"].includes(createdByRole)) {
    return next(
      new ErrorHandler("Only Admin or Moderator can create polls", 403)
    );
  }
// ── 2) Parse questions JSON ───────────────────────────────────────
    let questionsPayload: any[] = req.body.questions;
    if (typeof questionsPayload === "string") {
      try {
        questionsPayload = JSON.parse(questionsPayload);
      } catch {
        return next(new ErrorHandler("Invalid questions JSON", 400));
      }
    }

    if (!Array.isArray(questionsPayload) || questionsPayload.length === 0) {
      return next(new ErrorHandler("questions array is required", 400));
    }

    // ── 3) Upload images to S3 & stitch into questions ───────────────
    //    Expect front-end to send each File under field "images" and
    //    each question to have a tempImageName === file.originalname
    const files = (req.files as Express.Multer.File[]) || [];
    for (const file of files) {
      let result;
      try {
        result = await uploadToS3(file.buffer, file.mimetype, file.originalname);
      } catch (err) {
        return next(
          new ErrorHandler(`Failed to upload image ${file.originalname}`, 500)
        );
      }
console.log('files', files)
      // find the matching question by your tempImageName
      const q = questionsPayload.find((q) => q.tempImageName === file.originalname);
console.log('question',q)
      if (q) {
        q.image = result.url;
        // optionally store the S3 key if you need it:
        // q.imageKey = result.key;
        delete q.tempImageName;
      }
    }

    
    // ── 4) Per-question validation ────────────────────────────────────
    for (let i = 0; i < questionsPayload.length; i++) {
      if (validateQuestion(questionsPayload[i], i, next)) {
        return; // stops on first error
      }
    }
  /* 3. Create poll -------------------------------------------------- */

  const poll = await PollModel.create({
    projectId,
    // sessionId,
    title: title.trim(),
    questions: questionsPayload,
    createdBy,
    createdByRole,
  });

  console.log("poll", poll);
  sendResponse(res, poll, "Poll created", 201);
};

/**
 * GET /api/v1/polls/project/:projectId
 * Query params: ?page=1&limit=10
 */
export const getPollsByProjectId = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { projectId } = req.params;

  // 2️⃣ Pagination params
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.max(Number(req.query.limit) || 10, 1);
  const skip = (page - 1) * limit;

  // 3️⃣ Fetch slice + count
  const [polls, total] = await Promise.all([
    PollModel.find({ projectId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'firstName lastName') 
      .lean(),
    PollModel.countDocuments({ projectId }),
  ]);

  // 4️⃣ Build meta
  const totalPages = Math.ceil(total / limit);
  const meta = {
    page,
    limit,
    totalItems: total,
    totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
  };

  sendResponse(res, polls, "Polls fetched", 200, meta);
};

/**
 * GET /api/v1/polls/:id
 * Fetch a single poll by its ID.
 */
export const getPollById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;

  // 1️⃣  Lookup
  const poll = await PollModel.findById(id);
  if (!poll) {
    return next(new ErrorHandler("Poll not found", 404));
  }

  // 2️⃣ Return it
  sendResponse(res, poll, "Poll fetched", 200);
};

/**
 * PATCH /api/v1/polls/:id
 * Body may include any of: title, questions (full array), isRun
 */
export const updatePoll = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;

  // Build updatable fields
  const updates: any = { lastModified: new Date() };
  // parse + validate title / isRun as before…
  if (req.body.title) updates.title = req.body.title.trim();
  if (req.body.isRun !== undefined) updates.isRun = req.body.isRun;

  // 1) parse questions JSON
  if (req.body.questions) {
    let questionsPayload: any[] = req.body.questions;
    if (typeof questionsPayload === "string") {
      try {
        questionsPayload = JSON.parse(questionsPayload);
      } catch {
        return next(new ErrorHandler("Invalid questions JSON", 400));
      }
    }

    if (!Array.isArray(questionsPayload) || !questionsPayload.length) {
      return next(new ErrorHandler("questions must be a non-empty array", 400));
    }

    // 2) upload any new files and stitch
    const files = (req.files as Express.Multer.File[]) || [];
    for (const file of files) {
      let uploadResult;
      try {
        uploadResult = await uploadToS3(
          file.buffer,
          file.mimetype,
          file.originalname
        );
      } catch {
        return next(
          new ErrorHandler(`Failed to upload image ${file.originalname}`, 500)
        );
      }

      // now that your JSON has tempImageName, this will work:
      const q = questionsPayload.find(
        qq => qq.tempImageName === file.originalname
      );
      if (q) {
        q.image = uploadResult.url;
        delete q.tempImageName;
      }
    }

    // 3) validate each question…
    for (let i = 0; i < questionsPayload.length; i++) {
      if (validateQuestion(questionsPayload[i], i, next)) return;
    }

    updates.questions = questionsPayload;
  }

  // if nothing to update
  if (Object.keys(updates).length === 1 /* only lastModified */) {
    return next(new ErrorHandler("No valid fields provided for update", 400));
  }

  // 4) perform the mongo update
  const updated = await PollModel.findByIdAndUpdate(id, updates, { new: true });
  if (!updated) return next(new ErrorHandler("Poll not found", 404));
  sendResponse(res, updated, "Poll updated", 200);
};

/**
 * POST /api/v1/polls/:id/duplicate
 * Clone an existing poll (questions, metadata) into a new document.
 */
export const duplicatePoll = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;

  // 1️⃣  find original
  const original = await PollModel.findById(id).lean();
  if (!original) {
    return next(new ErrorHandler("Poll not found", 404));
  }

  // 2️⃣ prepare copy (strip mongoose fields)
  const copyData: any = {
    projectId: original.projectId,
    sessionId: original.sessionId,
    title: `${original.title} (copy)`,
    questions: original.questions,
    createdBy: original.createdBy,
    createdByRole: original.createdByRole,
    isRun: false,
    responsesCount: 0,
    lastModified: new Date(),
  };

  // 3️⃣insert new document
  const copy = await PollModel.create(copyData);

  sendResponse(res, copy, "Poll duplicated", 201);
};

/**
 * DELETE /api/v1/polls/:id
 * Remove a poll by its ID.
 */
export const deletePoll = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;

  // 1️⃣  attempt deletion
  const deleted = await PollModel.findByIdAndDelete(id);
  if (!deleted) {
    return next(new ErrorHandler("Poll not found", 404));
  }

  sendResponse(res, deleted, "Poll deleted", 200);
};


---
// src/controllers/ProjectController.ts

import { Request, Response, NextFunction } from "express";
import { sendResponse } from "../utils/responseHelpers";
import ProjectFormModel,
  {
    IProjectFormDocument,
  } from "../model/ProjectFormModel";
import User from "../model/UserModel";
import ErrorHandler from "../utils/ErrorHandler";
import ProjectModel, { IProjectDocument } from "../model/ProjectModel";
import mongoose, { PipelineStage, Types } from "mongoose";
import {
  projectCreateAndPaymentConfirmationEmailTemplate,
  projectInfoEmailTemplate,
} from "../constants/emailTemplates";
import { sendEmail } from "../processors/sendEmail/sendVerifyAccountEmailProcessor";
import { ProjectCreateAndPaymentConfirmationEmailTemplateParams } from "../../shared/interface/ProjectInfoEmailInterface";
import ModeratorModel, { IModeratorDocument } from "../model/ModeratorModel";

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

    // console.log('populated project', populatedProject)

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
  const { search = "", tag = "", status="", page = 1, limit = 10, from, to} = req.query;

  console.log("req.query", req.query);

  if (!userId) {
    return next(new ErrorHandler("User ID is required", 400));
  }

  // ── pagination params ───────────────────────────────────────
  const pageNum = Math.max(Number(page), 1);
  const limitNum = Math.max(Number(limit), 1);
  const skip = (pageNum - 1) * limitNum;
   let fromDate: Date | undefined;
  let toDate: Date | undefined;
  if (typeof from === "string") fromDate = new Date(from);
  if (typeof to   === "string") toDate   = new Date(to);

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
      ...(tag ? { "tags.name": { $regex: tagRegex } } : {}),
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
       ...(fromDate || toDate
  ? [{
      $match: {
      startDate: {
          ...(fromDate ? { $gte: fromDate } : {}),
          ...(toDate   ? { $lte: toDate   } : {}),
        }
      }
    }]
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
    { $sort: { name: 1 } },
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
           ...(fromDate || toDate
  ? [{
      $match: {
      startDate: {
          ...(fromDate ? { $gte: fromDate } : {}),
          ...(toDate   ? { $lte: toDate   } : {}),
        }
      }
    }]
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

export const editProject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Expecting projectId in body along with the fields to be updated.
  const { projectId, internalProjectName, description } = req.body;

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

  // Update only the allowed fields if they are provided.
  if (internalProjectName) {
    project.internalProjectName = internalProjectName;
  }
  if (description) {
    project.description = description;
  }

  console.log("req.body", req.body);

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


---
// src/controllers/SessionController.ts

import { Request, Response, NextFunction } from "express";
import { sendResponse } from "../utils/responseHelpers";
import ErrorHandler from "../utils/ErrorHandler";
import { ISessionDocument, SessionModel } from "../model/SessionModel";
import ProjectModel from "../model/ProjectModel";
import ModeratorModel from "../model/ModeratorModel";
import { toTimestamp } from "../processors/session/sessionTimeConflictChecker";
import { DateTime } from "luxon";
import * as sessionService from "../processors/liveSession/sessionService";
import mongoose from "mongoose";

// !  the fields you really need to keep the payload light
const SESSION_POPULATE = [
  { path: "moderators", select: "firstName lastName email" },
  { path: "projectId", select: "service" },
];

export const createSessions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { projectId, timeZone, breakoutRoom, sessions } = req.body;

  // 1. Basic payload validation
  if (
    !Array.isArray(sessions) ||
    sessions.length === 0 ||
    !projectId ||
    typeof timeZone !== "string" ||
    breakoutRoom === undefined
  ) {
    return next(
      new ErrorHandler(
        "Sessions array, project id, time zone, breakout room information are required",
        400
      )
    );
  }
  console.log("req.body", req.body);
  console.log(
    "req.body.sessions =",
    JSON.stringify(req.body.sessions, null, 2)
  );

  // 2. Project existence check
  const project = await ProjectModel.findById(projectId);
  if (!project) {
    return next(new ErrorHandler("Project not found", 404));
  }

  // 3. Moderator existence check

  const modIds = Array.from(new Set(sessions.flatMap((s) => s.moderators)));

  const allMods = await ModeratorModel.find({
    _id: { $in: modIds },
  });

  if (allMods.length !== modIds.length) {
    return next(new ErrorHandler("One or more moderators not found", 404));
  }

  // 4. Pull all existing sessions for this project
  const existing = await SessionModel.find({ projectId });

  // 5. Validate no overlaps

  for (const s of sessions) {
    const tz = timeZone;
    const startNew = toTimestamp(s.date, s.startTime, tz);
    const endNew = startNew + s.duration * 60_000;

    // calendar day in this timeZone
    const dayNew = DateTime.fromISO(
      typeof s.date === "string"
        ? s.date
        : DateTime.fromJSDate(s.date).toISODate()!,
      { zone: tz }
    ).toISODate();

    for (const ex of existing) {
      const exTz = ex.timeZone;
      const dayEx = DateTime.fromISO(
        DateTime.fromJSDate(ex.date).toISODate()!,
        { zone: exTz }
      ).toISODate();
      if (dayEx !== dayNew) continue;

      const startEx = toTimestamp(ex.date, ex.startTime, exTz);
      const endEx = startEx + ex.duration * 60_000;

      // overlap if: startNew < endEx && startEx < endNew
      if (startNew < endEx && startEx < endNew) {
        return next(
          new ErrorHandler(
            `Session "${s.title}" conflicts with existing "${ex.title}"`, 
            409
          )
        );
      }
    }
  }

  // 6. Map each session, injecting the shared fields
  const docs = sessions.map((s: any) => ({
    projectId,
    timeZone,
    breakoutRoom,
    title: s.title,
    date: s.date,
    startTime: s.startTime,
    duration: s.duration,
    moderators: s.moderators,
  }));

  // 7. Bulk insert into MongoDB
  // ─── START TRANSACTION ────────────────────────────────────────────
  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();
  let created: ISessionDocument[];

  try {
    created = await SessionModel.insertMany(docs, { session: mongoSession });

    for (const sess of created) {
      await sessionService.createLiveSession(sess._id.toString(), {
        session: mongoSession,
      });
    }

    project.meetings.push(...created.map((s) => s._id));
    await project.save({ session: mongoSession });

    await mongoSession.commitTransaction();
  } catch (err) {
    await mongoSession.abortTransaction();
    mongoSession.endSession();
    return next(err);
  } finally {
    // always end the session
    mongoSession.endSession();
  }
  // 8. Send uniform success response
  sendResponse(res, created, "Sessions created", 201);
};

/**
 * GET /sessions/project/:projectId
 * Fetch all sessions for a given project
 */
export const getSessionsByProject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { projectId } = req.params;

    // ── pagination params ───────────────────────────────────────
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);

    const skip = (page - 1) * limit;

    // ── parallel queries: data + count ─────────────────────────
    const [sessions, total] = await Promise.all([
      SessionModel.find({ projectId })
        .sort({ date: 1, startTime: 1 })
        .skip(skip)
        .limit(limit)
        .populate(SESSION_POPULATE)
        .lean(),
      SessionModel.countDocuments({ projectId }),
    ]);

    // ── build meta payload ─────────────────────────────────────
    const totalPages = Math.ceil(total / limit);

    const meta = {
      page,
      limit,
      totalItems: total,
      totalPages,
      hasPrev: page > 1,
      hasNext: page < totalPages,
    };

    sendResponse(res, sessions, "Sessions fetched", 200, meta);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /sessions/:id
 * Fetch a single session by its ID
 */
export const getSessionById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // 1. Lookup
    const session = await SessionModel.findById(id)
      .populate(SESSION_POPULATE)
      .lean();

    if (!session) {
      return next(new ErrorHandler("Session not found", 404));
    }

    // 2. Return it
    sendResponse(res, session, "Session fetched", 200);
  } catch (err) {
    next(err);
  }
};

export const updateSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sessionId = req.params.id;

    // 1. Load the original session
    const original = await SessionModel.findById(sessionId);
    if (!original) {
      return next(new ErrorHandler("Session not found", 404));
    }

    // 2. Build an updates object only with allowed fields
    const allowed = [
      "title",
      "date",
      "startTime",
      "duration",
      "moderators",
      "timeZone",
      "breakoutRoom",
    ] as const;

    // 3. Build an updates object only with allowed fields
    const updates: Partial<Record<(typeof allowed)[number], any>> = {};

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    // 4. If nothing to update, reject
    if (Object.keys(updates).length === 0) {
      return next(new ErrorHandler("No valid fields provided for update", 400));
    }

    // 5. If moderators updated, re-validate them
    if (updates.moderators) {
      const modIds = Array.from(new Set(updates.moderators));
      const found = await ModeratorModel.find({ _id: { $in: modIds } });
      if (found.length !== modIds.length) {
        return next(new ErrorHandler("One or more moderators not found", 404));
      }
    }

    // 6. Determine the “new” values to check for conflicts
    const newDate = updates.date ?? original.date;
    const newStartTime = updates.startTime ?? original.startTime;
    const newDuration = updates.duration ?? original.duration;
    const newTz = updates.timeZone ?? original.timeZone;

    // 7. Fetch all other sessions in this project
    const otherSessions = await SessionModel.find({
      projectId: original.projectId,
      _id: { $ne: sessionId },
    });

    // 8. Check each “other” session for an overlap with our proposed slot
    const startNew = toTimestamp(newDate, newStartTime, newTz);
    const endNew = startNew + newDuration * 60_000;
    const dayNew = DateTime.fromISO(
      typeof newDate === "string"
        ? newDate
        : DateTime.fromJSDate(newDate).toISODate()!,
      { zone: newTz }
    ).toISODate();

    for (const ex of otherSessions) {
      const exTz = ex.timeZone;
      const dayEx = DateTime.fromISO(
        DateTime.fromJSDate(ex.date).toISODate()!,
        { zone: exTz }
      ).toISODate();
      if (dayEx !== dayNew) continue;

      const startEx = toTimestamp(ex.date, ex.startTime, exTz);
      const endEx = startEx + ex.duration * 60_000;

      // overlap test:
      if (startNew < endEx && startEx < endNew) {
        return next(
          new ErrorHandler(
            `Proposed time conflicts with existing session "${ex.title}"`, 
            409
          )
        );
      }
    }

    // 9. No conflicts — perform the update
    const updated = await SessionModel.findByIdAndUpdate(sessionId, updates, {
      new: true,
    });

    // 10. If not found, 404
    if (!updated) {
      return next(new ErrorHandler("Session not found during update", 404));
    }

    // 11. Return the updated session
    sendResponse(res, updated, "Session updated", 200);
  } catch (err) {
    next(err);
  }
};

export const duplicateSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sessionId = req.params.id;

    // 1. Find the existing session
    const original = await SessionModel.findById(sessionId);
    if (!original) {
      return next(new ErrorHandler("Session not found", 404));
    }

    const {
      _id, // drop
      createdAt, // drop
      updatedAt, // drop
      __v, // (optional) drop version key too
      ...data // data now has only the session fields you care about
    } = original.toObject();

    // 3. Modify the title
    data.title = `${original.title} (copy)`;

    // 4. Insert the new document
    const copy = await SessionModel.create(data);

    // 5. Return the duplicated session
    sendResponse(res, copy, "Session duplicated", 201);
  } catch (err) {
    next(err);
  }
};

export const deleteSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sessionId = req.params.id;

    // 1. Attempt deletion
    const deleted = await SessionModel.findByIdAndDelete(sessionId);

    // 2. If nothing was deleted, the id was invalid
    if (!deleted) {
      return next(new ErrorHandler("Session not found", 404));
    }

    // 3. Success—return the deleted doc for confirmation
    sendResponse(res, deleted, "Session deleted", 200);
  } catch (err) {
    next(err);
  }
};


---
// src/controllers/SessionDeliverableController.ts

import { Request, Response, NextFunction } from "express";
import { SessionDeliverableModel } from "../model/SessionDeliverableModel";
import ProjectModel from "../model/ProjectModel";
import ErrorHandler from "../utils/ErrorHandler";
import { sendResponse } from "../utils/responseHelpers";
import {
  deleteFromS3,
  getSignedUrl,
  getSignedUrls,
  uploadToS3,
} from "../utils/uploadToS3";
import { SessionModel } from "../model/SessionModel";
import { Socket } from "dgram";

/**
 * POST /api/v1/deliverables
 * multipart/form-data:
 *   file         (binary)
 *   sessionId    (string)
 *   projectId    (string)
 *   type         (AUDIO | VIDEO | ...)
 *   uploadedBy   (string)  ← user _id
 *
 * Optional:
 *   displayName  (string)  ← if omitted, we auto-generate
 */
export const createDeliverable = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  /* ── pull fields & file ─────────────────────────── */
  const { sessionId, projectId, type, uploadedBy, displayName } = req.body;

  const file = req.file as Express.Multer.File | undefined;

  if (!file || !sessionId || !projectId || !type || !uploadedBy) {
    return next(
      new ErrorHandler(
        "file, sessionId, projectId, type and uploadedBy are required",
        400
      )
    );
  }

  /* ── sanity checks (optional but recommended) ───── */
  const [projectExists, sessionExists] = await Promise.all([
    ProjectModel.exists({ _id: projectId }),
    SessionModel.exists({ _id: sessionId }),
  ]);

  if (!projectExists) return next(new ErrorHandler("Project not found", 404));

  if (!sessionExists) return next(new ErrorHandler("Session not found", 404));

  /* ── upload binary to S3 ───────────────────────── */
  const { url: s3Url, key: s3Key } = await uploadToS3(
    file.buffer,
    file.mimetype,
    file.originalname
  );

  /* ── create doc ──────────────────────────────────── */
  const doc = await SessionDeliverableModel.create({
    sessionId,
    projectId,
    type,
    displayName,
    size: file.size,
    storageKey: s3Key,
    uploadedBy,
  });

  /* ── respond ───────────────────────────────────── */
  sendResponse(
    res,
    { ...doc.toObject(), url: s3Url },
    "Deliverable uploaded",
    201
  );
};

/**
 * List deliverables for a project with skip/limit pagination
 * and optional ?type=AUDIO | VIDEO | …
 */
export const getDeliverablesByProjectId = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { projectId } = req.params;
  const { type } = req.query;
  /* ––– pagination params ––– */
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.max(Number(req.query.limit) || 10, 1);
  const skip = (page - 1) * limit;

  /* ––– verify project exists (optional safety) ––– */
  const projectExists = await ProjectModel.exists({ _id: projectId });
  if (!projectExists) return next(new ErrorHandler("Project not found", 404));

  /* ––– build filter ––– */
  const filter: Record<string, unknown> = { projectId };
  if (type) filter.type = type; // e.g. ?type=AUDIO

  /* ––– query slice + total in parallel ––– */
  const [rows, total] = await Promise.all([
    SessionDeliverableModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    SessionDeliverableModel.countDocuments(filter),
  ]);

  /* ––– meta payload ––– */
  const totalPages = Math.ceil(total / limit);
  const meta = {
    page,
    limit,
    totalItems: total,
    totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
  };

  sendResponse(res, rows, "Deliverables fetched", 200, meta);
};

export const downloadDeliverable = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;
  const deliverable = await SessionDeliverableModel.findById(id).lean();

  if (!deliverable) return next(new ErrorHandler("Not found", 404));

  const url = getSignedUrl(deliverable.storageKey, 300);
  res.redirect(url);
};

export const downloadMultipleDeliverable = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  /* 1️⃣ request-body sanity check */
  const { ids } = req.body as { ids?: unknown };
  if (!Array.isArray(ids) || ids.length === 0) {
    return next(new ErrorHandler("ids array is required", 400));
  }

  /* 2️⃣ fetch matching docs */
  const docs = await SessionDeliverableModel.find({ _id: { $in: ids } }).lean();

  if (docs.length === 0) {
    return next(
      new ErrorHandler("No deliverables found for the given ids", 404)
    );
  }

  /* 3️⃣ compute signed URLs */
  const keys = docs.map((d) => d.storageKey);

  const links = getSignedUrls(keys, 300);

  sendResponse(res, links, "Signed URLs", 200);
};

export const deleteDeliverable = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;

  /* ── find doc first ────────────────────────────────────────── */
  const doc = await SessionDeliverableModel.findById(id);
  if (!doc) return next(new ErrorHandler("Deliverable not found", 404));

  await deleteFromS3(doc.storageKey);

  /* ── delete DB row ────────────────────────────────────────── */
  await doc.deleteOne();

  sendResponse(res, doc, "Deliverable deleted", 200);
};


---
// src/controllers/TagController.ts

import { Request, Response, NextFunction } from "express";
import { sendResponse } from "../utils/responseHelpers";
import ErrorHandler from "../utils/ErrorHandler";

import UserModel from "../model/UserModel";
import ProjectModel from "../model/ProjectModel";
import { TagDocument, TagModel } from "../model/TagModel";
import mongoose from "mongoose";
import { ITag } from "../../shared/interface/TagInterface";
import { ClientSession } from "mongoose";

export const createTag = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { title, color, createdBy, projectId } = req.body;

    // 1️⃣ basic validation ----------------------------------------------------
    if (!title || !color || !createdBy || !projectId) {
      return next(
        new ErrorHandler(
          "title, color, createdBy and projectId are required",
          400
        )
      );
    }

    // 2️⃣ existence checks ----------------------------------------------------
    const [project, user] = await Promise.all([
      ProjectModel.findById(projectId),
      UserModel.findById(createdBy),
    ]);

    if (!project) return next(new ErrorHandler("Project not found", 404));

    if (!user) return next(new ErrorHandler("User not found", 404));

    // 3️⃣ optional duplicate-title guard (case-insensitive) -------------------
    const clash = await TagModel.findOne({
      projectId,
      title: { $regex: new RegExp(`^${title}$`, "i") },
    });

    if (clash) {
      return next(
        new ErrorHandler(
          "A tag with this title already exists for this project",
          409
        )
      );
    }

    // ─── START TRANSACTION ───────────────────────────────────────────────
    const session: ClientSession = await mongoose.startSession();
    session.startTransaction();

    let tagDoc: TagDocument;
    try {
      // 4️⃣ Create & save tag under txn
      tagDoc = new TagModel({ title, color, createdBy, projectId });
      await tagDoc.save({ session });

      // 5️⃣ Push its ObjectId into project.tags & save
      project.tags.push(tagDoc._id);
      await project.save({ session });

      // 6️⃣ Commit both writes
      await session.commitTransaction();
    } catch (err) {
      // 7️⃣ Roll back everything on error
      await session.abortTransaction();
      session.endSession();
      return next(err);
    } finally {
      session.endSession();
    }
    // ─── TRANSACTION END ─────────────────────────────────────────────

    // 8️⃣ Convert to your shared ITag shape (if needed)
    const responsePayload = {
      ...tagDoc.toObject(),
      _id: tagDoc._id.toString(),
      createdBy: tagDoc.createdBy.toString(),
      projectId: tagDoc.projectId.toString(),
      createdAt: tagDoc.createdAt,
      updatedAt: tagDoc.updatedAt,
    };

    sendResponse(res, responsePayload, "Tag created", 201);
  } catch (err) {
    next(err);
  }
};

export const getTagsByProjectId = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { projectId } = req.params;

    const projectExists = await ProjectModel.exists({ _id: projectId });

    if (!projectExists) return next(new ErrorHandler("Project not found", 404));

    const tags = await TagModel.find({ projectId }).sort({ title: 1 }).lean();

    sendResponse(res, tags, "Tags fetched", 200);
  } catch (err) {
    next(err);
  }
};

export const getTagsByUserId = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;

    const userExists = await UserModel.exists({ _id: userId });
    if (!userExists) return next(new ErrorHandler("User not found", 404));

    const tags = await TagModel.find({ createdBy: userId })
      .sort({
        title: 1,
      })
      .lean();
    sendResponse(res, tags, "Tags fetched", 200);
  } catch (err) {
    next(err);
  }
};

export const editTag = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, color } = req.body;

    if (!title && !color) {
      return next(new ErrorHandler("No update data provided", 400));
    }

    const tag = await TagModel.findById(id);
    if (!tag) return next(new ErrorHandler("Tag not found", 404));

    // Optional duplicate title guard (same project)
    if (title && title !== tag.title) {
      const duplicate = await TagModel.findOne({
        projectId: tag.projectId,
        title: { $regex: new RegExp(`^${title}$`, "i") },
      });
      if (duplicate) {
        return next(
          new ErrorHandler(
            "Another tag with this title already exists in the project",
            409
          )
        );
      }
      tag.title = title;
    }

    if (color) tag.color = color;

    const updated = await tag.save();
    sendResponse(res, updated, "Tag updated", 200);
  } catch (err) {
    next(err);
  }
};

export const deleteTag = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const deleted = await TagModel.findByIdAndDelete(id);
    if (!deleted) return next(new ErrorHandler("Tag not found", 404));

    await ProjectModel.updateMany({ tags: id }, { $pull: { tags: id } });

    sendResponse(res, deleted, "Tag deleted", 200);
  } catch (err) {
    next(err);
  }
};


---
// src/controllers/UserController.ts

import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import User from "../model/UserModel";
import ErrorHandler from "../utils/ErrorHandler";
import { sendResponse } from "../utils/responseHelpers";
import {
  resetPasswordEmailTemplate,
  verificationEmailTemplate,
} from "../constants/emailTemplates";
import { sendEmail } from "../processors/sendEmail/sendVerifyAccountEmailProcessor";
import { sanitizeUser } from "../processors/user/removePasswordFromUserObjectProcessor";
import config from "../config/index";
import jwt from "jsonwebtoken";
import { isStrongPassword } from "../processors/user/isStrongPasswordProcessor";
import ProjectModel from "../model/ProjectModel";

import {
  cookieOptions,
  parseExpiryToMs,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/tokenService";
import { AuthRequest } from "../middlewares/authenticateJwt";
import { Types } from "mongoose";

import { isValidEmail } from "../processors/isValidEmail";


export const createAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const {
    firstName,
    lastName,
    email,
    phoneNumber,
    companyName,
    password,
    role,
    status,
    termsAccepted,
  } = req.body;

  // Check if the email format is valid
  if (!isValidEmail(email)) {
    return next(new ErrorHandler("Invalid email format", 400));
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return next(new ErrorHandler("User already exists", 400));
  }

  if (await User.findOne({ phoneNumber })) {
    return next(new ErrorHandler("phoneNumber already exists", 409));
  }

  if (!isStrongPassword(password)) {
    return next(
      new ErrorHandler(
        "Password must be at least 9 characters long and include uppercase, lowercase, number, and special character.",
        400
      )
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({
    firstName,
    lastName,
    email,
    phoneNumber,
    companyName,
    password: hashedPassword,
    role,
    status: status || "Active",
    isEmailVerified: false,
    termsAccepted,
    termsAcceptedTime: new Date(),
    isDeleted: false,
    createdBy: "self",
    credits: 0,
    stripeCustomerId: undefined,
  });

  const savedUser = await newUser.save();

  // In createAccount controller, after saving the user
  const token = jwt.sign(
    { userId: savedUser._id },
    config.jwt_secret as string,
    { expiresIn: "1d" }
  );

  const verificationLink = `${config.frontend_base_url}/verify-email?token=${token}`;

  // Send verification email with token
  await sendEmail({
    to: savedUser.email,
    subject: "Verify Your Account",
    html: verificationEmailTemplate(savedUser.firstName, verificationLink),
  });

  const userResponse = sanitizeUser(savedUser);

  sendResponse(res, userResponse, "User registered successfully", 201);
};

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { email, password } = req.body;

  const { ip, deviceType, platform, browser, location } = (req as any)
    .deviceInfo;

  if (!email || !password) {
    return next(new ErrorHandler("Email and password are required", 400));
  }

  const user = await User.findOne({ email });
  if (!user) {
    return next(new ErrorHandler("Invalid credentials", 401));
  }

  if (user.isDeleted) {
    return next(new ErrorHandler("Account has been deleted", 403));
  }

  if (user.status !== "Active") {
    return next(new ErrorHandler("Account is not active", 403));
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    console.log("Invalid credentials");
    return next(new ErrorHandler("Invalid credentials", 401));
  }

  const idString =
    typeof user._id === "string"
      ? user._id
      : (user._id as Types.ObjectId).toString();

  const accessToken = signAccessToken({ userId: idString, role: user.role });

  const refreshToken = signRefreshToken({ userId: idString });

  // parse the expiry strings from config
  const accessMaxAge = parseExpiryToMs(config.jwt_access_token_expires_in!);

  const refreshMaxAge = parseExpiryToMs(config.jwt_refresh_token_expires_in!);

  // set the cookies
  res.cookie("accessToken", accessToken, cookieOptions(accessMaxAge));
  res.cookie("refreshToken", refreshToken, cookieOptions(refreshMaxAge));

  const userResponse = sanitizeUser(user);

  sendResponse(res, { user: userResponse }, "Login successful");
};

export const getCurrentUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // req.user is set by authenticateJwt
  const payload = req.user;
  if (!payload) {
    return next(new ErrorHandler("Not authenticated", 401));
  }

  const user = await User.findById(payload.userId);
  if (!user || user.isDeleted) {
    return next(new ErrorHandler("User not found", 404));
  }

  const userResponse = sanitizeUser(user);
  sendResponse(res, { user: userResponse }, "Current user retrieved", 200);
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { email } = req.body;
  if (!email) {
    return next(new ErrorHandler("Email is required", 400));
  }

  const user = await User.findOne({ email });
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Check if the account is deleted or inactive
  if (user.isDeleted) {
    return next(new ErrorHandler("This account has been deleted", 403));
  }

  if (user.status !== "Active") {
    return next(new ErrorHandler("Account is not active", 403));
  }

  // Generate a reset token valid for 1 hour
  const token = jwt.sign({ userId: user._id }, config.jwt_secret as string, {
    expiresIn: "1h",
  });

  // Use the provided email template function and modify it for a reset-password email
  const emailHtml = resetPasswordEmailTemplate(user.firstName, token);

  // Send the reset email
  await sendEmail({
    to: user.email,
    subject: "Password Reset Instructions",
    html: emailHtml,
  });

  sendResponse(
    res,
    null,
    "Password reset instructions sent to your email",
    200
  );
};

export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { userId, oldPassword, newPassword } = req.body;
  if (!userId || !oldPassword || !newPassword) {
    return next(
      new ErrorHandler(
        "User id, old password, and new password are required",
        400
      )
    );
  }

  const user = await User.findById(userId);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Additional checks for account status and deletion
  if (user.isDeleted) {
    return next(new ErrorHandler("This account has been deleted", 403));
  }
  if (user.status !== "Active") {
    return next(new ErrorHandler("Account is not active", 403));
  }

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    return next(new ErrorHandler("Old password is incorrect", 401));
  }

  if (!isStrongPassword(newPassword)) {
    return next(
      new ErrorHandler(
        "Password must be at least 9 characters long and include uppercase, lowercase, number, and special character.",
        400
      )
    );
  }

   const isSameAsOld = await bcrypt.compare(newPassword, user.password);
  if (isSameAsOld) {
    return next(
      new ErrorHandler("New password must be different from the old password", 400)
    );
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();

  sendResponse(res, null, "Password changed successfully", 200);
};

export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { token } = req.query;
  if (!token || typeof token !== "string") {
    return next(new ErrorHandler("Verification token is required", 400));
  }

  let decoded: any;
  try {
    decoded = jwt.verify(token, config.jwt_secret as string);
  } catch (error) {
    return next(new ErrorHandler("Invalid or expired token", 400));
  }

  const user = await User.findById(decoded.userId);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  user.isEmailVerified = true;
  await user.save();

  sendResponse(res, null, "Email verified successfully", 200);
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return next(new ErrorHandler("Token and new password are required", 400));
  }

  let decoded: any;
  try {
    decoded = jwt.verify(token, config.jwt_secret as string);
  } catch (error) {
    return next(new ErrorHandler("Invalid or expired token", 400));
  }

  const user = await User.findById(decoded.userId);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  if (!isStrongPassword(newPassword)) {
    return next(
      new ErrorHandler(
        "Password must be at least 9 characters long and include uppercase, lowercase, number, and special character.",
        400
      )
    );
  }

   const isSameAsOld = await bcrypt.compare(newPassword, user.password);
  if (isSameAsOld) {
    return next(
      new ErrorHandler("New password must be different from the old password", 400)
    );
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();

  sendResponse(res, null, "Password reset successful", 200);
};

export const editUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;

  const { firstName, lastName, phoneNumber, companyName } = req.body;

  // Find the user by id
  const user = await User.findById(id);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Update only the allowed fields if provided
  if (firstName !== undefined) user.firstName = firstName;
  if (lastName !== undefined) user.lastName = lastName;
  if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
  if (companyName !== undefined) user.companyName = companyName;

  // Save the updated user document
  const updatedUser = await user.save();

  // Sanitize and send the updated user response
  const userResponse = sanitizeUser(updatedUser);
  sendResponse(res, userResponse, "User updated successfully");
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Extract user id from route parameters.
  const { id } = req.params;

  // Check if the user exists.
  const user = await User.findById(id);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Fixed default user id to be used as replacement for project createdBy field.
  const defaultUserId = "67f35a519c899e0dc4b6dee5";

  // Update all projects where this user is the creator.
  await ProjectModel.updateMany(
    { createdBy: user._id },
    { $set: { createdBy: defaultUserId } }
  );

  // Instead of deleting the user, update the isDeleted field to true.
  user.isDeleted = true;
  await user.save();

  // Send a success response.
  sendResponse(res, null, "User deleted successfully", 200);
};

export const findUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userId = (req.query._id || req.query.id) as string;

  if (!userId) {
    return next(new ErrorHandler("User ID is required", 400));
  }

  const user = await User.findById(userId);

  if (!user || user.isDeleted) {
    return next(new ErrorHandler("User not found", 404));
  }

  sendResponse(res, user, "User retrieved successfully", 200);
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.cookies.refreshToken;
  if (!token) {
    return next(new ErrorHandler("No refresh token", 401));
  }

  const { userId } = verifyRefreshToken(token);
  const user = await User.findById(userId);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // sign a fresh access token
  const newAccessToken = signAccessToken({
    userId,
    role: user.role,
  });

  // convert your expiry‐string to a number
  const accessMaxAge = parseExpiryToMs(config.jwt_access_token_expires_in!);

  // set the cookie
  res.cookie("accessToken", newAccessToken, cookieOptions(accessMaxAge));

  sendResponse(res, null, "Access token refreshed", 200);
};

export const logoutUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  sendResponse(res, null, "Logged out successfully", 200);
};


---
// src/middlewares/CatchErrorMiddleware.ts

import { Request, Response, NextFunction } from "express";

/**
 * Higher-order function to catch errors in asynchronous route handlers.
 * Automatically forwards errors to Express error-handling middleware.
 *
 * @param handler - An asynchronous function handling an Express request.
 * @returns A function that wraps the handler and catches any errors.
 */
export const catchError = (
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => (req: Request, res: Response, next: NextFunction): void => {
  handler(req, res, next).catch(next);
};


---
// src/middlewares/ErrorMiddleware.ts

import { Request, Response, NextFunction } from "express";
import { ICustomError } from "../../shared/interface/ErrorInterface";
import ErrorHandler from "../utils/ErrorHandler";

const errorMiddleware = ( 
  err: ICustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Set default values if not provided
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";

  // Handle CastError (e.g., invalid MongoDB ID)
  if (err.name === "CastError" && err.path) {
    const message = `Resource not found. Invalid: ${err.path}`;
    err = new ErrorHandler(message, 400);
  }

  // Handle Duplicate Key Error (e.g., duplicate field in MongoDB)
  if (err.code === 11000 && err.keyValue) {
    const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
    err = new ErrorHandler(message, 400);
  }

  // Handle invalid JWT token
  if (err.name === "JsonWebTokenError") {
    const message = "Json Web Token is invalid, try again";
    err = new ErrorHandler(message, 400);
  }

  // Handle expired JWT token
  if (err.name === "TokenExpiredError") {
    const message = "Json Web Token is expired, try again";
    err = new ErrorHandler(message, 400);
  }

  // Send the error response
  res.status(err.statusCode ?? 500).json({
    success: false,
    message: err.message,
  });
};

export default errorMiddleware;


---
// src/middlewares/authenticateJwt.ts

// src/middlewares/authenticateJwt.ts
import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/tokenService";
import ErrorHandler from "../utils/ErrorHandler";

export interface AuthRequest extends Request {
  user?: { userId: string; role: string };
}

export const authenticateJwt = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies.accessToken;
  if (!token) {
    return next(new ErrorHandler("Not authenticated", 401));
  }

  try {
    // throws if invalid/expired
    const payload = verifyAccessToken(token);
    req.user = { userId: payload.userId, role: payload.role };
    next();
  } catch {
    next(new ErrorHandler("Invalid or expired access token", 401));
  }
};


---
// src/middlewares/authorizeRoles.ts

// src/middlewares/authorizeRoles.ts
import { Response, NextFunction } from "express";
import { AuthRequest } from "./authenticateJwt";
import ErrorHandler from "../utils/ErrorHandler";

export const authorizeRoles =
  (...allowedRoles: string[]) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ErrorHandler("Not authenticated", 401));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ErrorHandler("Forbidden: insufficient permissions", 403));
    }
    next();
  };


---
// src/middlewares/deviceInfo.ts

// src/middlewares/deviceInfo.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';
import requestIp from 'request-ip';
import useragent from 'express-useragent';
import geoip, { Lookup } from 'geoip-lite';

export const deviceInfoMiddleware: RequestHandler[] = [
  // 1) populate `req.useragent`
  useragent.express(),

  // 2) our own middleware
  (req: Request, res: Response, next: NextFunction) => {
    // get the IP
    const ip = requestIp.getClientIp(req) || '';

    // unwrap the typed `req.useragent`
    const ua = req.useragent;             // now TS knows this is `Details`
    const deviceType = ua.isMobile
      ? 'mobile'
      : ua.isDesktop
      ? 'desktop'
      : 'other';

    // typed lookup
    const geo: Lookup | null = geoip.lookup(ip);
    const location = {
      country: geo?.country ?? null,
      region: geo?.region ?? null,
      city: geo?.city ?? null,
    };

    // attach a fully typed object
    req.deviceInfo = {
      ip,
      deviceType,
      platform: ua.platform,
      browser: ua.browser,
      location,
    };

    next();
  },
];


---
// src/model/ChatModel.ts

import mongoose, { Document, Schema, Model } from "mongoose";
import { IChatMessage } from "../../shared/interface/ChatMessageInterface";

export interface IChatMessageDoc
  extends Omit<IChatMessage, "_id">,
    Document {}

const ChatMessageSchema = new Schema<IChatMessageDoc>(
  {
    senderName:   { type: String, required: true },
    receiverName: { type: String, required: true },
    senderEmail:  { type: String, required: true },
    receiverEmail:{ type: String, required: true },
    message:      { type: String, required: true },
  },
  {
    timestamps: { createdAt: "timestamp", updatedAt: false },
  }
);

export const ChatMessageModel: Model<IChatMessageDoc> =
  mongoose.model<IChatMessageDoc>("ChatMessage", ChatMessageSchema);

export default ChatMessageModel;


---
// src/model/GroupMessage.ts

import mongoose, { Document, Schema, Model } from "mongoose";
import { IGroupMessage } from "../../shared/interface/GroupMessageInterface";

export interface IGroupMessageDoc
  extends Omit<IGroupMessage, "_id">,
    Document {}

const GroupMessageSchema = new Schema<IGroupMessageDoc>(
  {
    meetingId:   { type: String, required: true },
    senderEmail: { type: String, required: true },
    name:        { type: String, required: true },
    content:     { type: String, required: true },
  },
  {
    timestamps: { createdAt: "timestamp", updatedAt: false },
  }
);

export const GroupMessageModel: Model<IGroupMessageDoc> =
  mongoose.model<IGroupMessageDoc>("GroupMessage", GroupMessageSchema);

export default GroupMessageModel;


---
// src/model/LiveSessionModel.ts

// backend/models/LiveSessionModel.ts
import mongoose, { Document, Schema, Model, Types } from "mongoose";
import { ILiveSession } from "../../shared/interface/LiveSessionInterface";

export interface ILiveSessionDocument extends Omit<ILiveSession,'_id'| "sessionId">, Document {sessionId: Types.ObjectId;}


const WaitingRoomParticipantSchema = new Schema< 
  ILiveSessionDocument["participantWaitingRoom"][0]
>({ 
  name: { type: String, required: true }, 
  email: { type: String, required: true }, 
  role: { type: String, enum: ["Participant", "Moderator", "Admin"], required: true }, 
  joinedAt: { type: Date, required: true, default: () => new Date() }, 
});
const WaitingRoomObserverSchema = new Schema< 
  ILiveSessionDocument["observerWaitingRoom"][0]
>({ 
  userId:     { type: Schema.Types.ObjectId, ref: "User", required: false }, 
  name: { type: String, required: true }, 
  email: { type: String, required: true }, 
  role: { type: String, enum: ["Observer", "Moderator" , "Admin"], required: true }, 
  joinedAt: { type: Date, required: true, default: () => new Date() }, 
});

const ParticipantSchema = new Schema< 
  ILiveSessionDocument["participantsList"][0]
>({ 
  email:   { type: String, required: true }, 
  name: { type: String, required: true }, 
  role: { type: String, enum: ["Participant", "Moderator" , "Admin"], required: true }, 
  joinedAt: { type: Date, required: true, default: () => new Date() }, 
});

const ObserverSchema = new Schema< 
  ILiveSessionDocument["observerList"][0]
>({ 
  userId: { type: Schema.Types.ObjectId, ref: "User", required: false  }, 
  name: { type: String, required: true }, 
  email:   { type: String, required: true }, 
  role: { type: String, enum: ["Observer", "Moderator" , "Admin"], required: true }, 
  joinedAt: { type: Date, required: true, default: () => new Date() }, 
});

const LiveSessionSchema = new Schema<ILiveSessionDocument>(
  {
    sessionId: {  type: Schema.Types.ObjectId, ref: "Session", required: true },
    ongoing: { type: Boolean, default: false },
    startTime: { type: Date },
    endTime: { type: Date },
    participantWaitingRoom: { type: [WaitingRoomParticipantSchema], default: [] },
    observerWaitingRoom: { type: [WaitingRoomObserverSchema], default: [] },
    participantsList: { type: [ParticipantSchema], default: [] },
    observerList: { type: [ObserverSchema], default: [] },
    // add other flags or subdocuments here
  },
  {
    timestamps: true, 
  }
);

export const LiveSessionModel: Model<ILiveSessionDocument> =
  mongoose.model<ILiveSessionDocument>("LiveSession", LiveSessionSchema);


---
// src/model/ModeratorModel.ts

// src/models/moderator.model.ts

import { Schema, model, Document, Types } from "mongoose";
import { IModerator, Role } from "../../shared/interface/ModeratorInterface";

// Omit the '_id' from IModerator to avoid conflicts with Document's '_id'
export interface IModeratorDocument
  extends Omit<IModerator, "_id" | "projectId" >,
    Document {
      _id: Types.ObjectId;
  projectId: Types.ObjectId;
}

const moderatorSchema = new Schema<IModeratorDocument>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    companyName: { type: String, required: true },
     roles: {
      type: [String],
      enum: ["Admin", "Moderator", "Observer"] as Role[],
      default: [],
      required: true,
    },
    adminAccess: { type: Boolean, default: false },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export default model<IModeratorDocument>("Moderator", moderatorSchema);


---
// src/model/ObserverDocumentModel.ts

// backend/model/ObserverDocumentModel.ts
import { Schema, model, Types, Document } from "mongoose";

import {IObserverDocument} from "../../shared/interface/ObserverDocumentInterface"
/* map string IDs → ObjectId for DB layer */
type ObserverDocDB = Omit<
  IObserverDocument,
  "_id" | "projectId" | "sessionId" | "addedBy"
> & {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  sessionId: Types.ObjectId;
  addedBy: Types.ObjectId;
};

export interface ObserverDocument
  extends Document<Types.ObjectId, {}, ObserverDocDB>,
    ObserverDocDB {}

const ObserverDocSchema = new Schema<ObserverDocument>(
  {
    projectId:   { type: Schema.Types.ObjectId, ref: "Project", required: true },
    sessionId:   { type: Schema.Types.ObjectId, ref: "Session", required: true },
    displayName: { type: String, required: true, trim: true },
    size:        { type: Number, required: true }, 
    storageKey:  { type: String, required: true, trim: true },
    addedBy:     { type: Schema.Types.ObjectId, ref: "User", required: true },
    addedByRole: {
      type: String,
      enum: ["Admin", "Moderator", "Observer"],
      required: true,
    },
  },
  { timestamps: true }
);

export const ObserverDocumentModel = model<ObserverDocument>(
  "ObserverDocument",
  ObserverDocSchema
);


---
// src/model/ObserverGroupMessage.ts

import mongoose, { Document, Schema, Model } from "mongoose";
import { IObserverGroupMessage } from "../../shared/interface/ObserverGroupMessageInterface";

export interface IObserverGroupMessageDoc
  extends Omit<IObserverGroupMessage, "_id">,
    Document {}

const ObserverGroupMessageSchema = new Schema<IObserverGroupMessageDoc>(
  {
    meetingId:   { type: String, required: true },
    senderEmail: { type: String, required: true },
    name:        { type: String, required: true },
    content:     { type: String, required: true },
  },
  {
    timestamps: { createdAt: "timestamp", updatedAt: false },
  }
);

export const ObserverGroupMessageModel: Model<IObserverGroupMessageDoc> =
  mongoose.model<IObserverGroupMessageDoc>(
    "ObserverGroupMessage",
    ObserverGroupMessageSchema
  );

export default ObserverGroupMessageModel;


---
// src/model/ObserverWaitingRoomChatModel.ts

import mongoose, { Document, Schema, Model, Types } from "mongoose";
import { IWaitingRoomChat } from "../../shared/interface/WaitingRoomChatInterface";

interface IObserverWaitingRoomChatDocument
  extends Omit<IWaitingRoomChat, "sessionId" | "_id">,
    Document {
  sessionId: Types.ObjectId;
}

const ObserverWaitingRoomChatSchema = new Schema<IObserverWaitingRoomChatDocument>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "LiveSession", required: true },
    email: { type: String, required: true },
    senderName: { type: String, required: true },
    role: {
      type: String,
      enum: ["Participant", "Observer", "Moderator"],
      required: true,
    },
    content: { type: String, required: true },
    timestamp: { type: Date, default: () => new Date() },
  },
  { timestamps: false }
);

export const ObserverWaitingRoomChatModel: Model<IObserverWaitingRoomChatDocument> =
  mongoose.model<IObserverWaitingRoomChatDocument>(
    "ObserverWaitingRoomChat",
    ObserverWaitingRoomChatSchema
  );


---
// src/model/ParticipantMeetingChatModel.ts

import mongoose, { Schema, Document, Types } from "mongoose";
import { IWaitingRoomChat } from "../../shared/interface/WaitingRoomChatInterface";


export interface ParticipantMeetingChatDocument extends Omit<IWaitingRoomChat,"sessionId" | "_id">, Document {sessionId: Types.ObjectId;}

const ParticipantMeetingChatSchema = new Schema<ParticipantMeetingChatDocument>({
   sessionId: { type: Schema.Types.ObjectId, ref: "LiveSession", required: true },
   email:   { type: String, required: true },
  senderName:    { type: String, required: true },
 role: { type: String, enum: ["Participant", "Observer", "Moderator"], required: true },
    content: { type: String, required: true },
  timestamp:     { type: Date,   required: true },
});

export const ParticipantMeetingChatModel = mongoose.model< 
  ParticipantMeetingChatDocument
>("ParticipantMeetingChat", ParticipantMeetingChatSchema);


---
// src/model/ParticipantWaitingRoomChatModel.ts

// backend/models/WaitingRoomChatModel.ts
import mongoose, { Document, Schema, Model, Types } from "mongoose";
import { IWaitingRoomChat } from "../../shared/interface/WaitingRoomChatInterface";

export interface IParticipantWaitingRoomChatDocument extends Omit<IWaitingRoomChat, "sessionId" | "_id">, Document {sessionId: Types.ObjectId;}

const ParticipantWaitingRoomChatSchema  = new Schema<IParticipantWaitingRoomChatDocument>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "LiveSession", required: true },
    email:   { type: String, required: true },
    senderName: { type: String, required: true },
    role: { type: String, enum: ["Participant", "Observer", "Moderator"], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: () => new Date() },
  },
  {
    timestamps: false,
  }
);

export const ParticipantWaitingRoomChatModel: Model<IParticipantWaitingRoomChatDocument> =
  mongoose.model<IParticipantWaitingRoomChatDocument>(
    "ParticipantWaitingRoomChat",
    ParticipantWaitingRoomChatSchema
  );


---
// src/model/PollModel.ts

import { Schema, model, Types, Document } from "mongoose";
import { IPoll } from "../../shared/interface/PollInterface";

/* Convert front-end strings → ObjectIds */
type PollDB = Omit<IPoll, "_id" | "projectId" | "sessionId" | "createdBy" | "questions"> & {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  sessionId: Types.ObjectId;
  createdBy: Types.ObjectId;
  questions: (IPoll["questions"][number] & { _id: Types.ObjectId })[];
};

export interface PollDocument
  extends Document<Types.ObjectId, {}, PollDB>,
    PollDB {}

/* ---------- Question schema (all optional fields declared) ---------- */
const QuestionSchema = new Schema(
  {
    type: {
      type: String,
      enum: [
        "SINGLE_CHOICE",
        "MULTIPLE_CHOICE",
        "MATCHING",
        "RANK_ORDER",
        "SHORT_ANSWER",
        "LONG_ANSWER",
        "FILL_IN_BLANK",
        "RATING_SCALE",
      ],
      required: true,
    },
    prompt: { type: String, required: true, trim: true },
    required: { type: Boolean, default: false },
    image: { type: String },

    /* single / multiple choice */
    answers: { type: [String] },
    correctAnswer: { type: Number },
    correctAnswers: { type: [Number] },
    showDropdown: { type: Boolean },

    /* matching */
    options: { type: [String] },

    /* rank order */
    rows: { type: [String] },
    columns: { type: [String] },

    /* text questions */
    minChars: { type: Number },
    maxChars: { type: Number },

    /* rating scale */
    scoreFrom: { type: Number },
    scoreTo: { type: Number },
    lowLabel: { type: String },
    highLabel: { type: String },
  },
  { _id: true }
);

/* ---------- Poll schema ---------- */
const PollSchema = new Schema<PollDocument>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },

    sessionId: { type: Schema.Types.ObjectId, ref: "Session" },

    title: { type: String, required: true, trim: true },
    questions: { type: [QuestionSchema], required: true },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdByRole: {
      type: String,
      enum: ["Admin", "Moderator"],
      required: true,
    },

    lastModified: { type: Date, default: Date.now },
    responsesCount: { type: Number, default: 0 },
    isRun: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const PollModel = model<PollDocument>("Poll", PollSchema);


---
// src/model/ProjectFormModel.ts

import { Schema, model, Document, Types } from "mongoose";
import { IProjectForm } from "../../shared/interface/ProjectFormInterface";

export interface IProjectFormDocument extends Omit<IProjectForm, "user">, Document {
  user: Types.ObjectId;
}

const projectFormSchema = new Schema<IProjectFormDocument>(
  { name: { type: String },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    service: {
      type: String,
      enum: ["Concierge", "Signature"],
      required: true,
    },
    addOns: { type: [String] },
    respondentCountry: { type: String },
    respondentLanguage: { type: [String] },
    sessions: [
      {
        number: { type: Number },
        duration: { type: String },
      },
    ],
    firstDateOfStreaming: { type: Date, required: true },
    respondentsPerSession: { type: Number, default: 0 },
    numberOfSessions: { type: Number, default: 0 },
    sessionLength: { type: Number, default: 0},
    recruitmentSpecs: { type: String, default: ""},
    preWorkDetails: { type: String, default: "" },
    selectedLanguage: { type: String, default: ""},
    inLanguageHosting: {
      type: String,
      enum: ["yes", "no", ""],
      default: "",
    },
    provideInterpreter: {
      type: String,
      enum: ["yes", "no", ""],
      default: "",
    },
    languageSessionBreakdown: { type: String, default: "" },
    additionalInfo: { type: String, default: "" },
    emailSent: { type: String, default: "Pending" },
  },
  {
    timestamps: true,
  }
);

export default model<IProjectFormDocument>("ProjectForm", projectFormSchema);


---
// src/model/ProjectModel.ts


import { Schema, model, Document, Types } from "mongoose";
import { IProject, IProjectSession } from "../../shared/interface/ProjectInterface";

// Override types for backend/Mongoose usage
export interface IProjectDocument extends Omit<IProject, "createdBy" | "tags" | "moderators" | "meetings" | "_id">, Document {
  createdBy: Types.ObjectId;
  tags: Types.ObjectId[];
  moderators: Types.ObjectId[];
  meetings: Types.ObjectId[];
  sessions: IProjectSession[];
}

const projectSchema = new Schema<IProjectDocument>(
  {
    name: { type: String, required: true },
    internalProjectName: { type: String, default: "" },
    description: { type: String, default: "" },
    startDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["Draft", "Active", "Inactive", "Closed", "Archived"],
      default: "Draft",
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tags: { type: [Schema.Types.ObjectId], ref: "Tag", default: [] },
    moderators: { type: [Schema.Types.ObjectId], ref: "Moderator", default: [] },
    meetings: { type: [Schema.Types.ObjectId], ref: "Session", default: [] },
    projectPasscode: {
      type: String,
      default: () =>
        Math.floor(10000000 + Math.random() * 90000000).toString(),
    },
    cumulativeMinutes: { type: Number, default: 0 },
    service: {
      type: String,
      enum: ["Concierge", "Signature"],
      required: true,
    },
    respondentCountry: { type: String },
    respondentLanguage: { type: String },
    sessions: [
      {
        number: { type: Number },
        duration: { type: String },
      },
    ],
    recordingAccess: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export default model<IProjectDocument>("Project", projectSchema);


---
// src/model/SessionDeliverableModel.ts

import { Schema, model, Types, Document } from "mongoose";
import { ISessionDeliverable } from "../../shared/interface/SessionDeliverableInterface"

/* Convert string IDs to ObjectId for Mongo layer */
type DeliverableDB = Omit<
ISessionDeliverable,
  "_id" | "sessionId" | "projectId" | "uploadedBy"
> & {
  _id: Types.ObjectId;
  sessionId: Types.ObjectId;
  projectId: Types.ObjectId;
  uploadedBy: Types.ObjectId;
};

export interface SessionDeliverableDocument
  extends Document<Types.ObjectId, {}, DeliverableDB>,
    DeliverableDB {}

const DeliverableSchema = new Schema<SessionDeliverableDocument>(
  {
    sessionId:  { type: Schema.Types.ObjectId, ref: "Session",  required: true },
    projectId:  { type: Schema.Types.ObjectId, ref: "Project",  required: true },

    type: {
      type:    String,
      enum:    [
        "AUDIO",
        "VIDEO",
        "TRANSCRIPT",
        "BACKROOM_CHAT",
        "SESSION_CHAT",
        "WHITEBOARD",
        "POLL_RESULT",
      ],
      required: true,
    },
    displayName:  { type: String, required: true, trim: true },
    size:         { type: Number, required: true }, 
    storageKey:   { type: String, required: true, trim: true },
    uploadedBy:   { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const SessionDeliverableModel = model<SessionDeliverableDocument>(
  "SessionDeliverable",
  DeliverableSchema
);


---
// src/model/SessionModel.ts

// backend/models/SessionModel.ts
import { Schema, model, Document, Types } from "mongoose";
import { ISession } from "../../shared/interface/SessionInterface";

// Omit the raw string-IDs so we can re-add them as ObjectId
type SessionDB = Omit<ISession, "_id" | "projectId" | "moderators"> & {
  projectId: Types.ObjectId;
  moderators: Types.ObjectId[];
};

// Now extend Document<Types.ObjectId, {}, SessionDB>
export interface ISessionDocument
  extends Document<Types.ObjectId, {}, SessionDB>,
          SessionDB {
  createdAt?: Date;
  updatedAt?: Date;
}

const SessionSchema = new Schema<ISessionDocument>(
  {
    title: { type: String, required: true, trim: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    duration: { type: Number, required: true, min: 30 },
    moderators: [
      { type: Schema.Types.ObjectId, ref: "Moderator", required: true }
    ],
    timeZone: { type: String, required: true },
    breakoutRoom: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

export const SessionModel = model<ISessionDocument>(
  "Session",
  SessionSchema
);


---
// src/model/TagModel.ts

import { Schema, model, Types, Document } from "mongoose";
import { ITag } from "../../shared/interface/TagInterface"; 
/**
 * Convert the three IDs from `string` to `Types.ObjectId`
 * so they line up with what Mongoose actually stores.
 */
type TagDBProps = Omit<ITag, "_id" | "createdBy" | "projectId"> & {
  createdBy: Types.ObjectId;
  projectId: Types.ObjectId;
};

/**
 * Mongoose document type = your converted props + the built-in Document
 * + automatic timestamp fields.
 */
export interface TagDocument
  extends Document<Types.ObjectId, {}, TagDBProps>,
    TagDBProps {
  createdAt: Date;
  updatedAt: Date;
}

const TagSchema = new Schema<TagDocument>(
  {
    title:     { type: String, required: true, trim: true },
    color:     { type: String, required: true, trim: true },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
  },
  { timestamps: true }
);

export const TagModel = model<TagDocument>("Tag", TagSchema);


---
// src/model/UserActivityModel.ts

// backend/models/UserActivityModel.ts
import mongoose, { Document, Schema, Model, Types } from "mongoose";
import { IUserActivity } from "../../shared/interface/UserActivityInterface";

export interface IUserActivityDocument extends Omit<IUserActivity, "_id"| "sessionId" | "userId">, Document {sessionId: Types.ObjectId, userId: Types.ObjectId}

const DeviceInfoSchema = new Schema<IUserActivityDocument["deviceInfo"]>(
  {
    ip: { type: String },
    deviceType: { type: String },
    platform: { type: String },
    browser: { type: String },
    location: { type: String },
  },
  { _id: false }
);

const UserActivitySchema = new Schema<IUserActivityDocument>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "LiveSession", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: false },
    role: { type: String, enum: ["Participant", "Observer", "Moderator", "Admin"], required: true },
    joinTime: { type: Date, default: () => new Date(), required: true },
    leaveTime: { type: Date },
    deviceInfo: { type: DeviceInfoSchema },
  },
  {
    timestamps: false,
  }
);

export const UserActivityModel: Model<IUserActivityDocument> =
  mongoose.model<IUserActivityDocument>("UserActivity", UserActivitySchema);


---
// src/model/UserModel.ts

import mongoose, { Schema, Document, Model } from "mongoose";
import { IUser } from "../../shared/interface/UserInterface";
export interface IUserDocument extends Omit<IUser, "_id">, Document {}

const UserSchema: Schema<IUserDocument> = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true, unique: true },
    companyName: { type: String, required: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: [
        "Admin",
        "Moderator",
        "Observer",
        "Participant",
        "AmplifyAdmin",
        "AmplifyModerator",
        "AmplifyObserver",
        "AmplifyParticipant",
        "AmplifyTechHost",
      ],
      required: true,
    },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    isEmailVerified: { type: Boolean, default: false },
    termsAccepted: { type: Boolean, required: true },
    termsAcceptedTime: { type: Date, default: Date.now },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: String, default: "self" },
    createdById: { type: Schema.Types.ObjectId },
    credits: { type: Number, default: 0 },
    stripeCustomerId: { type: String },
    billingInfo: {
      address: { type: String },
      city: { type: String },
      state: { type: String },
      country: { type: String },
      postalCode: { type: String },
    },
    creditCardInfo: {
      last4: { type: String },
      brand: { type: String },
      expiryMonth: { type: String },
      expiryYear: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

const User: Model<IUserDocument> = mongoose.model<IUserDocument>(
  "User",
  UserSchema
);

export default User;


---
// src/package.json
{
  "name": "backend",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
       "build:shared": "tsc --build ../shared",
    "build:backend": "tsc --build",
    "build": "npm run build:shared && npm run build:backend",
    "start:prod": "node ./dist/server.js",
    "dev": "ts-node-dev --respawn --transpile-only ./server.ts",
    "start": "ts-node ./server.ts"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "description": "",
  "dependencies": {
    "@aws-sdk/client-s3": "^3.802.0",
    "@aws-sdk/s3-request-presigner": "^3.802.0",
    "archiver": "^7.0.1",
    "aws-sdk": "^2.1692.0",
    "bcrypt": "^5.1.1",
    "bcryptjs": "^3.0.2",
    "cloudinary": "^2.6.0",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.5",
    "dotenv": "^16.5.0",
    "express": "^5.1.0",
    "express-useragent": "^1.0.15",
    "geoip-lite": "^1.4.10",
    "jsonwebtoken": "^9.0.2",
    "luxon": "^3.6.1",
    "mongoose": "^8.13.2",
    "ms": "^2.1.3",
    "multer": "^1.4.5-lts.2",
    "node-cron": "^3.0.3",
    "nodemailer": "^6.10.0",
    "request-ip": "^3.3.0",
    "socket.io": "^4.8.1",
    "stripe": "^18.0.0"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2",
    "@types/bcryptjs": "^2.4.6",
    "@types/cookie-parser": "^1.4.8",
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.1",
    "@types/express-useragent": "^1.0.5",
    "@types/geoip-lite": "^1.4.4",
    "@types/jsonwebtoken": "^9.0.9",
    "@types/luxon": "^3.6.2",
    "@types/ms": "^2.1.0",
    "@types/multer": "^1.4.12",
    "@types/node": "^22.14.0",
    "@types/node-cron": "^3.0.11",
    "@types/nodemailer": "^6.4.17",
    "@types/request-ip": "^0.0.41",
    "@types/socket.io": "^3.0.1",
    "nodemon": "^3.1.9",
    "ts-node": "^10.9.2",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.8.2"
  }
}


---
// src/processors/isValidEmail.ts

export const isValidEmail = (email: string): boolean => {
  // This regex pattern checks for a basic email format.
  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  return emailRegex.test(email);
};


---
// src/processors/liveSession/sessionService.ts

// backend/processors/sessionService.ts

import { ClientSession, Types } from "mongoose";
import { LiveSessionModel } from "../../model/LiveSessionModel";
import { UserActivityModel } from "../../model/UserActivityModel";
import ChatMessageModel from "../../model/ChatModel";
import GroupMessageModel from "../../model/GroupMessage";
import ObserverGroupMessageModel from "../../model/ObserverGroupMessage";
import { ParticipantWaitingRoomChatModel } from "../../model/ParticipantWaitingRoomChatModel";

export interface EnqueueUserData {
  userId?: string;
  name: string;
  email: string;
  role: "Participant" | "Observer" | "Moderator" | "Admin";
}

/**
 * Ensure there is a LiveSession for the given scheduled session.
 * If none exists, create it with ongoing=false.
 */
export async function createLiveSession(sessionId: string,  options?: { session?: ClientSession }) {
  // include the session on the query (so even findOne is under txn)
  const live = await LiveSessionModel.findOne(
    { sessionId: new Types.ObjectId(sessionId) },
    null,
    { session: options?.session }
  );
   if (live) return live;
    // create with the session option
  const [created] = await LiveSessionModel.create(
    [
      {
        sessionId: new Types.ObjectId(sessionId),
        ongoing: false,
      }
    ],
    { session: options?.session }
  );

  return created;
}

/**
 * Add a user to the waiting room and record their join in UserActivity.
 */
export async function enqueueUser(
  sessionId: string,
  userData: EnqueueUserData
) {
  const live = await LiveSessionModel.findOne({ sessionId });
  if (!live) throw new Error("LiveSession not found");

  // 🛑 skip if already in waiting room
  if (
    userData.role === "Participant" && (
      live.participantWaitingRoom.some((u) => u.email === userData.email) ||
      live.participantsList.some((u) => u.email === userData.email)
    )
  ) {
    return {
      participantsWaitingRoom: live.participantWaitingRoom,
      observersWaitingRoom: live.observerWaitingRoom,
      participantList: live.participantsList,
      observerList: live.observerList
    };
  }
  // Add to waiting room
  if (userData.role === "Participant") {
    live.participantWaitingRoom.push({
      name: userData.name,
      email: userData.email,
      role: userData.role,
      joinedAt: new Date(),
    });
  } else if (userData.role === "Observer") {
    live.observerWaitingRoom.push({
      userId: userData.userId || undefined,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      joinedAt: new Date(),
    });
  } else if (userData.role === "Moderator" || userData.role === "Admin" ) {
    const email = userData.email;
    if (
      live.observerList.some(u => u.email === email) ||
      live.participantsList.some(u => u.email === email)
    ) {
      return {
            participantsWaitingRoom: live.participantWaitingRoom,
    observersWaitingRoom:    live.observerWaitingRoom,
    participantList:         live.participantsList,
    observerList:            live.observerList,
      };
    }
    
    live.observerList.push({
      userId: userData.userId || undefined,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      joinedAt: new Date(),
    });
    live.participantsList.push({
      name: userData.name,
      email: userData.email,
      role: userData.role,
      joinedAt: new Date(),
    });
  }

  await live.save();

  // Log join in activity
  await UserActivityModel.create({
    sessionId: live._id,
    userId: userData.userId ? new Types.ObjectId(userData.userId) : undefined,
    role: userData.role,
    joinTime: new Date(),
  });

  return {
     participantsWaitingRoom: live.participantWaitingRoom,
      observersWaitingRoom: live.observerWaitingRoom,
      participantList: live.participantsList,
      observerList: live.observerList
  };
}

/**
 * Mark the LiveSession as started.
 */
export async function startSession(sessionId: string) {
  const live = await LiveSessionModel.findOne({ sessionId });
  if (!live) throw new Error("LiveSession not found");

  live.ongoing = true;
  live.startTime = new Date();
  await live.save();

  return live;
}

/**
 * Mark the LiveSession as ended and record endTime.
 */
export async function endSession(sessionId: string) {
  const live = await LiveSessionModel.findOne({ sessionId });
  if (!live) throw new Error("LiveSession not found");

  live.ongoing = false;
  live.endTime = new Date();
  await live.save();

  return live;
}

/**
 * Fetch consolidated session history:
 *  • liveSession metadata
 *  • all join/leave activities
 *  • all waiting-room chats
 *  • all in-meeting direct and group chats
 */
export async function getSessionHistory(sessionId: string) {
  const live = await LiveSessionModel.findOne({ sessionId });
  if (!live) throw new Error("LiveSession not found");

  const liveId = live._id;

  // Join/leave activity
  const activities = await UserActivityModel.find({ sessionId: liveId }).lean();

  // Waiting-room chats
  const waitingRoomChats = await ParticipantWaitingRoomChatModel.find({
    sessionId: liveId,
  }).lean();

  // In-meeting direct chats (1:1)
  const directChats = await ChatMessageModel.find({ 
    sessionId: liveId,
  }).lean();

  // In-meeting participant group chats
  const groupChats = await GroupMessageModel.find({
    meetingId: sessionId,
  }).lean();

  // In-meeting observer group chats
  const observerChats = await ObserverGroupMessageModel.find({
    meetingId: sessionId,
  }).lean();

  return {
    liveSession: live.toObject(),
    activities,
    waitingRoomChats,
    directChats,
    groupChats,
    observerChats,
  };
}

export async function logLeave(
  sessionId: string,
  userId: string
): Promise<void> {
  // Find the LiveSession to get its _id
  const live = await LiveSessionModel.findOne({ sessionId });
  if (!live) throw new Error("LiveSession not found");

  // Find the most recent activity without a leaveTime
  const activity = await UserActivityModel.findOne({ 
    sessionId: live._id,
    userId: new Types.ObjectId(userId),
    leaveTime: { $exists: false },
  }).sort({ joinTime: -1 });

  if (activity) {
    activity.leaveTime = new Date();
    await activity.save();
  }
}


---
// src/processors/poll/QuestionValidationProcessor.ts

import { NextFunction } from "express";
import ErrorHandler from "../../utils/ErrorHandler";

export const validateQuestion = (
  q: any,
  idx: number,
  next: NextFunction
): boolean => {
  const fail = (msg: string) => {
    next(new ErrorHandler(`Question ${idx + 1}: ${msg}`, 400));
    return true;
  };

  if (!q || typeof q !== "object") return fail("must be an object");
  if (!q.type) return fail("type is required");

  switch (q.type) {
    case "SINGLE_CHOICE":
      if (!Array.isArray(q.answers) || q.answers.length < 2)
        return fail("requires at least two answers");
      if (typeof q.correctAnswer !== "number")
        return fail("correctAnswer (index) is required");
      if (q.correctAnswer < 0 || q.correctAnswer >= q.answers.length)
        return fail("correctAnswer index is out of range");
      break;

    case "MULTIPLE_CHOICE":
      if (!Array.isArray(q.answers) || q.answers.length < 2)
        return fail("requires at least two answers");
      if (!Array.isArray(q.correctAnswers) || q.correctAnswers.length === 0)
        return fail("correctAnswers array is required");
      if (q.correctAnswers.some((n: number) => n < 0 || n >= q.answers.length))
        return fail("one or more correctAnswers indices are out of range");
      break;

    case "MATCHING":
      if (!Array.isArray(q.options) || !Array.isArray(q.answers))
        return fail("options and answers arrays are required");
      // Add length check here if you need strict one-to-one mapping
      // if (q.options.length !== q.answers.length)
      //   return error("options and answers must be the same length");
      break;

    case "RANK_ORDER":
      if (!Array.isArray(q.rows) || !Array.isArray(q.columns))
        return fail("rows and columns arrays are required");
      break;

    case "SHORT_ANSWER":
    case "LONG_ANSWER":
      // Add min/max char checks if desired
      break;

    case "FILL_IN_BLANK":
      if (!Array.isArray(q.answers) || q.answers.length === 0)
        return fail("answers array is required");
      break;

    case "RATING_SCALE":
      if (
        typeof q.scoreFrom !== "number" ||
        typeof q.scoreTo !== "number" ||
        q.scoreFrom >= q.scoreTo
      )
        return fail("scoreFrom must be less than scoreTo");
      break;

    default:
      return fail(`unknown type "${q.type}"`);
  }

  return false; // validation passed
};


---
// src/processors/sendEmail/sendVerifyAccountEmailProcessor.ts

import transporter from "../../config/NodemailerConfig";
import config from "../../config/index"
import {SendEmailOptions} from "../../../shared/interface/SendEmailInterface"


export const sendEmail = async (options: SendEmailOptions): Promise<void> => {
  const mailOptions = {
    from: config.EMAIL_FROM || 'test356sales@gmail.com',
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  await transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Email has been sent:", info);
    }
  });
  
};


---
// src/processors/session/sessionTimeConflictChecker.ts

// backend/processors/session/sessionTimeConflictChecker.ts
import { DateTime } from "luxon";

/**
 * Combines a date (Date or ISO “YYYY-MM-DD”) and a “HH:mm” time string
 * into a millisecond timestamp in the given IANA timeZone.
 */
export const toTimestamp = (
  dateVal: Date | string,
  timeStr: string,
  timeZone: string
): number => {
  // Normalize date to “YYYY-MM-DD”
  const dateISO =
    typeof dateVal === "string"
      ? dateVal
      : DateTime.fromJSDate(dateVal).toISODate()!;

  const dt = DateTime.fromISO(`${dateISO}T${timeStr}`, { zone: timeZone });
  if (!dt.isValid) {
    throw new Error(
      `Invalid date/time/timeZone: ${dateISO} ${timeStr} ${timeZone}`
    );
  }
  return dt.toMillis();
};


---
// src/processors/user/isStrongPasswordProcessor.ts

export const isStrongPassword = (password: string): boolean => {
  const minLength = 9;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

  return (
    password.length >= minLength &&
    hasUpperCase &&
    hasLowerCase &&
    hasNumber &&
    hasSpecialChar
  );
};


---
// src/processors/user/isValidEmailProcessor.ts

export const isValidEmail = (email: string): boolean => {
  // This regex pattern checks for a basic email format.
  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  return emailRegex.test(email);
};


---
// src/processors/user/removePasswordFromUserObjectProcessor.ts

import { IUserDocument } from "../../model/UserModel";

export const sanitizeUser = (user: IUserDocument) => {
  const { password, ...sanitizedUser } = user.toObject();
  return sanitizedUser;
};


---
// src/routes/index.ts

// src/routes/index.ts
import express from "express";
import userRoutes from "./user/userRoutes";
import projectRoutes from "./project/projectRoutes";
import paymentRoutes from "./payment/PaymentRoutes";
import moderatorRoutes from "./moderator/ModeratorRoutes";
import sessionRoutes from "./session/SessionRoutes"
import tagRoutes from "./tag/TagRoutes"
import sessionDeliverableRoutes from "./sessionDeliverable/SessionDeliverableRoutes"
import observerDocumentRoutes from "./observerDocument/ObserverDocumentRoutes"
import pollRoutes from "./poll/PollRoutes"
import liveSessionRoutes from "./liveSession/LiveSessionRoutes"


const router = express.Router();

// Define all your routes here
const routes: { path: string; route: express.Router }[] = [
  { path: "/users", route: userRoutes },
  { path: "/projects", route: projectRoutes },
  { path: "/payment", route: paymentRoutes },
  { path: "/moderators", route: moderatorRoutes },
  { path: "/sessions", route: sessionRoutes },
  { path: "/tags", route: tagRoutes },
  { path: "/sessionDeliverables", route: sessionDeliverableRoutes },
  { path: "/observerDocuments", route: observerDocumentRoutes },
  { path: "/polls", route: pollRoutes },
  { path: "/liveSessions", route: liveSessionRoutes },
];

// Loop through and mount each route
routes.forEach((r) => {
  router.use(r.path, r.route);
});

export default router;


---
// src/routes/liveSession/LiveSessionRoutes.ts

import express from "express";
import { authenticateJwt } from "../../middlewares/authenticateJwt";
import { authorizeRoles } from "../../middlewares/authorizeRoles";
import { catchError } from "../../middlewares/CatchErrorMiddleware";
import { endSession, getSessionHistory, startSession } from "../../controllers/LiveSessionController";

const router = express.Router();

// only moderators can start or end
// POST api/v1/liveSessions/:sessionId/start
router.post(
  "/:sessionId/start",
  authenticateJwt,
  // authorizeRoles("Moderator"),
  catchError(startSession)
);

// POST api/v1/liveSessions/:sessionId/end
router.post(
  "/:sessionId/end",
  authenticateJwt,
  // authorizeRoles("Moderator"),
  catchError(endSession)
);

// GET api/v1/liveSessions/:sessionId/history
router.get(
  "/:sessionId/history",
  authenticateJwt,
  catchError(getSessionHistory)
);

export default router;


---
// src/routes/moderator/ModeratorRoutes.ts

import { addModerator,  editModerator, getModeratorById, getModeratorsByProjectId, toggleModeratorStatus } from "../../controllers/ModeratorController";
import { catchError } from "../../middlewares/CatchErrorMiddleware";
import express from "express";


const router = express.Router();

// POST /api/v1/moderators/add-moderator
router.post("/add-moderator", catchError(addModerator));

// PUT /api/v1/moderators/:moderatorId
router.put("/:moderatorId", catchError(editModerator));

// POST /api/v1/moderators/project/:projectId
router.get("/project/:projectId", catchError(getModeratorsByProjectId));

// POST /api/v1/moderators/:moderatorId
router.get("/:moderatorId", catchError(getModeratorById));

// POST /api/v1/moderators/toggle/:moderatorId
router.patch("/toggle/:moderatorId", catchError(toggleModeratorStatus));

export default router;

--- 
// src/routes/observerDocument/ObserverDocumentRoutes.ts

import express from "express";
import multer from "multer";
import { catchError } from "../../middlewares/CatchErrorMiddleware";
import { createObserverDocument, deleteObserverDocument, downloadObserverDocument, downloadObserverDocumentsBulk, getObserverDocumentsByProjectId } from "../../controllers/ObserverDocumentController";


const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST   /api/v1/observerDocuments 
router.post("/", upload.single("file"),
  catchError(createObserverDocument)
);

// GET   /api/v1/observerDocuments/project/:projectId 
router.get(
  "/project/:projectId",
  catchError(getObserverDocumentsByProjectId)
);

// GET   /api/v1/observerDocuments/:id/download 
router.get("/:id/download", catchError(downloadObserverDocument));

// POST   /api/v1/observerDocuments/download

router.post("/download-bulk", catchError(downloadObserverDocumentsBulk));

/* DELETE /api/v1/observerDocuments/:id */
router.delete("/:id", catchError(deleteObserverDocument));

export default router;


---
// src/routes/payment/PaymentRoutes.ts

import express from "express";
import { catchError } from "../../middlewares/CatchErrorMiddleware";
import {
  createCustomer,
  createPaymentIntent,
  savePaymentMethod,
  createSetupIntent,
  retrievePaymentMethod,
  chargeCustomer,
  saveBillingInfo
} from "../../controllers/PaymentController";

const router = express.Router();

// POST /api/v1/payment/create-customer
router.post("/create-customer", catchError(createCustomer));

// POST /api/v1/payment/create-payment-intent
router.post("/create-payment-intent", catchError(createPaymentIntent));

// POST /api/v1/payment/save-payment-method
router.post("/save-payment-method", catchError(savePaymentMethod));

// POST /api/v1/payment/create-setup-intent
router.post("/create-setup-intent", catchError(createSetupIntent));

// POST /api/v1/payment/retrieve-payment-method
router.post("/retrieve-payment-method", catchError(retrievePaymentMethod));

// POST /api/v1/payment/charge
router.post("/charge", catchError(chargeCustomer));

// POST /api/v1/payment/save-billing-info
router.post("/save-billing-info", catchError(saveBillingInfo));

export default router;


---
// src/routes/poll/PollRoutes.ts

import express from "express";
import { catchError } from "../../middlewares/CatchErrorMiddleware";
import { createPoll, deletePoll, duplicatePoll, getPollById, getPollsByProjectId, updatePoll } from "../../controllers/PollController";
import { uploadImage } from "../../utils/multer";


const router = express.Router();

/* POST /api/v1/polls  – Create a new poll */
router.post("/", uploadImage.array("images", 20), catchError(createPoll));

// GET /api/v1/polls/project/:projectId?page=&limit=
router.get("/project/:projectId", catchError(getPollsByProjectId));

// GET /api/v1/polls/:id
router.get("/:id", catchError(getPollById));  

/* PATCH /api/v1/polls/:id  – Update a poll */
router.patch("/:id", uploadImage.array("images", 20),  catchError(updatePoll));

/* POST /api/v1/polls/:id/duplicate  – Duplicate a  poll */
router.post("/:id/duplicate", catchError(duplicatePoll));

/* DELETE /api/v1/polls/:id  – Delete a  poll */
router.delete("/:id",  catchError(deletePoll));


---
// src/routes/project/projectRoutes.ts


import express from 'express';
import { catchError } from '../../middlewares/CatchErrorMiddleware';
import { createProjectByExternalAdmin, editProject, emailProjectInfo, getProjectById, getProjectByUserId, saveProgress, toggleRecordingAccess } from '../../controllers/ProjectController';
import { authenticateJwt } from '../../middlewares/authenticateJwt';
import { authorizeRoles } from '../../middlewares/authorizeRoles';


const router = express.Router();

// POST /api/v1/projects/save-progress - Register a new user
router.post("/save-progress", catchError(saveProgress));

// POST /api/v1/projects/create-project-by-external-admin
router.post("/create-project-by-external-admin", catchError(createProjectByExternalAdmin));

// POST /api/v1/projects/email-project-info
router.post("/email-project-info", catchError(emailProjectInfo));

// POST /api/v1/projects/get-project-by-userId/:userId
router.get("/get-project-by-userId/:userId", authenticateJwt,
  authorizeRoles("SuperAdmin", "AmplifyAdmin", "Admin"), catchError(getProjectByUserId));

// GET /api/v1/projects/get-project-by-id/:projectId 
router.get("/get-project-by-id/:projectId",authenticateJwt,
  authorizeRoles("SuperAdmin", "AmplifyAdmin", "Admin"), catchError(getProjectById));

// PATCH /api/v1/projects/edit-project 
router.patch("/edit-project", catchError(editProject));

// GET /api/v1/projects/toggle-recording-access
router.patch("/toggle-recording-access", catchError(toggleRecordingAccess));

export default router;


---
// src/routes/sessionDeliverable/SessionDeliverableRoutes.ts

import express from "express";
import { catchError } from "../../middlewares/CatchErrorMiddleware";
import multer from "multer";
import { createDeliverable, deleteDeliverable, downloadDeliverable, downloadMultipleDeliverable, getDeliverablesByProjectId } from "../../controllers/SessionDeliverableController";


const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });         

// POST   /api/v1/sessionDeliverables       
router.post("/", upload.single("file"), catchError(createDeliverable));


// GET    /api/v1/sessionDeliverables/project/:projectId?page=&limit=&type=
router.get(
  "/project/:projectId",
  catchError(getDeliverablesByProjectId)
);

// GET    /api/v1/sessionDeliverables/:id/download   
router.get("/:id/download", catchError(downloadDeliverable));

// POST   /api/v1/sessionDeliverables/download        
router.post("/download-bulk", catchError(downloadMultipleDeliverable));

// DELETE /api/v1/sessionDeliverables/:id             
router.delete("/:id", catchError(deleteDeliverable));

export default router;


---
// src/routes/session/SessionRoutes.ts


import { createSessions, updateSession, duplicateSession, deleteSession, getSessionsByProject, getSessionById } from "../../controllers/SessionController";
import { catchError } from "../../middlewares/CatchErrorMiddleware";
import express from "express";


const router = express.Router();

// POST /api/v1/sessions/
router.post("/", catchError(createSessions));

// GET /api/v1/sessions/project/:projectId
router.get(
  "/project/:projectId",
  catchError(getSessionsByProject)
);

// GET /api/v1/sessions/:id
router.get(
  "/:id",
  catchError(getSessionById)
);

// PATCH /api/v1/sessions/:id
router.patch("/:id", catchError(updateSession));

// POST /api/v1/sessions/:id/duplicate
router.post("/:id/duplicate", catchError(duplicateSession));

// DELETE /api/v1/sessions/:d
router.delete("/:id", catchError(deleteSession));

export default router;

--- 
// src/routes/tag/TagRoutes.ts

import express from "express";
import { catchError } from "../../middlewares/CatchErrorMiddleware";
import { createTag, getTagsByProjectId,getTagsByUserId, editTag, deleteTag} from "../../controllers/TagController";

const router = express.Router();

// POST /api/v1/tags
router.post("/", catchError(createTag));

// GET    /api/v1/tags/project/:projectId
router.get("/project/:projectId", catchError(getTagsByProjectId));

// GET    /api/v1/tags/user/:userId
router.get("/user/:userId", catchError(getTagsByUserId));

// PATCH  /api/v1/tags/:id
router.patch("/:id", catchError(editTag));

// DELETE /api/v1/tags/:id
router.delete("/:id", catchError(deleteTag));

export default router;


---
// src/routes/user/userRoutes.ts

import express from 'express'
import {
  createAccount,
  loginUser,
  forgotPassword,
  resetPassword,
  verifyEmail,
  changePassword,
  editUser,
  deleteUser,
  findUserById,
  refreshToken,
  logoutUser,
  getCurrentUser,
} from '../../controllers/UserController'
import { catchError } from '../../middlewares/CatchErrorMiddleware'
import { authenticateJwt } from '../../middlewares/authenticateJwt'

const router = express.Router()

// POST /api/v1/users/register - Register a new user
router.post('/register', catchError(createAccount))
// POST /api/v1/users/login - login a user
router.post('/login', catchError(loginUser))

// POST /api/v1/users/logout - logout a user
router.post('/logout', catchError(logoutUser))

// POST /api/v1/users/refreshToken - 
router.post('/refreshToken', catchError(refreshToken))

// POST /api/v1/users/forgot-password
router.post('/forgot-password', catchError(forgotPassword))

// POST /api/v1/users/reset-password
router.post('/reset-password', catchError(resetPassword))

// GET /api/v1/users/verify-email
router.get('/verify-email', catchError(verifyEmail))

// GET /api/v1/users/find-by-id
router.get('/find-by-id', catchError(findUserById))

// POST /api/v1/users/change-password
router.post('/change-password', catchError(changePassword))

// PUT /api/v1/users/edit/:id
router.put('/edit/:id', catchError(editUser))

// DELETE /api/v1/users/:id
router.delete('/:id', catchError(deleteUser))

router.get(
  "/me",
  authenticateJwt,  
  catchError(getCurrentUser)
);
// ! Delete route will be implemented after creating project
// ! Find all and find by id route need to be implemented for the amplify admin

export default router


---
// src/server.ts

// src/server.ts
import express from "express";
import config from "./config/index";
import connectDB from "./config/db";
import errorMiddleware from "./middlewares/ErrorMiddleware";
import mainRoutes from "./routes/index"
import cors from "cors";
import cookieParser from "cookie-parser"; 
import { deviceInfoMiddleware } from "./middlewares/deviceInfo";
import http from "http";
import { initSocket } from "./socket";

const app = express();
console.log("Starting server...",config.frontend_base_url);
// ✅ CORS config
const allowedOrigins = [config.frontend_base_url as string,  "http://localhost:3000",];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser());
app.set('trust proxy', true);
// this must come before any route that needs deviceInfo
app.use(deviceInfoMiddleware);

// Example route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  // console.log('Body:', req.body);
  next();
});


// Place your other routes here
app.use("/api/v1", mainRoutes);

// Error handling middleware should be added after routes
app.use(errorMiddleware);

// Create an HTTP server from Express
const server = http.createServer(app);

// Initialize Socket.IO on that server
initSocket(server);

// Connect to the database and start the server
const PORT = config.port || 8008;
server.listen(PORT, async () => {
  await connectDB();
  console.log(`Server is running on port ${PORT}`);
});


---
// src/tsconfig.json
{"extends": "../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,

    /* Visit https://aka.ms/tsconfig to read more about this file */

    /* Projects */
    // "incremental": true,                              /* Save .tsbuildinfo files to allow for incremental compilation of projects. */
    // "composite": true,                                /* Enable constraints that allow a TypeScript project to be used with project references. */
    // "tsBuildInfoFile": "./.tsbuildinfo",              /* Specify the path to .tsbuildinfo incremental compilation file. */
    // "disableSourceOfProjectReferenceRedirect": true,  /* Disable preferring source files instead of declaration files when referencing composite projects. */
    // "disableSolutionSearching": true,                 /* Opt a project out of multi-project reference checking when editing. */
    // "disableReferencedProjectLoad": true,                 /* Reduce the number of projects loaded automatically by TypeScript. */

    /* Language and Environment */
    "target": "es2016",                                  /* Set the JavaScript language version for emitted JavaScript and include compatible library declarations. */
    // "lib": [],                                        /* Specify a set of bundled library declaration files that describe the target runtime environment. */
    // "jsx": "preserve",                                /* Specify what JSX code is generated. */
    // "libReplacement": true,                           /* Enable lib replacement. */
    // "experimentalDecorators": true,                   /* Enable experimental support for legacy experimental decorators. */
    // "emitDecoratorMetadata": true,                    /* Emit design-type metadata for decorated declarations in source files. */
    // "jsxFactory": "",                                 /* Specify the JSX factory function used when targeting React JSX emit, e.g. 'React.createElement' or 'h'. */
    // "jsxFragmentFactory": "",                         /* Specify the JSX Fragment reference used for fragments when targeting React JSX emit e.g. 'React.Fragment' or 'Fragment'. */
    // "jsxImportSource": "",                            /* Specify module specifier used to import the JSX factory functions when using 'jsx: react-jsx*'. */
    // "reactNamespace": "",                             /* Specify the object invoked for 'createElement'. This only applies when targeting 'react' JSX emit. */
    // "noLib": true,                                    /* Disable including any library files, including the default lib.d.ts. */
    // "useDefineForClassFields": true,                  /* Emit ECMAScript-standard-compliant class fields. */
    // "moduleDetection": "auto",                        /* Control what method is used to detect module-format JS files. */

    /* Modules */
    "module": "commonjs",                                /* Specify what module code is generated. */
    "rootDir": ".",                                  /* Specify the root folder within your source files. */
    // "moduleResolution": "node10",                     /* Specify how TypeScript looks up a file from a given module specifier. */
    "baseUrl": ".",                                  /* Specify the base directory to resolve non-relative module names. */
    "paths": {"@shared/*":  ["../shared/dist/*"]},
    // "rootDirs": [],                                   /* Allow multiple folders to be treated as one when resolving modules. */
    // "typeRoots": [],                                      /* Specify multiple folders that act like './node_modules/@types'. */
    // "types": [],                                      /* Specify type package names to be included without being referenced in a source file. */
    // "allowUmdGlobalAccess": true,                     /* Allow accessing UMD globals from modules. */
    // "moduleSuffixes": [],                             /* List of file name suffixes to search when resolving a module. */
    // "allowImportingTsExtensions": true,               /* Allow imports to include TypeScript file extensions. Requires '--moduleResolution bundler' and either '--noEmit' or '--emitDeclarationOnly' to be set. */
    // "rewriteRelativeImportExtensions": true,          /* Rewrite '.ts', '.tsx', '.mts', and '.cts' file extensions in relative import paths to their JavaScript equivalent in output files. */
    // "resolvePackageJsonExports": true,                /* Use the package.json 'exports' field when resolving package imports. */
    // "resolvePackageJsonImports": true,                /* Use the package.json 'imports' field when resolving imports. */
    // "customConditions": [],                           /* Conditions to set in addition to the resolver-specific defaults when resolving imports. */
    // "noUncheckedSideEffectImports": true,             /* Check side effect imports. */
    // "resolveJsonModule": true,                        /* Enable importing .json files. */
    // "allowArbitraryExtensions": true,                 /* Enable importing files with any extension, provided a declaration file is present. */
    // "noResolve": true,                                /* Disallow 'import's, 'require's or '<reference>'s from expanding the number of files TypeScript should add to a project. */

    /* JavaScript Support */
    // "allowJs": true,                                  /* Allow JavaScript files to be a part of your program. Use the 'checkJS' option to get errors from these files. */
    // "checkJs": true,                                  /* Enable error reporting in type-checked JavaScript files. */
    // "maxNodeModuleJsDepth": 1,                        /* Specify the maximum folder depth used for checking JavaScript files from 'node_modules'. Only applicable with 'allowJs'. */

    /* Emit */
    // "declaration": true,                              /* Generate .d.ts files from TypeScript and JavaScript files in your project. */
    // "declarationMap": true,                           /* Create sourcemaps for d.ts files. */
    // "emitDeclarationOnly": true,                      /* Only output d.ts files and not JavaScript files. */
    // "sourceMap": true,                                /* Create source map files for emitted JavaScript files. */
    // "inlineSourceMap": true,                          /* Include sourcemap files inside the emitted JavaScript. */
    // "noEmit": true,                                   /* Disable emitting files from a compilation. */
    // "outFile": "./",                                  /* Specify a file that bundles all outputs into one JavaScript file. If 'declaration' is true, also designates a file that bundles all .d.ts output. */
    "outDir": "dist",                                   /* Specify an output folder for all emitted files. */
    // "removeComments": true,                           /* Disable emitting comments. */
    // "importHelpers": true,                            /* Allow importing helper functions from tslib once per project, instead of including them per-file. */
    // "downlevelIteration": true,                       /* Emit more compliant, but verbose and less performant JavaScript for iteration. */
    // "sourceRoot": "",                                 /* Specify the root path for debuggers to find the reference source code. */
    // "mapRoot": "",                                    /* Specify the location where debugger should locate map files instead of generated locations. */
    // "inlineSources": true,                            /* Include source code in the sourcemaps inside the emitted JavaScript. */
    // "emitBOM": true,                                  /* Emit a UTF-8 Byte Order Mark (BOM) in the beginning of output files. */
    // "newLine": "crlf",                                /* Set the newline character for emitting files. */
    // "stripInternal": true,                            /* Disable emitting declarations that have '@internal' in their JSDoc comments. */
    // "noEmitHelpers": true,                            /* Disable generating custom helper functions like '__extends' in compiled output. */
    // "noEmitOnError": true,                            /* Disable emitting files if any type checking errors are reported. */
    // "preserveConstEnums": true,                       /* Disable erasing 'const enum' declarations in generated code. */
    // "declarationDir": "./",                           /* Specify the output directory for generated declaration files. */

    /* Interop Constraints */
    // "isolatedModules": true,                          /* Ensure that each file can be safely transpiled without relying on other imports. */
    // "verbatimModuleSyntax": true,                     /* Do not transform or elide any imports or exports not marked as type-only, ensuring they are written in the output file's format based on the 'module' setting. */
    // "isolatedDeclarations": true,                     /* Require sufficient annotation on exports so other tools can trivially generate declaration files. */
    // "erasableSyntaxOnly": true,                       /* Do not allow runtime constructs that are not part of ECMAScript. */
    // "allowSyntheticDefaultImports": true,             /* Allow 'import x from y' when a module doesn't have a default export. */
    "esModuleInterop": true,                             /* Emit additional JavaScript to ease support for importing CommonJS modules. This enables 'allowSyntheticDefaultImports' for type compatibility. */
    // "preserveSymlinks": true,                         /* Disable resolving symlinks to their realpath. This correlates to the same flag in node. */
    "forceConsistentCasingInFileNames": true,            /* Ensure that casing is correct in imports. */

    /* Type Checking */
    "strict": true,   
    "declaration": true,
"declarationMap": true,
"emitDeclarationOnly": false,                                   /* Enable all strict type-checking options. */
    // "noImplicitAny": true,                            /* Enable error reporting for expressions and declarations with an implied 'any' type. */
    // "strictNullChecks": true,                         /* When type checking, take into account 'null' and 'undefined'. */
    // "strictFunctionTypes": true,                      /* When assigning functions, check to ensure parameters and the return values are subtype-compatible. */
    // "strictBindCallApply": true,                      /* Check that the arguments for 'bind', 'call', and 'apply' methods match the original function. */
    // "strictPropertyInitialization": true,             /* Check for class properties that are declared but not set in the constructor. */
    // "strictBuiltinIteratorReturn": true,              /* Built-in iterators are instantiated with a 'TReturn' type of 'undefined' instead of 'any'. */
    // "noImplicitThis": true,                           /* Enable error reporting when 'this' is given the type 'any'. */
    // "useUnknownInCatchVariables": true,               /* Default catch clause variables as 'unknown' instead of 'any'. */
    // "alwaysStrict": true,                             /* Ensure 'use strict' is always emitted. */
    // "noUnusedLocals": true,                           /* Enable error reporting when local variables aren't read. */
    // "noUnusedParameters": true,                       /* Raise an error when a function parameter isn't read. */
    // "exactOptionalPropertyTypes": true,               /* Interpret optional property types as written, rather than adding 'undefined'. */
    // "noImplicitReturns": true,                        /* Enable error reporting for codepaths that do not explicitly return in a function. */
    // "noFallthroughCasesInSwitch": true,               /* Enable error reporting for fallthrough cases in switch statements. */
    // "noUncheckedIndexedAccess": true,                 /* Add 'undefined' to a type when accessed using an index. */
    // "noImplicitOverride": true,                       /* Ensure overriding members in derived classes are marked with an override modifier. */
    // "noPropertyAccessFromIndexSignature": true,       /* Enforces using indexed accessors for keys declared using an indexed type. */
    // "allowUnusedLabels": true,                        /* Disable error reporting for unused labels. */
    // "allowUnreachableCode": true,                     /* Disable error reporting for unreachable code. */

    /* Completeness */
    // "skipDefaultLibCheck": true,                      /* Skip type checking .d.ts files that are included with TypeScript. */
    "skipLibCheck": true                                 /* Skip type checking all .d.ts files. */
  },
    "references": [{ "path": "../shared" }],
 "include": ["**/*.ts"],
  "exclude": ["node_modules","dist"]
}


---
// src/types/express-useragent.d.ts

// src/types/express-useragent.d.ts
import 'express';
import { Details } from 'express-useragent';
import { Lookup } from 'geoip-lite';

declare module 'express-serve-static-core' {
  interface Request {
    useragent: Details;
    deviceInfo?: {
      ip: string;
      deviceType: 'mobile' | 'desktop' | 'other';
      platform: string;
      browser: string;
      location: {
        country: string | null;
        region: string | null;
        city: string | null;
      }
    };
  }
}


---
// src/utils/ErrorHandler.ts

class ErrorHandler extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    (Error as any).captureStackTrace(this, this.constructor);
  }
}

export default ErrorHandler;


---
// src/utils/multer.ts

// backend/utils/multer.ts
import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';

// Store files in memory so we can hand the buffer off to S3
const storage = multer.memoryStorage();

// Only accept common image types
const imageFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, WEBP or GIF images are allowed'));
  }
};

// Export a configured Multer instance
export const uploadImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // limit to 5MB
  },
});


---
// src/utils/responseHelpers.ts

import { Request, Response, NextFunction } from "express";

/**
 * Higher-order function to catch errors in asynchronous route handlers.
 * Automatically forwards errors to Express error-handling middleware.
 *
 * @param handler - An asynchronous function handling an Express request.
 * @returns A function that wraps the handler and catches any errors.
 */
export const catchError = (
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => (req: Request, res: Response, next: NextFunction): void => {
  handler(req, res, next).catch(next);
};

/**
 * Reusable function to send a standardized JSON response.
 *
 * @param res - The Express response object.
 * @param data - The data to include in the response.
 * @param message - A custom message for the response (default is "Request successful").
 * @param statusCode - HTTP status code (default is 200).
 * @param meta - Optional metadata to include in the response.
 * @returns A JSON response with a consistent format.
 */
export const sendResponse = <T, U>(
  res: Response,
  data: T,
  message: string = "Request successful",
  statusCode: number = 200,
  meta?: U
): Response => {
  const responsePayload: { success: boolean; message: string; data: T; meta?: U } = {
    success: true,
    message,
    data,
  };

  if (meta) {
    responsePayload.meta = meta;
  }

  return res.status(statusCode).json(responsePayload);
};


---
// src/utils/tokenService.ts

// src/utils/tokenService.ts
import jwt from "jsonwebtoken";
import config from "../config/index";

export interface AccessPayload {
  userId: string;
  role: string;
}

export interface RefreshPayload {
  userId: string;
}

/** Sign an access token */
export function signAccessToken(payload: AccessPayload): string {
  return jwt.sign(
    payload,
    config.jwt_secret!,
    {
      expiresIn: config.jwt_access_token_expires_in as jwt.SignOptions["expiresIn"],
    }
  );
}

/** Sign a refresh token */
export function signRefreshToken(payload: RefreshPayload): string {
  return jwt.sign(
    payload,
    config.jwt_refresh_secret!,
    {
      expiresIn: config.jwt_refresh_token_expires_in as jwt.SignOptions["expiresIn"],
    }
  );
}

/** Verify an access token */
export function verifyAccessToken(token: string): AccessPayload {
  return jwt.verify(token, config.jwt_secret!) as AccessPayload;
}

/** Verify a refresh token */
export function verifyRefreshToken(token: string): RefreshPayload {
  return jwt.verify(token, config.jwt_refresh_secret!) as RefreshPayload;
}

export function cookieOptions(maxAgeMs: number) {
  return {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: "strict" as const,
    maxAge: maxAgeMs,
  };
}


/**
 * Turn a string like "15m", "7d", "30s", "2h" into milliseconds.
 * Throws if the format is invalid.
 */
export function parseExpiryToMs(expiry: string): number {
  const m = /^(\d+)([smhd])$/.exec(expiry.trim());
  if (!m) {
    throw new Error(`Invalid expiry format: "${expiry}"`);
  }
  const value = Number(m[1]);
  switch (m[2]) {
    case "s":
      return value * 1_000;
    case "m":
      return value * 60_000;
    case "h":
      return value * 3_600_000;
    case "d":
      return value * 86_400_000;
    default:
      throw new Error(`Unsupported time unit "${m[2]}"`);
  }
}


---
// src/utils/uploadToS3.ts

// utils/uploadToS3.ts  (TypeScript — works in JS if you drop the types)
import AWS from "aws-sdk";
import config from "../config";

/** One reusable S3 client (creds & region picked up from env vars) */
const s3 = new AWS.S3({
  accessKeyId:     config.s3_access_key,
  secretAccessKey: config.s3_secret_access_key
});

/**
 * Upload a Buffer to S3 under the `mediabox/` prefix.
 *
 * @param buffer      Raw file bytes (e.g. from multer.memoryStorage()).
 * @param mimeType    Content-Type, e.g. "video/mp4", "image/png".
 * @param displayName The filename you want to appear in S3 *unchanged*.
 *
 * @returns `{ url, key }`
 *          key → "mediabox/<displayName>"   (store in DB)
 *          url → public URL (works if bucket/prefix is public)
 */
export async function uploadToS3(
  buffer: Buffer,
  mimeType: string,
  displayName: string
): Promise<{ url: string; key: string }> {
  const key   = `mediabox/${displayName}`;
  const Bucket = config.s3_bucket_name as string;

  const params: AWS.S3.PutObjectRequest = {
    Bucket,
    Key:  key,
    Body: buffer,
    ContentType: mimeType,
  };

  const { Location } = await s3.upload(params).promise();

  return { url: Location as string, key };
}


/* ───────────────────────────────────────────────────────────── */
/*  SINGLE DOWNLOAD HELPER                                      */
/*  — Returns a short-lived signed URL (default 2 min)          */
/* ───────────────────────────────────────────────────────────── */
export function getSignedUrl(
  key: string,
  expiresSeconds = 120
): string {
  const Bucket = config.s3_bucket_name;

  return s3.getSignedUrl("getObject", {
    Bucket,
    Key: key,
    Expires: expiresSeconds,
    ResponseContentDisposition: `attachment; filename="${encodeURIComponent(
      key.split("/").pop() || "download"
    )}"`,
  });
}

/* ───────────────────────────────────────────────────────────── */
/*  MULTIPLE DOWNLOAD HELPER                                    */
/*  — Returns an array of { key, url } signed links             */
/* ───────────────────────────────────────────────────────────── */
export function getSignedUrls(
  keys: string[],
  expiresSeconds = 120
): { key: string; url: string }[] {
  return keys.map((k) => ({
    key: k,
    url: getSignedUrl(k, expiresSeconds),
  }));
}


/*───────────────────────────────────────────────────────────────────────────*/
/*  Delete helper                                                            */
/*───────────────────────────────────────────────────────────────────────────*/
export async function deleteFromS3(key: string): Promise<void> {
  if (!config.s3_bucket_name) {
    throw new Error("S3_BUCKET_NAME is not configured");
  }
  const Bucket = config.s3_bucket_name; 

  await s3
    .deleteObject({
      Bucket,
      Key: key,
    })
    .promise();
}
