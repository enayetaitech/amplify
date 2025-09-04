
Path: tsconfig.base.json

```
{
  "files": [],
  "references": [
    {
      "path": "./shared"
    },
    {
      "path": "./backend"
    },
    {
      "path": "./frontend"
    }
  ],
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "skipLibCheck": true,
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
     "baseUrl": ".",
    "paths": {
      "@shared/*": ["shared/*"],
      "@backend/*": ["backend/*"],
      "@frontend/*": ["frontend/*"]
    }
  }
}
```

Path: backend/config/db.ts

```
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

```

Path: backend/config/index.ts

```
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
  admit_jwt_secret: process.env.ADMIT_JWT_SECRET,
  
  frontend_base_url: process.env.FRONTEND_BASE_URL,
  
  cloudinary_cloud_name: process.env.CLOUDINARY_NAME,
  cloudinary_api_key: process.env.CLOUDINARY_API_KEY,
  cloudinary_api_secret: process.env.CLOUDINARY_SECRET,
  
  next_payment_gateway_public_key: process.env.NEXT_PAYMENT_GATEWAY_PUBLIC_KEY,
  stripe_secret_key: process.env.STRIPE_SECRET_KEY,
  
  s3_access_key: process.env.S3_ACCESS_KEY,
  s3_secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
  s3_bucket_name: process.env.S3_BUCKET_NAME,
  s3_bucket_region: process.env.S3_REGION,

  hls_base_url: process.env.HLS_CDN_BASE,
  
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,

  SMTP_USER:process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM,

  livekit_api_key: process.env.LIVEKIT_API_KEY,
  livekit_api_secret: process.env.LIVEKIT_API_SECRET,
  livekit_api_url: process.env.LIVEKIT_HOST,
 
};


```

Path: backend/config/NodemailerConfig.ts

```
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

```

Path: backend/constants/emailTemplates.ts

```
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


```

Path: backend/constants/roles.ts

```
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

```

Path: backend/controllers/LivekitController.ts

```
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
    });

    sendResponse(res, { token }, "LiveKit token issued");
  } catch (err: any) {
    return next(
      new ErrorHandler(err?.message || "Invalid/expired admitToken", 401)
    );
  }
};


```

Path: backend/controllers/LiveReadController.ts

```
// src/controllers/LiveReadController.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/authenticateJwt';
import {LiveSessionModel} from '../model/LiveSessionModel';
import {SessionModel} from '../model/SessionModel';
import ErrorHandler from '../utils/ErrorHandler';
import { sendResponse } from '../utils/responseHelpers';

export const getObserverHls = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { sessionId } = req.params;
  const session = await SessionModel.findById(sessionId);
  if (!session) return next(new ErrorHandler('Session not found', 404));

  const live = await LiveSessionModel.findOne({ sessionId });
  if (!live?.hlsPlaybackUrl) return next(new ErrorHandler('HLS not available', 404));

  sendResponse(res, { url: live.hlsPlaybackUrl }, 'HLS URL');
};

```

Path: backend/controllers/LiveSessionController.ts

```
import { Request, Response, NextFunction } from "express";
import { sendResponse } from "../utils/responseHelpers";
import * as sessionService from "../processors/liveSession/sessionService";
import ErrorHandler from "../utils/ErrorHandler";
import { AuthRequest } from "../middlewares/authenticateJwt";
import { endMeeting, startMeeting } from "../processors/livekit/meetingProcessor";

const canStartOrEnd = (role?: string) => {
  // Admin/Moderator can start/end meetings
  return role === 'Admin' || role === 'Moderator';
};

export const startLiveSession = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const user = req.user;
  if (!user) return next(new ErrorHandler('Not authenticated', 401));

  if (!canStartOrEnd(user.role)) return next(new ErrorHandler('Forbidden', 403));

  const { sessionId } = req.params;
  if (!sessionId) return next(new ErrorHandler('sessionId required', 400));

  const result = await startMeeting(sessionId, user.userId);
  sendResponse(res, result, 'Meeting started');
};

export const endLiveSession = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const user = req.user;
  if (!user) return next(new ErrorHandler('Not authenticated', 401));

  if (!canStartOrEnd(user.role)) return next(new ErrorHandler('Forbidden', 403));

  const { sessionId } = req.params;
  if (!sessionId) return next(new ErrorHandler('sessionId required', 400));

  const result = await endMeeting(sessionId, user.userId);
  sendResponse(res, result, 'Meeting ended');
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

```

Path: backend/controllers/ModeratorController.ts

```
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


  const session = await mongoose.startSession();
  session.startTransaction();
  let moderator: IModeratorDocument;
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
    console.error("error adding moderator", err);
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

```

Path: backend/controllers/ObserverDocumentController.ts

```
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
  const { projectId, sessionId, addedBy, addedByRole } = req.body;
  const file = req.file as Express.Multer.File | undefined;

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

/*───────────────────────────────────────────────────────────────*/
/*  GET  /api/v1/observer-documents/:id/download                 */
/*───────────────────────────────────────────────────────────────*/
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

/*───────────────────────────────────────────────────────────────*/
/*  POST /api/v1/observer-documents/download   { ids: string[] } */
/*───────────────────────────────────────────────────────────────*/
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

```

Path: backend/controllers/PaymentController.ts

```
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
      // user.stripeCustomerId = customer.id;
      await user.save();
    }

    // Create the SetupIntent
    const setupIntent = await stripe.setupIntents.create({
      customer: user.stripeCustomerId,
      payment_method_types: ["card"],
    });

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

```

Path: backend/controllers/PollController.ts

```
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
      // find the matching question by your tempImageName
      const q = questionsPayload.find((q) => q.tempImageName === file.originalname);
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

```

Path: backend/controllers/ProjectController.ts

```
import { Request, Response, NextFunction } from "express";
import { sendResponse } from "../utils/responseHelpers";
import ProjectFormModel, {
  IProjectFormDocument,
} from "../model/ProjectFormModel";
import User from "../model/UserModel";
import ErrorHandler from "../utils/ErrorHandler";
import ProjectModel, { IProjectDocument } from "../model/ProjectModel";
import { resolveToIana } from "../processors/session/sessionTimeConflictChecker";
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
  } = req.query;


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
  if (typeof to === "string") toDate = new Date(to);

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
      ? [
          {
            $match: {
              startDate: {
                ...(fromDate ? { $gte: fromDate } : {}),
                ...(toDate ? { $lte: toDate } : {}),
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
      ? [
          {
            $match: {
              startDate: {
                ...(fromDate ? { $gte: fromDate } : {}),
                ...(toDate ? { $lte: toDate } : {}),
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

```

Path: backend/controllers/SessionController.ts

```
import { Request, Response, NextFunction } from "express";
import { sendResponse } from "../utils/responseHelpers";
import ErrorHandler from "../utils/ErrorHandler";
import { ISessionDocument, SessionModel } from "../model/SessionModel";
import ProjectModel from "../model/ProjectModel";
import ModeratorModel from "../model/ModeratorModel";
import {
  resolveToIana,
  toTimestampStrict,
} from "../processors/session/sessionTimeConflictChecker";
import * as sessionService from "../processors/liveSession/sessionService";
import mongoose from "mongoose";
import { LiveSessionModel } from "../model/LiveSessionModel";

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
  const { projectId, sessions } = req.body;


  // 1. Basic payload validation
  if (!Array.isArray(sessions) || sessions.length === 0 || !projectId) {
    return next(
      new ErrorHandler(
        "Sessions array, project id information are required",
        400
      )
    );
  }

  // 2. Project existence check
  const project = await ProjectModel.findById(projectId);

  if (!project) {
    return next(new ErrorHandler("Project not found", 404));
  }
  // ✅ Display label from DB (keep storing this)
  const displayTimeZone = project.defaultTimeZone as string;

  // ✅ IANA for math
  const ianaTimeZone = resolveToIana(displayTimeZone);
  if (!ianaTimeZone) {
    return next(
      new ErrorHandler(
        `Project time zone "${displayTimeZone}" is not recognized.`,
        400
      )
    );
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

  // Precompute epochs for new sessions and check intra-batch overlaps
  type NewSess = (typeof sessions)[number] & {
    startAtEpoch: number;
    endAtEpoch: number;
  };

  const newSessions: NewSess[] = [];

  for (const s of sessions) {
    const startAtEpoch = toTimestampStrict(s.date, s.startTime, ianaTimeZone);
    const endAtEpoch = startAtEpoch + s.duration * 60_000;
    newSessions.push({ ...s, startAtEpoch, endAtEpoch });
  }

  // Intra-batch overlap check
  for (let i = 0; i < newSessions.length; i++) {
    for (let j = i + 1; j < newSessions.length; j++) {
      const a = newSessions[i];
      const b = newSessions[j];
      if (a.startAtEpoch < b.endAtEpoch && b.startAtEpoch < a.endAtEpoch) {
        return next(
          new ErrorHandler(
            `Session "${a.title}" time conflicts with session "${b.title}" in this request`,
            409
          )
        );
      }
    }
  }

  // Check against existing sessions (by epoch)
  for (const s of newSessions) {
    for (const ex of existing) {
      const exIana = resolveToIana(ex.timeZone) ?? ianaTimeZone;
      const startEx = toTimestampStrict(ex.date, ex.startTime, exIana);
      const endEx = startEx + ex.duration * 60_000;
      if (s.startAtEpoch < endEx && startEx < s.endAtEpoch) {
        return next(
          new ErrorHandler(
            `Session "${s.title}" time conflicts with existing "${ex.title}"`,
            409
          )
        );
      }
    }
  }

  // 6. Map each session, injecting the shared fields
  const docs = newSessions.map((s: any) => ({
    projectId,
    timeZone: displayTimeZone,
    breakoutRoom: project.defaultBreakoutRoom ?? false,
    title: s.title,
    date: s.date,
    startTime: s.startTime,
    duration: s.duration,
    startAtEpoch: s.startAtEpoch,
    endAtEpoch: s.endAtEpoch,
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
    // 8. Send uniform success response
    sendResponse(res, created, "Sessions created", 201);
  } catch (err) {
    await mongoSession.abortTransaction();
    mongoSession.endSession();
    return next(err);
  } finally {
    mongoSession.endSession();
  }
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

/**
 * GET /sessions/project/:projectId/latest?role=Participant|Observer|Moderator|Admin
 * Resolve the latest session for a project based on role semantics.
 * Priority:
 *  1) If any LiveSession is ongoing for this project's sessions, return that (status: "ongoing").
 *  2) If none ongoing:
 *     - Participant: Option B → 404 "No session is currently running".
 *     - Observer/Moderator/Admin: Option A → return time-window ongoing if any, else nearest upcoming.
 */
export const getLatestSessionForProject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { projectId } = req.params;
    const roleRaw = (req.query.role as string) || "";
    const allowedRoles = new Set([
      "Participant",
      "Observer",
      "Moderator",
      "Admin",
    ]);

    // Validate role
    if (!allowedRoles.has(roleRaw)) {
      return next(new ErrorHandler("Invalid or missing role", 400));
    }

    // Validate projectId
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return next(new ErrorHandler("Invalid project id", 400));
    }

    // Ensure project exists
    const project = await ProjectModel.findById(projectId).lean();
    if (!project) {
      return next(new ErrorHandler("Project not found", 404));
    }

    // 1) Prefer an actually ongoing LiveSession for this project's sessions
    const liveWithSession = await LiveSessionModel.find({ ongoing: true })
      .populate({
        path: "sessionId",
        select: "projectId startAtEpoch endAtEpoch",
      })
      .lean();

    const liveForProject = liveWithSession.find((ls: any) => {
      const sess = ls.sessionId as any;
      return sess && String(sess.projectId) === String(projectId);
    });

    if (liveForProject && liveForProject.sessionId) {
      const sess = liveForProject.sessionId as unknown as {
        _id: string | mongoose.Types.ObjectId;
        projectId: string | mongoose.Types.ObjectId;
        startAtEpoch: number;
        endAtEpoch: number;
      };
      const data = {
        sessionId: String(sess._id),
        status: "ongoing" as const,
        startAtEpoch: sess.startAtEpoch,
        endAtEpoch: sess.endAtEpoch,
      };
      sendResponse(res, data, "Resolved latest session (ongoing)", 200);
    }

    // 2) None ongoing via LiveSession
    const now = Date.now();

    if (roleRaw === "Participant") {
      // Option B: No session for participants when none ongoing
      next(new ErrorHandler("No session is currently running", 404));
    }

    // Option A for Observer/Moderator/Admin
    // 2a) Try time-window ongoing (scheduled window contains now)
    const windowOngoing = await SessionModel.findOne({
      projectId,
      startAtEpoch: { $lte: now },
      endAtEpoch: { $gte: now },
    })
      .sort({ startAtEpoch: -1 })
      .lean();

    if (windowOngoing) {
      const data = {
        sessionId: String(windowOngoing._id),
        status: "ongoing" as const,
        startAtEpoch: windowOngoing.startAtEpoch,
        endAtEpoch: windowOngoing.endAtEpoch,
      };
      sendResponse(res, data, "Resolved latest session (window ongoing)", 200);
      return;
    }

    // 2b) Else nearest upcoming
    const upcoming = await SessionModel.findOne({
      projectId,
      startAtEpoch: { $gt: now },
    })
      .sort({ startAtEpoch: 1 })
      .lean();

    if (upcoming) {
      const data = {
        sessionId: String(upcoming._id),
        status: "upcoming" as const,
        startAtEpoch: upcoming.startAtEpoch,
        endAtEpoch: upcoming.endAtEpoch,
      };
      sendResponse(res, data, "Resolved upcoming session", 200);
      return;
    }

    // 2c) None found
    next(new ErrorHandler("No current or upcoming session", 404));
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

    // 1a. Load project to enforce locked timezone
    const project = await ProjectModel.findById(original.projectId);
    if (!project) {
      return next(new ErrorHandler("Project not found", 404));
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
    // Enforce project-level timezone lock
    if (
      updates.timeZone !== undefined &&
      updates.timeZone !== project.defaultTimeZone
    ) {
      return next(
        new ErrorHandler(
          "Project timezone is locked and cannot be changed",
          400
        )
      );
    }
    const newTz = project.defaultTimeZone;

    // 7. Fetch all other sessions in this project
    const otherSessions = await SessionModel.find({
      projectId: original.projectId,
      _id: { $ne: sessionId },
    });

    // 8. Compute epochs with strict DST policy
    const startNew = toTimestampStrict(newDate, newStartTime, newTz);
    const endNew = startNew + newDuration * 60_000;

    for (const ex of otherSessions) {
      const startEx = toTimestampStrict(ex.date, ex.startTime, ex.timeZone);
      const endEx = startEx + ex.duration * 60_000;
      if (startNew < endEx && startEx < endNew) {
        console.warn(
          `Session conflict on update: proposed [${startNew}-${endNew}] vs existing {title:${ex.title}} [${startEx}-${endEx}] in project ${original.projectId}`
        );
        return next(
          new ErrorHandler(
            `Proposed time conflicts with existing session "${ex.title}"`,
            409
          )
        );
      }
    }

    // 9. No conflicts — perform the update
    const updated = await SessionModel.findByIdAndUpdate(
      sessionId,
      {
        ...updates,
        timeZone: newTz,
        startAtEpoch: startNew,
        endAtEpoch: endNew,
      },
      {
        new: true,
      }
    );

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

    // 1a. Load project for timezone
    const project = await ProjectModel.findById(original.projectId);
    if (!project) {
      return next(new ErrorHandler("Project not found", 404));
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

    // 3a. Recompute epochs with locked project timezone
    const tz = project.defaultTimeZone;
    const startAtEpoch = toTimestampStrict(data.date, data.startTime, tz);
    const endAtEpoch = startAtEpoch + data.duration * 60_000;
    data.timeZone = tz;
    data.startAtEpoch = startAtEpoch;
    data.endAtEpoch = endAtEpoch;

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

```

Path: backend/controllers/SessionDeliverableController.ts

```
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

```

Path: backend/controllers/TagController.ts

```
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

```

Path: backend/controllers/UserController.ts

```
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

```

Path: backend/controllers/WaitingRoomController.ts

```
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

    // Check ongoing state
    const live = await LiveSessionModel.findOne({ sessionId }).lean();
    const isOngoing = !!live?.ongoing;

    // Enqueue user appropriately
    await enqueueUser(sessionId, { name, email, role });

    // Determine action for client
    let action: "waiting_room" | "stream" = "waiting_room";
    if (
      (role === "Observer" || role === "Moderator" || role === "Admin") &&
      isOngoing
    ) {
      action = "stream";
    }

    sendResponse(res, { action, sessionId }, "Enqueued", 200);
    return;
  } catch (err) {
    next(err);
  }
};

```

Path: backend/middlewares/authenticateJwt.ts

```
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

```

Path: backend/middlewares/authorizeRoles.ts

```
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

```

Path: backend/middlewares/CatchErrorMiddleware.ts

```
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

```

Path: backend/middlewares/deviceInfo.ts

```
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

```

Path: backend/middlewares/ErrorMiddleware.ts

```
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

```
Path: backend/model/BreakoutRoom.ts

```
// backend/model/BreakoutRoom.ts
import { Schema, model, Document, Types } from "mongoose";

export interface BreakoutRoomDoc extends Document<Types.ObjectId> {
  sessionId: Types.ObjectId;
  index: number;
  livekitRoom: string;
  createdAt: Date;
  closesAt?: Date;
  closedAt?: Date;
  recording?: { egressId?: string; startedAt?: Date; stoppedAt?: Date };
  hls?: { playbackUrl?: string; startedAt?: Date; stoppedAt?: Date };
}

const BreakoutRoomSchema = new Schema<BreakoutRoomDoc>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true },
    index: { type: Number, required: true },
    livekitRoom: { type: String, required: true },
    closesAt: Date,
    closedAt: Date,
    recording: { egressId: String, startedAt: Date, stoppedAt: Date },
    hls: { playbackUrl: String, startedAt: Date, stoppedAt: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
BreakoutRoomSchema.index({ sessionId: 1, index: 1 }, { unique: true });

export default model<BreakoutRoomDoc>("BreakoutRoom", BreakoutRoomSchema);

```

Path: backend/model/ChatModel.ts

```
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

```

Path: backend/model/ChatMessage.ts

```
// backend/model/ChatMessage.ts
import { Schema, model, Document, Types } from "mongoose";

export type ChatScope = "waiting" | "main" | "breakout" | "observer";
export type ChatType  = "group" | "dm";
export type ChatRole  = "Moderator" | "Participant" | "Observer";

type IdentityRef = {
  /** LiveKit identity (string) — always present so we can route even if no userId exists */
  identity: string;
  /** Optional DB user for Mods/Admins/Observers (Participants won't have this) */
  userId?: Types.ObjectId;
  /** For transcript UX */
  name?: string;
  email?: string;
  role: ChatRole;
};

export interface ChatMessageDoc extends Document<Types.ObjectId> {
  sessionId: Types.ObjectId;
  scope: ChatScope;
  breakoutIndex?: number;        // only for scope='breakout'
  type: ChatType;                // 'group' or 'dm'

  from: IdentityRef;
  /** Present only for 'dm' messages; when DM to a Participant, userId may be undefined */
  to?: Omit<IdentityRef, "name" | "email" | "role"> & { role: ChatRole };

  text: string;
  attachments?: { storageKey: string; displayName: string; size: number }[];
  ts: Date;
}

const IdentityRefSchema = new Schema<IdentityRef>(
  {
    identity: { type: String, required: true, index: false },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    name: String,
    email: String,
    role: { type: String, enum: ["Moderator", "Participant", "Observer"], required: true },
  },
  { _id: false }
);

const ChatMessageSchema = new Schema<ChatMessageDoc>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true, index: true },
    scope: { type: String, enum: ["waiting", "main", "breakout", "observer"], required: true },
    breakoutIndex: Number,
    type: { type: String, enum: ["group", "dm"], required: true },

    from: { type: IdentityRefSchema, required: true },
    to: {
      type: new Schema(
        {
          identity: { type: String, required: function (this: any) { return this?.type === "dm"; } },
          userId: { type: Schema.Types.ObjectId, ref: "User" },
          role: { type: String, enum: ["Moderator", "Participant", "Observer"], required: function (this: any) { return this?.type === "dm"; } },
        },
        { _id: false }
      ),
      required: function (this: any) { return this?.type === "dm"; },
    },

    text: { type: String, required: true },
    attachments: [{ storageKey: String, displayName: String, size: Number }],
    ts: { type: Date, default: () => new Date() },
  },
  { timestamps: false }
);

// Primary timeline read
ChatMessageSchema.index({ sessionId: 1, scope: 1, ts: 1 });
// DM lookups by identities
ChatMessageSchema.index({ sessionId: 1, "from.identity": 1, ts: 1 });
ChatMessageSchema.index({ sessionId: 1, "to.identity": 1, ts: 1 });
// Breakout filtering
ChatMessageSchema.index({ sessionId: 1, scope: 1, breakoutIndex: 1, ts: 1 });

export default model<ChatMessageDoc>("ChatMessage", ChatMessageSchema);

```

Path: backend/model/GroupMessage.ts

```
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

```

Path: backend/model/JoinLink.ts

```
import { Schema, model, Document, Types } from "mongoose";

export interface JoinLinkDoc extends Document<Types.ObjectId> {
  projectId: Types.ObjectId;
  type: "participant" | "observer";
  slug: string;              // unique per {projectId,type}
  passwordHash?: string;     // required for 'observer'
  createdBy: Types.ObjectId; // User
  createdAt: Date;
  updatedAt: Date;
}

const JoinLinkSchema = new Schema<JoinLinkDoc>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    type: { type: String, enum: ["participant", "observer"], required: true },
    slug: { type: String, required: true, trim: true },
    passwordHash: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

JoinLinkSchema.index({ projectId: 1, type: 1 }, { unique: true });
JoinLinkSchema.index({ slug: 1 }, { unique: true });

export default model<JoinLinkDoc>("JoinLink", JoinLinkSchema);
```

Path: backend/model/LiveSessionModel.ts

```
// backend/models/LiveSessionModel.ts
import mongoose, { Document, Schema, Model, Types } from "mongoose";
import { ILiveSession } from "../../shared/interface/LiveSessionInterface";

export interface ILiveSessionDocument
  extends Omit<ILiveSession, "_id" | "sessionId" | "startedBy" | "endedBy">,
    Document {
  sessionId: Types.ObjectId;
  startedBy: Types.ObjectId;
  endedBy: Types.ObjectId;
}

const WaitingRoomParticipantSchema = new Schema<
  ILiveSessionDocument["participantWaitingRoom"][0]
>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  role: {
    type: String,
    enum: ["Participant", "Moderator", "Admin"],
    required: true,
  },
  joinedAt: { type: Date, required: true, default: () => new Date() },
});
const WaitingRoomObserverSchema = new Schema<
  ILiveSessionDocument["observerWaitingRoom"][0]
>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: false },
  name: { type: String, required: true },
  email: { type: String, required: true },
  role: {
    type: String,
    enum: ["Observer", "Moderator", "Admin"],
    required: true,
  },
  joinedAt: { type: Date, required: true, default: () => new Date() },
});

const ParticipantSchema = new Schema<
  ILiveSessionDocument["participantsList"][0]
>({
  email: { type: String, required: true },
  name: { type: String, required: true },
  role: {
    type: String,
    enum: ["Participant", "Moderator", "Admin"],
    required: true,
  },
  joinedAt: { type: Date, required: true, default: () => new Date() },
});

const ObserverSchema = new Schema<ILiveSessionDocument["observerList"][0]>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: false },
  name: { type: String, required: true },
  email: { type: String, required: true },
  role: {
    type: String,
    enum: ["Observer", "Moderator", "Admin"],
    required: true,
  },
  joinedAt: { type: Date, required: true, default: () => new Date() },
});

const LiveSessionSchema = new Schema<ILiveSessionDocument>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true },
    ongoing: { type: Boolean, default: false },
    startTime: { type: Date },
    endTime: { type: Date },
    participantWaitingRoom: {
      type: [WaitingRoomParticipantSchema],
      default: [],
    },
    observerWaitingRoom: { type: [WaitingRoomObserverSchema], default: [] },
    participantsList: { type: [ParticipantSchema], default: [] },
    observerList: { type: [ObserverSchema], default: [] },
    hlsPlaybackUrl: { type: String, default: null },
    hlsEgressId: { type: String, default: null },
    hlsPlaylistName: { type: String, default: null },
    fileEgressId: { type: String, default: null },
    startedBy: { type: Schema.Types.ObjectId, ref: "User" },
    endedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);

export const LiveSessionModel: Model<ILiveSessionDocument> =
  mongoose.model<ILiveSessionDocument>("LiveSession", LiveSessionSchema);

```

Path: backend/model/LiveUsageLog.ts

```
// backend/model/LiveUsageLog.ts
import { Schema, model, Document, Types } from "mongoose";

export interface LiveUsageLogDoc extends Document<Types.ObjectId> {
  sessionId: Types.ObjectId;
  projectId: Types.ObjectId;
  startedBy: Types.ObjectId;
  startedAt: Date;
  endedAt?: Date;
  minutesTotal?: number;
  participantsPeak?: number;
  observersPeak?: number;
  creditsUsed?: number;
}

const LiveUsageLogSchema = new Schema<LiveUsageLogDoc>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    startedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    startedAt: { type: Date, default: () => new Date(), index: true },
    endedAt: Date,
    minutesTotal: Number,
    participantsPeak: Number,
    observersPeak: Number,
    creditsUsed: Number,
  },
  { timestamps: false }
);
LiveUsageLogSchema.index({ sessionId: 1 });

export default model<LiveUsageLogDoc>("LiveUsageLog", LiveUsageLogSchema);
```

Path: backend/model/ModeratorModel.ts

```
// src/models/moderator.model.ts

import { Schema, model, Document, Types } from "mongoose";
import { IModerator, Role } from "../../shared/interface/ModeratorInterface";

// Omit the '_id' from IModerator to avoid conflicts with Document's '_id'
export interface IModeratorDocument
  extends Omit<IModerator, "_id" | "projectId">,
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

```

Path: backend/model/ObserverDocumentModel.ts

```
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

```

Path: backend/model/ObserverGroupMessage.ts

```
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

```

Path: backend/model/ObserverWaitingRoomChatModel.ts

```
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

```

Path: backend/model/ParticipantMeetingChatModel.ts

```
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

```

Path: backend/model/ParticipantWaitingRoomChatModel.ts

```
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

```

Path: backend/model/WaitingRoomEntry.ts

```
// backend/model/WaitingRoomEntry.ts
import { Schema, model, Document, Types } from "mongoose";

export interface WaitingRoomEntryDoc extends Document<Types.ObjectId> {
  sessionId: Types.ObjectId;
  name: string;
  email: string;
  userId?: Types.ObjectId;
  ip?: string;
  ua?: string;
  status: "waiting" | "admitted" | "removed" | "left";
  removedReason?: string;
  joinedAt: Date;
}

const WaitingRoomEntrySchema = new Schema<WaitingRoomEntryDoc>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    ip: String,
    ua: String,
    status: { type: String, enum: ["waiting", "admitted", "removed", "left"], default: "waiting" },
    removedReason: String,
    joinedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);
WaitingRoomEntrySchema.index({ sessionId: 1, status: 1, joinedAt: -1 });

export default model<WaitingRoomEntryDoc>("WaitingRoomEntry", WaitingRoomEntrySchema);

```

Path: backend/model/PollModel.ts

```
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

```

Path: backend/model/PollResponse.ts

```
// backend/model/PollResponse.ts
import { Schema, model, Document, Types } from "mongoose";

type Scalar = string | number | boolean | null;

export interface PollAnswer {
  questionId: Types.ObjectId;          // which question this answer belongs to
  optionId?: Types.ObjectId;           // selected option (for MCQ), optional
  value?: Scalar | Scalar[];           // free text / numeric / boolean / multi
}

export interface PollResponseDoc extends Document<Types.ObjectId> {
  pollId: Types.ObjectId;
  sessionId: Types.ObjectId;
  responder: { userId?: Types.ObjectId; name?: string; email?: string };
  answers: PollAnswer[];
  submittedAt: Date;
}

const PollAnswerSchema = new Schema<PollAnswer>(
  {
    questionId: { type: Schema.Types.ObjectId, required: true, ref: "PollQuestion" },
    optionId: { type: Schema.Types.ObjectId, ref: "PollOption" },
    value: { type: Schema.Types.Mixed }, // allows string/number/bool/array
  },
  { _id: false }
);

const PollResponseSchema = new Schema<PollResponseDoc>(
  {
    pollId: { type: Schema.Types.ObjectId, ref: "Poll", required: true },
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true },
    responder: {
      userId: { type: Schema.Types.ObjectId, ref: "User" },
      name: String,
      email: String,
    },
    answers: { type: [PollAnswerSchema], default: [] },
    submittedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

PollResponseSchema.index({ pollId: 1, sessionId: 1 });

export default model<PollResponseDoc>("PollResponse", PollResponseSchema);

```

Path: backend/model/Presence.ts

```
// backend/model/Presence.ts
import { Schema, model, Document, Types } from "mongoose";

export interface PresenceDoc extends Document<Types.ObjectId> {
  sessionId: Types.ObjectId;
  projectId: Types.ObjectId;
  role: "Admin" | "Moderator" | "Participant" | "Observer";
  userId?: Types.ObjectId;
  name?: string;
  email?: string;
  device?: { os?: string; browser?: string };
  ip?: string;
  geo?: { country?: string; city?: string; lat?: number; lon?: number };
  roomType: "main" | "breakout";
  breakoutIndex?: number;
  joinedAt: Date;
  leftAt?: Date;
}

const PresenceSchema = new Schema<PresenceDoc>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    role: { type: String, enum: ["Admin", "Moderator", "Participant", "Observer"], required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    name: String,
    email: String,
    device: { os: String, browser: String },
    ip: String,
    geo: { country: String, city: String, lat: Number, lon: Number },
    roomType: { type: String, enum: ["main", "breakout"], required: true },
    breakoutIndex: Number,
    joinedAt: { type: Date, default: () => new Date() },
    leftAt: Date,
  },
  { timestamps: true }
);
PresenceSchema.index({ sessionId: 1, role: 1, roomType: 1 });
PresenceSchema.index({ sessionId: 1, joinedAt: -1 });

export default model<PresenceDoc>("Presence", PresenceSchema);
```

Path: backend/model/ProjectFormModel.ts

```
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
    recruitmentSpecs: { type: String, default: " "},
    preWorkDetails: { type: String, default: " " },
    selectedLanguage: { type: String, default: " "},
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

```

Path: backend/model/ProjectModel.ts

```
import { Schema, model, Document, Types } from "mongoose";
import {
  IProject,
  IProjectSession,
} from "../../shared/interface/ProjectInterface";

// Override types for backend/Mongoose usage
export interface IProjectDocument
  extends Omit<
      IProject,
      | "createdBy"
      | "tags"
      | "moderators"
      | "meetings"
      | "_id"
      | "defaultTimeZone"
      | "defaultBreakoutRoom"
    >,
    Document {
  createdBy: Types.ObjectId;
  tags: Types.ObjectId[];
  moderators: Types.ObjectId[];
  meetings: Types.ObjectId[];
  sessions: IProjectSession[];
  // Override optional fields from shared interface with required types as per schema
  defaultTimeZone: string;
  defaultBreakoutRoom: boolean;
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
    moderators: {
      type: [Schema.Types.ObjectId],
      ref: "Moderator",
      default: [],
    },
    meetings: { type: [Schema.Types.ObjectId], ref: "Session", default: [] },
    projectPasscode: {
      type: String,
      default: () => Math.floor(10000000 + Math.random() * 90000000).toString(),
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
    defaultTimeZone: { type: String, required: true, immutable: true },
    defaultBreakoutRoom: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export default model<IProjectDocument>("Project", projectSchema);

```
Path: backend/model/ScreenShareGrant.ts

```
// backend/model/ScreenShareGrant.ts
import { Schema, model, Document, Types } from "mongoose";

export type GrantMode = "single" | "all";
export type GrantRole = "Admin" | "Moderator" | "Participant" | "Observer";

export interface ScreenShareGrantDoc extends Document<Types.ObjectId> {
  sessionId: Types.ObjectId;

  // "all" = everyone can share; "single" = one specific identity
  mode: GrantMode;

  // When mode = "single", we target by LiveKit identity (since participants are ephemeral)
  target?: {
    identity: string;          // LiveKit identity (string) — REQUIRED when mode="single"
    role?: GrantRole;          // optional: useful in logs
    name?: string;             // optional display
    email?: string;            // optional display
    userId?: Types.ObjectId;   // optional if target is a real user (mod/admin/observer)
  };

  // Who granted the permission (mods/admins usually have a DB user)
  granter: {
    userId?: Types.ObjectId;
    identity: string;          // LiveKit identity of the granter
    role: Exclude<GrantRole, "Participant" | "Observer">; // Admin|Moderator
    name?: string;
    email?: string;
  };

  grantedAt: Date;
  revokedAt?: Date;
}

const ScreenShareGrantSchema = new Schema<ScreenShareGrantDoc>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true },

    mode: { type: String, enum: ["single", "all"], required: true },

    target: {
      identity: { type: String, required: function () { return this.mode === "single"; } },
      role: { type: String, enum: ["Admin", "Moderator", "Participant", "Observer"] },
      name: String,
      email: String,
      userId: { type: Schema.Types.ObjectId, ref: "User" },
    },

    granter: {
      userId: { type: Schema.Types.ObjectId, ref: "User" },
      identity: { type: String, required: true },
      role: { type: String, enum: ["Admin", "Moderator"], required: true },
      name: String,
      email: String,
    },

    grantedAt: { type: Date, default: () => new Date() },
    revokedAt: Date,
  },
  { timestamps: false }
);

// Fast lookups:
// - active "all" grants for a session
ScreenShareGrantSchema.index({ sessionId: 1, mode: 1, revokedAt: 1, grantedAt: -1 });
// - active "single" grant for a specific identity
ScreenShareGrantSchema.index({ sessionId: 1, "target.identity": 1, revokedAt: 1, grantedAt: -1 });

export default model<ScreenShareGrantDoc>("ScreenShareGrant", ScreenShareGrantSchema);

```

Path: backend/model/SessionDeliverableModel.ts

```
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

```

Path: backend/model/SessionModel.ts

```
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
    duration: { type: Number, required: true, min: 15 },
    startAtEpoch: { type: Number, required: true },
    endAtEpoch: { type: Number, required: true },
    moderators: [
      { type: Schema.Types.ObjectId, ref: "Moderator", required: true },
    ],
    timeZone: { type: String, required: true },
    breakoutRoom: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

SessionSchema.index({ projectId: 1, startAtEpoch: 1, endAtEpoch: 1 });

export const SessionModel = model<ISessionDocument>("Session", SessionSchema);

```

Path: backend/model/TagModel.ts

```
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

```

Path: backend/model/UserActivityModel.ts

```
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

```

Path: backend/model/UserModel.ts

```
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

```

Path: backend/model/WhiteboardSnapshot.ts

```
// backend/model/WhiteboardSnapshot.ts
import { Schema, model, Document, Types } from "mongoose";

export interface WhiteboardSnapshotDoc extends Document<Types.ObjectId> {
  wbSessionId: string; // matches WhiteboardStroke.sessionId
  pngKey: string;
  width: number;
  height: number;
  takenBy: Types.ObjectId;
  ts: Date;
}

const WhiteboardSnapshotSchema = new Schema<WhiteboardSnapshotDoc>(
  {
    wbSessionId: { type: String, required: true, index: true },
    pngKey: { type: String, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    takenBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    ts: { type: Date, default: () => new Date() },
  },
  { timestamps: false }
);

export default model<WhiteboardSnapshotDoc>("WhiteboardSnapshot", WhiteboardSnapshotSchema);

```

Path: backend/model/WhiteboardStroke.ts

```
// backend/model/WhiteboardStroke.ts
import { Schema, model, Document } from "mongoose";

export interface WhiteboardStrokeDoc extends Document {
  roomName: string;
  sessionId: string; // whiteboard sessionId (string), not DB ObjectId
  seq: number;
  author: { identity: string; name?: string; role: string };
  tool: string;
  shape: "free" | "line" | "rect" | "circle" | "text";
  color: string;
  size: number;
  points: { x: number; y: number }[];
  text?: string;
  ts: Date;
  revoked?: boolean;
}

const WhiteboardStrokeSchema = new Schema<WhiteboardStrokeDoc>(
  {
    roomName: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    seq: { type: Number, required: true, index: true },
    author: { identity: String, name: String, role: String },
    tool: String,
    shape: { type: String, enum: ["free", "line", "rect", "circle", "text"], default: "free" },
    color: String,
    size: Number,
    points: [{ x: Number, y: Number }],
    text: String,
    ts: { type: Date, default: () => new Date(), index: true },
    revoked: { type: Boolean, default: false },
  },
  { timestamps: false }
);
WhiteboardStrokeSchema.index({ roomName: 1, sessionId: 1, seq: 1 }, { unique: true });

export default model<WhiteboardStrokeDoc>("WhiteboardStroke", WhiteboardStrokeSchema);

```

Path: backend/processors/isValidEmail.ts

```
export const isValidEmail = (email: string): boolean => {
  // This regex pattern checks for a basic email format.
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

```
Path: backend/processors/livekit/admitTokenService.ts

```
import jwt from "jsonwebtoken";
import crypto from "crypto";
import config from "../../config";

const SECRET = config.admit_jwt_secret!; // add to your env/config
const DEFAULT_TTL_SECONDS = 120;

/** Minimal one-time replay cache (replace with Redis in prod) */
const usedJti = new Map<string, number>(); // jti -> expiresAt(ms)
setInterval(() => {
  const now = Date.now();
  for (const [jti, exp] of usedJti) if (exp <= now) usedJti.delete(jti);
}, 30_000).unref();

export function createAdmitToken(params: {
  sessionId: string;
  email: string;
  name: string;
  ttlSeconds?: number;
}) {
  const { sessionId, email, name, ttlSeconds = DEFAULT_TTL_SECONDS } = params;
  const jti = crypto.randomUUID();

  return jwt.sign(
    { sessionId, email, name, role: "Participant", jti },
    SECRET,
    { expiresIn: ttlSeconds }
  );
}

export function verifyAdmitToken(token: string): {
  sessionId: string; email: string; name: string; role: "Participant"; jti?: string;
} {
  const payload = jwt.verify(token, SECRET) as any;

  if (!payload?.sessionId || !payload?.email || payload?.role !== "Participant") {
    throw new Error("Malformed admit token");
  }

  // one-time use guard
  if (payload.jti) {
    if (usedJti.has(payload.jti)) {
      throw new Error("Admit token already used");
    }
    usedJti.set(payload.jti, (payload.exp ?? 0) * 1000);
  }

  return payload;
}

/** stable identity without exposing email */
export function participantIdentity(sessionId: string, email: string) {
  const hash = crypto.createHash("sha256").update(email).digest("hex").slice(0, 24);
  return `p:${sessionId}:${hash}`;
}

```
Path: backend/processors/livekit/livekitService.ts

```
// src/processors/livekit/livekitService.ts
// src/processors/livekit/livekitService.ts
import config from "../../config/index";

import { AccessToken, RoomServiceClient, TrackSource, TrackType, VideoGrant } from "livekit-server-sdk";

export type LivekitRole = 'Admin' | 'Moderator' | 'Participant' | 'Observer';

const apiKey = config.livekit_api_key!;
const apiSecret = config.livekit_api_secret!;

export const roomService = new RoomServiceClient(
  config.livekit_api_url!, // LIVEKIT_HOST
  apiKey,
  apiSecret
);

export async function issueRoomToken(params: {
  identity: string;          // user id
  name?: string;             // display name (optional)
  role: LivekitRole;
  roomName: string;
}) {
  const { identity, name, role, roomName } = params;

  // Include role as metadata so sockets can authorize easily.
  const at = new AccessToken(apiKey, apiSecret, { identity, name, metadata: JSON.stringify({ role }) });

  // Base grant applies to everyone who joins the room
  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canSubscribe: true,
    canPublishData: true,
    canPublish: role !== 'Observer',
    // 👇 IMPORTANT: lock participant screenshare by default
    // Observers: []
    // Participants: MIC + CAMERA only
    // Admin/Moderator: MIC + CAMERA + SCREEN_SHARE (+ audio)
    canPublishSources:
      role === 'Observer'
        ? []
        : role === 'Participant'
        ? [TrackSource.MICROPHONE, TrackSource.CAMERA]
        : [TrackSource.MICROPHONE, TrackSource.CAMERA, TrackSource.SCREEN_SHARE, TrackSource.SCREEN_SHARE_AUDIO],
  };

  at.addGrant(grant);
  return await at.toJwt();
}


/** NEW: server-side moderation helper – mute a participant's microphone */
export async function serverMuteMicrophone(params: {
  roomName: string;      // in your app this is the sessionId used when issuing the LK token
  identity: string;      // use participantIdentity(sessionId, email)
}): Promise<boolean> {
  const { roomName, identity } = params;

  const participants = await roomService.listParticipants(roomName);
  const p = participants.find((pi) => pi.identity === identity);
  if (!p) return false;

  // find an audio pub (mic) and mute it
  const audioPub =
    (p.tracks || []).find(
      (t: any) => t?.source === TrackSource.MICROPHONE || t?.type === TrackType.AUDIO
    ) || (p.tracks || [])[0];

  if (!audioPub?.sid) return false;

  await roomService.mutePublishedTrack(roomName, identity, audioPub.sid, true);
  return true;
}

/** NEW: server-side moderation helper – turn off (mute) a participant's camera */
export async function serverDisableCamera(params: {
  roomName: string;
  identity: string;
}): Promise<boolean> {
  const { roomName, identity } = params;

  const participants = await roomService.listParticipants(roomName);
  const p = participants.find((pi) => pi.identity === identity);
  if (!p) return false;

  // find a video pub (camera) and mute it
  const videoPub =
    (p.tracks || []).find(
      (t: any) => t?.source === TrackSource.CAMERA || t?.type === TrackType.VIDEO
    ) || (p.tracks || [])[0];

  if (!videoPub?.sid) return false;

  await roomService.mutePublishedTrack(roomName, identity, videoPub.sid, true);
  return true;
}

/** NEW: server-side moderation helper – toggle  a participant's screenshare */
export async function serverAllowScreenshare(params: {
  roomName: string;
  identity: string;
  allow: boolean; 
}): Promise<boolean> {
  const { roomName, identity, allow } = params;

  const participants = await roomService.listParticipants(roomName);
  const p = participants.find(pi => pi.identity === identity);
  if (!p) return false;

  // participant.permission?.canPublishSources may be undefined/empty (meaning "all"),
  // but for Participants your grant uses an explicit list (MIC + CAMERA). Keep the pattern.  // ← see your token grant
  const prevPerm: any = (p as any).permission || {};
  const prevSources: TrackSource[] = prevPerm.canPublishSources ?? [];

  const add = [TrackSource.SCREEN_SHARE, TrackSource.SCREEN_SHARE_AUDIO];
  const nextSources = allow
    ? Array.from(new Set([...prevSources, ...add]))
    : prevSources.filter(s => !add.includes(s));

  await roomService.updateParticipant(roomName, identity, {
    permission: { ...prevPerm, canPublishSources: nextSources },
  });

  // If revoking, also hard-stop any active screenshare tracks published by this participant.
  if (!allow) {
    for (const t of (p.tracks || [])) {
      if (t?.sid && (t.source === TrackSource.SCREEN_SHARE || t.source === TrackSource.SCREEN_SHARE_AUDIO)) {
        await roomService.mutePublishedTrack(roomName, identity, t.sid, true);
      }
    }
  }
  return true;
}

export async function ensureRoom(roomName: string) {
 console.log(roomName)
}
/** stubs to wire into start/end session; we’ll fill these next */
export async function startHlsEgress(roomName: string): Promise<{
  egressId: string; playbackUrl: string | null; playlistName: string;
}> {
 

  
  return { egressId: '', playbackUrl: "hbjh", playlistName: 'live.m3u8' };
}

export async function stopHlsEgress(egressId?: string | null) {

}

export async function startFileEgress(roomName: string): Promise<{ egressId: string }> {
  

  return { egressId: '' };
}

export async function stopFileEgress(egressId?: string | null) {
  
}
```

Path: backend/processors/livekit/meetingProcessor.ts

```
// src/processors/live/meetingProcessor.ts

import config from "../../config/index";
import { LiveSessionModel } from "../../model/LiveSessionModel";
import { SessionModel } from "../../model/SessionModel";
import {
  startHlsEgress,
  stopHlsEgress,
  startFileEgress,
  stopFileEgress,
  ensureRoom,
} from "./livekitService";
import mongoose from "mongoose";

type ObjectIdLike = string | mongoose.Types.ObjectId;

function makeRoomName(session: any) {
  // Adjust to your naming convention if you already set one
  return `project_${session.projectId}_session_${session._id}`;
}

export async function startMeeting(
  sessionId: ObjectIdLike,
  startedBy: ObjectIdLike
) {
  const session = await SessionModel.findById(sessionId);

  if (!session) throw new Error("Session not found");

  let live = await LiveSessionModel.findOne({ sessionId: session._id });
  if (!live) {
    live = await LiveSessionModel.create({ sessionId: session._id });
  }
  if (live.ongoing) {
    throw new Error("Session already ongoing");
  }

  const roomName = makeRoomName(session);

  await ensureRoom(roomName);


  const hls = await startHlsEgress(roomName); // { egressId, playbackUrl, playlistName }
  const rec = await startFileEgress(roomName);

  live.ongoing = true;
  live.startTime = new Date();
  live.startedBy = startedBy as any;

  live.hlsPlaybackUrl = hls.playbackUrl ?? null;
  live.hlsEgressId = hls.egressId ?? null;
  live.hlsPlaylistName = hls.playlistName ?? null;
  live.fileEgressId = rec.egressId ?? null;

  await live.save();

  return {
    sessionId: String(session._id),
    roomName,
    hlsPlaybackUrl: live.hlsPlaybackUrl,
    startedAt: live.startTime,
  };
}

export async function endMeeting(
  sessionId: ObjectIdLike,
  endedBy: ObjectIdLike
) {
  const session = await SessionModel.findById(sessionId);
  if (!session) throw new Error("Session not found");

  const live = await LiveSessionModel.findOne({ sessionId: session._id });
  if (!live || !live.ongoing) {
    // Idempotent: nothing to stop
    return { sessionId: String(session._id), alreadyEnded: true };
  }

  // const roomName = makeRoomName(session);

  // Stop egress
  await stopHlsEgress(live.hlsEgressId || undefined);
  await stopFileEgress(live.fileEgressId || undefined);

  live.ongoing = false;
  live.endTime = new Date();
  live.endedBy = endedBy as any;

  await live.save();

  return {
    sessionId: String(session._id),
    roomName: makeRoomName(session),
    endedAt: live.endTime,
  };
}

```

Path: backend/processors/liveSession/sessionService.ts

```
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

```

Path: backend/processors/poll/QuestionValidationProcessor.ts

```
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

```

Path: backend/processors/sendEmail/sendVerifyAccountEmailProcessor.ts

```
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

```

Path: backend/processors/session/sessionTimeConflictChecker.ts

```
// backend/processors/session/sessionTimeConflictChecker.ts
import { DateTime, IANAZone } from "luxon";

// Map your UI labels to canonical IANA zones.
// Include both the naked name and the "(UTC±..) Name" variant for resilience.
const DISPLAY_TZ_TO_IANA: Record<string, string> = {
  "Eastern Time": "America/New_York",
  "(UTC-05) Eastern Time": "America/New_York",

  "Central Time": "America/Chicago",
  "(UTC-06) Central Time": "America/Chicago",

  "Mountain Time": "America/Denver",
  "(UTC-07) Mountain Time": "America/Denver",

  "Pacific Time": "America/Los_Angeles",
  "(UTC-08) Pacific Time": "America/Los_Angeles",

  "Alaska Time": "America/Anchorage",
  "(UTC-09) Alaska Time": "America/Anchorage",

  "Hawaii Time": "Pacific/Honolulu",
  "(UTC-10) Hawaii Time": "Pacific/Honolulu",

  "London Time": "Europe/London",
  "(UTC-00) London Time": "Europe/London",

  "Cape Verde": "Atlantic/Cape_Verde",
  "(UTC-01) Cape Verde": "Atlantic/Cape_Verde",

  "Sandwich Islands": "Atlantic/South_Georgia",
  "(UTC-02) Sandwich Islands": "Atlantic/South_Georgia",

  "Rio de Janeiro": "America/Sao_Paulo",
  "(UTC-03) Rio de Janeiro": "America/Sao_Paulo",

  "Buenos Aires": "America/Argentina/Buenos_Aires",
  "(UTC-04) Buenos Aires": "America/Argentina/Buenos_Aires",

  "Paris": "Europe/Paris",
  "(UTC+01) Paris": "Europe/Paris",

  "Athens": "Europe/Athens",
  "(UTC+02) Athens": "Europe/Athens",

  "Moscow": "Europe/Moscow",
  "(UTC+03) Moscow": "Europe/Moscow",

  "Dubai": "Asia/Dubai",
  "(UTC+04) Dubai": "Asia/Dubai",

  "Pakistan": "Asia/Karachi",
  "(UTC+05) Pakistan": "Asia/Karachi",

  "Delhi": "Asia/Kolkata",
  "(UTC+05.5) Delhi": "Asia/Kolkata",

  "Bangladesh": "Asia/Dhaka",
  "(UTC+06) Bangladesh": "Asia/Dhaka",

  "Bangkok": "Asia/Bangkok",
  "(UTC+07) Bangkok": "Asia/Bangkok",

  "Beijing": "Asia/Shanghai",
  "(UTC+08) Beijing": "Asia/Shanghai",

  "Tokyo": "Asia/Tokyo",
  "(UTC+09) Tokyo": "Asia/Tokyo",

  "Sydney": "Australia/Sydney",
  "(UTC+10) Sydney": "Australia/Sydney",

  "Solomon Islands": "Pacific/Guadalcanal",
  "(UTC+11) Solomon Islands": "Pacific/Guadalcanal",

  "Auckland": "Pacific/Auckland",
  "(UTC+12) Auckland": "Pacific/Auckland",
};

/** Try to resolve a UI timezone label to an IANA zone. */
export const resolveToIana = (tzLabel: string | undefined | null): string | null => {
  if (!tzLabel) return null;

  // If caller already gave an IANA zone, accept it.
  if (validateIanaZone(tzLabel)) return tzLabel;

  const trimmed = tzLabel.trim();

  // Direct map hit?
  const direct = DISPLAY_TZ_TO_IANA[trimmed];
  if (direct) return direct;

  // If it's "(UTC±..) Name", strip the prefix and try again.
  const withoutPrefix = trimmed.replace(/^\(UTC[+-]?\d+(?:\.\d+)?\)\s*/, "");
  if (withoutPrefix !== trimmed) {
    const byName = DISPLAY_TZ_TO_IANA[withoutPrefix];
    if (byName) return byName;
  }

  return null;
};

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

/** Validate an IANA time zone identifier */
export const validateIanaZone = (zone: string): boolean => {
  return IANAZone.isValidZone(zone);
};

/**
 * Compute timestamp with strict DST policy:
 * - Reject nonexistent times (spring-forward) -> throw Error
 * - Reject ambiguous times (fall-back repeated hour) -> throw Error
 */
export const toTimestampStrict = (
  dateVal: Date | string,
  timeStr: string,
  timeZone: string
): number => {
  // Normalize date to “YYYY-MM-DD”
  const dateISO =
    typeof dateVal === "string"
      ? dateVal
      : DateTime.fromJSDate(dateVal).toISODate()!;

  // First attempt: Luxon will flag nonexistent times as invalid
  const dt = DateTime.fromISO(`${dateISO}T${timeStr}`, { zone: timeZone });
  if (!dt.isValid) {
    throw new Error(
      `Selected time does not exist in ${timeZone} on ${dateISO} due to daylight saving time. Please choose a different time.`
    );
  }

  // Detect ambiguous fall-back hour on this date by locating the offset transition
  const transition = findDailyOffsetTransition(dateISO, timeZone);
  if (transition && transition.newOffset < transition.oldOffset) {
    const ambiguousStartMin = transition.minuteOfDay; // inclusive
    const ambiguousLen = transition.oldOffset - transition.newOffset; // typically 60
    const ambiguousEndMin = ambiguousStartMin + ambiguousLen; // exclusive

    const [h, m] = timeStr.split(":").map(Number);
    const selectedMin = h * 60 + m;
    if (selectedMin >= ambiguousStartMin && selectedMin < ambiguousEndMin) {
      const window = `${formatMinutes(ambiguousStartMin)}–${formatMinutes(
        ambiguousEndMin
      )}`;
      throw new Error(
        `Selected time is ambiguous in ${timeZone} on ${dateISO} (${window}) due to the end of daylight saving time. Please choose a time outside this window.`
      );
    }
  }

  return dt.toMillis();
};

/**
 * Scan the local day to find the first minute where the time zone offset changes.
 * Returns null if there is no transition that day.
 */
const findDailyOffsetTransition = (
  dateISO: string,
  timeZone: string
): { minuteOfDay: number; oldOffset: number; newOffset: number } | null => {
  let prev = DateTime.fromISO(`${dateISO}T00:00`, { zone: timeZone });
  let prevOffset = prev.offset; // minutes
  for (let minute = 1; minute < 24 * 60; minute++) {
    const cur = DateTime.fromISO(`${dateISO}T00:00`, { zone: timeZone }).plus({
      minutes: minute,
    });
    const curOffset = cur.offset;
    if (curOffset !== prevOffset) {
      return {
        minuteOfDay: minute,
        oldOffset: prevOffset,
        newOffset: curOffset,
      };
    }
    prevOffset = curOffset;
  }
  return null;
};

const formatMinutes = (mins: number): string => {
  const h = Math.floor(mins / 60)
    .toString()
    .padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};

```

Path: backend/processors/user/isStrongPasswordProcessor.ts

```
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

```

Path: backend/processors/user/isValidEmailProcessor.ts

```
export const isValidEmail = (email: string): boolean => {
  // This regex pattern checks for a basic email format.
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

```

Path: backend/processors/user/removePasswordFromUserObjectProcessor.ts

```
import { IUserDocument } from "../../model/UserModel";

export const sanitizeUser = (user: IUserDocument) => {
  const { password, ...sanitizedUser } = user.toObject();
  return sanitizedUser;
};

```

Path: backend/processors/waiting/waitingService.ts

```
// backend/processors/waiting/waitingService.ts
import { LiveSessionModel } from "../../model/LiveSessionModel";

/** Load lists for UI panels */
export async function listState(sessionId: string) {
  const live = await LiveSessionModel.findOne({ sessionId }).lean();
  if (!live) throw new Error("LiveSession not found");

  return {
    participantsWaitingRoom: live.participantWaitingRoom ?? [],
    observersWaitingRoom: live.observerWaitingRoom ?? [],
    participantList: live.participantsList ?? [],
    observerList: live.observerList ?? [],
  };
}

/** Admit a single participant (by email) from waiting → active */
export async function admitByEmail(sessionId: string, email: string) {
  const live = await LiveSessionModel.findOne({ sessionId });
  
  if (!live) throw new Error("LiveSession not found");

  const i = live.participantWaitingRoom.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
  if (i >= 0) {
    const user = live.participantWaitingRoom[i];
    // remove from waiting
    live.participantWaitingRoom.splice(i, 1);
    // add to active list
    live.participantsList.push({
      name: user.name,
      email: user.email,
      role: user.role,
      joinedAt: new Date(),
    });
    await live.save();
  }
  return {
    participantsWaitingRoom: live.participantWaitingRoom,
    observersWaitingRoom: live.observerWaitingRoom,
    participantList: live.participantsList,
    observerList: live.observerList,
  };
}

/** Remove from waiting room (do not admit) */
export async function removeFromWaitingByEmail(sessionId: string, email: string) {
  const live = await LiveSessionModel.findOne({ sessionId });
  if (!live) throw new Error("LiveSession not found");

  live.participantWaitingRoom = live.participantWaitingRoom.filter(
    (u) => u.email.toLowerCase() !== email.toLowerCase()
  ) as any;

  await live.save();
  return {
    participantsWaitingRoom: live.participantWaitingRoom,
    observersWaitingRoom: live.observerWaitingRoom,
    participantList: live.participantsList,
    observerList: live.observerList,
  };
}

/** Admit all participants currently waiting */
export async function admitAll(sessionId: string) {
  const live = await LiveSessionModel.findOne({ sessionId });
  if (!live) throw new Error("LiveSession not found");

  const now = new Date();
  const toAdmit = [...live.participantWaitingRoom];
  live.participantWaitingRoom = [];
  for (const user of toAdmit) {
    live.participantsList.push({
      name: user.name,
      email: user.email,
      role: user.role,
      joinedAt: now,
    });
  }
  await live.save();

  return {
    participantsWaitingRoom: live.participantWaitingRoom,
    observersWaitingRoom: live.observerWaitingRoom,
    participantList: live.participantsList,
    observerList: live.observerList,
  };
}
```

Path: backend/routes/index.ts

```
// src/routes/index.ts
import express from "express";
import userRoutes from "./user/userRoutes";
import projectRoutes from "./project/projectRoutes";
import paymentRoutes from "./payment/PaymentRoutes";
import moderatorRoutes from "./moderator/ModeratorRoutes";
import sessionRoutes from "./session/SessionRoutes";
import tagRoutes from "./tag/TagRoutes";
import sessionDeliverableRoutes from "./sessionDeliverable/SessionDeliverableRoutes";
import observerDocumentRoutes from "./observerDocument/ObserverDocumentRoutes";
import pollRoutes from "./poll/PollRoutes";
import liveSessionRoutes from "./liveSession/LiveSessionRoutes";
import livekitRoutes from "./livekit/livekit.routes";
import waitingRoomRoutes from "./waitingRoom/WaitingRoomRoutes";

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
  { path: "/livekit", route: livekitRoutes },
  { path: "/waiting-room", route: waitingRoomRoutes },
];

// Loop through and mount each route
routes.forEach((r) => {
  router.use(r.path, r.route);
});

export default router;

```

Path: backend/routes/livekit/livekit.routes.ts

```
// src/routes/livekit/LivekitRoutes.ts
import express from 'express';
import { authenticateJwt } from '../../middlewares/authenticateJwt';
import { catchError } from '../../middlewares/CatchErrorMiddleware';
import { exchangeAdmitForLivekitToken, getLivekitToken } from '../../controllers/LivekitController';
import { getObserverHls } from '../../controllers/LiveReadController';

const router = express.Router();

// POST /api/v1/livekit/token
router.post('/token', authenticateJwt, catchError(getLivekitToken));

// POST /api/v1/livekit/exchange
router.post('/exchange', catchError(exchangeAdmitForLivekitToken));


// POST /api/v1/livekit/:sessionId/hls
router.get('/:sessionId/hls', getObserverHls);

export default router;


```

Path: backend/routes/liveSession/LiveSessionRoutes.ts

```
import express from "express";
import { authenticateJwt } from "../../middlewares/authenticateJwt";
import { catchError } from "../../middlewares/CatchErrorMiddleware";
import { endLiveSession,  startLiveSession } from "../../controllers/LiveSessionController";

const router = express.Router();

// only moderators can start or end
// POST api/v1/liveSessions/:sessionId/start
router.post(
  "/:sessionId/start",
  authenticateJwt,
  // authorizeRoles("Moderator"),
  catchError(startLiveSession)
);

// POST api/v1/liveSessions/:sessionId/end
router.post(
  "/:sessionId/end",
  authenticateJwt,
  // authorizeRoles("Moderator"),
  catchError(endLiveSession)
);


export default router;

```

Path: backend/routes/moderator/ModeratorRoutes.ts

```
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
```

Path: backend/routes/observerDocument/ObserverDocumentRoutes.ts

```
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

```

Path: backend/routes/payment/PaymentRoutes.ts

```
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

```

Path: backend/routes/poll/PollRoutes.ts

```
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


export default router;

```

Path: backend/routes/project/projectRoutes.ts

```

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

```

Path: backend/routes/session/SessionRoutes.ts

```
import {
  createSessions,
  updateSession,
  duplicateSession,
  deleteSession,
  getSessionsByProject,
  getSessionById,
  getLatestSessionForProject,
} from "../../controllers/SessionController";
import { catchError } from "../../middlewares/CatchErrorMiddleware";
import express from "express";

const router = express.Router();

// POST /api/v1/sessions/
router.post("/", catchError(createSessions));

// GET /api/v1/sessions/project/:projectId
router.get("/project/:projectId", catchError(getSessionsByProject));

// GET /api/v1/sessions/project/:projectId/latest
router.get(
  "/project/:projectId/latest",
  catchError(getLatestSessionForProject)
);

// GET /api/v1/sessions/:id
router.get("/:id", catchError(getSessionById));

// PATCH /api/v1/sessions/:id
router.patch("/:id", catchError(updateSession));

// POST /api/v1/sessions/:id/duplicate
router.post("/:id/duplicate", catchError(duplicateSession));

// DELETE /api/v1/sessions/:d
router.delete("/:id", catchError(deleteSession));

export default router;

```

Path: backend/routes/sessionDeliverable/SessionDeliverableRoutes.ts

```
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

```

Path: backend/routes/tag/TagRoutes.ts

```
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

```

Path: backend/routes/user/userRoutes.ts

```
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

```

Path: backend/routes/waitingRoom/WaitingRoomRoutes.ts

```
import express from "express";
import { catchError } from "../../middlewares/CatchErrorMiddleware";
import { enqueue } from "../../controllers/WaitingRoomController";

const router = express.Router();

// POST /api/v1/waiting-room/enqueue
router.post("/enqueue", catchError(enqueue));

export default router;

```

Path: backend/types/express-useragent.d.ts

```
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

```

Path: backend/utils/ErrorHandler.ts

```
class ErrorHandler extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    (Error as any).captureStackTrace(this, this.constructor);
  }
}

export default ErrorHandler;

```

Path: backend/utils/multer.ts

```
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

```

Path: backend/utils/responseHelpers.ts

```
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

```

Path: backend/utils/tokenService.ts

```
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

```

Path: backend/utils/uploadToS3.ts

```
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
```

Path: backend/package.json

```
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
    "livekit-server-sdk": "^2.13.2",
    "luxon": "^3.6.1",
    "mongoose": "^8.13.2",
    "ms": "^2.1.3",
    "multer": "^1.4.5-lts.2",
    "node-cron": "^3.0.3",
    "nodemailer": "^6.10.0",
    "request-ip": "^3.3.0",
    "socket.io": "^4.8.1",
    "stripe": "^18.0.0",
    "zod": "^4.0.17"
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

```

Path: backend/server.ts

```
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
import { attachSocket } from "./socket/index";

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
attachSocket(server);

// Connect to the database and start the server
const PORT = config.port || 8008;
server.listen(PORT, async () => {
  await connectDB();
  console.log(`Server is running on port ${PORT}`);
});

```

Path: backend/socket/index.ts

```
// backend/socket/index.ts
import type { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";

import {
  listState,
  admitByEmail,
  removeFromWaitingByEmail,
  admitAll,
} from "../processors/waiting/waitingService";
import {
  createAdmitToken,
  participantIdentity,
} from "../processors/livekit/admitTokenService";
import { TrackSource, TrackType } from "@livekit/protocol";
import {
  roomService,
  serverAllowScreenshare,
  serverDisableCamera,
  serverMuteMicrophone,
} from "../processors/livekit/livekitService";

// In-memory map to find a participant socket by email within a session
// sessionId -> (email -> socketId)
const emailIndex = new Map<string, Map<string, string>>();
const identityIndex = new Map<string, Map<string, string>>();

type Role = "Participant" | "Observer" | "Moderator" | "Admin";
type JoinAck = Awaited<ReturnType<typeof listState>>;

export function attachSocket(server: HTTPServer) {
  const io = new Server(server, {
    path: "/socket.io",
    cors: { origin: true, credentials: true },
  });

  io.on("connection", (socket: Socket) => {
    // Expect query: ?sessionId=...&role=...&name=...&email=...
    const q = socket.handshake.query;
    const sessionId = String(q.sessionId || "");
    const role = String(q.role || "Participant") as Role;
    const name = (q.name as string) || "";
    const email = (q.email as string) || "";

    if (!sessionId || !role) {
      socket.emit("error:auth", "Missing sessionId or role");
      return socket.disconnect(true);
    }

    const rooms = {
      waiting: `waiting::${sessionId}`,
      meeting: `meeting::${sessionId}`, // future milestones
      observer: `observer::${sessionId}`, // future milestones
    };

    // Join waiting room by default; participant/observer wait here
    socket.join(rooms.waiting);

    // Track email -> socket (only if email present)
    if (email) {
      if (!emailIndex.has(sessionId)) emailIndex.set(sessionId, new Map());
      emailIndex.get(sessionId)!.set(email.toLowerCase(), socket.id);
    }

    // Make sure each socket is in a session room for targeted broadcasts.
    if (sessionId) {
      socket.join(sessionId);
    }
    // Initial payload (lists)
    socket.on("join-room", async (_payload, ack?: (rooms: JoinAck) => void) => {
      const state = await listState(sessionId);
      if (ack) ack(state);
      // Also broadcast updated waiting list to all moderators’ panels
      io.to(rooms.waiting).emit("waiting:list", {
        participantsWaitingRoom: state.participantsWaitingRoom,
        observersWaitingRoom: state.observersWaitingRoom,
      });
    });

    // Client will tell us their LiveKit identity after joining the room.
    socket.on(
      "meeting:register-identity",
      (payload: { identity: string; email?: string }) => {
        try {
          if (!payload?.identity) return;
          if (!identityIndex.has(sessionId))
            identityIndex.set(sessionId, new Map());
          identityIndex
            .get(sessionId)!
            .set(payload.identity.toLowerCase(), socket.id);

          // Optional: if client also sends email, refresh the emailIndex mapping
          if (payload.email) {
            if (!emailIndex.has(sessionId))
              emailIndex.set(sessionId, new Map());
            emailIndex
              .get(sessionId)!
              .set(payload.email.toLowerCase(), socket.id);
          }
        } catch {}
      }
    );

    // ===== Moderator actions =====
    socket.on("waiting:admit", async ({ email }: { email: string }) => {
      if (!["Moderator", "Admin"].includes(role)) return;
      const state = await admitByEmail(sessionId, email);

      // 1) issue short-lived admitToken for THIS participant
      const displayName =
        state.participantList?.find(
          (p) => p.email?.toLowerCase() === email.toLowerCase()
        )?.name || email; // fallback if name not present

      const admitToken = createAdmitToken({
        sessionId,
        email,
        name: displayName,
        ttlSeconds: 120,
      });

      // 2) find that participant's socket & notify only them
      const targetId = emailIndex.get(sessionId)?.get(email.toLowerCase());
      if (targetId) {
        // new event for participants to listen to
        io.to(targetId).emit("participant:admitted", { admitToken });
      }

      // 3) update moderator panels as you already do
      io.to(rooms.waiting).emit("waiting:list", {
        participantsWaitingRoom: state.participantsWaitingRoom,
        observersWaitingRoom: state.observersWaitingRoom,
      });
    });

    socket.on("waiting:remove", async ({ email }: { email: string }) => {
      if (!["Moderator", "Admin"].includes(role)) return;
      const state = await removeFromWaitingByEmail(sessionId, email);
      io.to(rooms.waiting).emit("waiting:list", {
        participantsWaitingRoom: state.participantsWaitingRoom,
        observersWaitingRoom: state.observersWaitingRoom,
      });

      const targetId = emailIndex.get(sessionId)?.get(email.toLowerCase());
      if (targetId)
        io.to(targetId).emit("waiting:removed", {
          reason: "Removed by moderator",
        });
    });

    socket.on("waiting:admitAll", async () => {
      if (!["Moderator", "Admin"].includes(role)) return;
      const state = await admitAll(sessionId);

      // for each known socket in this session, try to send an admitToken
      const idx = emailIndex.get(sessionId);
      if (idx) {
        for (const [eml, sockId] of idx.entries()) {
          const displayName =
            state.participantList?.find((p) => p.email?.toLowerCase() === eml)
              ?.name || eml;

          const admitToken = createAdmitToken({
            sessionId,
            email: eml,
            name: displayName,
            ttlSeconds: 120,
          });

          io.to(sockId).emit("participant:admitted", { admitToken });
        }
      }
      io.to(rooms.waiting).emit("waiting:list", {
        participantsWaitingRoom: state.participantsWaitingRoom,
        observersWaitingRoom: state.observersWaitingRoom,
      });
    });

    /**
     * Moderator/Admin → force-mute a participant's microphone.
     * Payload: { targetEmail: string }
     * Ack: { ok: boolean, error?: string }
     */
    socket.on(
      "meeting:mute-mic",
      async (
        payload: { targetEmail?: string; targetIdentity?: string },
        ack?: (resp: { ok: boolean; error?: string }) => void
      ) => {
        try {
          if (!(role === "Admin" || role === "Moderator")) {
            return ack?.({ ok: false, error: "forbidden" });
          }
          if (!payload?.targetEmail && !payload?.targetIdentity) {
            return ack?.({ ok: false, error: "bad_request" });
          }

          // identity: prefer explicit identity; else compute from email
          const identity =
            payload.targetIdentity ||
            participantIdentity(sessionId, payload.targetEmail!);

          const ok = await serverMuteMicrophone({
            roomName: sessionId,
            identity,
          });
          if (!ok)
            return ack?.({ ok: false, error: "mute_failed_or_not_found" });

          // nudge the client (by email if we have it; otherwise broadcast and let client filter by identity if you emit that too)
          if (payload.targetEmail) {
            const targetId = emailIndex
              .get(sessionId)
              ?.get(payload.targetEmail.toLowerCase());
            if (targetId)
              io.to(targetId).emit("meeting:force-mute", {
                email: payload.targetEmail,
              });
          } else if (payload.targetIdentity) {
            const targetId = identityIndex
              .get(sessionId)
              ?.get(payload.targetIdentity.toLowerCase());
            if (targetId) io.to(targetId).emit("meeting:force-mute", {});
          }

          return ack?.({ ok: true });
        } catch (e: any) {
          return ack?.({ ok: false, error: e?.message || "internal_error" });
        }
      }
    );

    /**
     * Moderator/Admin → force-turn-off a participant's camera.
     * Payload: { targetEmail?: string; targetIdentity?: string }
     * Ack: { ok: boolean, error?: string }
     */
    socket.on(
      "meeting:camera-off",
      async (
        payload: { targetEmail?: string; targetIdentity?: string },
        ack?: (resp: { ok: boolean; error?: string }) => void
      ) => {
        try {
          if (!(role === "Admin" || role === "Moderator")) {
            return ack?.({ ok: false, error: "forbidden" });
          }
          if (!payload?.targetEmail && !payload?.targetIdentity) {
            return ack?.({ ok: false, error: "bad_request" });
          }

          // Resolve identity the same way as mic
          const identity =
            payload.targetIdentity ||
            participantIdentity(sessionId, payload.targetEmail!);

          const ok = await serverDisableCamera({
            roomName: sessionId,
            identity,
          });
          if (!ok)
            return ack?.({
              ok: false,
              error: "camera_off_failed_or_not_found",
            });

          // Nudge client (email preferred; fallback to identity broadcast)
          if (payload.targetEmail) {
            const targetId = emailIndex
              .get(sessionId)
              ?.get(payload.targetEmail.toLowerCase());
            if (targetId)
              io.to(targetId).emit("meeting:force-camera-off", {
                email: payload.targetEmail,
              });
          } else if (payload.targetIdentity) {
            const targetId = identityIndex
              .get(sessionId)
              ?.get(payload.targetIdentity.toLowerCase());
            if (targetId) io.to(targetId).emit("meeting:force-camera-off", {});
          }

          return ack?.({ ok: true });
        } catch (e: any) {
          return ack?.({ ok: false, error: e?.message || "internal_error" });
        }
      }
    );

// -- allow/revoke for a single participant
socket.on(
  "meeting:screenshare:allow",
  async (
    payload: { targetEmail?: string; targetIdentity?: string; allow: boolean },
    ack?: (resp: { ok: boolean; error?: string }) => void
  ) => {
    try {
      if (!(role === "Admin" || role === "Moderator")) {
        return ack?.({ ok: false, error: "forbidden" });
      }
      if (!payload?.allow && payload?.allow !== false) {
        return ack?.({ ok: false, error: "bad_request" });
      }
      if (!payload?.targetEmail && !payload?.targetIdentity) {
        return ack?.({ ok: false, error: "bad_request" });
      }

      const identity =
        payload.targetIdentity ||
        participantIdentity(sessionId, payload.targetEmail!);

      const ok = await serverAllowScreenshare({
        roomName: sessionId,
        identity,
        allow: payload.allow,
      });
      if (!ok) return ack?.({ ok: false, error: "not_found_or_failed" });

      // If we revoked, nudge client to stop local capture promptly (UX).
      if (!payload.allow) {
        const targetId =
          (payload.targetEmail &&
            emailIndex.get(sessionId)?.get(payload.targetEmail.toLowerCase())) ||
          (payload.targetIdentity &&
            identityIndex.get(sessionId)?.get(payload.targetIdentity.toLowerCase()));
        if (targetId) io.to(targetId).emit("meeting:force-stop-screenshare", {});
      }

      return ack?.({ ok: true });
    } catch (e: any) {
      return ack?.({ ok: false, error: e?.message || "internal_error" });
    }
  }
);

// -- allow/revoke for ALL participants in a room (one go)
socket.on(
  "meeting:screenshare:allow-all",
  async (
    payload: { allow: boolean },
    ack?: (resp: { ok: boolean; updated: number; error?: string }) => void
  ) => {
    try {
      if (!(role === "Admin" || role === "Moderator")) {
        return ack?.({ ok: false, updated: 0, error: "forbidden" });
      }
      const participants = await roomService.listParticipants(sessionId);
      let updated = 0;
      for (const pi of participants) {
        // Skip moderators/admins (they already can share by default).
        const meta = (() => { try { return JSON.parse(pi.metadata || "{}"); } catch { return {}; } })();
        const theirRole = (meta?.role as string) || "";
        if (theirRole === "Admin" || theirRole === "Moderator") continue;

        const ok = await serverAllowScreenshare({
          roomName: sessionId,
          identity: pi.identity!,
          allow: payload.allow,
        });
        if (ok) {
          updated++;
          if (!payload.allow) {
            const targetId = identityIndex.get(sessionId)?.get(pi.identity!.toLowerCase());
            if (targetId) io.to(targetId).emit("meeting:force-stop-screenshare", {});
          }
        }
      }
      return ack?.({ ok: true, updated });
    } catch (e: any) {
      return ack?.({ ok: false, updated: 0, error: e?.message || "internal_error" });
    }
  }
);

    socket.on("disconnect", () => {
      if (email && emailIndex.get(sessionId)) {
        emailIndex.get(sessionId)!.delete(email.toLowerCase());
      }
      const idMap = identityIndex.get(sessionId);
      if (idMap) {
        for (const [idLower, sockId] of idMap.entries()) {
          if (sockId === socket.id) idMap.delete(idLower);
        }
      }
    });
  });

  return io;
}

```

Path: backend/tsconfig.json

```
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
    // "disableReferencedProjectLoad": true,             /* Reduce the number of projects loaded automatically by TypeScript. */

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
    "paths": {"@shared/*":  ["../shared/dist/*"]},                                      /* Specify a set of entries that re-map imports to additional lookup locations. */
    // "rootDirs": [],                                   /* Allow multiple folders to be treated as one when resolving modules. */
    // "typeRoots": [],                                  /* Specify multiple folders that act like './node_modules/@types'. */
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

```

Path: docker/docker-compose.yml

```
version: "3.8"

services:
  backend-server:
    container_name: backend
    build:

      context: ..
      dockerfile: docker/dockerfile.backend
    ports:
      - "8978:8978"
    volumes:
      - ../backend:/app/backend
      - /app/backend/node_modules
    env_file:
      - ../backend/.env


  frontend-server:
    container_name: frontend
    build:

      context: ..
      dockerfile: docker/dockerfile.frontend

    ports:
      - "8979:8979"
    depends_on:
      - backend-server

    volumes:
      - ../frontend:/app/frontend
      - /app/frontend/node_modules
    env_file:
      - ../frontend/.env
    command: npm run dev -- -p 8979


```

Path: docker/dockerfile.backend

```
# Use the official Node.js 20 Alpine image
FROM node:20-alpine AS base

# Set the working directory
WORKDIR /app

# Install OS dependencies including build tools and libraries needed to build your project
RUN apk update && apk add --no-cache \
    ttf-freefont \
    chromium \
    git \
    build-base \
    python3 \
    py3-pip \
    automake \
    autoconf \
    libtool \
    linux-headers \
    libstdc++ \
    libc6-compat \
    net-tools \
    iputils \
    curl \
    openssl \
    openssl-dev

# Create symbolic link for `python` if needed
RUN ln -sf python3 /usr/bin/python

# Create a second stage for actual running
FROM base AS run

# Set working directory again (new layer)
WORKDIR /app

# Copy package files first for better layer caching
COPY backend/package.json backend/package-lock.json ./backend/

# Install dependencies
RUN cd backend && npm install --force

# Copy the full app (excluding Docker context)
COPY . .

# Expose necessary ports
EXPOSE 8978

# Set working directory to backend
WORKDIR /app/backend

# Start the application
CMD ["npm", "run", "dev"]

```

Path: docker/dockerfile.frontend

```
# Base stage with dependencies
FROM node:20-alpine AS base

WORKDIR /app

# Install OS & build dependencies
RUN apk update && apk add --no-cache \
    ttf-freefont \
    chromium \
    git \
    build-base \
    python3 \
    py3-pip \
    automake \
    autoconf \
    libtool \
    linux-headers \
    libstdc++ \
    libc6-compat \
    net-tools \
    iputils \
    curl

# Symlink for python if needed
RUN ln -sf python3 /usr/bin/python

# Application build stage
FROM base AS run

WORKDIR /app

# Pre-clean (these folders should not exist before copying; better to use .dockerignore)
# Still keeping these lines in case of dirty Docker context
RUN rm -rf frontend/.next \
           frontend/node_modules

# Copy only necessary package files first for caching
COPY frontend/package.json frontend/package-lock.json ./frontend/

# Install dependencies
RUN cd frontend && npm install --force

# Copy the rest of the app
COPY . .

# Build the frontend
RUN cd frontend && npm run build

# Set correct working directory
WORKDIR /app/frontend

# Expose the Next.js port
EXPOSE 8979

# Start the application
CMD ["npm", "run", "start", "--", "-p", "8979"]

```

Path: frontend/app/(auth)/account-activation/page.tsx

```
"use client";
import React from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "components/ui/skeleton";
import AccountActivationUI from "components/accountActivation/AccountActivationUI";
import Logo from "components/shared/LogoComponent";
import FooterComponent from "components/shared/FooterComponent";

const AccountActivationContent: React.FC = () => {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  return <AccountActivationUI email={email} />;
};

const AccountActivationLoading: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Skeleton className="h-12 w-48 mb-8" />
      <Skeleton className="h-64 w-full max-w-2xl rounded-xl" />
    </div>
  );
};

const AccountActivation: React.FC = () => {
  return (
    <div>
      <div className="flex justify-center items-center pt-5 lg:hidden">
        <Logo />
      </div>
      <div className="pt-5 pl-10 hidden lg:block">
        <Logo />
      </div>
      <Suspense fallback={<AccountActivationLoading />}>
        <AccountActivationContent />
      </Suspense>
      <FooterComponent />
    </div>
  );
};

export default AccountActivation;

```

Path: frontend/app/(auth)/create-user/page.tsx

```
"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card";
import Logo from "components/shared/LogoComponent";
import FooterComponent from "components/shared/FooterComponent";
import RegisterForm from "components/createAccount/RegisterForm";

const Register = () => {
  return (
    <div>
      <div className="hidden lg:justify-center lg:items-start lg:flex bg-white h-10">
        <div className="flex-1 flex items-center w-full h-full">
          <div className="pl-10 pt-8">
            <Logo />
          </div>
        </div>
        <div className="flex-1 bg-slate-100 h-10"></div>
      </div>
      <div className="lg:hidden bg-white flex justify-center items-center pt-5">
        <Logo />
      </div>
      <div className="lg:flex lg:justify-center lg:items-center">
        <div className="flex-1 pb-10 lg:pb-0">
          <Card className="border-0 shadow-none">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold uppercase">
                CREATE ACCOUNT
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RegisterForm />
              <p className="mt-6 text-center">
                Already have an account?{" "}
                <Link href="/login" className="text-blue-500 ml-1">
                  Login
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="hidden lg:flex lg:flex-1 lg:bg-[#F6F8FA] min-h-screen">
          <div className="flex-1 flex justify-center items-start">
            <Image
              src="/register.jpg"
              alt="Amplify register"
              height={800}
              width={600}
            />
          </div>
        </div>
      </div>
      <FooterComponent />
    </div>
  );
};

export default Register;

```

Path: frontend/app/(auth)/forgot-password/page.tsx

```
"use client";

import React, { useState } from "react";

import { FaEnvelopeOpenText } from "react-icons/fa";
import { Input } from "components/ui/input";
import { Button } from "components/ui/button";
import { Label } from "components/ui/label";
import Logo from "components/shared/LogoComponent";
import { Alert, AlertDescription } from "components/ui/alert";
import FooterComponent from "components/shared/FooterComponent";
import useForgotPassword from "hooks/useForgotPassword";

const ForgotPassword = () => {
  const [email, setEmail] = useState<string>("");

  const {
    mutate: sendResetLink,
    isPending: isLoading,
    isError,
    isSuccess,
    data,
    error,
  } = useForgotPassword();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendResetLink({ email });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-none">
        <div className="flex justify-center items-center pt-5 lg:hidden">
          <Logo />
        </div>
        <div className="pt-5 pl-10 lg:block hidden">
          <Logo />
        </div>
      </div>

      <div className="py-20 flex-grow flex items-center justify-center">
        <div className="max-w-[800px] w-full mx-auto px-10 lg:px-20 bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.15),0_-4px_12px_rgba(0,0,0,0.1)]">
          <div className="flex justify-center items-center py-5">
            <FaEnvelopeOpenText className="h-20 w-20" />
          </div>
          <div className="px-3">
            <h1 className="text-3xl font-bold text-center">FORGOT PASSWORD</h1>
            <p className="text-blue-600 text-center mt-2">
              Send a link to your email to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="pt-10">
            <div className="mb-4">
              <Label htmlFor="email" className="block mb-2">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full"
              />
            </div>
            <Button
              variant="default"
              className="w-full bg-orange-500 hover:bg-orange-600"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>

          {isSuccess && (
            <Alert
              variant="default"
              className="mt-4 bg-green-50 border-green-500"
            >
              <AlertDescription className="text-green-500 text-center">
                {data.message}
              </AlertDescription>
            </Alert>
          )}

          {isError && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription className="text-center">
                {error.response?.data.message ||
                  error.message ||
                  "Error sending reset link"}
              </AlertDescription>
            </Alert>
          )}

          <div className="pt-14 pb-20">
            <div className="flex justify-center">
              <a href="/login" className="text-blue-600 font-semibold">
                Back to Login
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-none mt-auto">
        <FooterComponent />
      </div>
    </div>
  );
};

export default ForgotPassword;

```

Path: frontend/app/(auth)/login/page.tsx

```
import Login from 'components/login/login'
import React from 'react'

const page = () => {
  return (
    <div>
      <Login/>
    </div>
  )
}

export default page

```

Path: frontend/app/(auth)/reset-password/page.tsx

```
// app/reset-password/page.tsx
import React, { Suspense } from "react";
import ResetPasswordForm from "../../../components/reset-password/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center">Loading…</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

```

Path: frontend/app/(auth)/set-new-password/page.tsx

```
import React from 'react'

const SetNewPassword = () => {
  return (
    <div>SetNewPassword</div>
  )
}

export default SetNewPassword
```

Path: frontend/app/(auth)/verify-email/page.tsx

```
// app/(auth)/verify-email/page.tsx
import VerifyAccountClient from "../../../components/verify-email/VerifyAccountClient";
import React, { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<p className="p-8 text-center">Loading…</p>}>
      <VerifyAccountClient />
    </Suspense>
  );
}

```

Path: frontend/app/(before-meeting)/join/observer/[sessionId]/page.tsx

```
"use client";

import React from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "components/ui/input";
import { Button } from "components/ui/button";
import { useParams, useRouter } from "next/navigation";
import api from "lib/api";
import axios from "axios";
import { toast } from "sonner";

const observerJoinSchema = z.object({
  name: z.string().nonempty("Name is required"),
  email: z.string().email("Invalid email address"),
  passcode: z.string().min(1, "Passcode is required"),
});
type ObserverJoinData = z.infer<typeof observerJoinSchema>;

const ObserverJoinMeeting: React.FC = () => {
  const router = useRouter();
  const { sessionId: idParam } = useParams() as { sessionId: string };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ObserverJoinData>({
    resolver: zodResolver(observerJoinSchema),
  });

  async function tryGetSession(projectOrSessionId: string) {
    try {
      const res = await api.get<{
        data: { _id: string; projectId: string | { _id: string } };
      }>(`/api/v1/sessions/${projectOrSessionId}`);
      return {
        sessionId: res.data.data._id,
        projectId: res.data.data.projectId,
      };
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        return null;
      }
      throw err;
    }
  }

  async function resolveProjectToSession(projectId: string) {
    const res = await api.get<{
      data: { sessionId: string; status: "ongoing" | "upcoming" };
    }>(`/api/v1/sessions/project/${projectId}/latest`, {
      params: { role: "Observer" },
    });
    return res.data.data;
  }

  const onSubmit = async (data: ObserverJoinData) => {
    try {
      // Determine if param is a session or a project
      const maybeSession = await tryGetSession(idParam);
      let projectId: string;
      if (maybeSession) {
        const pid = maybeSession.projectId;
        projectId = typeof pid === "string" ? pid : pid._id;
      } else {
        projectId = idParam;
      }

      // Resolve latest for observer semantics
      let resolved;
      try {
        resolved = await resolveProjectToSession(projectId);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          toast.error("No current or upcoming session");
          return;
        }
        throw err;
      }

      // Enqueue; server decides waiting room vs stream by ongoing flag
      const enqueueRes = await api.post(`/api/v1/waiting-room/enqueue`, {
        sessionId: resolved.sessionId,
        name: data.name,
        email: data.email,
        role: "Observer",
        passcode: data.passcode,
      });

      const action = enqueueRes.data?.data?.action as
        | "waiting_room"
        | "stream"
        | undefined;
      if (action === "stream") {
        // Navigate to streaming room page (existing meeting route)
        router.push(`/meeting/${resolved.sessionId}?role=Observer`);
      } else {
        // Default to waiting room
        router.push(`/waiting-room/observer/${resolved.sessionId}`);
      }
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.message : "Failed to join";
      toast.error(msg);
    }
  };

  // subscribe to real‐time observer waiting‐room updates
  // useEffect(() => {
  //   const handleUpdate = (list: IObserverWaitingUser[]) => {
  //     console.log('observer waiting room now has', list.length, 'members');
  //   };
  //   onObserverWaitingRoomUpdate(handleUpdate);
  //   return () => {
  //     offObserverWaitingRoomUpdate(handleUpdate);
  //   };
  // }, [onObserverWaitingRoomUpdate, offObserverWaitingRoomUpdate]);

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4">Join as Observer</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Name
          </label>
          <Input id="name" {...register("name")} placeholder="Your full name" />
          {errors.name && (
            <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            placeholder="you@example.com"
          />
          {errors.email && (
            <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="passcode" className="block text-sm font-medium mb-1">
            Passcode
          </label>
          <Input
            id="passcode"
            type="password"
            {...register("passcode")}
            placeholder="Project passcode"
          />
          {errors.passcode && (
            <p className="text-red-600 text-sm mt-1">
              {errors.passcode.message}
            </p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Joining…" : "Join Meeting"}
        </Button>
      </form>
    </div>
  );
};

export default ObserverJoinMeeting;


```

Path: frontend/app/(before-meeting)/join/participant/[sessionId]/page.tsx

```
"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "lib/api";
import axios from "axios";
import { toast } from "sonner";

export default function ParticipantJoinMeeting() {
  const router = useRouter();
  const { sessionId: idParam } = useParams() as { sessionId: string };

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [joining, setJoining] = useState(false);

  async function resolveProjectToSession(projectId: string) {
    const res = await api.get<{ data: { sessionId: string } }>(
      `/api/v1/sessions/project/${projectId}/latest`,
      { params: { role: "Participant" } }
    );
    return res.data.data.sessionId;
  }

  async function tryGetSession(projectOrSessionId: string) {
    try {
      const res = await api.get<{
        data: { _id: string; projectId: string | { _id: string } };
      }>(`/api/v1/sessions/${projectOrSessionId}`);
      return {
        sessionId: res.data.data._id,
        projectId: res.data.data.projectId,
      };
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        return null;
      }
      throw err;
    }
  }

  const handleJoin = async () => {
    const nameTrimmed = name.trim();
  const emailNormalized = email.trim().toLowerCase();

  if (!nameTrimmed || !emailNormalized) {
    toast.error("Name and email are required");
    return;
  }
    setJoining(true);
    try {
      // Determine if the route param is a sessionId or a projectId
      const maybeSession = await tryGetSession(idParam);

      let projectId: string;

      if (maybeSession) {
        // Always resolve via project to enforce Participant semantics
        type ProjectRef = string | { _id: string };

        const pid = maybeSession.projectId as ProjectRef;

        projectId = typeof pid === "string" ? pid : pid._id;
      } else {
        projectId = idParam;
      }

      // 2) Resolve the latest session for participants
    let sessionId: string;
    try {
      const res = await api.get<{ data: { sessionId: string } }>(
        `/api/v1/sessions/project/${projectId}/latest`,
        { params: { role: "Participant" } }
      );
      sessionId = res.data.data.sessionId;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        toast.error("No session is currently running");
        return;
      }
      throw err;
    }

      // 3) Enqueue into the waiting room (no auth required)
      await api.post(`/api/v1/waiting-room/enqueue`, {
        sessionId,
        name: nameTrimmed,
        email: emailNormalized,
        role: "Participant",
        // optional, but useful for reporting:
        device: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      });

    // 4) Persist for the waiting-room page (which opens the socket)
    localStorage.setItem(
      "liveSessionUser",
      JSON.stringify({ name: nameTrimmed, email: emailNormalized, role: "Participant" })
    );

    // 5) Go to the participant waiting room
      router.push(`/waiting-room/participant/${sessionId}`);
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.message : "Failed to join";
      toast.error(msg);
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <h2 className="text-xl font-semibold">Join as Participant</h2>
      <input
        className="w-full p-2 border rounded"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className="w-full p-2 border rounded"
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      {/* localhost:3000/join/participant/670d9310667c144b9c271710 */}
      <button
        className="w-full py-2 bg-green-600 text-white rounded"
        onClick={handleJoin}
        disabled={joining}
      >
        {joining ? "Joining…" : "Join Meeting"}
      </button>
    </div>
  );
}

```

Path: frontend/app/(before-meeting)/remove-participant/page.tsx

```
import React from 'react'

const RemoveParticipant = () => {
  return (
    <div className="max-w-md mx-auto p-6 text-center">
    <h2 className="text-2xl font-semibold mb-4">You’ve been removed</h2>
    <p className="text-sm text-muted-foreground mb-6">
        The moderator removed you from the session. If this was a mistake, you can try joining again using your project link.
      </p>
  </div>
  )
}

export default RemoveParticipant
```

Path: frontend/app/(before-meeting)/waiting-room/observer/[sessionId]/page.tsx

```
import React from 'react'

const ObserverWaitingRoom = () => {
  return (
    <div>ObserverWaitingRoom</div>
  )
}

export default ObserverWaitingRoom
```

Path: frontend/app/(before-meeting)/waiting-room/participant/[sessionId]/page.tsx

```
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "constant/socket";
import type {
  IObserverWaitingUser,
  IParticipant,
  IObserver,
} from "@shared/interface/LiveSessionInterface";
import api from "lib/api";
import { ApiResponse } from "@shared/interface/ApiResponseInterface";

type UserRole = "Participant" | "Observer" | "Moderator" | "Admin";

interface WaitingUser {
  name: string;
  email: string;
  role: Extract<UserRole, "Participant" | "Moderator" | "Admin">;
  joinedAt: string;
}

interface JoinAck {
  participantsWaitingRoom: WaitingUser[];
  observersWaitingRoom: IObserverWaitingUser[];
  participantList: IParticipant[];
  observerList: IObserver[];
}

export default function ParticipantWaitingRoom() {
  const { sessionId } = useParams() as { sessionId: string };
  const router = useRouter();
  // const { socket } = useMeeting();

  // Load 'me' from localStorage (set by Join page)
  const me = useMemo(() => {
    const raw = localStorage.getItem("liveSessionUser");
    if (!raw) {
      // If missing, bounce back to join
      router.replace(`/join/participant/${sessionId}`);
      return { name: "", email: "", role: "Participant" as UserRole };
    }
    return JSON.parse(raw) as { name: string; email: string; role: UserRole };
  }, [router, sessionId]);

  const [waiting, setWaiting] = useState<WaitingUser[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const joinedRef = useRef(false);

  // chat state
  // const [chatInput, setChatInput] = useState("");

  useEffect(() => {
    if (!sessionId || !me.email) return;

    const s = io(SOCKET_URL, {
      path: "/socket.io",
      withCredentials: true,
      query: {
        sessionId,
        role: me.role,
        name: me.name,
        email: me.email,
      },
    });

    socketRef.current = s;

    s.on("connect", () => {
      if (joinedRef.current) return;
      joinedRef.current = true;

      s.emit("join-room", {}, (rooms: JoinAck) => {
        // exclude self from the UI list
        const others = (rooms.participantsWaitingRoom || []).filter(
          (u) => u.email !== me.email
        );
        setWaiting(others);
      });
    });

    s.on(
      "waiting:list",
      (payload: { participantsWaitingRoom: WaitingUser[] }) => {
        setWaiting(
          (payload.participantsWaitingRoom || []).filter(
            (u) => u.email !== me.email
          )
        );
      }
    );

     s.on("participant:admitted", async ({ admitToken }: { admitToken: string }) => {
      try {
        const resp = await api.post<ApiResponse<{ token: string }>>(
          "/api/v1/livekit/exchange",
          { admitToken } // public route – no auth header needed
        );
        const lkToken = resp.data.data.token;

        // Store for the meeting page to read (short-lived is fine in sessionStorage)
        sessionStorage.setItem(`lk:${sessionId}`, lkToken);

        // Go to the actual meeting page
        router.push(`/meeting/${sessionId}`);
      } catch (err) {
        console.error("Failed to exchange admit token", err);
      }
    });

    s.on("waiting:removed", () => {
      router.push(`/remove-participant`); // implement simple “removed” page later
    });

    return () => {
      s.off("waiting:list");
      s.off("participant:admitted");
      s.off("waiting:removed");
      s.disconnect();
    };
  }, [me.email, me.name, me.role, router, sessionId]);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Waiting Room</h1>
      <p className="text-sm text-muted-foreground">
        Hi {me.name}, you’ll enter the meeting once the moderator admits you.
      </p>

      <div className="rounded-xl border p-4">
        <h2 className="font-medium mb-2">Other participants waiting</h2>
        {waiting.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You’re the first here.
          </p>
        ) : (
          <ul className="space-y-2">
            {waiting.map((u) => (
              <li key={u.email} className="flex items-center justify-between">
                <span>{u.name}</span>
                <span className="text-xs text-muted-foreground">{u.email}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}


```

Path: frontend/app/(dashboard)/account/page.tsx

```
import React from 'react'

const Account = () => {
  return (
    <div>Account</div>
  )
}

export default Account
```

Path: frontend/app/(dashboard)/billing/page.tsx

```
import React from 'react'

const page = () => {
  return (
    <div>This is billing page</div>
  )
}

export default page
```

Path: frontend/app/(dashboard)/companies/page.tsx

```
import React from 'react'

const Companies = () => {
  return (
    <div>Companies</div>
  )
}

export default Companies
```

Path: frontend/app/(dashboard)/create-project/page.tsx

```
"use client";

import React from "react";
import ComponentContainer from "components/shared/ComponentContainer";
import CustomButton from "components/shared/CustomButton";
import clsx from "clsx";
import { useCreateProject } from "hooks/useCreateProject";

const CreateProjectPage: React.FC = () => {
   const {
    formData,
    updateFormData,
    currentStep,
    StepComponent,
    totalSteps,
    handleBack,
    handleNext,
    isNextButtonDisabled,
    isLastStep,
    isLoading,
    uniqueId
  } = useCreateProject();

    const stepTitles: Record<number, string[]> = {
    2: [
      "Choose Service",   
      "Project Information Request"
    ],
    3: [
      "Choose Service",   
      "Tell us about your project", 
      "Review & Pay" 
    ]
  };

  // fallback to "Create Project" if something unexpected happens
  const heading =
    stepTitles[totalSteps]?.[currentStep] ??
    "Create Project";

  return (
    <ComponentContainer>
      <div className="min-h-screen p-6 mx-5">
        <h1 className="text-3xl font-bold mb-4 text-center">{heading}</h1>
        <div className="mb-4 text-center">
          <p>
            Step {currentStep + 1} of {totalSteps}
          </p>
        </div>

        {/* Dynamic Step Rendering */}
        <StepComponent
          formData={formData}
          updateFormData={updateFormData}
          uniqueId={uniqueId}
        
        />

        <div className="flex justify-between mt-6  items-center">
          <CustomButton
            className={clsx(
              "bg-custom-teal hover:bg-custom-dark-blue-3",
              {
                "": currentStep === 2,
              },
              {
                "": currentStep === 1,
              }
            )}
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            Back
          </CustomButton>
          {/* Only show Next button if not on last step */}
          {!isLastStep && (
            <CustomButton
              onClick={handleNext}
              disabled={isNextButtonDisabled() || isLoading}
              className="bg-custom-teal hover:bg-custom-dark-blue-3"
            >
              {isLoading ? "Saving..." : "Next"}
            </CustomButton>
          )}
        </div>
      </div>
    </ComponentContainer>
  );
};

export default CreateProjectPage;

```

Path: frontend/app/(dashboard)/edit-profile/[id]/page.tsx

```
"use client";
import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { FaSave } from "react-icons/fa";
import { Button } from "components/ui/button";
import InputFieldComponent from "components/shared/InputFieldComponent";
import { useUserById } from "hooks/useUserById";
import { useUpdateUser } from "hooks/useUpdateUser";
import { Controller, useForm } from "react-hook-form";
import { EditUserFormValues, editUserSchema } from "schemas/editUserSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { personalFields } from "constant";

const Page: React.FC = () => {
  const { id } = useParams() as { id: string };
  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      companyName: "",
      phoneNumber: "",
    },
  });

  const { data: fullUser, isLoading, isError, error } = useUserById(id);
  const updateMutation = useUpdateUser(id);

  useEffect(() => {
    if (fullUser) {
      reset({
        firstName: fullUser.firstName,
        lastName: fullUser.lastName,
        companyName: fullUser.companyName || "",
        phoneNumber: fullUser.phoneNumber || "",
      });
    }
  }, [fullUser, reset]);

  const onSubmit = (data: EditUserFormValues) => updateMutation.mutate(data);

  if (isLoading) return <p className="px-6 py-4">Loading profile…</p>;

  if (isError) {
    console.error("Error fetching user:", error);
    return (
      <p className="px-6 py-4 text-red-500">
        {error?.message || "Failed to load profile"}
      </p>
    );
  }

  const isSaving = updateMutation.isPending;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="my_profile_main_section_shadow pb-16 bg-[#fafafb] bg-opacity-90 h-full min-h-screen flex flex-col items-center"
    >
      {/* navbar */}
      <div className="bg-white h-20 w-full">
        <div className="px-10 flex justify-between items-center pt-3">
          <h1 className="text-2xl font-bold text-[#1E656D]">Edit Profile</h1>

          <div className="fixed right-5 md:static md:flex gap-4">
            <Button
              type="submit"
              variant="teal"
              disabled={isSaving}
              className="rounded-xl py-6 w-full md:w-[100px] shadow-[0px_3px_6px_#FF66004D] md:shadow-[0px_3px_6px_#2976a54d]   
    "
            >
              <FaSave className="md:mr-1" />
              <span className="hidden md:inline">
                {isSaving ? "Saving" : "Save"}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* body */}
      <div className="w-full md:w-[450px] px-5 md:px-0 md:ml-6 md:mr-auto">
        <div className="pt-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <Image
              src="/placeholder-image.png"
              alt="user image"
              height={70}
              width={70}
              className="rounded-full"
            />
            <Controller
              name="firstName"
              control={control}
              render={({ field }) => (
                <div className="flex-grow">
                  <h2 className="text-3xl font-semibold text-[#1E656D]">
                    {field.value}
                  </h2>
                  <p className="text-gray-400">{fullUser?.role}</p>
                </div>
              )}
            />
          </div>

          <h2 className="text-2xl font-semibold text-[#00293C] pt-7">
            Personal Details
          </h2>
          <div className="space-y-7 mt-5">
            {personalFields.map(({ name, label }) => (
              <Controller
                key={name}
                name={name}
                control={control}
                render={({ field }) => (
                  <InputFieldComponent
                    label={label}
                    {...field}
                    error={errors[name]?.message}
                    disabled={isSaving}
                  />
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </form>
  );
};

export default Page;

```

Path: frontend/app/(dashboard)/external-admin/page.tsx

```
import React from 'react'

const ExternalAdmin = () => {
  return (
    <div>ExternalAdmin</div>
  )
}

export default ExternalAdmin
```

Path: frontend/app/(dashboard)/internal-admin/page.tsx

```
import React from 'react'

const InternalAdmin = () => {
  return (
    <div>InternalAdmin</div>
  )
}

export default InternalAdmin
```

Path: frontend/app/(dashboard)/layout.tsx

```
"use client";
import React, { ReactNode, useEffect, useState } from "react";
import { useGlobalContext } from "../../context/GlobalContext";
import { useRouter } from "next/navigation";
import FooterComponent from "components/shared/FooterComponent";
import DashboardSidebarComponent from "../../components/sidebar/DashboardSidebarComponent";
import LogoutModalComponent from "components/LogoutModalComponent";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const { user } = useGlobalContext();
  const router = useRouter();

  const handleLogoutModalOpen = () => {
    setIsLogoutModalOpen(!isLogoutModalOpen);
  };

  const handleCloseLogoutModal = () => {
    setIsLogoutModalOpen(false);
  };

  useEffect(() => {
    if (!user || Object.keys(user).length === 0) {
      router.push("/login");
    }
  }, [user, router]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] min-h-screen">
      {/* Sidebar */}
      <div className="relative z-50">
        <DashboardSidebarComponent
          handleLogoutModalOpen={handleLogoutModalOpen}
        />
      </div>

      {/* Main Content */}
      <div className="flex flex-col">
        <main className="flex-grow overflow-x-hidden">{children}</main>
        <footer className="mt-auto">
          <FooterComponent />
        </footer>
      </div>

      {isLogoutModalOpen && (
        <LogoutModalComponent
          open={isLogoutModalOpen}
          onClose={handleCloseLogoutModal}
        />
      )}
    </div>
   
  );
};
export default DashboardLayout;

```

Path: frontend/app/(dashboard)/my-profile/[id]/page.tsx

```
// components/MyProfilePage.tsx
"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import PasswordModalComponent from "components/profile/PasswordModalComponent";
import ConfirmationModalComponent from "components/shared/ConfirmationModalComponent";
import { useGlobalContext } from "context/GlobalContext";
import { useDeleteUser } from "hooks/useDeleteUser";
import { useProfileModals } from "hooks/useProfileModals";
import { ProfileDetailsCard } from "components/profile/ProfileDetailsCard";

const Page: React.FC = () => {
  const { user } = useGlobalContext();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const deleteUserMutation = useDeleteUser();
  const {
    showPasswordModal,
    setShowPasswordModal,
    showDeleteModal,
    setShowDeleteModal,
  } = useProfileModals();

  // Derive displayable strings once, so JSX stays clean:
  const firstName = user?.firstName?.toUpperCase() ?? "Loading...";
  const lastName = user?.lastName?.toUpperCase() ?? "Loading...";
  const role = user?.role?.toUpperCase() ?? "Loading...";
  const email = user?.email ?? "Loading...";
  const credits = user?.credits?.toString() ?? "0";
  const phoneNumber = user?.phoneNumber ?? "Loading...";
  const companyName = user?.companyName ?? "Loading...";
  const billingInfo = user?.billingInfo
    ? {
        address: user.billingInfo.address ?? "",
        city: user.billingInfo.city ?? "",
        state: user.billingInfo.state ?? "",
        postalCode: user.billingInfo.postalCode ?? "",
        country: user.billingInfo.country ?? "",
      }
    : null;

  return (
    <>
      <div className="my_profile_main_section_shadow bg-[#fafafb] bg-opacity-90 h-full min-h-screen flex-col justify-center items-center relative">
        <div className="bg-white h-16 w-full px-10 flex justify-between items-center pt-2">
          <p className="text-2xl font-bold text-custom-teal">My Profile</p>
        </div>

        {/* Profile Details Card */}
        <ProfileDetailsCard
          firstName={firstName}
          lastName={lastName}
          role={role}
          email={email}
          credits={credits}
          phoneNumber={phoneNumber}
          companyName={companyName}
          billingInfo={billingInfo}
          onEdit={() => router.push(`/edit-profile/${id}`)}
          onChangePassword={() => setShowPasswordModal(true)}
          onDelete={() => setShowDeleteModal(true)}
          isDeleting={deleteUserMutation.isPending}
        />

        {/* Modals */}
        <PasswordModalComponent
          open={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          id={id}
        />
        <ConfirmationModalComponent
          open={showDeleteModal}
          onCancel={() => setShowDeleteModal(false)}
          onYes={() => deleteUserMutation.mutate(id!)}
          heading="Delete Account"
          text="Are you sure you want to delete your account? All your data will be permanently deleted. This action cannot be undone."
        />
      </div>
    </>
  );
};

export default Page;

```

Path: frontend/app/(dashboard)/projects/page.tsx

```
"use client";
import React, { useState } from "react";
import { useGlobalContext } from "context/GlobalContext";
import { IProject } from "@shared/interface/ProjectInterface";
import NoSearchResult from "components/projects/NoSearchResult";
import { useRouter } from "next/navigation";
import { Card } from "components/ui/card";
import { toast } from "sonner";
import { useProjects } from "hooks/useProjects";
import ProjectsHeader from "components/projects/ProjectsHeader";
import ProjectsFilter from "components/projects/ProjectsFilter";
import ProjectsPagination from "components/projects/ProjectsPagination";
import ProjectsTable from "components/projects/ProjectsTable";
import ShareProjectModal from "components/projects/ShareProjectModal";

interface DateRange {
  from: Date | undefined;
  to?: Date | undefined;
}

const Projects: React.FC = () => {
  const { user } = useGlobalContext();
  const router = useRouter();
  const userId = user?._id;
  const [searchTerm, setSearchTerm] = useState("");
  const [tagTerm, setTagTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [page, setPage] = useState(1);
  const limit = 10;
  // Modal state
  const [activeShareType, setActiveShareType] = useState<
    "observer" | "participant" | null
  >(null);
  const [shareProject, setShareProject] = useState<IProject | null>(null);
  // ---- useProjects hook ----

  const fromISO = dateRange?.from?.toISOString();
  const toISO = dateRange?.to?.toISOString();

  const { projects, meta, isLoading, error } = useProjects({
    userId,
    page,
    limit,
    search: searchTerm,
    tag: tagTerm,
    from: fromISO,
    to: toISO,
  });

  if (!userId) {
    return <p>User not found or not authenticated.</p>;
  }


  if (error) {
    toast.error(error instanceof Error ? error.message : "Unknown error");
    return <p className="p-6 text-red-600"></p>;
  }

  return (
    <div className="p-6">
      {/* heading and upload button */}

      <ProjectsHeader onCreateClick={() => router.push("/create-project")} />

      <ProjectsFilter
        searchTerm={searchTerm}
        onSearchChange={(v) => {
          setSearchTerm(v);
          setPage(1);
        }}
        tagSearchTerm={tagTerm}
        onTagSearchChange={(v) => {
          setTagTerm(v);
          setPage(1);
        }}
        dateRange={dateRange}
        onDateRangeChange={(r) => {
          setDateRange(r);
          setPage(1);
        }}
      />
      <Card className="shadow-all-sides border-0 rounded-md">
        <div className="shadow-all-sides border-0 rounded-md">
          {projects.length === 0 && !isLoading ? (
            <NoSearchResult />
          ) : (
            <>
              <ProjectsTable
                filteredProjects={projects}
                isLoading={isLoading}
                // ← here is the “row click” navigation:
                onRowClick={(projectId: string) => {
                  router.push(`/view-project/${projectId}`);
                }}
                onShareClick={(project, type) => {
                  setShareProject(project);
                  setActiveShareType(type);
                }}
              />

              <ProjectsPagination
                totalPages={meta.totalPages}
                currentPage={page}
                onPageChange={(newPage) => {
                  setPage(newPage);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </>
          )}
        </div>
      </Card>
      {/* Share Modal */}
      <ShareProjectModal
        open={Boolean(activeShareType && shareProject)}
        shareType={activeShareType}
        project={shareProject}
        onClose={() => {
          setActiveShareType(null);
          setShareProject(null);
        }}
      />
    </div>
  );
};

export default Projects;

```

Path: frontend/app/(dashboard)/projects/[projectId]/layout.tsx

```
'use client'

import { ReactNode } from 'react'
import { useParams } from 'next/navigation'
import { useProject } from 'hooks/useProject'

export default function ProjectLayout({ children }: { children: ReactNode }) {
  const { projectId } = useParams() as { projectId: string };

  const { data: project, isLoading } = useProject(projectId)

  return (
    <div className=" py-4 px-5">
      {isLoading ? (
        <h1 className="text-xl font-semibold pl-16">Loading Project Name…</h1>
      ) : (
        <h1 className="text-2xl font-bold">{project?.name}</h1>
      )}

      {/* this is where Sessions / Polls / Reports pages will render */}
      <div className="mt-6">{children}</div>
    </div>
  )
}

```

Path: frontend/app/(dashboard)/projects/[projectId]/observer-documents/page.tsx

```
"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import api from "lib/api";
import { useParams } from "next/navigation";
import React, { useState } from "react";
import { IObserverDocument } from "@shared/interface/ObserverDocumentInterface";
import ComponentContainer from "components/shared/ComponentContainer";
import HeadingBlue25px from "components/shared/HeadingBlue25pxComponent";
import CustomButton from "components/shared/CustomButton";
import { Download, Trash2, Upload } from "lucide-react";
import CustomPagination from "components/shared/Pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import { IPaginationMeta } from "@shared/interface/PaginationInterface";
import { Checkbox } from "components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "components/ui/dialog";
import UploadObserverDocument from "components/projects/observerDocuments/UploadObserverDocuments";

type CheckedState = boolean | "indeterminate";

interface PopulatedUser {
  firstName: string;
  lastName: string;
  role: string;
}

const ObserverDocuments = () => {
  const params = useParams();
  const projectId =
    !params.projectId || Array.isArray(params.projectId)
      ? null
      : params.projectId;

  // 2️⃣ all hooks go here, top-level, unconditionally
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const limit = 10;
  const queryClient = useQueryClient();

  const [uploadOpen, setUploadOpen] = useState(false);

  const { data, isLoading, error } = useQuery<
    { data: IObserverDocument[]; meta: IPaginationMeta },
    Error
  >({
    queryKey: ["observerDocs", projectId, page],
    queryFn: () =>
      api
        .get<{ data: IObserverDocument[]; meta: IPaginationMeta }>(
          `/api/v1/observerDocuments/project/${projectId}`,
          { params: { page, limit } }
        )
        .then((res) => res.data),
    enabled: !!projectId,
    placeholderData: keepPreviousData,
  });

  // 2️⃣ Mutation for single-download
  const downloadOneMutation = useMutation<string, unknown, string>({
    // Using onMutate so we can fire off the download immediately
    mutationFn: (id) => Promise.resolve(id),
    onMutate: (id) => {
      window.open(
        `https://bamplify.hgsingalong.com/api/v1/observerDocuments/${id}/download`,
        "_blank"
      );
    },
  });

  // bulk-download
  const downloadAllMutation = useMutation<string[], unknown, string[]>({
    mutationFn: (ids) =>
      api
        .post<{
          success: boolean;
          message: string;
          data: Array<{ key: string; url: string }>;
        }>("/api/v1/observerDocuments/download-bulk", { ids })
        .then((res) => res.data.data.map((d) => d.url)),
    onSuccess: (urls) => {
      urls.forEach((url) => window.open(url, "_blank"));
    },
    onError: (err) => {
      console.error("Bulk download failed", err);
    },
  });

  // DELETE mutation
  const deleteMutation = useMutation<string, unknown, string>({
    mutationFn: (id) => api.delete(`/api/v1/observerDocuments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["observerDocs", projectId, page],
      });
    },
    onError: (err) => {
      console.error("Delete failed", err);
    },
  });

  // 3️⃣ now safe to guard
  if (!projectId) {
    return (
      <div className="p-4 text-red-600">
        <p>❗️ Invalid or missing projectId in the URL.</p>
      </div>
    );
  }

  if (error) return <p className="text-red-500">Error: {error.message}</p>;

  const totalPages = data?.meta.totalPages ?? 0;

  // format bytes as KB/MB
  const formatSize = (bytes: number) =>
    bytes >= 1024 * 1024
      ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
      : bytes >= 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${bytes} B`;

  // checkbox handlers
  const allSelected = data ? selectedIds.length === data.data.length : false;

  const toggleSelectAll = (checked: CheckedState) => {
    if (checked) {
      setSelectedIds(data?.data.map((d) => d._id) || []);
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectOne = (id: string) => (checked: CheckedState) => {
    const isTrue = checked === true;
    setSelectedIds((prev) =>
      isTrue ? [...prev, id] : prev.filter((sid) => sid !== id)
    );
  };

  return (
    <ComponentContainer>
      <div className="flex justify-between items-center bg-none pb-5 ">
        <HeadingBlue25px>Observer Documents</HeadingBlue25px>
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <CustomButton
              icon={<Upload />}
              text="Upload"
              variant="default"
              className="bg-custom-orange-2 text-white hover:bg-custom-orange-1"
            />
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Observer Document</DialogTitle>
            </DialogHeader>
            <UploadObserverDocument
              projectId={projectId}
              onClose={() => {
                setUploadOpen(false);
              }}
            />
            <DialogFooter />
          </DialogContent>
        </Dialog>
      </div>
      {isLoading ? (
        <p className="text-custom-dark-blue-1 text-2xl text-center font-bold">
          Loading observer documents...
        </p>
      ) : (
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                      className="cursor-pointer"
                    />
                    <CustomButton
                      icon={<Download />}
                      variant="outline"
                      onClick={() => downloadAllMutation.mutate(selectedIds)}
                      disabled={
                        selectedIds.length === 0 ||
                        downloadAllMutation.isPending
                      }
                      size="sm"
                      className="cursor-pointer hover:text-custom-dark-blue-1 hover:bg-white outline-0 border-0 shadow-lg bg-white"
                    >
                      {downloadAllMutation.isPending
                        ? "Downloading..."
                        : "Download All"}
                    </CustomButton>
                  </div>
                </TableHead>
                <TableHead>File Name</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Added By</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y">
              {data?.data.length ? (
                data.data.map((del) => (
                  <TableRow key={del._id}>
                    <TableCell className="w-[48px]">
                      <Checkbox
                        checked={selectedIds.includes(del._id)}
                        onCheckedChange={toggleSelectOne(del._id)}
                        aria-label={`Select ${del.displayName}`}
                        className="cursor-pointer"
                      />
                    </TableCell>
                    <TableCell>{del.displayName}</TableCell>
                    <TableCell>{formatSize(del.size)}</TableCell>
                    <TableCell>
                      {(del.addedBy as unknown as PopulatedUser).firstName}
                    </TableCell>
                    <TableCell className="text-center flex justify-center gap-2">
                      <CustomButton
                        className="bg-custom-teal hover:bg-custom-dark-blue-3 rounded-lg"
                        onClick={() => downloadOneMutation.mutate(del._id)}
                        disabled={downloadOneMutation.isPending}
                      >
                        {downloadOneMutation.isPending
                          ? "Downloading..."
                          : "Download"}
                      </CustomButton>
                      {/* Delete */}
                      <CustomButton
                        size="sm"
                        className="bg-custom-orange-1 hover:bg-custom-orange-2"
                        onClick={() => deleteMutation.mutate(del._id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 size={16} />
                      </CustomButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-gray-500 py-8"
                  >
                    No deliverables found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="w-full flex justify-end  pb-5">
          <CustomPagination
            totalPages={totalPages}
            currentPage={page}
            onPageChange={(p) => {
              setPage(p);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      )}
    </ComponentContainer>
  );
};

export default ObserverDocuments;

```

Path: frontend/app/(dashboard)/projects/[projectId]/page.tsx

```
'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { IProject } from '@shared/interface/ProjectInterface'
import api from 'lib/api'


export default function ProjectOverviewPage() {
  const { projectId } = useParams()
  const { data: project, isLoading, error } = useQuery<IProject, Error>({
    queryKey: ['project', projectId],
    queryFn: () =>
      api
        .get(`/api/v1/projects/get-project-by-id/${projectId}`)
        .then((res) => res.data.data),
    enabled: Boolean(projectId),
  })


  if (isLoading) return <p>Loading project overview…</p>
  if (error) return <p className="text-red-500">Failed to load project.</p>

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">About this project</h2>
      <p>{project?.name || 'No description provided.'}</p>
     
    </div>
  )
}

```

Path: frontend/app/(dashboard)/projects/[projectId]/polls/page.tsx

```
"use client";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import api from "lib/api";
import { useParams } from "next/navigation";
import React, { useState } from "react";
import { IPoll } from "@shared/interface/PollInterface";
import ComponentContainer from "components/shared/ComponentContainer";
import HeadingBlue25px from "components/shared/HeadingBlue25pxComponent";
import { useGlobalContext } from "context/GlobalContext";
import AddPollDialog from "components/projects/polls/AddPollDialog";
import PollsTable from "components/projects/polls/PollsTable";
import { IPaginationMeta } from "@shared/interface/PaginationInterface";
import { toast } from "sonner";
import axios from "axios";
import EditPollDialog from "components/projects/polls/EditPollDialog";
import PreviewPollDialog from "components/projects/polls/PreviewPollDialog";
import ConfirmationModalComponent from "components/shared/ConfirmationModalComponent";

const Polls = () => {
  const { projectId } = useParams() as { projectId?: string };
  const { user } = useGlobalContext();
  const queryClient = useQueryClient();
  const limit = 10;
  const [page, setPage] = useState(1);
  const [editingPoll, setEditingPoll] = useState<IPoll | null>(null);
  const [previewing, setPreviewing] = useState<IPoll | null>(null);
  const [pendingDeletePoll, setPendingDeletePoll] = useState<string | null>(
    null
  );

  const { data, isLoading, error } = useQuery<
    { data: IPoll[]; meta: IPaginationMeta },
    Error
  >({
    queryKey: ["polls", projectId, page],
    queryFn: () =>
      api
        .get<{ data: IPoll[]; meta: IPaginationMeta }>(
          `/api/v1/polls/project/${projectId}`,
          { params: { page, limit } }
        )
        .then((res) => res.data),
    placeholderData: keepPreviousData,
  });

  // Delete mutation
  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: (pollId: string) => api.delete(`/api/v1/polls/${pollId}`),
    onSuccess: () => {
      toast.success("Poll deleted");
      queryClient.invalidateQueries({ queryKey: ["polls", projectId] });
    },
    onError: (err) => {
      const msg = axios.isAxiosError(err)
        ? err.response?.data.message ?? err.message
        : "Could not delete poll";
      toast.error(msg);
    },
  });

  if (error) return <p className="text-red-500">Error: {error.message}</p>;

  return (
    <ComponentContainer>
      <div className="flex justify-between items-center bg-none pb-5 ">
        <HeadingBlue25px>Polls</HeadingBlue25px>
        {projectId && user && (
          <AddPollDialog projectId={projectId} user={user} />
        )}
      </div>
      {isLoading ? (
        <p className="text-custom-dark-blue-1 text-2xl text-center font-bold">
          Loading Sessions...
        </p>
      ) : (
        <div className="pt-5 bg-custom-white">
          <PollsTable
            polls={data!.data}
            meta={data!.meta}
            onPageChange={setPage}
            onDelete={(pollId) => setPendingDeletePoll(pollId)}
            onEdit={(poll) => setEditingPoll(poll)}
            onPreview={(p) => setPreviewing(p)}
          />
        </div>
      )}
      {editingPoll && (
        <EditPollDialog
          poll={editingPoll}
          onClose={() => setEditingPoll(null)}
        />
      )}

      {previewing && (
        <PreviewPollDialog
          poll={previewing}
          onClose={() => setPreviewing(null)}
        />
      )}

      {pendingDeletePoll && (
        <ConfirmationModalComponent
          open={true}
          heading="Delete this poll?"
          text="This action cannot be undone. Are you sure you want to delete this poll?"
          onCancel={() => setPendingDeletePoll(null)}
          onYes={() => {
            deleteMutation.mutate(pendingDeletePoll);
            setPendingDeletePoll(null);
          }}
        />
      )}
    </ComponentContainer>
  );
};

export default Polls;

```

Path: frontend/app/(dashboard)/projects/[projectId]/project-team/page.tsx

```
"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import api from "lib/api";
import { useParams } from "next/navigation";
import React, { useState } from "react";
import { IModerator } from "@shared/interface/ModeratorInterface";
import ComponentContainer from "components/shared/ComponentContainer";
import HeadingBlue25px from "components/shared/HeadingBlue25pxComponent";
import { Plus } from "lucide-react";
import CustomButton from "components/shared/CustomButton";
import { IPaginationMeta } from "@shared/interface/PaginationInterface";
import ProjectTeamsTable from "components/projects/projectTeam/ProjectTeamsTable";
import AddModeratorModal from "components/projects/projectTeam/AddModeratorModal";

const ProjectTeam = () => {
  const { projectId } = useParams();

  const [openAddModeratorModal, setOpenAddModeratorModal] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, error } = useQuery<
    { data: IModerator[]; meta: IPaginationMeta },
    Error
  >({
    queryKey: ["projectTeam", projectId, page],
    queryFn: () =>
      api
        .get<{ data: IModerator[]; meta: IPaginationMeta }>(
          `/api/v1/moderators/project/${projectId}`,
          { params: { page, limit } }
        )
        .then((res) => res.data),
    placeholderData: keepPreviousData,
  });

  if (isLoading) return <p>Loading project team…</p>;

  if (error) return <p className="text-red-500">Error: {error.message}</p>;

  return (
    <ComponentContainer>
      <div className="flex justify-between items-center bg-none pb-5 ">
        <HeadingBlue25px>Project Team View</HeadingBlue25px>
        <CustomButton
          icon={<Plus />}
          text="Add Project Team"
          variant="default"
          className=" bg-custom-orange-2 text-white hover:bg-custom-orange-1 font-semibold px-2"
          onClick={() => {
            setOpenAddModeratorModal(true);
          }}
        />
      </div>

      <AddModeratorModal
        open={openAddModeratorModal}
        onClose={() => setOpenAddModeratorModal(false)}
      />

      {isLoading ? (
        <p className="text-custom-dark-blue-1 text-2xl text-center font-bold">
          Loading Sessions...
        </p>
      ) : (
        <div className="pt-5 bg-custom-white">
          <ProjectTeamsTable
            moderators={data!.data}
            meta={data!.meta}
            onPageChange={setPage}
          />
        </div>
      )}
    </ComponentContainer>
  );
};

export default ProjectTeam;

```

Path: frontend/app/(dashboard)/projects/[projectId]/reports/page.tsx

```
import React from 'react'

const Reports = () => {
  return (
    <div>Reports</div>
  )
}

export default Reports
```

Path: frontend/app/(dashboard)/projects/[projectId]/session-deliverables/page.tsx

```
"use client";

import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import api from "lib/api";
import { useParams } from "next/navigation";
import React, { useState } from "react";
import { ISessionDeliverable } from "@shared/interface/SessionDeliverableInterface";
import ComponentContainer from "components/shared/ComponentContainer";
import HeadingBlue25px from "components/shared/HeadingBlue25pxComponent";
import { IPaginationMeta } from "@shared/interface/PaginationInterface";
import { Tabs, TabsList, TabsTrigger } from "components/ui/tabs";
import CustomPagination from "components/shared/Pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import { Checkbox } from "components/ui/checkbox";
import CustomButton from "components/shared/CustomButton";
import { Download } from "lucide-react";

const deliverableTabs = [
  { label: "Audio", type: "AUDIO" },
  { label: "Video", type: "VIDEO" },
  { label: "Transcripts", type: "TRANSCRIPT" },
  { label: "Backroom Chat", type: "BACKROOM_CHAT" },
  { label: "Session Chat", type: "SESSION_CHAT" },
  { label: "Whiteboards", type: "WHITEBOARD" },
  { label: "Poll Results", type: "POLL_RESULT" },
];

type CheckedState = boolean | "indeterminate";

const SessionDeliverables = () => {
  const { projectId } = useParams();
  const [page, setPage] = useState(1);
  const limit = 10;
  const [selectedType, setSelectedType] = useState(deliverableTabs[0].type);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data, isLoading, error } = useQuery<
    { data: ISessionDeliverable[]; meta: IPaginationMeta },
    Error
  >({
    queryKey: ["sessionDeliverables", projectId, page, selectedType],
    queryFn: () =>
      api
        .get<{ data: ISessionDeliverable[]; meta: IPaginationMeta }>(
          `/api/v1/sessionDeliverables/project/${projectId}`,
          { params: { page, limit, type: selectedType } }
        )
        .then((res) => res.data),
    placeholderData: keepPreviousData,
  });

  // 2️⃣ Mutation for single-download
  const downloadOneMutation = useMutation<string, unknown, string>({
    // Using onMutate so we can fire off the download immediately
    mutationFn: (id) => Promise.resolve(id),
    onMutate: (id) => {
      window.open(
        `https://bamplify.hgsingalong.com/api/v1/sessionDeliverables/${id}/download`,
        "_blank"
      );
    },
  });

  const downloadAllMutation = useMutation<string[], unknown, string[]>({
    mutationFn: (ids) =>
      api
        .post<{
          success: boolean;
          message: string;
          data: Array<{ key: string; url: string }>;
        }>("/api/v1/sessionDeliverables/download-bulk", { ids })
        .then((res) => res.data.data.map((d) => d.url)),
    onSuccess: (urls) => {
      urls.forEach((url) => window.open(url, "_blank"));
    },
    onError: (err) => {
      console.error("Bulk download failed", err);
    },
  });

  if (error) return <p className="text-red-500">Error: {error.message}</p>;

  const totalPages = data?.meta.totalPages ?? 0;

  // format bytes as KB/MB
  const formatSize = (bytes: number) =>
    bytes >= 1024 * 1024
      ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
      : bytes >= 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${bytes} B`;

  // checkbox handlers
  const allSelected = data ? selectedIds.length === data.data.length : false;

  const toggleSelectAll = (checked: CheckedState) => {
    if (checked) {
      setSelectedIds(data?.data.map((d) => d._id) || []);
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectOne = (id: string) => (checked: CheckedState) => {
    const isTrue = checked === true;
    setSelectedIds((prev) =>
      isTrue ? [...prev, id] : prev.filter((sid) => sid !== id)
    );
  };

  return (
    <ComponentContainer>
      <div className="flex justify-between items-center bg-none pb-5 ">
        <HeadingBlue25px>Session Deliverables</HeadingBlue25px>
      </div>
      {/* Tabs */}
      <div className="w-full overflow-x-auto">
        <Tabs
          value={selectedType}
          onValueChange={(value) => {
            setSelectedType(value);
            setPage(1);
          }}
          className="mb-4 w-full"
        >
          <TabsList className="w-full  p-1 bg-white rounded-none">
            {deliverableTabs.map((tab) => (
              <TabsTrigger
                key={tab.type}
                value={tab.type}
                className={`
        flex-1 text-center cursor-pointer
        border-b-3 border-transparent rounded-none bg-white
         text-gray-600 
         data-[state=active]:border-b-custom-dark-blue-1
         data-[state=active]:text-custom-dark-blue-1
       `}
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      {isLoading ? (
        <p className="text-custom-dark-blue-1 text-2xl text-center font-bold">
          Loading session deliverables...
        </p>
      ) : (
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                      className="cursor-pointer"
                    />
                    <CustomButton
                      icon={<Download />}
                      variant="outline"
                      onClick={() => downloadAllMutation.mutate(selectedIds)}
                      disabled={
                        selectedIds.length === 0 ||
                        downloadAllMutation.isPending
                      }
                      size="sm"
                      className="cursor-pointer hover:text-custom-dark-blue-1 hover:bg-white outline-0 border-0 shadow-lg bg-white"
                    >
                      {downloadAllMutation.isPending
                        ? "Preparing..."
                        : "Download All"}
                    </CustomButton>
                  </div>
                </TableHead>
                <TableHead>Deliverable</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y">
              {data?.data.length ? (
                data.data.map((del) => (
                  <TableRow key={del._id}>
                    <TableCell className="w-[48px]">
                      <Checkbox
                        checked={selectedIds.includes(del._id)}
                        onCheckedChange={toggleSelectOne(del._id)}
                        aria-label={`Select ${del.displayName}`}
                        className="cursor-pointer"
                      />
                    </TableCell>
                    <TableCell>{del.displayName}</TableCell>
                    <TableCell>{formatSize(del.size)}</TableCell>
                    <TableCell className="text-center">
                      <CustomButton
                        className="bg-custom-dark-blue-3 hover:bg-custom-dark-blue-2 rounded-lg"
                        onClick={() => downloadOneMutation.mutate(del._id)}
                        disabled={downloadOneMutation.isPending}
                      >
                        {downloadOneMutation.isPending
                          ? "Downloading..."
                          : "Download"}
                      </CustomButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-gray-500 py-8"
                  >
                    No deliverables found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="w-full flex justify-end  pb-5">
          <CustomPagination
            totalPages={totalPages}
            currentPage={page}
            onPageChange={(p) => {
              setPage(p);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      )}
    </ComponentContainer>
  );
};

export default SessionDeliverables;

```

Path: frontend/app/(dashboard)/projects/[projectId]/sessions/page.tsx

```
"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import api from "lib/api";
import { useParams, useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";
import { ISession } from "@shared/interface/SessionInterface";
import ComponentContainer from "components/shared/ComponentContainer";
import HeadingBlue25px from "components/shared/HeadingBlue25pxComponent";
import CustomButton from "components/shared/CustomButton";
import { Plus } from "lucide-react";
import { SessionsTable } from "components/projects/sessions/SessionsTable";
import { IPaginationMeta } from "@shared/interface/PaginationInterface";
import AddSessionModal from "components/projects/sessions/AddSessionModal";
import { toast } from "sonner";
import axios from "axios";
import EditSessionModal, {
  EditSessionValues,
} from "components/projects/sessions/EditSessionModal";
import ConfirmationModalComponent from "components/shared/ConfirmationModalComponent";
import { useProject } from "hooks/useProject";
import { formatUiTimeZone } from "utils/timezones";

interface EditSessionInput {
  id: string;
  values: EditSessionValues;
}

const Sessions = () => {
  const { projectId } = useParams();
  const queryClient = useQueryClient();
  const router = useRouter();
  const limit = 10;

  const [openAddSessionModal, setOpenAddSessionModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [page, setPage] = useState(1);
  const [sessionToEdit, setSessionToEdit] = useState<ISession | null>(null);
  const [toDeleteId, setToDeleteId] = useState<string | null>(null);

  const { data: project, isLoading: isProjectLoading } = useProject(
    projectId as string
  );

  const tzPretty = useMemo(() => {
    if (!project?.defaultTimeZone) return "";
    // Use the project's startDate if you want the offset for that exact date (DST-correct),
    // otherwise omit the 2nd arg to use "now".
    const atDate = project.startDate ?? undefined;
    return formatUiTimeZone(project.defaultTimeZone, atDate);
  }, [project?.defaultTimeZone, project?.startDate]);

  // Getting session data for session table
  const { data, isLoading, error } = useQuery<
    { data: ISession[]; meta: IPaginationMeta },
    Error
  >({
    queryKey: ["sessions", projectId, page],
    queryFn: () =>
      api
        .get<{ data: ISession[]; meta: IPaginationMeta }>(
          `/api/v1/sessions/project/${projectId}`,
          { params: { page, limit } }
        )
        .then((res) => res.data),
    placeholderData: keepPreviousData,
  });

  // Start live session then navigate
  const startMeeting = useMutation<
    { success?: boolean; message?: string },
    unknown,
    string
  >({
    mutationFn: async (sessionId: string) => {
      const res = await api.post<{ success?: boolean; message?: string }>(
        `/api/v1/liveSessions/${sessionId}/start`
      );
      return res.data; // e.g. { success: true, ... } OR { success: false, message: "Session already ongoing" }
    },
    onSuccess: (data, sessionId) => {
      const success = data?.success;
      const message = data?.message;

      if (success === false && message === "Session already ongoing") {
        toast.message("Session already ongoing — opening meeting");
      } else {
        toast.success("Session started");
      }

      // Refresh any live flags if you show them
      queryClient.invalidateQueries({ queryKey: ["sessions", projectId] });

      // Go to meeting either way
      router.push(`/meeting/${sessionId}`);
    },
    onError: (err, sessionId) => {
      // If server returned non-2xx with the same message, still proceed
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message;
        if (msg === "Session already ongoing") {
          toast.message("Session already ongoing — opening meeting");
          router.push(`/meeting/${sessionId}`);
          return;
        }
      }

      const fallback = axios.isAxiosError(err)
        ? err.response?.data?.message ?? err.message
        : "Could not start the session";
      toast.error(fallback);
    },
  });

  // Mutation to delete session
  const deleteSession = useMutation({
    mutationFn: (sessionId: string) =>
      api.delete(`/api/v1/sessions/${sessionId}`),
    onSuccess: () => {
      toast.success("Session deleted");
      queryClient.invalidateQueries({ queryKey: ["sessions", projectId] });
    },
    onError: (err) => {
      const msg = axios.isAxiosError(err)
        ? err.response?.data.message ?? err.message
        : "Could not delete session";
      toast.error(msg);
    },
  });

  // 🔁 Mutation to duplicate a session
  const duplicateSession = useMutation<ISession, Error, string>({
    mutationFn: (sessionId) =>
      api
        .post<{ data: ISession }>(`/api/v1/sessions/${sessionId}/duplicate`)
        .then((res) => res.data.data),
    onSuccess: () => {
      toast.success("Session duplicated");
      queryClient.invalidateQueries({ queryKey: ["sessions", projectId] });
    },
    onError: (err) => {
      toast.error(err.message || "Could not duplicate session");
    },
  });

  // ❗️ Mutation to save edits
  const editSession = useMutation<ISession, Error, EditSessionInput>({
    // 1. mutationFn instead of positional args
    mutationFn: ({ id, values }) =>
      api
        .patch<{ data: ISession }>(`/api/v1/sessions/${id}`, values)
        .then((res) => res.data.data),

    // 2. onSuccess now receives (data, variables, context)
    onSuccess() {
      toast.success("Session updated");
      queryClient.invalidateQueries({ queryKey: ["sessions", projectId] });
      setOpenEditModal(false);
    },

    // 4. onError only takes the Error it needs
    onError(error) {
      toast.error(error.message || "Could not update session");
    },
  });

  const isEditSessionSaving = editSession.isPending;

  if (error) return <p className="text-red-500">Error: {error.message}</p>;

  return (
    <ComponentContainer>
      <div className="flex justify-between items-center bg-none pb-5 ">
        <HeadingBlue25px>
          Sessions (All Times{" "}
          {isProjectLoading
            ? "Loading..."
            : tzPretty || project?.defaultTimeZone}
          )
        </HeadingBlue25px>
        <CustomButton
          icon={<Plus />}
          text="Add Sessions"
          variant="default"
          className=" bg-custom-orange-2 text-white hover:bg-custom-orange-1 font-semibold px-2"
          onClick={() => {
            setOpenAddSessionModal(true);
          }}
        />
      </div>

      {isLoading ? (
        <p className="text-custom-dark-blue-1 text-2xl text-center font-bold">
          Loading Sessions...
        </p>
      ) : (
        <div className="pt-5 bg-custom-white">
          <SessionsTable
            sessions={data!.data}
            meta={data!.meta}
            onPageChange={setPage}
            // onRowClick={(id) => router.push(`/session-details/${id}`)}
            onModerate={(id) => startMeeting.mutate(id)}
            onObserve={(id) => router.push(`/session-details/${id}/observe`)}
            onAction={(action, session) => {
              switch (action) {
                case "edit":
                  setSessionToEdit(session);
                  setOpenEditModal(true);
                  break;
                case "delete":
                  setToDeleteId(session._id);
                  setConfirmOpen(true);
                  break;
                case "duplicate":
                  duplicateSession.mutate(session._id);
                  break;
              }
            }}
          />
        </div>
      )}
      <AddSessionModal
        open={openAddSessionModal}
        onClose={() => setOpenAddSessionModal(false)}
      />

      <EditSessionModal
        open={openEditModal}
        session={sessionToEdit}
        onClose={() => setOpenEditModal(false)}
        onSave={(values) => {
          if (sessionToEdit) {
            editSession.mutate({ id: sessionToEdit._id, values });
          }
        }}
        isSaving={isEditSessionSaving}
      />

      <ConfirmationModalComponent
        open={confirmOpen}
        onCancel={() => {
          setConfirmOpen(false);
          setToDeleteId(null);
        }}
        onYes={() => {
          if (toDeleteId) {
            deleteSession.mutate(toDeleteId);
          }
          setConfirmOpen(false);
          setToDeleteId(null);
        }}
        heading="Delete Session?"
        text="Are you sure you want to delete this session? This action cannot be undone."
        cancelText="No"
      />
    </ComponentContainer>
  );
};

export default Sessions;


```

Path: frontend/app/(dashboard)/view-project/[id]/page.tsx

```
"use client";

import HeadingBlue25px from "components/shared/HeadingBlue25pxComponent";
import ComponentContainer from "components/shared/ComponentContainer";
import CreditSummary from "components/viewProject/CreditSummary";
import ProjectSummary from "components/viewProject/ProjectSummary";
import SessionAccess from "components/viewProject/SessionAccess";
import TagModal from "components/viewProject/TagModel";
import { useProject } from "hooks/useProject";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "components/ui/button";
import { projectSections } from "constant/projectSections";
import React, { useState } from "react";

const ViewProject = () => {
  const { id: projectId } = useParams() as { id: string };
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);

  const { data: project, isLoading, isError, error } = useProject(projectId);

  if (isLoading) return <p>Loading project…</p>;
  if (isError)
    return <p className="text-red-500">Error: {(error as Error).message}</p>;

  return (
    <ComponentContainer>
      <div className=" py-5 mx-5">
        <HeadingBlue25px>Project Details: {project!.name}</HeadingBlue25px>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProjectSummary
            project={project!}
            onTagEditClick={() => setIsTagModalOpen(true)}
          />

          <CreditSummary project={project!} />
        </div>
        <div className="w-full">
          <SessionAccess project={project!} />
        </div>
        <div className="mt-6">
          <div className="flex flex-wrap gap-2">
            {projectSections.map(({ slug, label }) => (
              <Link key={slug} href={`/projects/${project!._id}/${slug}`}>
                <Button variant="outline" size="sm">
                  {label}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <TagModal
        projectId={project!._id!}
        open={isTagModalOpen}
        onOpenChange={setIsTagModalOpen}
        existingTags={project!.tags}
      />
    </ComponentContainer>
  );
};

export default ViewProject;

```

Path: frontend/app/globals.css

```
/* src/styles/globals.css */

@import 'tailwindcss';
@import 'tw-animate-css';

/* 1) MAP YOUR DESIGN TOKENS INTO TAILWIND UTILITIES */
@theme inline {
  /* — Semantic “core” tokens (map to your raw vars below) — */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans:        var(--font-geist-sans);
  --font-mono:        var(--font-geist-mono);

  --color-card:                var(--card);
  --color-card-foreground:     var(--card-foreground);
  --color-popover:             var(--popover);
  --color-popover-foreground:  var(--popover-foreground);
  --color-primary:             var(--primary);
  --color-primary-foreground:  var(--primary-foreground);
  --color-secondary:           var(--secondary);
  --color-secondary-foreground:var(--secondary-foreground);
  --color-muted:               var(--muted);
  --color-muted-foreground:    var(--muted-foreground);
  --color-accent:              var(--accent);
  --color-accent-foreground:   var(--accent-foreground);
  --color-destructive:         var(--destructive);
  --color-border:              var(--border);
  --color-input:               var(--input);
  --color-ring:                var(--ring);

  /* Chart colors */
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);

  /* Sidebar palette */
  --color-sidebar:                   var(--sidebar);
  --color-sidebar-foreground:        var(--sidebar-foreground);
  --color-sidebar-primary:           var(--sidebar-primary);
  --color-sidebar-primary-foreground:var(--sidebar-primary-foreground);
  --color-sidebar-accent:            var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border:            var(--sidebar-border);
  --color-sidebar-ring:              var(--sidebar-ring);

  /* Border radius scale */
  --radius-sm:  calc(var(--radius) - 4px);
  --radius-md:  calc(var(--radius) - 2px);
  --radius-lg:  var(--radius);
  --radius-xl:  calc(var(--radius) + 4px);

  /* — YOUR “custom-*” brand colors from tailwind.config.js — */
  --color-custom-meet-bg:  #fde2d0;
  --color-custom-white:    #FFFFFF;
  --color-container-bg: #FBFBFB; 
  --color-custom-black:    #000000;
  --color-custom-red:      #FF3838;
  --color-custom-green:    #07C800;
  --color-custom-teal:     #1E656D;
  --color-custom-yellow:   #FCD860;
  --color-custom-pink:     #FF7E296E;
  --color-custom-dark-blue-1: #00293C;
  --color-custom-dark-blue-2: #031F3A;
  --color-custom-dark-blue-3: #34646C;
  --color-custom-light-blue-1: #2976a5;
  --color-custom-light-blue-2: #369CFF;
  --color-custom-light-blue-3: #559FFB;
  --color-custom-orange-1: #FF6600;
  --color-custom-orange-2: #FC6E15;
  --color-custom-orange-3: #E39906;
  --color-custom-gray-1:   #E8E8E8;
  --color-custom-gray-2:   #F7F8F9;
  --color-custom-gray-3:   #707070;
  --color-custom-gray-4:   #00000029;
  --color-custom-gray-5:   #A8A8A8;
  --color-custom-gray-6:   #AFAFAF;
  --color-custom-gray-7:   #EAEAEA;
  --color-custom-gray-8:   #EBEBEB;
  --color-custom-gray-9:   #F3F4F6;
  --color-custom-gray-10: #D5D6D8;
  --color-custom-blue-gray-1: #6E7E87;

  /* — Custom font token — */
  --font-montserrat: 'Montserrat', sans-serif;
}

/* 2) DARK VARIANT WHEN `.dark` IS ON <html> OR <body> */
@custom-variant dark (&:is(.dark *));

@custom-variant dark {
  @theme inline {
    --color-background: var(--background);
    --color-foreground: var(--foreground);
    /* add any extra dark-mode token overrides here */
  }
}

/* 3) YOUR RAW CSS VARIABLE DEFINITIONS */
:root {
  --radius: 0.625rem;

  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);

  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);

  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);

  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);

  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);

  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);

  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);

  --destructive: oklch(0.577 0.245 27.325);
  --border:      oklch(0.922 0 0);
  --input:       oklch(0.922 0 0);
  --ring:        oklch(0.708 0 0);

  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6   0.118 184.704);
  --chart-3: oklch(0.398 0.07  227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);

  --sidebar:                   oklch(0.985 0 0);
  --sidebar-foreground:        oklch(0.145 0 0);
  --sidebar-primary:           oklch(0.205 0 0);
  --sidebar-primary-foreground:oklch(0.985 0 0);
  --sidebar-accent:            oklch(0.97  0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border:            oklch(0.922 0 0);
  --sidebar-ring:              oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);

  --card:                oklch(0.205 0 0);
  --card-foreground:     oklch(0.985 0 0);

  --popover:             oklch(0.205 0 0);
  --popover-foreground:  oklch(0.985 0 0);

  --primary:             oklch(0.922 0 0);
  --primary-foreground:  oklch(0.205 0 0);

  --secondary:           oklch(0.269 0 0);
  --secondary-foreground:oklch(0.985 0 0);

  --muted:               oklch(0.269 0 0);
  --muted-foreground:    oklch(0.708 0 0);

  --accent:              oklch(0.269 0 0);
  --accent-foreground:   oklch(0.985 0 0);

  --destructive:         oklch(0.704 0.191 22.216);
  --border:              oklch(1 0 0 / 10%);
  --input:               oklch(1 0 0 / 15%);
  --ring:                oklch(0.556 0 0);

  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17  162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);

  --sidebar:                   oklch(0.205 0 0);
  --sidebar-foreground:        oklch(0.985 0 0);
  --sidebar-primary:           oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground:oklch(0.985 0 0);
  --sidebar-accent:            oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border:            oklch(1 0 0 / 10%);
  --sidebar-ring:              oklch(0.556 0 0);
}

/* 4) BASE LAYER: APPLY YOUR SEMANTIC TOKENS */
@layer base {
  body {
    background-color: var(--color-background);
    color:            var(--color-foreground);
    font-family:      var(--font-sans, var(--font-montserrat));
  }
}

/* 5) ANY EXTRA HELPER CLASSES YOU HAD */
.dashboard_sidebar_bg {
  background: linear-gradient(180deg, #d3d6d8, #e5dcd6) no-repeat padding-box;
}

.meeting_bg {
  background: linear-gradient(90deg, #d3d6d8, #e5dcd6) no-repeat padding-box;
}

.my_profile_main_section_shadow {
  box-shadow: 0px 0px 26px #00000029;
}

/* globals.css */
.shadow-all-sides {
  /* subtle box-shadow on all sides */
  box-shadow: 4 4px 8px rgba(0, 0, 0, 0.05),
              4 -4px 8px rgba(0, 0, 0, 0.02);
}

```

Path: frontend/app/layout.tsx

```
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import Providers from 'provider/Providers'
import TanstackProvider from 'provider/TanstackProvider'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Create Next App',
  description: 'Generated by create next app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TanstackProvider>
          <Providers>{children}</Providers>
        </TanstackProvider>
      </body>
    </html>
  )
}

```
Path: frontend/app/meeting/[id]/meeting.css

```
/* Scope to your meeting area so it doesn't leak app-wide */
.lk-scope .lk-nameplate {
  /* semi-transparent dark strip behind the label */
  background: rgba(0, 0, 0, 0.45) !important;
}

/* Make label text + icons white */
.lk-scope .lk-participant-name,
.lk-scope .lk-participant-metadata,
.lk-scope .lk-nameplate svg {
  color: #fff !important;
  fill: #fff !important;
}

/* Keep screen-share labels hidden (from earlier) */
.lk-scope [data-lk-source="screen_share"] .lk-participant-name,
.lk-scope [data-lk-source="screen_share"] .lk-participant-metadata {
  display: none !important;
}

```



Path: frontend/app/meeting/[id]/page.tsx

```
"use client";

import ModeratorWaitingPanel from "components/meeting/waitingRoom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks,
  useRoomContext,
  ControlBar,
  useParticipants,
  ScreenShareIcon,
} from "@livekit/components-react";
import { Track, RoomEvent } from "livekit-client";
import api from "lib/api";
import { ApiResponse } from "@shared/interface/ApiResponseInterface";
import "@livekit/components-styles";
import "./meeting.css";
import { useGlobalContext } from "context/GlobalContext";

import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "constant/socket";
import { Button } from "../../../components/ui/button";

declare global {
  interface Window {
    __meetingSocket?: Socket; // already created elsewhere in your app
  }
}

type UiRole = "admin" | "moderator" | "participant" | "observer";
type ServerRole = "Admin" | "Moderator" | "Participant" | "Observer";
/** Enables cam (muted mic) once connected for admin/moderator */
function AutoPublishOnConnect({ role }: { role: UiRole }) {
  const room = useRoomContext();

  useEffect(() => {
    if (!room) return;

    const enableNow = async () => {
      if (role === "admin" || role === "moderator") {
        await room.localParticipant.setCameraEnabled(true);
        await room.localParticipant.setMicrophoneEnabled(false);
      }
    };

    if (room.state === "connected") {
      void enableNow();
      return; // ensure the effect returns void here
    }

    const onConnected = () => {
      room.off(RoomEvent.Connected, onConnected);
      void enableNow();
    };
    room.on(RoomEvent.Connected, onConnected);

    // ✅ cleanup returns void
    return () => {
      room.off(RoomEvent.Connected, onConnected);
    };
  }, [room, role]);

  return null;
}

/** Video grid that safely uses useTracks inside LiveKitRoom context */
function VideoGrid() {
  const trackRefs = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: true },
  ]);

  return (
    <div className="flex-1 min-h-0">
      <GridLayout tracks={trackRefs}>
        {/* IMPORTANT: exactly ONE child element; no map() here */}
        <ParticipantTile />
      </GridLayout>
    </div>
  );
}

async function fetchLiveKitToken(sessionId: string, role: ServerRole) {
  const res = await api.post<ApiResponse<{ token: string }>>(
    "/api/v1/livekit/token",
    {
      roomName: sessionId,
      role, // NOTE: capitalized per backend type
    }
  );

  // Your codebase typically nests data under data.data
  return res.data.data.token;
}

/** --- helpers --- */
/** --- helpers --- */
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

function emailFromIdentity(identity?: string): string | null {
  if (!identity) return null;
  const hit = identity.match(EMAIL_RE);
  return hit ? hit[0].toLowerCase() : null;
}

/** Try both identity and metadata for an email */
function emailFromParticipant(p: {
  identity?: string;
  metadata?: string | null;
}) {
  const fromId = emailFromIdentity(p.identity);
  if (fromId) return fromId;
  if (!p?.metadata) return null;
  try {
    const meta = JSON.parse(p.metadata);
    const e = (meta?.email || meta?.userEmail || meta?.e || "").toString();
    return EMAIL_RE.test(e) ? e.toLowerCase() : null;
  } catch {
    return null;
  }
}

/** Participants (Live) list + per-row "Mute mic" for Admin/Moderator */
function ParticipantsPanel({
  role,
  socket,
  myEmail,
}: {
  role: UiRole;
  socket: Socket | null;
  myEmail?: string | null;
}) {
  const all = useParticipants(); // from LiveKit context
  const remotes = all.filter((p) => !p.isLocal); // don't show a mute button for self

  if (!(role === "admin" || role === "moderator")) return null;

  const bulk = (allow: boolean) => {
    if (!socket) return;
    socket.emit(
      "meeting:screenshare:allow-all",
      { allow },
      (ack: { ok: boolean; updated: number; error?: string }) => {
        if (!ack?.ok) console.error(ack?.error || "Bulk screenshare failed");
      }
    );
  };

  return (
    <div className="mt-4">
      <div className="font-semibold mb-2">Participants (Live)</div>

      {/* Bulk controls */}
      <div className="flex items-center gap-2 mb-3">
        <Button
          size="sm"
          onClick={() => bulk(true)}
          disabled={!socket}
          className="bg-neutral-200 hover:bg-neutral-300 text-black"
        >
          Allow screenshare for all
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => bulk(false)}
          disabled={!socket}
        >
          Revoke all
        </Button>
      </div>

      <div className="space-y-2">
        {remotes.length === 0 && (
          <div className="text-sm text-gray-500">
            No remote participants yet.
          </div>
        )}

        {remotes.map((p) => {
          const identity: string = p.identity || "";
          const name: string = p.name || "";
          const email = emailFromParticipant(p);
          const label = name || email || identity;

          const isMe = !!myEmail && email === myEmail.toLowerCase();
          const canAct = !isMe && !!socket; 
          const canMute = !isMe && !!socket; 
          const targetPayload = email
            ? { targetEmail: email }
            : { targetIdentity: identity };

          return (
            <div
              key={identity}
              className="flex items-center justify-between gap-2 border rounded px-2 py-1"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{label}</div>
                {email && (
                  <div className="text-[11px] text-gray-500 truncate">
                    {email}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Mute mic */}
                <button
                  className={`px-2 py-1 rounded text-sm ${
                    canMute
                      ? "bg-neutral-200 hover:bg-neutral-300"
                      : "bg-neutral-100 text-gray-400 cursor-not-allowed"
                  }`}
                  disabled={!canMute}
                  onClick={() => {
                    if (!socket) return;
                    const payload = email
                      ? { targetEmail: email }
                      : { targetIdentity: identity };
                    socket.emit(
                      "meeting:mute-mic",
                      payload,
                      (ack: { ok: boolean; error?: string }) => {
                        if (!ack?.ok)
                          console.error("Mute mic failed:", ack?.error);
                      }
                    );
                  }}
                >
                  Mute mic
                </button>
                {/* Turn off camera */}
                <button
                  className={`px-2 py-1 rounded text-sm ${
                    canMute
                      ? "bg-neutral-200 hover:bg-neutral-300"
                      : "bg-neutral-100 text-gray-400 cursor-not-allowed"
                  }`}
                  disabled={!canMute}
                  onClick={() => {
                    if (!socket) return;
                    const payload = email
                      ? { targetEmail: email }
                      : { targetIdentity: identity };
                    socket.emit(
                      "meeting:camera-off",
                      payload,
                      (ack: { ok: boolean; error?: string }) => {
                        if (!ack?.ok)
                          console.error("Camera off failed:", ack?.error);
                      }
                    );
                  }}
                >
                  Turn off cam
                </button>
                {/* Allow screenshare */}
                <Button
                  size="sm"
                  className="bg-neutral-200 hover:bg-neutral-300 text-black"
                  disabled={!canAct}
                  onClick={() => {
                    if (!socket) return;
                    socket.emit(
                      "meeting:screenshare:allow",
                      { ...targetPayload, allow: true },
                      (ack: { ok: boolean; error?: string }) => {
                        if (!ack?.ok)
                          console.error(
                            "Allow screenshare failed:",
                            ack?.error
                          );
                      }
                    );
                  }}
                >
                  Allow share
                </Button>

                {/* Revoke screenshare */}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!canAct}
                  onClick={() => {
                    if (!socket) return;
                    socket.emit(
                      "meeting:screenshare:allow",
                      { ...targetPayload, allow: false },
                      (ack: { ok: boolean; error?: string }) => {
                        if (!ack?.ok)
                          console.error(
                            "Revoke screenshare failed:",
                            ack?.error
                          );
                      }
                    );
                  }}
                >
                  Revoke
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Bridge: inside LiveKitRoom (where useRoomContext works), disable mic on server push. */
function ForceMuteSelfBridge() {
  const room = useRoomContext();
  useEffect(() => {
    const handler = async () => {
      try {
        if (room?.localParticipant) {
          await room.localParticipant.setMicrophoneEnabled(false);
        }
      } catch (e) {
        console.error("Failed to self force-mute:", e);
      }
    };
    window.addEventListener("amplify:force-mute-self", handler);
    return () => window.removeEventListener("amplify:force-mute-self", handler);
  }, [room]);
  return null;
}

function ForceCameraOffSelfBridge() {
  const room = useRoomContext();
  useEffect(() => {
    const handler = async () => {
      try {
        if (room?.localParticipant) {
          await room.localParticipant.setCameraEnabled(false);
        }
      } catch (e) {
        console.error("Failed to self force-camera-off:", e);
      }
    };
    window.addEventListener("amplify:force-camera-off", handler);
    return () =>
      window.removeEventListener("amplify:force-camera-off", handler);
  }, [room]);
  return null;
}

function RegisterIdentityBridge({
  socket,
  email,
}: {
  socket: Socket | null;
  email?: string;
}) {
  const room = useRoomContext();
  useEffect(() => {
    if (!room || !socket) return;

    const send = () => {
      const id = room.localParticipant?.identity;
      if (id) socket.emit("meeting:register-identity", { identity: id, email });
    };

    if (room.state === "connected") send();
    room.on(RoomEvent.Connected, send);
    return () => {
      room.off(RoomEvent.Connected, send);
    };
  }, [room, socket, email]);
  return null;
}

function ScreenshareControl({
  role,
}: {
  role: "admin" | "moderator" | "participant" | "observer";
}) {
  const room = useRoomContext();
  const [allowed, setAllowed] = useState<boolean>(false);
  const [sharing] = useState(false);

  // compute allowance: moderators/admins always; participants only if canPublishSources includes SCREEN_SHARE(_AUDIO)
  useEffect(() => {
    const lp = room.localParticipant;

    const compute = () => {
      if (role === "admin" || role === "moderator") {
        setAllowed(true);
        return;
      }

      // ✅ make sure this is typed as client-side Track.Source[]
      const sources = (lp.permissions?.canPublishSources ??
        []) as unknown as Track.Source[];

      const can =
        sources.length === 0 || // empty means "all sources allowed"
        sources.includes(Track.Source.ScreenShare) ||
        sources.includes(Track.Source.ScreenShareAudio);

      setAllowed(can);
    };

    compute();
    const onPerms = () => compute();
    room.on(RoomEvent.ParticipantPermissionsChanged, onPerms);
    return () => {
      room.off(RoomEvent.ParticipantPermissionsChanged, onPerms);
    };
  }, [room, role]);

  // listen to server nudge to force-stop local capture
  useEffect(() => {
    const sock = window.__meetingSocket;
    if (!sock) return; // ok: returns void, not a cleanup

    const stop = async () => {
      try {
        await room.localParticipant.setScreenShareEnabled(false);
      } catch {
        // no-op
      }
    };

    // add listener
    sock.on("meeting:force-stop-screenshare", stop);

    // ✅ proper cleanup: remove the listener (returns void)
    return () => {
      sock.off("meeting:force-stop-screenshare", stop);
    };
  }, [room]);

  if (!allowed) return null;

  const toggle = async () => {
    await room.localParticipant.setScreenShareEnabled(!sharing);
  };

  return (
    <Button
      size="sm"
      onClick={toggle}
      title={sharing ? "Stop share" : "Share screen"}
    >
      <ScreenShareIcon />
      <span className="ml-1">{sharing ? "Stop" : "Share"}</span>
    </Button>
  );
}
export default function Meeting() {
  const router = useRouter();

  const { id: sessionId } = useParams();

  // 1) derive role
  const { user } = useGlobalContext(); // dashboard user, if logged in

  const role: UiRole = useMemo(() => {
    // dashboard users
    if (user?.role === "Admin") return "admin";
    if (user?.role === "Moderator") return "moderator";
    if (user?.role === "Observer") return "observer";

    // participant from join flow
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("liveSessionUser");
      if (raw) {
        const u = JSON.parse(raw);
        if (u?.role === "Participant") return "participant";
      }
    }
    // default to participant (or you can redirect)
    return "participant";
  }, [user]);

  // current user's name/email (dashboard or join flow)
  const my = useMemo(() => {
    if (user?.email) {
      return {
        name: user?.firstName || user?.lastName || "",
        email: user.email as string,
        role: (user.role as ServerRole) || "Observer",
      };
    }
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("liveSessionUser");
        const u = raw ? JSON.parse(raw) : {};
        return {
          name: u?.name || "",
          email: (u?.email as string) || "",
          role: (u?.role as ServerRole) || "Participant",
        };
      } catch {
        // ignore
      }
    }
    return { name: "", email: "", role: "Participant" as ServerRole };
  }, [user]);

  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // 🔌 single meeting socket for this page
  const socketRef = useRef<Socket | null>(null);

  // 1) fetch your existing start/join token (reuse your current API)
  useEffect(() => {
    if (!sessionId) return;

    const url = process.env.NEXT_PUBLIC_LIVEKIT_URL!;
    if (!url) {
      console.error("Missing NEXT_PUBLIC_LIVEKIT_URL");
      return;
    }

    // 2) participant branch: use token from waiting-room exchange
    if (role === "participant") {
      const saved =
        typeof window !== "undefined"
          ? sessionStorage.getItem(`lk:${sessionId as string}`)
          : null;

      if (!saved) {
        // they came straight to the meeting (new tab/incognito) → send back
        router.replace(`/waiting-room/participant/${sessionId}`);
        return;
      }
      setToken(saved);
      setWsUrl(url);
      return; // ⛔ do NOT call /token
    }

    // 3) dashboard roles: call cookie-auth /token
    const serverRole: ServerRole =
      role === "admin"
        ? "Admin"
        : role === "moderator"
        ? "Moderator"
        : "Observer";

    (async () => {
      const lkToken = await fetchLiveKitToken(sessionId as string, serverRole); // your axios helper to /token
      if (!lkToken) {
        // if 401, send to login/dashboard as appropriate
        console.error("Failed to get LiveKit token");
        return;
      }
      setToken(lkToken);
      setWsUrl(url);
    })();
  }, [sessionId, role, router]);

  // Connect socket (once we know session + my email)
  useEffect(() => {
    if (!sessionId || !my?.email) return;

    const s = io(SOCKET_URL, {
      path: "/socket.io",
      withCredentials: true,
      query: {
        sessionId: String(sessionId),
        role:
          (user?.role as ServerRole) ||
          (my?.role as ServerRole) ||
          (role === "participant" ? "Participant" : "Observer"),
        name: my?.name || "",
        email: my?.email || "",
      },
    });
    socketRef.current = s;
    window.__meetingSocket = s;
    // When server enforces mute, dispatch event that the bridge listens for
    s.on("meeting:force-mute", (payload: { email?: string }) => {
      // If payload has email and it's not me, ignore; otherwise act.
      if (
        payload?.email &&
        payload.email.toLowerCase() !== (my.email || "").toLowerCase()
      )
        return;
      window.dispatchEvent(new CustomEvent("amplify:force-mute-self"));
    });

    // When server enforces camera off, dispatch event that the bridge listens for
    s.on("meeting:force-camera-off", (payload: { email?: string }) => {
      if (
        payload?.email &&
        payload.email.toLowerCase() !== (my.email || "").toLowerCase()
      )
        return;
      window.dispatchEvent(new CustomEvent("amplify:force-camera-off"));
    });

    return () => {
      s.off("meeting:force-mute");
      s.off("meeting:force-camera-off");
      s.disconnect();
    };
  }, [sessionId, my?.email, my?.name, my?.role, role, user?.role]);

  if (!token || !wsUrl) {
    return (
      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-80px)] p-4">
        <div className="col-span-12 m-auto text-gray-500">Connecting…</div>
      </div>
    );
  }

  // show loader until we have token & wsUrl
  if (!token || !wsUrl) {
    return (
      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-80px)] p-4">
        <div className="col-span-12 m-auto text-gray-500">Connecting…</div>
      </div>
    );
  }

  return (
    <LiveKitRoom token={token} serverUrl={wsUrl}>
      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-80px)] p-4">
        {/* LEFT: moderator/participant sidebar (now inside room context) */}
        <aside className="col-span-3 border rounded p-3 overflow-y-auto">
          <h3 className="font-semibold mb-2">Controls & Waiting Room</h3>
          <ModeratorWaitingPanel />
          <ParticipantsPanel
            role={role}
            socket={socketRef.current}
            myEmail={my?.email || null}
          />
        </aside>

        {/* MIDDLE: LiveKit room visuals */}
        <main className="col-span-6 border rounded p-3 flex flex-col min-h-0">
          <div className="flex flex-col h-full lk-scope">
            <AutoPublishOnConnect role={role} />
            <RegisterIdentityBridge
              socket={socketRef.current}
              email={my?.email || ""}
            />
            <ForceMuteSelfBridge />
            <ForceCameraOffSelfBridge />
            <RoomAudioRenderer />
            <VideoGrid />
            <div className="pt-2 flex items-center justify-between gap-2">
              <ControlBar variation="minimal" />
              <ScreenshareControl role={role} />
            </div>
          </div>
        </main>

        {/* RIGHT: observer chat/media hub — hide for participants */}
        {role !== "participant" ? (
          <aside className="col-span-3 border rounded p-3 overflow-y-auto">
            <h3 className="font-semibold mb-2">Observers</h3>
            {/* observer group chat, names, counts, media hub */}
          </aside>
        ) : (
          <div className="col-span-3" />
        )}
      </div>
    </LiveKitRoom>
  );
}

```

Path: frontend/app/page.tsx

```
import Login from 'components/login/login'
import React from 'react'

const page = () => {
  return (
    <Login/>
  )
}

export default page
```

Path: frontend/app/privacy-policy/page.tsx

```
"use client";

import React from "react";
import { Card, CardContent } from "components/ui/card";
import Logo from "components/shared/LogoComponent";
import HeadingBlue25px from "components/shared/HeadingBlue25pxComponent";
import FooterComponent from "components/shared/FooterComponent";

const PrivacyPolicyPage: React.FC = () => {
  return (
    <>
      <div className="dashboard_sidebar_bg lg:px-40 pb-20">
        <Card className="pb-20 pt-10 lg:px-28 px-5 shadow-[0px_3px_16px_#00000029]">
          <CardContent className="p-0">
            <div className="flex justify-center lg:justify-start">
              <Logo />
            </div>
            <h1 className="text-custom-dark-blue-2 text-2xl lg:text-4xl font-bold uppercase pb-2 pt-10 text-center lg:text-left">
              AMPLIFY RESEARCH PRIVACY POLICY
            </h1>

            <p className="pb-10 text-center lg:text-left text-muted-foreground">
              Last updated: December 12, 2022
            </p>

            <p className="py-4 text-custom-dark-blue-2 text-center lg:text-left">
              This Privacy Statement describes the personal data we collect
              and/or process (which may include collecting, organizing,
              structuring, storing, using, or disclosing) to provide products
              and services offered directly by Zoom Video Communications, Inc.
              (&quot;Zoom&quot;), including Zoom&apos;s websites, its meetings,
              webinars, and messaging platform, related collaborative features,
              and Zoom App Marketplace (&quot;Zoom products and services&quot;
              or &quot;products and services&quot;). Zoom products and services
              covered in this Privacy Statement do not include products or
              services developed by Zoom that are covered under a separate
              privacy policy (including those listed here).
            </p>

            <div className="py-5 text-center lg:text-left">
              <HeadingBlue25px>
                WHAT PERSONAL DATA DO WE RECEIVE?
              </HeadingBlue25px>
            </div>
            <p className="py-4 text-custom-dark-blue-2">
              Personal data is any information from or about an identified or
              identifiable person, including information that Zoom can associate
              with an individual person. We may collect, or process on behalf of
              our customers, the following categories of personal data when you
              use or interact with Zoom products and services:
            </p>
            <ul className="pl-5 lg:pl-16 space-y-5 list-disc list-inside pb-16 text-custom-dark-blue-2">
              <li>
                <span className="font-medium">Account Information:</span>{" "}
                Information associated with an account that licenses Zoom
                products and services, which may include administrator name,
                contact information, account ID, billing and transaction
                information, and account plan information.
              </li>

              <li>
                <span className="font-medium">
                  Profile and Participant Information:
                </span>{" "}
                Information associated with the Zoom profile of a user who uses
                Zoom products and services under a licensed account or that is
                provided by an unlicensed participant joining a meeting, which
                may include name, display name, picture, email address, phone
                number, job information, stated locale, user ID, or other
                information provided by the user and/or their account owner.{" "}
              </li>
              <li>
                <span className="font-medium">Contact Information:</span>{" "}
                Contact information added by accounts and/or their users to
                create contact lists on Zoom products and services, which may
                include contact information a user integrates from a third-party
                app, or provided by users to process referral invitations.{" "}
              </li>
              <li>
                <span className="font-medium">Settings: </span>Information
                associated with the preferences and settings on a Zoom account
                or user profile, which may include audio and video settings,
                recording file location, screen sharing settings, and other
                settings and configuration information.
              </li>
              <li>
                <span className="font-medium">Registration Information: </span>{" "}
                Information provided when registering for a Zoom meeting,
                webinar, Zoom Room, or recording, which may include name and
                contact information, responses to registration questions, and
                other registration information requested by the host.{" "}
              </li>
              <li>
                <span className="font-medium"> Device Information:</span>{" "}
                Information about the computers, phones, and other devices used
                when interacting with Zoom products and services, which may
                include information about the speakers, microphone, camera, OS
                version, hard disk ID, PC name, MAC address, IP address (which
                may be used to infer general location at a city or country
                level), device attributes (like operating system version and
                battery level), WiFi information, and other device information
                (like Bluetooth signals).
              </li>
              <li>
                <span className="font-medium">
                  Content and Context from Meetings, Webinars, Messaging, and
                  Other Collaborative Features:
                </span>{" "}
                Content generated in meetings, webinars, or messages that are
                hosted on Zoom products and services, which may include audio,
                video, in-meeting messages, in-meeting and out-of-meeting
                whiteboards, chat messaging content, transcriptions, transcript
                edits and recommendations, written feedback, responses to polls
                and Q&A, and files, as well as related context, such as
                invitation details, meeting or chat name, or meeting agenda.
                Content may contain your voice and image, depending on the
                account owner&apos;s settings, what you choose to share, your
                settings, and what you do on Zoom products and services.
              </li>
              <li>
                <span className="font-medium">
                  Usage Information Regarding Meetings, Webinars, Messaging,
                  Collaborative Features and the Website:
                </span>{" "}
                Information about how people and their devices interact with
                Zoom products and services, such as: when participants join and
                leave a meeting; whether participants sent messages and who they
                message with; performance data; mouse movements, clicks,
                keystrokes or actions (such as mute/unmute or video on/off),
                edits to transcript text, where authorized by the account owner
                and other inputs that help Zoom to understand feature usage,
                improve product design, and suggest features; which third-party
                apps are added to a meeting or other product or service and what
                information and actions the app is authorized to access and
                perform; use of third-party apps and the Zoom App Marketplace;
                features used (such as screen sharing, emojis, or filters); and
                other usage information and metrics. This also includes
                information about when and how people visit and interact with
                Zoom&apos;s websites, including what pages are accessed,
                interaction with website features, and whether or not the person
                signed up for a Zoom product or service.
              </li>
              <li>
                <span className="font-medium">
                  Limited Information from Zoom Email and Calendar Services:
                </span>{" "}
                &quot;Zoom Email&quot; refers to Zoom&apos;s native email
                service and emails sent from Zoom&apos;s native email service.
                Zoom Email is designed to be end-to-end encrypted by Zoom by
                default for emails sent and received directly between active
                Zoom Email users. Support for end-to-end encryption requires
                Zoom Email users to have added a device to their Zoom Email
                account with the associated email address and to use a supported
                Zoom client. When an email is end-to-end encrypted, only the
                users, and, depending on their settings, account owners, or
                designated account administrators control the encryption key and
                therefore access to the email content, including body text,
                subject line, attachments and custom labels applied to messages
                by users in their inboxes. Emails sent to or received from
                non-Zoom Email users are encrypted after the email is sent or
                received from Zoom&apos;s servers, if the Zoom Email user
                chooses to send them with encryption. In all cases, Zoom does
                have access to email metadata used for basic email
                delivery—specifically, email addresses in the from, to, cc, and
                bcc fields, time, mimeID, and the number and size of
                attachments. From use of Zoom&apos;s native calendar service,
                Zoom receives information regarding meeting invitations, body
                text, sender and recipients, and other calendar information.
              </li>
              <li>
                <span className="font-medium">
                  Content from Third-Party Integrations:
                </span>{" "}
                Users can access email and calendars from third-party services
                through their Zoom client, if they choose to integrate them.
                This information is not end-to-end encrypted by Zoom, but Zoom
                employees do not access this content, unless directed to, or
                required for legal, safety, or security reasons. If account
                owners and/or their users integrate their third-party emails
                with products and services offered or powered by Zoom, such as
                business analytics tools like Zoom IQ, Zoom may collect or
                process email information, including email content, headers and
                metadata, from such third-party services in order to provide
                services requested by the account and to improve the product.{" "}
              </li>
              <li>
                <span className="font-medium">Communications with Zoom:</span>{" "}
                Information about your communications with Zoom, including
                relating to support questions, your account, and other
                inquiries.
              </li>
              <li>
                <span className="font-medium">Information from Partners:</span>{" "}
                Zoom obtains information about account owners and their users
                from third-party companies, such as market data enrichment
                services, including information about an account owner&apos;s
                company size or industry, contact information, or activity of
                certain enterprise domains. Zoom may also obtain information
                from third-party advertising partners who deliver ads displayed
                on Zoom products and services, such as whether you clicked on an
                ad they showed you.
              </li>
            </ul>
            <div className="py-5 text-center lg:text-left">
              <HeadingBlue25px>HOW DO WE USE PERSONAL DATA?</HeadingBlue25px>
            </div>
            <div className="space-y-5 text-custom-dark-blue-2 pt-10">
              <p>
                Zoom employees do not access meeting, webinar, messaging or
                email content (specifically, audio, video, files, in-meeting
                whiteboards, messaging or email contents), or any content
                generated or shared as part of other collaborative features
                (such as out-of-meeting whiteboards), unless authorized by an
                account owner, or as required for legal, safety, or security
                reasons, as discussed below, and where technically feasible.
                Zoom uses personal data to conduct the following activities:{" "}
              </p>

              <p>
                <span className="font-medium">
                  Provide Zoom Products and Services:
                </span>{" "}
                To provide products and services to account owners, their users,
                and those they invite to join meetings and webinars hosted on
                their accounts, including to customize Zoom products and
                services and recommendations for accounts or their users. Zoom
                also uses personal data, including contact information, to route
                invitations, messages, or Zoom Emails to recipients when users
                send or receive invitations, messages, or Zoom Emails using Zoom
                products and services. This may also include using personal data
                for customer support, which may include accessing audio, video,
                files, messages, and other content or context, at the direction
                of the account owner or their users. We also use personal data
                to manage our relationship and contracts with account owners and
                others, including billing, compliance with contractual
                obligations, facilitating payment to third-party developers in
                relation to purchases made through the Zoom App Marketplace, and
                related administration.
              </p>
              <p>
                <span className="font-medium">
                  Advanced Voice and Video Features:
                </span>{" "}
                If you elect to use certain video features, such as filters,
                avatars, and gestures, information about your movements or the
                positioning of your face or hands may be processed on your
                device to apply the selected features. Such data does not leave
                your device, is not retained, and cannot be used to identify
                you. If certain features are enabled, such as transcription
                generation for recordings, Zoom may use technology that analyzes
                the meeting&apos;s audio recording to distinguish one speaker
                from another in order to create an accurate transcript. The
                audio analysis is not retained after the transcript is
                generated. Product Research and Development: To develop, test,
                and improve Zoom products and services, including, for example,
                content-related features (such as background and other filters),
                and to troubleshoot products and services.
              </p>
              <p>
                <span className="font-medium">
                  Marketing, Promotions, and Third-Party Advertising:
                </span>{" "}
                To permit Zoom and/or its third party marketing partners to
                market, advertise, and promote Zoom products and services,
                including based on your product usage, information we receive
                from third-party partners, information you provide to process
                referral invitations, or if you visit our websites, information
                about how and when you visit, and your interactions with them.
                We may also use this information to provide advertisements to
                you relating to Zoom products and services or to engage third
                party partners to analyze your interactions on our website or
                app or to deliver advertising to you. Zoom does not use meeting,
                webinar, or messaging content (specifically, audio, video, files
                shared, in-meeting whiteboards, and messages), or any content
                generated or shared as part of other collaborative features
                (such as out-of-meeting whiteboards) for any marketing or
                promotions.
              </p>
              <p>
                <span className="font-medium">
                  Authentication, Integrity, Security, and Safety:
                </span>{" "}
                To authenticate accounts and activity, detect, investigate, and
                prevent malicious conduct or unsafe experiences, address
                security threats, protect public safety, and secure Zoom
                products and services.
              </p>
              <p>
                <span className="font-medium">Communicate with You:</span> We
                use personal data (including contact information) to communicate
                with you about Zoom products and services, including product
                updates, your account, and changes to our policies and terms. We
                also use your information to respond to you when you contact us.
              </p>
              <p>
                <span className="font-medium">Legal Reasons:</span> To comply
                with applicable law or respond to valid legal process, including
                from law enforcement or government agencies, to investigate or
                participate in civil discovery, litigation, or other adversarial
                legal proceedings, and to enforce or investigate potential
                violations of our Terms of Service or policies.{" "}
              </p>

              <p>
                Zoom uses advanced tools to automatically scan content such as
                virtual backgrounds, profile images, incoming emails to
                Zoom&apos;s native email service from someone who is not a Zoom
                Email user, and files uploaded or exchanged through chat, for
                the purpose of detecting and preventing violations of our terms
                or policies and illegal or other harmful activity, and its
                employees may investigate such content where required for legal,
                safety, or security reasons.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      <FooterComponent />
    </>
  );
};

export default PrivacyPolicyPage;

```

Path: frontend/app/quick-join/page.tsx

```
'use client';

import { useEffect,  useState } from 'react';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_BASE_URL!;
const SERVER_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL!;

export default function QuickJoin() {
  const [jwt, setJwt] = useState<string>(''); // paste your backend JWT here
  const [roomName, setRoomName] = useState<string>('');
  const [role, setRole] = useState<'Moderator' | 'Participant'>('Moderator');
  const [lkToken, setLkToken] = useState<string | null>(null);

  // allow passing ?roomName=... via URL
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const n = q.get('roomName');
    if (n) setRoomName(n);
  }, []);

  async function getToken() {
    if (!jwt || !roomName) {
      alert('Paste your backend JWT and roomName'); return;
    }
    const res = await fetch(`${API_BASE}/api/v1/livekit/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',              // <— send cookies
      body: JSON.stringify({ roomName, role }),
    });
    if (!res.ok) {
      const t = await res.text();
      alert(`Token failed: ${res.status} ${t}`); return;
    }
    const json = await res.json();
    setLkToken(json?.data?.token || json?.token || null);
  }

  return (
    <div className="p-4 space-y-4">
      {!lkToken ? (
        <div className="max-w-xl space-y-3">
          <h1 className="text-xl font-semibold">Quick Join (publish A/V)</h1>

          <label className="block">
            <div className="text-sm font-medium">Backend JWT (Moderator/Admin)</div>
            <input className="border p-2 w-full" value={jwt} onChange={e => setJwt(e.target.value)} placeholder="paste your backend JWT" />
          </label>

          <label className="block">
            <div className="text-sm font-medium">Room name</div>
            <input className="border p-2 w-full" value={roomName} onChange={e => setRoomName(e.target.value)} placeholder="project_..._session_..." />
          </label>

          <label className="block">
            <div className="text-sm font-medium">Role</div>
            <select className="border p-2 w-full" value={role} onChange={(e) => setRole(e.target.value as 'Moderator' | 'Participant')}>
              <option>Moderator</option>
              <option>Participant</option>
            </select>
          </label>

          <button onClick={getToken} className="px-4 py-2 rounded bg-black text-white">
            Get token & Join
          </button>

          <p className="text-sm text-gray-600">
            Tip: use the <code>roomName</code> you got when you started the meeting:
            <br />
            <code>{`project_<projectId>_session_<sessionId>`}</code>
          </p>
        </div>
      ) : (
        <LiveKitRoom
          serverUrl={SERVER_URL}
          token={lkToken}
          connect={true}
          video={true}
          audio={true}
        >
          <VideoConference />
        </LiveKitRoom>
      )}
    </div>
  );
}

```

Path: frontend/app/terms-of-condition/page.tsx

```
import FooterComponent from "components/shared/FooterComponent";
import Heading20pxBlueUC from "components/shared/Heading20pxBlueUCComponent";
import Logo from "components/shared/LogoComponent";
import React from "react";

const TermsPage: React.FC = () => {
  return (
    <>
      <div className="dashboard_sidebar_bg lg:px-40 pb-20">
        <div className="bg-white pb-20 pt-10 lg:px-28 px-10 shadow-[0px_3px_16px_#00000029]">
          <div className="flex justify-center lg:justify-start">
            <Logo />
          </div>
          <p className="text-custom-dark-blue-2 lg:text-4xl text-2xl text-center lg:text-left font-bold uppercase  pb-2 pt-10 ">
            AMPLIFY RESEARCH TERMS OF SERVICE
          </p>

          <p className="pb-10 text-center lg:text-left">
            Last updated: December 12, 2022
          </p>

          <p className="pt-4 pb-10 text-custom-dark-blue-2">
            Amplify Research will provide the Services, and you may access and
            use the Services, in accordance with this Agreement. Amplify
            Research may provide any of the Services hereunder through any of
            its Affiliates. If You order Services through an on-line
            registration page or an order form (each an “Order Form”), the Order
            Form may contain additional terms and conditions and information
            regarding the Services you are ordering. Unless otherwise expressly
            set forth in any such additional terms and conditions applicable to
            the specific Service which You choose to use, those additional terms
            are hereby incorporated into this Agreement in relation to Your use
            of that Service.
          </p>

          <div className="text-center lg:text-left">
            <Heading20pxBlueUC>SYSTEM REQUIREMENTS</Heading20pxBlueUC>
          </div>

          <p className="pt-4 pb-10 text-custom-dark-blue-2">
            Use of the Services requires one or more compatible devices,
            Internet access (fees may apply), and certain software (fees may
            apply), and may require obtaining updates or upgrades from time to
            time. Because use of the Services involves hardware, software, and
            Internet access, Your ability to access and use the Services may be
            affected by the performance of these factors. High speed Internet
            access is recommended. You acknowledge and agree that such system
            requirements, which may be changed from time to time, are Your
            responsibility.
          </p>

          <div className="text-custom-dark-blue-2 lg:pl-16  space-y-10 text-center lg:text-left">
            <div>
              <Heading20pxBlueUC>DEFINITIONS</Heading20pxBlueUC>
              <p className="pt-4">
                The following definitions will apply in this Agreement, and any
                reference to the singular includes a reference to the plural and
                vice versa. Service specific definitions are found in the
                Services Description located at https://explore.Amplify
                Research.us/en/services-description/.{" "}
              </p>

              <p>
                “Affiliate” means, with respect to a Party, any entity that
                directly or indirectly controls, is controlled by or is under
                common control with that Party. For purposes of this Agreement,
                “control” means an economic or voting interest of at least fifty
                percent (50%) or, in the absence of such economic or voting
                interest, the power to direct or cause the direction of the
                management and set the policies of such entity.
              </p>
              <p>
                “End User” means a Host or Participant (as defined in the
                Services Description) who uses the Services. “Initial
                Subscription Term” means the initial subscription term for a
                Service as specified in an Order Form. “Laws” means all U.S. or
                non-U.S. national, regional, state, provincial or local laws,
                statutes, rules, regulations, ordinances, administrative
                rulings, judgments, decrees, orders, directives, policies, or
                treaties applicable to Amplify Research provision and Customer’s
                use of the Services.
              </p>
              <p>
                “Service Effective Date” means the date an Initial Subscription
                Term begins as specified in an Order Form. “Renewal Term” means
                the renewal subscription term for a Service commencing after the
                Initial Subscription Term or another Renewal Term as specified
                in an Order Form. “Taxes and Fees” and “Taxes or Fees” means all
                applicable sales, use, environmental or regulatory taxes, VAT,
                fees, duties (including customs duties), charges, surcharges or
                assessments levied on the provision of Services to Customer
                (exclusive of any income tax imposed on Zoom).
              </p>
              <p>
                {" "}
                “VAT” means any value added tax, and any other tax of a similar
                nature, whether imposed in a Member State of the European Union
                in substitution for, or levied in addition to, such tax, or
                imposed elsewhere, any Goods and Services Tax, PIS/COFINS, any
                similar indirect Tax or any Tax analogous thereto imposed in
                connection with, or otherwise relating to, the Services rendered
                by Zoom to Customer.
              </p>
              <p>
                “Your Data” means information provided to Zoom so that Zoom can
                fulfill the terms of the Agreement and provide access to the
                Services (e.g., company name, billing address, taxpayer ID
                number, VAT registration number, contact name and information).
                You are solely responsible for the accuracy of Your Data, and
                Zoom has no liability whatsoever for errors and omissions in
                Your Data.
              </p>
            </div>
            <div>
              <Heading20pxBlueUC>SERVICES</Heading20pxBlueUC>
              <p className="pt-4">
                Amplify Research will provide the Services as described on the
                Order Form, and standard updates to the Services that are made
                generally available by Amplify Research during the term. Amplify
                Research may, in its sole discretion, discontinue the Services
                or modify the features of the Services from time to time without
                prior notice. You will maintain the minimum number of
                subscriptions set forth on the Order Form for the duration of
                the Initial Subscription Term or then current Renewal Term, as
                applicable. Any amendment to the number of subscriptions set
                forth on the Order Form will be effective upon the commencement
                of Your next Renewal Term.
              </p>

              <p className="pt-10">
                Beta Services. Any use of beta products or services are governed
                by separate beta terms and conditions, and Beta usage is
                excluded from this Agreement. Absent a separate beta agreement
                signed by the parties, the Beta Program – Terms of Use disclosed
                at https://explore.zoom.us/en/beta-terms-and-conditions/ apply
                to Your use of any beta products or services.
              </p>
            </div>
            <div>
              <Heading20pxBlueUC>
                USE OF SERVICES AND YOUR RESPONSIBILITIES
              </Heading20pxBlueUC>
              <p className="pt-4">
                You may only use the Services pursuant to the terms of this
                Agreement. You are solely responsible for Your and Your End
                Users’ use of the Services and shall abide by, and ensure
                compliance with, all Laws in connection with Your and each End
                User’s use of the Services, including but not limited to Laws
                related to recording, intellectual property, privacy and export
                control. Use of the Services is void where prohibited. Sharing
                of Host subscriptions with anyone other than the individual
                assigned to be a Host is strictly prohibited.
              </p>

              <p className="pt-10">
                Registration Information. You may be required to provide
                information about Yourself in order to register for and/or use
                certain Services. You agree that any such information shall be
                accurate. You may also be asked to choose a user name and
                password. You are entirely responsible for maintaining the
                security of Your user name and password and agree not to
                disclose such to any third party.
              </p>
              <p className="pt-10">
                Your Content. You agree that You are solely responsible for the
                content (“Content”) sent or transmitted by You or displayed or
                uploaded by You in using the Services and for compliance with
                all Laws pertaining to the Content, including, but not limited
                to, Laws requiring You to obtain the consent of a third party to
                use the Content and to provide appropriate notices of third
                party rights. You represent and warrant that You have the right
                to upload the Content to Zoom and that such use does not violate
                or infringe on any rights of any third party. Under no
                circumstances will Amplify Research be liable in any way for any
                (a) Content that is transmitted or viewed while using the
                Services, (b) errors or omissions in the Content, or (c) any
                loss or damage of any kind incurred as a result of the use of,
                access to, or denial of access to Content. Although Zoom is not
                responsible for any Content, Amplify Research may delete any
                Content, at any time without notice to You, if Amplify Research
                becomes aware that it violates any provision of this Agreement,
                or any law. You retain copyright and any other rights You
                already hold in Content which You submit, post or display on or
                through, the Services.
              </p>
              <p className="pt-10">
                Recordings. You are responsible for compliance will all
                recording laws. The host can choose to record Amplify Research
                Meetings andAmplify Research Webinars. By using the Services,
                you are giving Zoom consent to store recordings for any or all
                Amplify Research meetings or webinars that you join, if such
                recordings are stored in our systems. You will receive a
                notification (visual or otherwise) when recording is enabled. If
                you do not consent to being recorded, you can choose to leave
                the meeting or webinar.
              </p>
              <p className="">
                Prohibited Use. You agree that You will not, and will not permit
                any End User to: (i) modify, customize, disassemble, decompile,
                prepare derivative works of, create improvements, derive
                innovations from, reverse engineer or attempt to gain access to
                any underlying technology of the Services (e.g., any source
                code, process, data set or database, management tool,
                development tool, server or hosting site, etc); (ii) knowingly
                or negligently use the Services in a way that abuses, interferes
                with, or disrupts Zoom’s networks, Your accounts, or the
                Services; (iii) engage in activity that is illegal, fraudulent,
                false, or misleading, (iv) transmit through the Services any
                material that may infringe the intellectual property or other
                rights of third parties; (v) build or benchmark a competitive
                product or service, or copy any features, functions or graphics
                of the Services; or (vi) use the Services to communicate any
                message or material that is harassing, libelous, threatening,
                obscene, indecent, would violate the intellectual property
                rights of any party or is otherwise unlawful, that would give
                rise to civil liability, or that constitutes or encourages
                conduct that could constitute a criminal offense, under any
                applicable law or regulation; (vii) upload or transmit any
                software, Content or code that does or is intended to harm,
                disable, destroy or adversely affect performance of the Services
                in any way or which does or is intended to harm or extract
                information or data from other hardware, software or networks of
                Zoom or other users of Services; (viii) engage in any activity
                or use the Services or Zoom account in any manner that could
                damage, disable, overburden, impair or otherwise interfere with
                or disrupt the Services, or any servers or networks connected to
                the Services or Zoom’s security systems. (ix) use the Services
                in violation of any Zoom policy or in a manner that violates
                applicable law, including but not limited to anti-spam, export
                control, privacy, and anti-terrorism laws and regulations and
                laws requiring the consent of subjects of audio and video
                recordings, and You agree that You are solely responsible for
                compliance with all such laws and regulations. Limitations on
                Use. You may not reproduce, resell, or distribute the Services
                or any reports or data generated by the Services for any purpose
                unless You have been specifically permitted to do so under a
                separate agreement with Zoom. You may not offer or enable any
                third parties to use the Services purchased by You, display on
                any website or otherwise publish the Services or any Content
                obtained from a Service (other than Content created by You) or
                otherwise generate income from the Services or use the Services
                for the development, production or marketing of a service or
                product substantially similar to the Services.
              </p>
            </div>
            <div>
              <Heading20pxBlueUC>
                RESPONSIBILITY FOR END USERS
              </Heading20pxBlueUC>
              <p className="pt-4">
                You are responsible for the activities of all End Users who
                access or use the Services through your account and you agree to
                ensure that any such End User will comply with the terms of this
                Agreement and any Amplify Research policies. Amplify Research
                assumes no responsibility or liability for violations. If You
                become aware of any violation of this Agreement in connection
                with use of the Services by any person, please contact Amplify
                Research at trust@Amplify Research.us. Amplify Research may
                investigate any complaints and violations that come to its
                attention and may take any (or no) action that it believes is
                appropriate, including, but not limited to issuing warnings,
                removing the content or terminating accounts and/or User
                profiles. Under no circumstances will Amplify Research be liable
                in any way for any data or other content viewed while using the
                Services, including, but not limited to, any errors or omissions
                in any such data or content, or any loss or damage of any kind
                incurred as a result of the use of, access to, or denial of
                access to any data or content.
              </p>
            </div>
            <div>
              <Heading20pxBlueUC>
                AMPLIFY RESEARCH OBLIGATIONS FOR CONTENT
              </Heading20pxBlueUC>
              <p className="pt-4">
                Amplify Research will maintain reasonable physical and technical
                safeguards to prevent unauthorized disclosure of or access to
                Content, in accordance with industry standards. Zoom will notify
                You if it becomes aware of unauthorized access to Content.
                Amplify Research will not access, view or process Content except
                (a) as provided for in this Agreement and in Amplify Research
                Privacy Statement; (b) as authorized or instructed by You, (c)
                as required to perform its obligations under this Agreement; or
                (d) as required by Law. Amplify Research has no other
                obligations with respect to Content.
              </p>
            </div>
            <div>
              <Heading20pxBlueUC>ELIGIBILITY</Heading20pxBlueUC>
              <p className="pt-4">
                You affirm that You are at least 16 years of age and are
                otherwise fully able and competent to enter into the terms,
                conditions, obligations, affirmations, representations, and
                warranties set forth in this Agreement, and to abide by and
                comply with this Agreement. Your access may be terminated
                without warning if we believe that You are under the age of 16
                or are otherwise ineligible.
              </p>
            </div>
            <div>
              <Heading20pxBlueUC>
                INTENDED USE; RESTRICTION ON USE BY CHILDREN
              </Heading20pxBlueUC>
              <p className="pt-4">
                The Services are intended for business use. You may choose to
                use the Services for other purposes, subject to the terms and
                limitations of this Agreement. Amplify Research is not intended
                for use by individuals under the age of 16, unless it is through
                a School Subscriber (as that term is defined in the Services
                Description) using Amplify Research for Education (K-12).
              </p>
            </div>
            <div>
              <Heading20pxBlueUC>CHARGES AND CANCELLATION</Heading20pxBlueUC>
              <p className="pt-4">
                You agree that Amplify Research may charge to Your credit card
                or other payment mechanism selected by You and approved by
                Amplify Research (“Your Account”) all amounts due and owing for
                the Services. All payments made by you to us under this
                Agreement will be made free and clear of any deduction or
                withholding, as may be required by law. If any such deduction or
                withholding (including but not limited to domestic or
                cross-border withholding taxes) is required on any payment, you
                will pay such additional amounts as are necessary so that the
                net amount received by us is equal to the amount then due and
                payable under this Agreement. We will provide you with such tax
                forms as are reasonably requested in order to reduce or
                eliminate the amount of any withholding or deduction for taxes
                in respect of payments made under this Agreement. You agree that
                all payment obligations are non-cancelable and all amounts paid
                are non-refundable during the Initial Subscription Term or then
                current Renewal Term, as applicable. Amplify Research may change
                prices for the Services from time to time, in its sole
                discretion. Any price changes will be effective upon the
                commencement of Your next Renewal Term; provided, that Amplify
                Research shall provide You with reasonable notice of any such
                fee increase prior to the expiration of the Initial Subscription
                Term or any Renewal Term. Prices specified in the Order Form may
                include discounts or promotional pricing. These discounts or
                promotional pricing amounts may be temporary and may expire upon
                the commencement of a Renewal Term, without additional notice.
                Amplify Research reserves the right to discontinue or modify any
                promotion, sale or special offer at its sole and reasonable
                discretion. You agree that in the event Amplify Research is
                unable to collect the fees owed to Amplify Research for the
                Services through Your Account, Amplify Research may take any
                other steps it deems necessary to collect such fees from You and
                that You will be responsible for all costs and expenses incurred
                by Amplify Research in connection with such collection activity,
                including collection fees, court costs and attorneys’ fees. You
                further agree that Amplify Research may collect interest at the
                lesser of 1.5% per month or the highest amount permitted by law
                on any amounts not paid when due.
              </p>
            </div>
            <div>
              <Heading20pxBlueUC>TAXES</Heading20pxBlueUC>
              <p className="pt-4">
                Unless stated otherwise, all prices and fees shown by Amplify
                Research are exclusive of Taxes and regulatory fees, service,
                service fees, set up fees, subscription fees, or any other fee
                or charge associated with Your Account. Where applicable, Taxes
                and regulatory fees will be charged on the invoices issued by
                Amplify Research in accordance with local laws and regulations.
                Amplify Research, in its sole discretion, will calculate the
                amount of Taxes due. The taxes and regulatory fees charged can
                be changed without notice.
              </p>
              <p className="pt-4">
                VAT Invoices. If required by Law, Amplify Research will issue a
                VAT invoice, or a document that the relevant taxing authority
                will treat as a VAT invoice, to You. You accept that this
                invoice may be issued electronically.
              </p>
              <p className="pt-4">
                Tax exemptions. If You are exempt from any Tax or Fee, You will
                provide Amplify Research with all appropriate tax exemption
                certificates, and/or other documentation satisfactory to the
                applicable taxing authorities to substantiate such exemption
                status. Amplify Research reserves the right to review and
                validate tax exemption documentation. In the event that the tax
                exemption documentation is not valid, Amplify Research reserves
                the right to charge applicable taxes to You.
              </p>
              <p className="pt-4">
                Payment of Taxes and Fees. You will pay to Amplify Research any
                applicable Taxes and Fees. You are solely responsible for paying
                any and all Taxes and Fees owing as a result of Amplify
                Research’s provision of the Services to You. If You are required
                to pay any Taxes and Fees, You shall pay such amounts with no
                reduction or offset in amounts payable to Amplify Research
                hereunder and You will pay and bear such additional amount, as
                shall be necessary such that Zoom receives the full amount of
                payment required as if no such reduction or offset were
                required.
              </p>
              <p className="pt-4">
                VAT due by the customer. In the event Taxes and Fees are due
                towards the taxing authorities by You instead of Amplify
                Research, through the reverse charge or other similar mechanism,
                You will provide Amplify Research with all appropriate evidence
                for Amplify Research to demonstrate Your business nature, such
                as a valid VAT registration number (or similar information
                required under the relevant VAT laws). Amplify Research reserves
                the right to review and validate your VAT registration number.
                In the event that the VAT registration number is not valid,
                Amplify Research reserves the right to nevertheless charge
                applicable VAT to You. For the avoidance of doubt, if VAT is due
                by You to a taxing authority, through the reverse charge or
                other similar mechanism, You are solely responsible for paying
                those amounts to the relevant taxing authority such that Amplify
                Research receives the full amount of payment required.
              </p>
              <p className="pt-4">
                Tax determination. Tax determination is principally based on the
                location where the Customer has established its business based
                on the Customer Data, or for individuals where that individual
                permanently resides. This will be defined by Amplify Research as
                Your ‘Sold To’ address. Amplify Research reserves the right to
                cross reference this location against other available evidence
                to validate whether Your location is accurate. In the event that
                Your location is inaccurate, Amplify Research reserves the right
                to charge You any outstanding Taxes and Fees.
              </p>
              <p className="pt-4">
                Use and enjoyment. If You purchase Amplify Research Services,
                and those Services are used and enjoyed by a subsidiary of You
                in a country that is different to Your location as determined by
                Section 9(e) of this TOS, You confirm that where required You
                will treat this as a supply to Your subsidiary. In the event You
                purchase Services and those Services are used and enjoyed by a
                branch or individual in a country that is different to Your
                location as determined by Section 9 (e) of this TOS, You
                acknowledge that You will inform Amplify Research of the
                Services that have been allocated and You acknowledge that Zoom
                reserves the right to charge Taxes and Fees based on the use and
                enjoyment of those Services.
              </p>
            </div>
          </div>
        </div>
      </div>
      <FooterComponent />
    </>
  );
};

export default TermsPage;

```

Path: frontend/components/accountActivation/AccountActivationUI.tsx

```
import React from "react";
import { Card, CardContent, CardHeader } from "components/ui/card";
import BackToLogin from "./BackToLogin";
import { FaEnvelopeOpenText } from "react-icons/fa";

interface AccountActivationUIProps {
  email: string;
}

const AccountActivationUI: React.FC<AccountActivationUIProps> = ({ email }) => {
  return (
    <div className="py-20 min-h-screen flex flex-col justify-center items-center">
      <Card className="max-w-2xl mx-auto rounded-xl">
        <CardHeader className="flex justify-center items-center py-5">
          <FaEnvelopeOpenText className="h-16 w-16 text-black" />
        </CardHeader>
        <CardContent className="px-10 lg:px-20">
          <div className="text-center space-y-4">
            <h1 className="font-bold text-2xl md:text-3xl">
              Account Activation
            </h1>
            <p className="text-slate-600">
              Thank you for signing up. A verification link has been sent to
            </p>
            <p className="text-gray-500 text-lg">{email}</p>
            <p className="text-slate-600">
              Please click the link in the email to verify your account.
            </p>
          </div>

          {/* Uncomment to include Resend Email button
          <div className="pt-10">
            <Button 
              variant="default" 
              className="w-full font-bold text-lg py-2 rounded-xl"
            >
              Resend Email
            </Button>
          </div>
          */}

          <div className="pt-14 pb-16 text-center">
            <BackToLogin />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountActivationUI;

```

Path: frontend/components/accountActivation/BackToLogin.tsx

```
"use client";
import React from "react";
import { Button } from "components/ui/button";
import Link from "next/link";

interface BackToLoginProps {
  className?: string;
}

const BackToLogin: React.FC<BackToLoginProps> = ({ className }) => {
  return (
    <Button
      variant="link"
      className={`text-blue-500 font-semibold text-center text-lg ${className}`}
      asChild
    >
      <Link href="/login">Back To Login</Link>
    </Button>
  );
};

export default BackToLogin;

```

Path: frontend/components/createAccount/countrySelector.tsx

```
// components/createAccount/CountrySelector.tsx
"use client";

import React, { useState } from "react";
import { Button } from "components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "lib/utils";
import { CountryCode } from "hooks/useCountryList";

interface CountrySelectorProps {
  countries: CountryCode[];
  isLoading: boolean;
  selectedCountry: CountryCode | null;
  onSelect: (c: CountryCode) => void;
}

export default function CountrySelector({
  countries,
  isLoading,
  selectedCountry,
  onSelect,
}: CountrySelectorProps) {
  // Local state to control popover visibility
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={isLoading}
          className="w-32 justify-between border-none"
        >
          {selectedCountry ? (
            <div className="flex items-center">
              <span className="mr-1">{selectedCountry.iso}</span>
              <span>+{selectedCountry.code}</span>
            </div>
          ) : (
            "Select country"
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-64 p-0 border-0">
        <Command>
          <CommandInput placeholder="Search country or code…" />
          <CommandEmpty>No country found.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-y-auto">
            {countries.map((country) => (
              <CommandItem
                key={country.iso}
                value={`${country.country} ${country.code} ${country.iso}`}
                onSelect={() => {
                  onSelect(country);
                  setOpen(false); // close popover after selecting
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedCountry?.iso === country.iso ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex justify-between w-full">
                  <span>{country.country}</span>
                  <span className="text-gray-500">+{country.code}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

```

Path: frontend/components/createAccount/PasswordField.tsx

```
// components/createAccount/PasswordField.tsx
"use client";

import React, { useState } from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "components/ui/form";
import { Input } from "components/ui/input";
import { Button } from "components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import {
  Control,
  FieldValues,
  Path,
} from "react-hook-form";

interface PasswordFieldProps<TFieldValues extends FieldValues> {
  /** the RHF control object */
  control: Control<TFieldValues>;
  /** the field name – must be a key of TFieldValues */
  name: Path<TFieldValues>;
  /** visible label text */
  label: string;
  /** placeholder inside the <Input> */
  placeholder?: string;
  /** extra className on the FormItem (e.g. for flex‐layout) */
  className?: string;
  disabled?: boolean;
}

export default function PasswordField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder = "",
  className = "",
  disabled = false,
}: PasswordFieldProps<TFieldValues>) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={placeholder}
                {...field}
                disabled={disabled}
                 onCopy={(e) => e.preventDefault()}
               onPaste={(e) => e.preventDefault()}
               onCut={(e) => e.preventDefault()}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full pr-2"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </Button>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

```

Path: frontend/components/createAccount/RegisterForm.tsx

```
// components/RegisterForm.tsx
"use client";

import React from "react";
import { toast } from "sonner";
import { useForm, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "components/ui/form";
import { Input } from "components/ui/input";
import { Checkbox } from "components/ui/checkbox";
import { Button } from "components/ui/button";
import TextInputField from "components/createAccount/TextInputField";
import PasswordField from "components/createAccount/PasswordField";

import { useCountryList } from "hooks/useCountryList";
import { useRegister } from "hooks/useRegister";
import { registerSchema, RegisterFormValues } from "schemas/registerSchema";
import { registerDefaults } from "constant";
import Link from "next/link";
import CountrySelector from "./countrySelector";

export default function RegisterForm() {
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: registerDefaults,
  });

  const { countries, isLoading: countriesLoading, selectedCountry, setSelectedCountry } = useCountryList();
  const registerMutation = useRegister();

  const handleErrors = (errors: FieldErrors<RegisterFormValues>) => {
    Object.values(errors).forEach((fieldError) => {
      if (fieldError?.message) {
        toast.error(fieldError.message);
      }
    });
  };

  const onSubmit = (values: RegisterFormValues) => {
    const fullPhoneNumber = selectedCountry
      ? `+${selectedCountry.code}${values.phoneNumber}`
      : values.phoneNumber;
    registerMutation.mutate({ values, fullPhoneNumber });
  };
  const handleRegister = form.handleSubmit(onSubmit, handleErrors);

  const isSaving = registerMutation.isPending;


  return (
    <Form {...form}>
      <form onSubmit={handleRegister} className="lg:px-24 px-4 space-y-4">
        <div className="lg:flex lg:gap-4 space-y-4 lg:space-y-0">
          <TextInputField
            control={form.control}
            name="firstName"
            label="First Name"
            placeholder="Enter your first name"
            className="flex-1"
            disabled={isSaving}
          />
          <TextInputField
            control={form.control}
            name="lastName"
            label="Last Name"
            placeholder="Enter your last name"
            className="flex-1"
               disabled={isSaving}
          />
        </div>

        <TextInputField
          control={form.control}
          name="email"
          label="Email"
          placeholder="Enter your email"
          type="email"
             disabled={isSaving}
        />

        <div className="lg:flex lg:gap-4 space-y-4 lg:space-y-0">
          <div className="flex-1">
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Phone Number</FormLabel>
                  <div className="flex gap-0.5">
                    <CountrySelector
                      countries={countries}
                      isLoading={countriesLoading}
                      selectedCountry={selectedCountry}
                      onSelect={setSelectedCountry}
                    />
                    <FormControl>
                      <Input
                        placeholder="Enter your phone number"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, "");
                          field.onChange(value);
                        }}
                        className=" flex-1"
                           disabled={isSaving}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <TextInputField
            control={form.control}
            name="companyName"
            label="Company Name"
            placeholder="Enter your company name"
            className="flex-1"
               disabled={isSaving}
          />
        </div>

        <PasswordField
          control={form.control}
          name="password"
          label="Password"
          placeholder="Enter your password"
             disabled={isSaving}
        />

        <PasswordField
          control={form.control}
          name="confirmPassword"
          label="Confirm Password"
          placeholder="Confirm your password"
             disabled={isSaving}
        />

        <FormField
          control={form.control}
          name="terms"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start">
              <FormControl>
                <div className="flex h-5 items-center mt-1">
                  <Checkbox checked={field.value} onCheckedChange={field.onChange}    disabled={isSaving}/>
                </div>
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="font-semibold text-base">
                  I agree to the{" "}
                  <Link target="_blank" href="/terms-of-condition" className="text-blue-500 font-bold">
                    Terms & Conditions
                  </Link>
                </FormLabel>
                <FormDescription className="text-sm">
                  Your personal data will be used to support your experience throughout this website to manage access to your account, and for other purposes described in our{" "}
                  <Link target="_blank" href="/privacy-policy" className="text-blue-500 underline">
                    Privacy Policy
                  </Link>
                  .
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full bg-orange-500 hover:bg-orange-600 mt-4"
          disabled={isSaving}
        >
          {isSaving ? "Registering..." : "Create Account"}
        </Button>
      </form>
    </Form>
  );
}

```

Path: frontend/components/createAccount/TextInputField.tsx

```
// components/form/TextInputField.tsx
"use client";

import React from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "components/ui/form";
import { Input } from "components/ui/input";
import {
  Control,
  FieldValues,
  Path,
} from "react-hook-form";

interface TextInputFieldProps<TFieldValues extends FieldValues> {
  /** The RHF control object, typed to your form’s TFieldValues */
  control: Control<TFieldValues>;
  /** The field name – must be a key of TFieldValues */
  name: Path<TFieldValues>;
  /** Visible label text */
  label: string;
  /** Placeholder inside the <Input> */
  placeholder?: string;
  /** Native input type; defaults to "text" */
  type?: React.HTMLInputTypeAttribute;
  /** Extra className on the FormItem (e.g. for flex layout) */
  className?: string;
  disabled?: boolean;
}

export default function TextInputField<
  TFieldValues extends FieldValues
>({
  control,
  name,
  label,
  placeholder = "",
  type = "text",
  className = "",
  disabled = false,
}: TextInputFieldProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input type={type} placeholder={placeholder} {...field} 
            disabled={disabled}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

```

Path: frontend/components/DatePicker.tsx

```
"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "lib/utils";
import { Button } from "components/ui/button";
import { Calendar } from "components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "components/ui/popover";

export function DatePicker() {
  const [date, setDate] = React.useState<Date>();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-[280px] justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

```

Path: frontend/components/login/login.tsx

```
"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "components/ui/form";
import { Checkbox } from "components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { FieldErrors, useForm } from "react-hook-form";
import { Button } from "components/ui/button";
import Logo from "components/shared/LogoComponent";
import FooterComponent from "components/shared/FooterComponent";
import TextInputField from "components/createAccount/TextInputField";
import PasswordField from "components/createAccount/PasswordField";
import { LoginFormValues, loginSchema } from "schemas/loginSchema";
import { loginDefaults } from "constant";
import { useLogin } from "hooks/useLogin";

const Login = () => {
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: loginDefaults,
  });

  const loginMutation = useLogin();

  const { mutate: login, isPending } = loginMutation;

  const handleErrors = (errors: FieldErrors<LoginFormValues>) => {
    Object.values(errors).forEach((fieldError) => {
      if (fieldError?.message) {
        toast.error(fieldError.message);
      }
    });
  };

  const onSubmit = form.handleSubmit((vals) => {
    login(vals);
  }, handleErrors);

  return (
    <div>
      <div className="hidden lg:justify-center lg:items-start lg:flex bg-white h-10">
        <div className="flex-1 flex items-center w-full h-full">
          <div className="pl-10 pt-8">
            <Logo />
          </div>
        </div>
        <div className="flex-1 bg-slate-100 h-10"></div>
      </div>
      <div className="lg:hidden bg-white flex justify-center items-center pt-5">
        <Logo />
      </div>
      <div className="lg:flex lg:justify-center lg:items-center">
        <div className="flex-1 pb-10 lg:pb-0">
          <Card className="border-0 shadow-none">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold">LOGIN</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={onSubmit} className="lg:px-24 px-4 space-y-4">
                  {/* Email Field */}
                  <TextInputField
                    control={form.control}
                    name="email"
                    label="Email Address"
                    placeholder="Enter your email"
                    type="email"
                    disabled={isPending}
                  />

                  {/* Password Field */}
                  <PasswordField
                    control={form.control}
                    name="password"
                    label="Password"
                    placeholder="Enter your password"
                    disabled={isPending}
                  />
                  <div className="flex items-center justify-between">
                    <FormField
                      control={form.control}
                      name="rememberMe"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isPending}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            Remember me
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    <Link
                      href="/forgot-password"
                      className="text-blue-500 text-sm"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    disabled={isPending}
                  >
                    {isPending ? "Loading..." : "Login"}
                  </Button>
                </form>
              </Form>
              <p className="mt-6 text-center">
                Don&apos;t have an Account?{" "}
                <Link href="/create-user" className="text-blue-500">
                  Create Account
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="flex-1 bg-[#F6F8FA] min-h-screen hidden lg:block">
          <div className="flex-1 flex justify-center items-start">
            <Image
              src="/register.jpg"
              alt="Amplify register"
              height={800}
              width={600}
            />
          </div>
        </div>
      </div>
      <FooterComponent />
    </div>
  );
};

export default Login;

```

Path: frontend/components/LogoutModalComponent.tsx

```
'use client'
import { useGlobalContext } from 'context/GlobalContext'
import { useRouter } from 'next/navigation'
import React from 'react'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import api from 'lib/api'

interface LogoutModalProps {
  open: boolean
  onClose: () => void
}

const LogoutModalComponent: React.FC<LogoutModalProps> = ({
  open,
  onClose,
}) => {
  const { setUser } = useGlobalContext()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await api.post("/api/v1/users/logout")
      localStorage.clear()
      setUser(null)
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      // Still clear local state even if server request fails
      localStorage.clear()
      setUser(null)
      router.push('/login')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='rounded-2xl w-[420px]'>
        <DialogHeader>
          <DialogTitle className='text-[#031F3A] text-2xl'>Log Out</DialogTitle>
          <DialogDescription className='text-[#AFAFAF] text-[11px]'>
            Are you sure you want to logout?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className='gap-4 sm:justify-end mt-8'>
          <Button
            variant='dark-blue'
            type='button'
            onClick={onClose}
            className='rounded-xl py-1 px-7 shadow-[0px_3px_6px_#031F3A59] text-base'
          >
            Cancel
          </Button>
          <Button
            variant='teal'
            type='button'
            onClick={handleLogout}
            className='rounded-xl py-1 px-10 shadow-[0px_3px_6px_#031F3A59] text-base'
          >
            Yes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default LogoutModalComponent

```

Path: frontend/components/meeting/waitingRoom.tsx

```
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "constant/socket";

type WaitingUser = {
  name: string;
  email: string;
  joinedAt: string;
  role: "Participant" | "Moderator" | "Admin";
};
type WaitingListPayload = { participantsWaitingRoom: WaitingUser[] };

export default function ModeratorWaitingPanel() {
  const { sessionId: sid, id } = useParams() as {
    sessionId?: string;
    id?: string;
  };
  const sessionId = sid ?? id;
  const [waiting, setWaiting] = useState<WaitingUser[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const joinedRef = useRef(false);
  
  console.log("sessionId", sessionId);

  // For demo: “me” as Moderator (in prod, JWT-protected page)
  const me = useMemo(
    () => ({ role: "Moderator", name: "Moderator", email: "mod@example.com" }),
    []
  );

  useEffect(() => {
    if (!sessionId) return;
    const s = io(SOCKET_URL, {
      path: "/socket.io",
      withCredentials: true,
      query: {
        sessionId: sessionId as string,
        role: me.role,
        name: me.name,
        email: me.email,
      },
    });
    socketRef.current = s;

    s.on("connect", () => {
      if (joinedRef.current) return;
      joinedRef.current = true;
      s.emit("join-room", {}, (rooms: WaitingListPayload) => {
        setWaiting(rooms.participantsWaitingRoom || []);
      });
    });

    s.on(
      "waiting:list",
      (payload: { participantsWaitingRoom: WaitingUser[] }) => {
        setWaiting(payload.participantsWaitingRoom || []);
      }
    );

    return () => {
      s.disconnect();
    };
  }, [me.email, me.name, me.role, sessionId]);

  const admit = (email: string) =>
    socketRef.current?.emit("waiting:admit", { email });
  const remove = (email: string) =>
    socketRef.current?.emit("waiting:remove", { email });
  const admitAll = () => socketRef.current?.emit("waiting:admitAll");

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Moderator – Waiting Room</h1>
        <button className="border rounded-lg px-3 py-2" onClick={admitAll}>
          Admit all
        </button>
      </div>

      <div className="rounded-xl border divide-y">
        {waiting.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">
            No one is waiting.
          </div>
        ) : (
          waiting.map((u) => (
            <div
              key={u.email}
              className="p-4 flex items-center justify-between"
            >
              <div>
                <div className="font-medium">{u.name}</div>
                <div className="text-xs text-muted-foreground">{u.email}</div>
              </div>
              <div className="space-x-2">
                <button
                  className="border rounded-lg px-3 py-2"
                  onClick={() => admit(u.email)}
                >
                  Admit
                </button>
                <button
                  className="border rounded-lg px-3 py-2"
                  onClick={() => remove(u.email)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


```

Path: frontend/components/profile/PasswordModalComponent.tsx

```
"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { useForm } from "react-hook-form";
import {
  ChangePasswordInputs,
  changePasswordSchema,
} from "../../schemas/changePasswordSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import useChangePassword from "../../hooks/useChangePassword";
import { Form } from "../ui/form";
import PasswordField from "../createAccount/PasswordField";

interface PasswordModalProps {
  open: boolean;
  onClose: () => void;
  id: string;
}

const PasswordModalComponent: React.FC<PasswordModalProps> = ({
  open,
  onClose,
  id,
}) => {
  const form = useForm<ChangePasswordInputs>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const {
    control,
    handleSubmit,
    formState: {},
  } = form;
  const { mutate: changePassword, isPending } = useChangePassword();

  const onSubmit = (values: ChangePasswordInputs) => {
    changePassword(
      {
        userId: id,
        oldPassword: values.currentPassword,
        newPassword: values.newPassword,
      },
      {
        onSuccess: () => {
          form.reset();
          onClose();
        },
      }
    );
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[420px] rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-[#031F3A] font-semibold">
            Change Password
          </DialogTitle>
          <DialogDescription className="text-[11px] text-[#AFAFAF]">
            Your new password must be different from previously used passwords.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
            <PasswordField
              control={control}
              name="currentPassword"
              label="Current Password"
              placeholder="••••••••"
              disabled={isPending}
            />

            <PasswordField
              control={control}
              name="newPassword"
              label="New Password"
              placeholder="••••••••"
              disabled={isPending}
            />

            <PasswordField
              control={control}
              name="confirmPassword"
              label="Confirm New Password"
              placeholder="••••••••"
              disabled={isPending}
            />

            <DialogFooter className="mt-4 flex justify-end gap-4">
              <Button
                type="button"
                variant="cancel"
                onClick={() => {
                  form.reset();
                  onClose();
                }}
                className="rounded-xl shadow-[0px_3px_6px_#031F3A59]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="teal"
                className="rounded-xl shadow-[0px_3px_6px_#031F3A59] text-base"
                disabled={isPending}
              >
                {isPending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordModalComponent;

```

Path: frontend/components/profile/ProfileDetailItem.tsx

```
export function DetailItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 bg-custom-gray-2 rounded-xl px-3 py-2">
      {icon}
      <span className="text-custom-gray-5 font-medium w-28">{label}:</span>
      <span className="truncate">{value}</span>
    </div>
  );
}
```

Path: frontend/components/profile/ProfileDetailsCard.tsx

```
// components/ProfileDetailsCard.tsx

import { Badge } from "components/ui/badge";
import { Button } from "components/ui/button";
import { Card, CardContent } from "components/ui/card";
import { Mail, Phone, Building2, Home, Landmark, MapPin, Globe2, DollarSign, UserCircle2 } from "lucide-react";
import Image from "next/image";
import React from "react";
import { DetailItem } from "./ProfileDetailItem";

type BillingInfo = {
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export function ProfileDetailsCard({
  firstName,
  lastName,
  role,
  email,
  credits,
  phoneNumber,
  companyName,
  billingInfo,
  onEdit,
  onChangePassword,
  onDelete,
  isDeleting,
}: {
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  credits: string;
  phoneNumber: string;
  companyName: string;
  billingInfo?: BillingInfo | null;
  onEdit: () => void;
  onChangePassword: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {

  const personalRows = [
    { icon: <UserCircle2 size={20} />, label: "First Name", value: firstName },
    { icon: <UserCircle2 size={20} />, label: "Last Name",  value: lastName  },
    { icon: <Phone       size={20} />, label: "Phone",      value: phoneNumber },
    { icon: <Building2   size={20} />, label: "Company",    value: companyName },
  ];

  const addressRows = billingInfo
    ? [
        { icon: <Home     size={20} />, label: "Address", value: billingInfo.address    },
        { icon: <Landmark size={20} />, label: "City",    value: billingInfo.city       },
        { icon: <MapPin   size={20} />, label: "State",   value: billingInfo.state      },
        { icon: <Mail     size={20} />, label: "Postal",  value: billingInfo.postalCode },
        { icon: <Globe2   size={20} />, label: "Country", value: billingInfo.country    },
      ]
    : [];

    const actionButtons: Array<{
  label: string;
  variant: "teal" | "dark-blue" | "orange";
  onClick: () => void;
  disabled?: boolean;
}> = [
  { label: "Edit Profile",       variant: "teal",      onClick: onEdit      },
  { label: "Change Password",    variant: "dark-blue", onClick: onChangePassword },
  {
    label: isDeleting ? "Deleting…" : "Delete Account",
    variant: "orange",
    onClick: onDelete,
    disabled: isDeleting,
  },
];

  return (
    <Card className="max-w-4xl mx-auto mt-10 p-0 shadow-xl rounded-2xl border-custom-gray-7">
      <CardContent className="p-8">
        {/* Header */}
        <div className="flex items-center gap-6 mb-8">
          <div>
            <Image
              src="/placeholder-image.png"
              alt="User"
              width={80}
              height={80}
              className="rounded-full border-4 border-custom-light-blue-1 shadow-md"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-2xl font-bold text-custom-dark-blue-1 truncate">
                {firstName} {lastName}
              </span>
              <Badge className="bg-custom-light-blue-1 text-white text-xs px-3 py-1 rounded-xl uppercase tracking-wider">
                {role}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-custom-gray-3 mt-1">
              <Mail size={18} /> <span className="truncate">{email}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <DollarSign size={18} className="text-custom-orange-2" />
              <span className="font-semibold text-custom-orange-2">
                {credits}
              </span>
              <span className="text-xs text-custom-gray-5">Credits</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-custom-gray-7 mb-6" />

        {/* Personal Details */}
        <h2 className="text-lg font-semibold text-custom-light-blue-1 mb-3 tracking-wide">
          Personal Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {personalRows.map(({ icon, label, value }) => (
            <DetailItem key={label} icon={icon} label={label} value={value} />
          ))}
        </div>

        {/* Address Details */}
         {addressRows.length > 0 && (
          <>
            <h2>Address</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addressRows.map(({ icon, label, value }) => (
                <DetailItem key={label} icon={icon} label={label} value={value} />
              ))}
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-4 justify-center mt-10">
  {actionButtons.map(({ label, variant, onClick, disabled }, i) => (
    <Button
      key={i}
      variant={variant}
      className="w-full md:w-44"
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </Button>
  ))}
</div>

      </CardContent>
    </Card>
  );
}

// Helper for label/value pair


```

Path: frontend/components/profile/ProfileField.tsx

```
// components/ProfileField.tsx
import HeadingParagraphComponent from "components/shared/HeadingParagraphComponent";
import React from "react";

interface ProfileFieldProps {
  label: string;
  value?: string | number;
  upperCase?: boolean;
}

export const ProfileField: React.FC<ProfileFieldProps> = ({
  label,
  value,
  upperCase = false,
}) => (
  <HeadingParagraphComponent
    heading={label}
    paragraph={value != null
      ? (upperCase ? String(value).toUpperCase() : String(value))
      : "Loading..."
    }
  />
);

```

Path: frontend/components/projects/createProject/BillingFormComponent.tsx

```
// /components/BillingForm.tsx
"use client";
import React, { useState } from "react";
import { Button } from "components/ui/button";
import { Label } from "components/ui/label";
import { IBillingInfo } from "@shared/interface/UserInterface";
import { BillingFormProps } from "@shared/interface/CreateProjectInterface";
import { useGlobalContext } from "context/GlobalContext";
import { Input } from "components/ui/input";
import { Card, CardContent } from "components/ui/card";
import { useSaveBilling } from "hooks/useSaveBilling";
import { makeOnChange } from "utils/validationHelper";
import {
  alphanumericSingleSpace,
  lettersAndSpaces,
  noLeadingSpace,
  noMultipleSpaces,
  onlyDigits,
} from "schemas/validators";

const fieldLabels: Record<keyof IBillingInfo, string> = {
  address: "Street Address",
  postalCode: "Zip Code",
  city: "City",
  state: "State",
  country: "Country",
};

export const BillingForm: React.FC<BillingFormProps> = ({ onSuccess }) => {
  const { user } = useGlobalContext();
  const [billingInfo, setBillingInfo] = useState<IBillingInfo>({
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
  });

 const billingMutation = useSaveBilling(() => {
    onSuccess();
  });
  const { mutate: saveBilling, isPending } = billingMutation;


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const userId = user?._id;
    if (!userId) return;

    saveBilling({ userId, billingInfo });
  };

 

  return (
    <Card className="border-0 shadow-sm py-0">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4">Billing Details</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full-width Street Address */}
          <div className="flex flex-col">
            <Label htmlFor="address" className="mb-1">
              {fieldLabels.address} *
            </Label>
            <Input
              id="address"
              placeholder="Enter Street Address"
              value={billingInfo.address}
              disabled={isPending}
              onChange={makeOnChange(
                "address",
                [noLeadingSpace, noMultipleSpaces, alphanumericSingleSpace],
                "Only letters, numbers, and single spaces are allowed.",
                (upd) =>
                  setBillingInfo((prev) => ({
                    ...prev,
                    ...upd,
                  }))
              )}
              required
            />
          </div>

          {/* Three-column Zip / City / State */}
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                field: "postalCode" as const,
                label: fieldLabels.postalCode,
                validators: [noLeadingSpace, noMultipleSpaces, onlyDigits],
                err: "Only digits allowed (no spaces or special chars).",
              },
              {
                field: "city" as const,
                label: fieldLabels.city,
                validators: [
                  noLeadingSpace,
                  noMultipleSpaces,
                  lettersAndSpaces,
                ],
                err: "Only letters & single spaces allowed.",
              },
              {
                field: "state" as const,
                label: fieldLabels.state,
                validators: [
                  noLeadingSpace,
                  noMultipleSpaces,
                  lettersAndSpaces,
                ],
                err: "Only letters & single spaces allowed.",
              },
            ].map(({ field, label, validators, err }) => (
              <div key={field} className="flex flex-col">
                <Label htmlFor={field} className="mb-1">
                  {label} *
                </Label>
                <Input
                  id={field}
                  placeholder={`Enter ${label}`}
                  value={billingInfo[field]}
                  disabled={isPending}
                  onChange={makeOnChange(field, validators, err, (upd) =>
                    setBillingInfo((prev) => ({
                      ...prev,
                      ...upd,
                    }))
                  )}
                  required
                />
              </div>
            ))}
          </div>
          <div className="flex flex-col">
            <Label htmlFor="country" className="mb-1">
              {fieldLabels.country} *
            </Label>
            <Input
              id="country"
              placeholder="Enter Country"
              value={billingInfo.country}
              disabled={isPending}
              onChange={makeOnChange(
                "country",
                [noLeadingSpace, noMultipleSpaces, lettersAndSpaces],
                "Only letters & single spaces allowed.",
                (upd) =>
                  setBillingInfo((prev) => ({
                    ...prev,
                    ...upd,
                  }))
              )}
              required
            />
          </div>
          {/* Next button centered */}
          <div className="text-center">
            <Button
              type="submit"
              className="bg-custom-teal hover:bg-custom-dark-blue-3"
              disabled={isPending}
            >
              {isPending ? "Saving..." : "Save Billing Info"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default BillingForm;

```

Path: frontend/components/projects/createProject/CardSetupFormComponent.tsx

```
// /components/CardSetupForm.tsx
"use client";
import React from "react";
import { toast } from "sonner";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { CardSetupFormProps } from "@shared/interface/CreateProjectInterface";
import { useQuery } from "@tanstack/react-query";
import {
  ApiResponse,
  ErrorResponse,
} from "@shared/interface/ApiResponseInterface";
import { useGlobalContext } from "context/GlobalContext";
import api from "lib/api";
import { Card } from "components/ui/card";
import CustomButton from "components/shared/CustomButton";
import { useSaveCard } from "../../../hooks/useSaveCard";

export const CardSetupForm: React.FC<CardSetupFormProps> = ({
  onCardSaved,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  
 
  const { user } = useGlobalContext();

  // 1️⃣ Fetch Setup Intent
  const { data: clientSecret, isLoading: loadingSecret } = useQuery<
    string,
    ErrorResponse
  >({
    queryKey: ["stripeSetupIntent", user?._id],
    queryFn: async () => {
      if (!user || !user._id) throw new Error("Not authenticated");
      const res = await api.post<ApiResponse<{ clientSecret: string }>>(
        "/api/v1/payment/create-setup-intent",
        { userId: user._id }
      );
      return res.data.data.clientSecret;
    },
    enabled: Boolean(user?._id),
  });



    const { mutate: saveCard, isPending: isSavingCard } = useSaveCard();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret) return;

    const cardEl = elements.getElement(CardElement);
    if (!cardEl) return;

    // Confirm setup intent with Stripe.js
    const { error, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
      payment_method: { card: cardEl },
    });
    if (error) {
      toast.error(error.message || "Error during card setup");
      return;
    }

    // Extract the payment method ID
    const pmField = setupIntent.payment_method;
    const pmId = typeof pmField === "string" ? pmField : pmField?.id;
    if (!pmId) {
      toast.error("Unable to retrieve payment method ID");
      return;
    }

    // Kick off the backend mutation
    saveCard(pmId, {
      onSuccess: () => {
        onCardSaved(); 
      },
    });
  };

  if (loadingSecret) {
    return <p>Loading payment form…</p>;
  }

  return (
    <Card className="border-0 p-4 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-4 ">
        <h2 className="text-lg font-semibold">Billing Details</h2>

        <div className="border p-4 rounded-md">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#32325d",
                  "::placeholder": { color: "#aab7c4" },
                },
              },
            }}
          />
        </div>
        <CustomButton
          type="submit"
          disabled={!stripe || isSavingCard}
          className="bg-custom-teal hover:bg-custom-dark-blue-3"
        >
          {isSavingCard ? "Saving Card..." : "Save Card & Pay"}
        </CustomButton>
      </form>
    </Card>
  );
};

export default CardSetupForm;

```

Path: frontend/components/projects/createProject/PaymentIntegrationComponent.tsx

```
// /components/PaymentIntegration.tsx
"use client";
import React, { useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import CardSetupForm from "./CardSetupFormComponent";
import BillingForm from "./BillingFormComponent";
import {
  PaymentIntegrationProps,
} from "@shared/interface/CreateProjectInterface";
import { useGlobalContext } from "../../../context/GlobalContext";
import api from "lib/api";
import { ApiResponse } from "@shared/interface/ApiResponseInterface";
import { IUser } from "@shared/interface/UserInterface";
import { Card } from "../../ui/card";
import CustomButton from "../../shared/CustomButton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { useChargePayment } from "hooks/useChargePayment";
import { useCreateExternalProject } from "hooks/useCreateProjectByExternalAdmin";
import { formatProjectData } from "utils/formatProjectData";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

export const PaymentIntegration: React.FC<PaymentIntegrationProps> = ({
  totalPurchasePrice,
  totalCreditsNeeded,
  projectData,
  uniqueId,
}) => {
  const { user, setUser } = useGlobalContext();
  const router = useRouter();

  const [isChangingCard, setIsChangingCard] = useState(false);

  const [showCreatedModal, setShowCreatedModal] = useState(false);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);

  // 1️⃣ A helper to re-fetch the logged-in user's profile
  const refetchUser = async () => {
    const resp = await api.get<ApiResponse<{ user: IUser }>>(
      "/api/v1/users/me"
    );

    const fresh = resp.data.data.user;
    setUser(fresh);

    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(fresh));
    }
  };

  
  const { mutate: chargePayment, isPending: isCharging } = useChargePayment(() => {
    createProject({ uniqueId: uniqueId!, formState: projectData, totalPurchasePrice, totalCreditsNeeded });
  });
 

  const { mutate: createProject } = useCreateExternalProject(formatProjectData, (newId) => {
    setCreatedProjectId(newId);
    setShowCreatedModal(true);
  });

  if (!user) return <div className="text-red-500">User not found</div>;


  const handleUseSavedCard = async () => {
    if (!user.stripeCustomerId) {
      return toast.error("No Stripe customer ID available");
    }
    const amountCents = Math.round(totalPurchasePrice * 100);
    
   chargePayment({
      amount: amountCents,
      credits: totalCreditsNeeded,
      customerId: user.stripeCustomerId,
      userId: user._id!,
    });
  };


  const hasBilling = Boolean(user.billingInfo);
  const hasCard = Boolean(user.creditCardInfo?.last4);

  return (
    <div className="space-y-6">
      {/* Billing Form */}
      {!hasBilling && (
        <div>
          <p className="mb-4">We need your billing information first.</p>
          <BillingForm onSuccess={refetchUser} />
        </div>
      )}
      {/* Card Setup Form */}
      {hasBilling && (!hasCard || isChangingCard) && (
        <CardSetupForm
          onCardSaved={() => {
            const amountCents = Math.round(totalPurchasePrice * 100);
            if (!user?.stripeCustomerId) {
              return toast.error("No Stripe customer ID available");
            }

            chargePayment({
              amount: amountCents,
              credits: totalCreditsNeeded,
              customerId: user.stripeCustomerId,
              userId: user._id!,
            });
          }}
        />
      )}
      {/* Saved Card Display */}
      {hasBilling && hasCard && !isChangingCard && (
        <Card className="space-y-4 border-0 shadow-sm p-4">
          <p>
            Your saved card ending in{" "}
            <span className="font-medium">{user.creditCardInfo?.last4}</span> is
            on file.
          </p>
          <div className="flex space-x-4">
            <CustomButton
              className="bg-custom-teal hover:bg-custom-dark-blue-3"
              onClick={handleUseSavedCard}
              disabled={isCharging}
            >
              {isCharging ? "Processing..." : "Use this Card"}
            </CustomButton>
            <CustomButton
              className="bg-custom-teal hover:bg-custom-dark-blue-3"
              onClick={() => setIsChangingCard(true)}
              disabled={isCharging}
            >
              Change Card
            </CustomButton>
          </div>
        </Card>
      )}

      <Dialog
        open={showCreatedModal}
        onOpenChange={(open) => {
          if (!open) {
            router.push("/projects");
          }
          setShowCreatedModal(open);
        }}
      >
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Project Created!</DialogTitle>
          </DialogHeader>
          <div className="py-4">Do you want to set up your project now?</div>
          <DialogFooter className="flex justify-end space-x-2">
            <CustomButton
              variant="outline"
              onClick={() => {
                setShowCreatedModal(false);
                router.push("/projects");
              }}
            >
              No
            </CustomButton>
            <CustomButton
              onClick={() => {
                setShowCreatedModal(false);
                router.push(`/view-project/${createdProjectId}`);
              }}
              className="bg-custom-teal text-white hover:bg-custom-dark-blue-3"
            >
              Yes
            </CustomButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Wrap PaymentIntegration with Stripe Elements
const PaymentIntegrationWrapper: React.FC<PaymentIntegrationProps> = (
  props
) => (
  <Elements stripe={stripePromise}>
    <PaymentIntegration {...props} />
  </Elements>
);

export default PaymentIntegrationWrapper;

```

Path: frontend/components/projects/createProject/PurchaseModal.tsx

```
// components/PurchaseModal.tsx
"use client";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "components/ui/dialog";
import { Button } from "components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "components/ui/table";
import BillingForm from "./BillingFormComponent";
import { useGlobalContext } from "context/GlobalContext";
import api from "lib/api";
import PaymentIntegrationWrapper from "./PaymentIntegrationComponent";
import { Card } from "components/ui/card";
import CustomButton from "components/shared/CustomButton";
import { IProjectFormState } from "@shared/interface/CreateProjectInterface";
import { useCreateCustomer } from "hooks/useCreateCustomer";
import { toast } from "sonner";

interface PurchaseModalProps {
  creditPackages: { package: number; cost: number }[];
  purchaseQuantities: Record<number, number>;
  totalPurchasePrice: number;
  totalCreditsNeeded: number;
  projectData: IProjectFormState;
}

export const PurchaseModal: React.FC<PurchaseModalProps> = ({
  creditPackages,
  purchaseQuantities,
  totalPurchasePrice,
  totalCreditsNeeded,
  projectData,
}) => {
  const { user, setUser } = useGlobalContext();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const createCustomerMutation = useCreateCustomer();

  const { isSuccess, mutate: createCustomer, isPending } = createCustomerMutation;


  // 2️⃣ When createCustomerMutation succeeds, move to step 2
  useEffect(() => {
    if (isSuccess) {
      setStep(2);
    }
  }, [isSuccess]);

  // Helpers
  const handleNext = () => {
    if (!user?.billingInfo) {
      createCustomer();
    } else {
      setStep(2);
    }
  };

  return (
    <Dialog open={open}   onOpenChange={(isOpen) => {
    setOpen(isOpen);
    if (isOpen) setStep(1);
  }}>
      <Button
        className="bg-custom-teal hover:bg-custom-dark-blue-3"
        onClick={() => {
          if (totalCreditsNeeded === 0) {
            toast.error("You have to select a credit package");
          } else {
            setStep(1)      
            setOpen(true);
          }
        }}
      >
        Pay Now
      </Button>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? "Checkout" : "Payment Details"}
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <>
            {/* Summary Table */}
            <Card className="border-0 shadow-md py-0">
              <Table className="py-0">
                <TableHeader>
                  <TableRow>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Total Price (USD)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {creditPackages.map((pkg) => {
                    const qty = purchaseQuantities[pkg.package] || 0;
                    if (qty === 0) return null;

                    const lineTotal = qty * pkg.cost;
                    return (
                      <TableRow key={pkg.package}>
                        <TableCell>{qty}</TableCell>
                        <TableCell>{pkg.package}</TableCell>
                        <TableCell>{pkg.cost}</TableCell>
                        <TableCell>{lineTotal}</TableCell>
                      </TableRow>
                    );
                  })}

                  {/* final total row */}
                  <TableRow className="font-semibold">
                    <TableCell colSpan={3} className="text-left">
                      Total Price (USD)
                    </TableCell>
                    <TableCell>{totalPurchasePrice.toFixed(2)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Card>

            {/* Billing */}
            {!user?.billingInfo && (
              <BillingForm
                onSuccess={() => {
                  // After billing saved, refetch user from server
                  api.get("/api/v1/users/me").then((r) => {
                    setUser(r.data.data.user);
                    handleNext();
                  });
                }}
              />
            )}
          </>
        )}

        {step === 2 && (
          <>
            <PaymentIntegrationWrapper
              totalPurchasePrice={totalPurchasePrice}
              totalCreditsNeeded={totalCreditsNeeded}
              projectData={projectData}
              uniqueId={null}
            />
          </>
        )}

        <DialogFooter className="flex justify-end space-x-2">
          {step === 1 && (
            <CustomButton
              onClick={handleNext}
              disabled={
                isPending ||
                (!!user?.billingInfo && false)
              }
              className="bg-custom-teal hover:bg-custom-dark-blue-3"
            >
              Next
            </CustomButton>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseModal;

```

Path: frontend/components/projects/createProject/SessionsTable.tsx

```
"use client";

import React, { useState, useEffect } from "react";
import { Input } from "components/ui/input";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "components/ui/dropdown-menu";
import { MoreVertical, Plus, Trash } from "lucide-react";
import { Select, SelectTrigger, SelectContent, SelectItem } from "components/ui/select";
import { durationMapping, durationStep3 } from "constant";
import { IProjectSession, SessionRow } from "@shared/interface/ProjectInterface";

export default function SessionsTable({
  onChange,
  initialSessions = [],
}: {
  onChange: (rows: SessionRow[]) => void;
  initialSessions?: IProjectSession[];
}) {
  const [rows, setRows] = useState<SessionRow[]>(() => {
    if (initialSessions.length) {
      return initialSessions.map((s, i) => ({
        id: `${Date.now()}_${i}`,
        number: s.number,
        duration: s.duration,
      }));
    }
    return [
      { id: Date.now().toString(), number: 1, duration: durationStep3[0] },
    ];
  });

  // whenever rows change, notify parent
  useEffect(() => {
    onChange(rows);
  }, [rows, onChange]);

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { id: Date.now().toString(), number: 1, duration: durationStep3[0] },
    ]);
  };
  const deleteRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };
  const updateRow = <K extends keyof SessionRow>(
    id: string,
    field: K,
    value: SessionRow[K]
  ) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

    // Totals
  const totalSessions = rows.reduce((sum, r) => sum + r.number, 0);
  const totalMinutes = rows.reduce(
    (sum, r) => sum + r.number * (durationMapping[r.duration] || 0),
    0
  );
  const totalHoursDecimal = totalMinutes / 60;
  const hoursText =
    totalHoursDecimal % 1 === 0
      ? String(totalHoursDecimal)
      : totalHoursDecimal.toFixed(2);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Number of Sessions</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead /> 
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="p-2">
              <Input
                type="number"
                min={1}
                value={row.number}
                onChange={(e) =>
                  updateRow(row.id, "number", Number(e.target.value))
                }
                className="w-full"
              />
            </TableCell>
            <TableCell className="p-2">
              <Select
                value={row.duration}
                onValueChange={(val) =>
                  updateRow(row.id, "duration", val)
                }
              >
                <SelectTrigger className="w-full text-left">
                  {row.duration}
                </SelectTrigger>
                <SelectContent>
                  {durationStep3.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell className="p-2 text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <MoreVertical className="h-5 w-5 text-gray-500" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={addRow}>
                    <Plus className="mr-2 h-5 w-5 text-custom-orange-2 hover:text-custom-orange-1 cursor-help rounded-full border-custom-orange-2 border-[1px] p-0.5" />
                    Add Row
                   </DropdownMenuItem>
                  {rows.length > 1 && (
                    <DropdownMenuItem onSelect={() => deleteRow(row.id)}>
                      <Trash className="mr-2 h-4 w-4 text-red-500" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
        {/* Totals Row */}
        <TableRow className="bg-gray-50">
          <TableCell className="p-2 font-semibold">
            Total Sessions: {totalSessions}
          </TableCell>
          <TableCell className="p-2 font-semibold">
            Total Duration: {hoursText} hour{hoursText !== "1" ? "s" : ""} (
            {totalMinutes} minute{totalMinutes !== 1 ? "s" : ""})
          </TableCell>
          <TableCell /> {/* blank cell */}
        </TableRow>
      </TableBody>
    </Table>
  );
}

```

Path: frontend/components/projects/createProject/step1Component/ServiceTierCard.tsx

```
import { optionalAddOnServices } from "constant";
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/card";
import { TierConfig } from "../Step1Component";
import { Input } from "../../../ui/input";
const today = new Date().toISOString().split("T")[0];
// Still in Step1.tsx, below the tier data
type Props = {
  tier: TierConfig;
  selected: "Signature" | "Concierge" | undefined;
  onSelect: (t: "Signature" | "Concierge") => void;
  firstDate: string;
  onDateChange: (d: string) => void;
  addOns: string[] | undefined;
  onAddOnToggle: (svc: string) => void;
};

export function ServiceTierCard({
  tier,
  selected,
  onSelect,
  firstDate,
  onDateChange,
  addOns,
  onAddOnToggle,
}: Props) {
  const isSelected = selected === tier.key;

  return (
    <Card
      onClick={() => onSelect(tier.key)}
      className={`relative flex flex-col flex-1 cursor-pointer p-4 border transition-shadow
        ${isSelected ? "border-custom-teal shadow-md" : "border-gray-200 hover:shadow-sm"}`}
    >
      <input
        type="radio"
        name="service"
        value={tier.key}
        checked={isSelected}
        onChange={() => onSelect(tier.key)}
        className="absolute top-4 left-4 h-4 w-4 cursor-pointer accent-custom-teal"
      />

      <CardHeader className="pt-2 pl-8">
        <CardTitle className="text-custom-teal">{tier.title}</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col flex-1 justify-between">
        {tier.features}

        {tier.hasAddOns && (
          <div className="mt-4">
            <p className="font-medium text-sm">Optional Add-On Services:</p>
            <ul className="mt-2 space-y-1">
              {optionalAddOnServices.map((svc) => (
                <li key={svc}>
                  <label className="inline-flex items-center text-sm">
                    <input
                      type="checkbox"
                      disabled={!isSelected}
                      className="mr-2 h-4 w-4 cursor-pointer accent-custom-teal"
                      checked={addOns?.includes(svc) || false}
                      onChange={() => onAddOnToggle(svc)}
                    />
                    {svc}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">
            First Date of Streaming
          </label>
         <Input
  type="date"
  min={today}
  disabled={!isSelected}
  value={isSelected ? firstDate : ""}
  onChange={(e) => isSelected && onDateChange(e.target.value)}
  className="mt-1 w-full"
/>
        </div>
      </CardContent>
    </Card>
  );
}

```

Path: frontend/components/projects/createProject/Step1Component.tsx

```
"use client";

import React from "react";
import { Step1Props } from "@shared/interface/CreateProjectInterface";
import { ServiceTierCard } from "./step1Component/ServiceTierCard";

export interface TierConfig {
  key: "Signature" | "Concierge";
  title: string;
  features: React.ReactNode;
  hasAddOns: boolean;
}

const tiers: TierConfig[] = [
  {
    key: "Signature",
    title: "Tier 1: Signature Platform Access",
    hasAddOns: false,
    features: (
      <ul className="list-disc pl-6 text-sm space-y-1">
        <li>Amplify’s Virtual Backroom Platform Access</li>
        <li>Live Streaming</li>
        <li>Participant Chat</li>
        <li>Whiteboards</li>
        <li>Breakout Rooms</li>
        <li>Polling</li>
        <li>Observation Room</li>
        <li>Live observer & moderator chat</li>
        <li>
          Session Deliverables:
          <ul className="list-circle pl-6">
            <li>Audio Recording</li>
            <li>Video Recording</li>
            <li>AI Transcripts</li>
            <li>Chat Transcripts</li>
            <li>Whiteboard & Poll Results</li>
          </ul>
        </li>
      </ul>
    ),
  },
  {
    key: "Concierge",
    title: "Tier 2: Concierge Platform Access",
    hasAddOns: true,
    features: (
      <ul className="list-disc pl-6 text-sm space-y-1">
        <li>Everything in Tier 1, plus:</li>
        <ul className="list-disc pl-6">
          <li>Amplify’s Hosting & Project Support</li>
          <li>
            Hosted Session Check-In:
            <ul className="list-disc pl-6">
              <li>Test video & sound</li>
              <li>Lighting & camera recommendations</li>
              <li>ID & pre-session verifications</li>
              <li>Follow-up on no-shows</li>
            </ul>
          </li>
          <li>Continuous Meeting Monitoring</li>
          <li>Amplify Project Support Team</li>
        </ul>
      </ul>
    ),
  },
];

const Step1: React.FC<Step1Props> = ({ formData, updateFormData }) => {
  // Update the selected service tier
   const handleServiceSelect = (tier: "Signature" | "Concierge") => {
    updateFormData({ service: tier });
  };

  // Update the first date of streaming when the date input changes
   const handleDateChange = (date: string) => {
    updateFormData({ firstDateOfStreaming: date });
  };

  // Toggle add-on checkbox selection
  const handleAddOnToggle = (service: string) => {
    const addOns = formData.addOns?.includes(service)
      ? formData.addOns.filter((s) => s !== service)
      : [...(formData.addOns || []), service];
    updateFormData({ addOns });
  };

   return (
    <div className="flex flex-col md:flex-row md:gap-6 gap-4 ">
      {tiers.map((tier) => (
        <ServiceTierCard
          key={tier.key}
          tier={tier}
          selected={formData.service as "Signature" | "Concierge" | undefined}
          onSelect={handleServiceSelect}
          firstDate={formData.firstDateOfStreaming}
          onDateChange={handleDateChange}
          addOns={formData.addOns}
          onAddOnToggle={handleAddOnToggle}
        />
      ))}
    </div>
  );
};

export default Step1;

```

Path: frontend/components/projects/createProject/step2Component/FormInput.tsx

```
import { Step2FormValues } from "@shared/interface/CreateProjectInterface";
import { Input } from "components/ui/input";
import { FieldErrors, RegisterOptions, UseFormRegister } from "react-hook-form";
import { Validator } from "schemas/validators";

export type RegexRule = {
  /** must match this RegExp */
  fn: Validator;
  /** error to show if it doesn’t */
  message: string;
};

export const FormInput = ({
  label,
  type = "text",
  register,
  name,
  required,
  error,
  pattern,
  patternMessage,
  regexRules,
  disabled
}: {
  label: string;
  type?: string;
  register: UseFormRegister<Step2FormValues>;
  name: keyof Step2FormValues;
  required?: boolean;
  error?: FieldErrors<Step2FormValues>[keyof Step2FormValues];
  pattern?: RegExp;
  patternMessage?: string;
    regexRules?: RegexRule[];
    disabled?: boolean;
}) => {
  
  const validation = {
    ...(required
      ? {
          required: "This field is required",
        }
      : {}),
    ...(type === "number"
      ? {
          valueAsNumber: true,
          min: { value: 0, message: "Value cannot be negative" },
        }
      : {}),
      ...(pattern
      ? {
          pattern: {
            value: pattern,
            message: patternMessage || "Invalid format",
          },
        }
      : {}),
       ...(regexRules
      ? {
          validate: (val) => {
            const str = String(val ?? "");
            for (const { fn, message } of regexRules) {
              if (!fn(str)) return message;
            }
            return true;
          },
        }
      : {}),
  } as RegisterOptions<Step2FormValues, typeof name>;
  return (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <Input
      type={type}
      {...(type === "number" ? { min: 0 } : {})}
           {...register(name, validation)}
      className="mt-1 w-full"
      disabled={disabled}
    />
    {error && <p className="text-red-500 text-xs">{error?.message}</p>}
  </div>
)};
```

Path: frontend/components/projects/createProject/step2Component/FormRadioGroup.tsx

```
import { Step2FormValues } from "@shared/interface/CreateProjectInterface";
import { FieldErrors, UseFormRegister } from "react-hook-form";

export const FormRadioGroup = ({
  label,
  name,
  options,
  register,
  error,
  disabled
}: {
  label: string;
  name: keyof Step2FormValues;
  options: string[];
  register: UseFormRegister<Step2FormValues>;
  error?: FieldErrors<Step2FormValues>[keyof Step2FormValues];
  disabled?: boolean;
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <div className="flex items-center gap-6 mt-1">
      {options.map((val) => (
        <label key={val} className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            value={val}
            {...register(name, { required: true })}
            className="accent-custom-orange-1"
            disabled={disabled}
          />
          <span className="text-sm capitalize">{val}</span>
        </label>
      ))}
    </div>
    {error && <p className="text-red-500 text-xs">Please select an option</p>}
  </div>
);
```

Path: frontend/components/projects/createProject/Step2Component.tsx

```
"use client";
import React from "react";
import { Textarea } from "../../ui/textarea";
import {
  Step2FormValues,
  Step2Props,
} from "@shared/interface/CreateProjectInterface";
import CustomButton from "../../shared/CustomButton";
import { useStep2 } from "hooks/useStep2";
import { FormInput } from "./step2Component/FormInput";
import { FormRadioGroup } from "./step2Component/FormRadioGroup";
import { validate } from "../../../schemas/validators";
import {
  alphanumericRules,
  alphaRules,
} from "../../../schemas/validationConfigs";
import { RegisterOptions, UseFormRegister } from "react-hook-form";
import { numberFields, recruitingFields } from "../../../constant/index";

export type FieldConfig = { name: keyof Step2FormValues; label: string };



// Simple textarea wrapper
function FormTextarea({
  name,
  label,
  register,
  rules,
  disabled,
  error,
}: {
  name: keyof Step2FormValues;
  label: string;
  register: UseFormRegister<Step2FormValues>;
  rules?: RegisterOptions<Step2FormValues>;
  disabled: boolean;
  error?: { message?: string };
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <Textarea
        {...register(name, rules)}
        className="mt-1 w-full"
        disabled={disabled}
      />
      {error && <p className="text-red-500 text-xs mt-2">{error.message}</p>}
    </div>
  );
}
const Step2: React.FC<Step2Props> = ({
  formData,
  updateFormData,
  uniqueId,
}) => {
  const { register, handleSubmit, watch, errors, onSubmit, isLoading } =
    useStep2({
      formData,
      updateFormData,
      uniqueId,
    });

  const watchInLanguageHosting = watch("inLanguageHosting");

  return (
  
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-gray-100 p-4 rounded-md">
          <h2 className="text-xl font-bold mb-2 text-center">
            Project Information Request
          </h2>
          <p className="text-sm text-center">
            An Amplify Team member will be in touch by the end of the next
            business day with a quote, or to gather more information so that we
            can provide you with the best pricing and service. If you need costs
            sooner or have more information to provide, please feel free to
            email info@amplifyresearch.com. Thank you!
          </p>
        </div>

        {/* Basic Project Info Fields */}
        {/* Numeric inputs */}
        {numberFields.map(({ name, label }) => (
          <FormInput
            key={name}
            label={label}
            name={name}
            type="number"
            register={register}
            required
            disabled={isLoading}
            error={errors[name]}
          />
        ))}

        {formData.addOns?.includes("Top-Notch Recruiting") &&
          recruitingFields.map(({ name, label }) => (
            <FormInput
              key={name}
              label={label}
              name={name}
              register={register}
              required={name === "recruitmentSpecs"}
              disabled={isLoading}
              error={errors[name]}
              regexRules={alphanumericRules}
            />
          ))}

        {/* Conditional: Multi-Language Services */}
        {formData.addOns.includes("Multi-Language Services") && (
          <>
            <FormInput
              label="What language(s)?"
              name="selectedLanguage"
              register={register}
              required
              disabled={isLoading}
              error={errors.selectedLanguage}
              regexRules={alphaRules}
            />

            <div className="space-y-2">
              <p className="text-sm">
                Amplify can provide in-language hosting services for check-in
                and participant assistance in many languages.
              </p>
              <FormRadioGroup
                label="Will you need in-language hosting?"
                name="inLanguageHosting"
                options={["yes", "no"]}
                register={register}
                disabled={isLoading}
                error={errors.inLanguageHosting}
              />
            </div>

            {watchInLanguageHosting === "yes" && (
              <div className="space-y-2">
                <p className="text-sm">
                  Amplify can provide the technology for including an
                  interpreter in the session, as well as the audio service to
                  allow observers to listen to both in-language and interpreted
                  audio.
                </p>
                <FormRadioGroup
                  label="Will you provide an interpreter?"
                  name="provideInterpreter"
                  options={["yes", "no"]}
                  register={register}
                  disabled={isLoading}
                  error={errors.provideInterpreter}
                />
              </div>
            )}

            <FormTextarea
              name="languageSessionBreakdown"
              label="If some sessions will be in English and some will be non-English, please specify how many of each you will conduct:"
              register={register}
              rules={{
                required: "This field is required", // now v is inferred as string|number|undefined:
                validate: (v) => {
                  if (typeof v !== "string") return true;
                  return (
                    validate(
                      v,
                      alphanumericRules.map((r) => r.fn)
                    ) || "Only letters, numbers & single spaces allowed."
                  );
                },
              }}
              disabled={isLoading}
              error={errors.languageSessionBreakdown}
            />
          </>
        )}

        {/* Anything else */}
        <FormTextarea
          name="additionalInfo"
          label="Anything else we should know about the project?"
          register={register}
          rules={{
            validate: (v) => {
              if (typeof v !== "string") return true;
              return (
                validate(
                  v,
                  alphanumericRules.map((r) => r.fn)
                ) || "Only letters, numbers & single spaces allowed."
              );
            },
          }}
          disabled={isLoading}
          error={errors.additionalInfo}
        />

        <div className="text-center">
          <CustomButton
            type="submit"
            className="bg-custom-teal hover:bg-custom-dark-blue-3"
            disabled={isLoading}
          >
            {isLoading ? "Submitting..." : "Submit Project Information"}
          </CustomButton>
        </div>
      </form>

  );
};

export default Step2;

```

Path: frontend/components/projects/createProject/Step3Component.tsx

```
"use client";

import React, { useState, useEffect } from "react";
import { Label } from "components/ui/label";
import { Input } from "components/ui/input";
import { Button } from "components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "components/ui/select";
import { CheckIcon } from "lucide-react";
import { SessionRow } from "@shared/interface/ProjectInterface";
import {
  ALPHA_REGEX,
  availableLanguages,
  durations,
  PROJECT_NAME_REGEX,
} from "constant";
import { Popover, PopoverContent, PopoverTrigger } from "components/ui/popover";
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
} from "components/ui/command";
import { Step3Props } from "@shared/interface/CreateProjectInterface";
import { IProjectForm } from "@shared/interface/ProjectFormInterface";
import { Switch } from "components/ui/switch";
import { Tooltip, TooltipTrigger } from "components/ui/tooltip";
import { TooltipContent } from "@radix-ui/react-tooltip";
import { BiQuestionMark } from "react-icons/bi";
import { timeZones } from "constant";
import SessionsTable from "./SessionsTable";
import {
  alphanumericSingleSpace,
  lettersAndSpaces,
  noLeadingSpace,
  noMultipleSpaces,
  noTrailingSpace,
  validate,
} from "schemas/validators";
import { makeOnChange } from "utils/validationHelper";

const Step3: React.FC<Step3Props> = ({ formData, updateFormData }) => {
  // ========= Respondent Languages =========
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    Array.isArray(formData.respondentLanguage)
      ? formData.respondentLanguage
      : formData.respondentLanguage
      ? [formData.respondentLanguage]
      : []
  );
  const [otherLanguage, setOtherLanguage] = useState<string>("");
  const [otherLangError, setOtherLangError] = useState<string>("");
  const [projectName, setProjectName] = useState<string>(formData.name || "");
  const [defaultTimeZone, setDefaultTimeZone] = useState<
    IProjectForm["defaultTimeZone"] | ""
  >(formData.defaultTimeZone ?? "");
  const [defaultBreakoutRoom, setDefaultBreakoutRoom] = useState<boolean>(
    formData.defaultBreakoutRoom ?? false
  );
  const [projectNameError, setProjectNameError] = useState<string>("");
  // ========= Respondent Country =========
  const isInitiallyOther =
    formData.respondentCountry && formData.respondentCountry !== "USA";
  const [countrySelection, setCountrySelection] = useState<"USA" | "Other">(
    isInitiallyOther ? "Other" : "USA"
  );
  const [otherCountry, setOtherCountry] = useState<string>(
    isInitiallyOther ? formData.respondentCountry : ""
  );
  const [otherCountryError, setOtherCountryError] = useState<string>("");
  // ========= Sessions =========
  const [sessionRows, setSessionRows] = useState<SessionRow[]>(
    () =>
      formData.sessions?.map((s, i) => ({
        id: `${Date.now()}_${i}`,
        number: s.number,
        duration: s.duration,
      })) || [{ id: Date.now().toString(), number: 1, duration: durations[0] }]
  );

  // ========= Update Parent State =========
  useEffect(() => {
    if (!validateProjectName()) return;

    if (selectedLanguages.includes("Other") && !validateOtherLanguage()) return;

    const computedLanguages = selectedLanguages.includes("Other")
      ? [
          ...selectedLanguages.filter((lang) => lang !== "Other"),
          ...(otherLanguage.trim() ? [otherLanguage.trim()] : []),
        ]
      : selectedLanguages;

    if (countrySelection === "Other" && !validateOtherCountry()) return;

    const finalCountry =
      countrySelection === "USA" ? "USA" : otherCountry.trim();

    updateFormData({
      name: projectName,
      respondentLanguage: computedLanguages,
      respondentCountry: finalCountry,
      sessions: sessionRows.map((row) => ({
        number: row.number,
        duration: row.duration,
      })),
      defaultTimeZone:
        (defaultTimeZone as IProjectForm["defaultTimeZone"]) || undefined,
      defaultBreakoutRoom,
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    projectName,
    selectedLanguages,
    otherLanguage,
    countrySelection,
    otherCountry,
    sessionRows,
  ]);

  // ========= Multi-Select Handlers =========
  const toggleLanguage = (lang: string) => {
    if (selectedLanguages.includes(lang)) {
      setSelectedLanguages(selectedLanguages.filter((l) => l !== lang));
    } else {
      setSelectedLanguages([...selectedLanguages, lang]);
    }
  };

  // ========= Respondent Country Handlers =========
  const handleCountrySelection = (value: "USA" | "Other") => {
    setCountrySelection(value);
    if (value === "USA") {
      setOtherCountry("");
    }
  };

  const validateOtherLanguage = () => {
    if (!otherLanguage.trim()) {
      setOtherLangError("Please enter a language.");
      return false;
    }
    if (!ALPHA_REGEX.test(otherLanguage.trim())) {
      setOtherLangError("Only letters and spaces are allowed.");
      return false;
    }
    setOtherLangError("");
    return true;
  };

  const validateOtherCountry = () => {
    const trimmed = otherCountry.trim();
    if (!trimmed) {
      setOtherCountryError("Please enter a country.");
      return false;
    }
    if (!ALPHA_REGEX.test(trimmed)) {
      setOtherCountryError("Only letters and spaces are allowed.");
      return false;
    }
    setOtherCountryError("");
    return true;
  };

  const validateProjectName = () => {
    const trimmed = projectName.trim();

    if (!trimmed) {
      setProjectNameError("Project Name is required.");
      return false;
    }

    // compose all your rules in one call:
    const ok = validate(trimmed, [
      noLeadingSpace,
      noTrailingSpace,
      noMultipleSpaces,
      (v) => PROJECT_NAME_REGEX.test(v),
    ]);

    if (!ok) {
      setProjectNameError(
        "Project Name must be letters, numbers, dashes/underscores, single spaces, no edge spaces."
      );
      return false;
    }

    setProjectNameError("");
    return true;
  };

  return (
    <div className="space-y-4">
      {/* Project Name Input */}
      <div>
        <Label className="text-sm font-medium">Project Name*</Label>
        <Input
          type="text"
          className={`mt-1 w-full ${projectNameError ? "border-red-500" : ""}`}
          autoFocus
          value={projectName}
          onChange={makeOnChange<"projectName">(
            "projectName",
            [noLeadingSpace, noMultipleSpaces, alphanumericSingleSpace],
            "Project Name must only contain letters/numbers and single spaces (no edge/multiple spaces).",
            (upd) => {
              setProjectName(upd.projectName);
              if (projectNameError) setProjectNameError("");
            }
          )}
          onBlur={validateProjectName}
          required
        />
        {projectNameError && (
          <p className="text-red-500 text-sm mt-1">{projectNameError}</p>
        )}
      </div>
      {/* Default Time Zone and Breakout Room */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium">Default Time Zone</Label>
          <Select
            value={defaultTimeZone ?? ""}
            onValueChange={(v) =>
              setDefaultTimeZone(v as IProjectForm["defaultTimeZone"])
            }
          >
            <SelectTrigger className="w-full">
              {(() => {
                if (!defaultTimeZone) return "Select time zone";
                const tz = timeZones.find((t) => t.name === defaultTimeZone);
                if (!tz) return defaultTimeZone;
                const computedLabel =
                  tz.utc === "+00" && tz.name === "London Time"
                    ? "(UTC-00) London Time"
                    : `(UTC${tz.utc}) ${tz.name}`;
                return computedLabel;
              })()}
            </SelectTrigger>
            <SelectContent>
              {timeZones.map(
                (tz: {  utc: string; name: string }) => {
                  const computedLabel =
                    tz.utc === "+00" && tz.name === "London Time"
                      ? "(UTC-00) London Time"
                      : `(UTC${tz.utc}) ${tz.name}`;
                  return (
                    <SelectItem key={`${tz.name}-${tz.utc}`} value={tz.name}>
                      {computedLabel}
                    </SelectItem>
                  );
                }
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">
              Do you need breakout room functionality?
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <BiQuestionMark className="ml-2 h-5 w-5 text-custom-orange-2 hover:text-custom-orange-1 cursor-help rounded-full border-custom-orange-2 border-[1px] px-0.5 mb-1.5" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs bg-white text-black shadow-sm p-2 z-50">
                Breakout rooms allow you to split participants into separate
                rooms during your session for smaller group discussions or
                activities. The moderator can only be present in one room at a
                time, but all breakout rooms will be streamed to the backroom
                for observers to view and will be recorded.
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={defaultBreakoutRoom}
              onCheckedChange={(b) => setDefaultBreakoutRoom(b)}
              className="cursor-pointer"
            />
            <span className="text-sm font-medium">
              {defaultBreakoutRoom ? "Yes" : "No"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Multi-Select for Languages using Popover and Command */}
        <div>
          <Label className="text-sm font-medium">Respondent Language(s)*</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full text-left">
                {selectedLanguages.length > 0
                  ? selectedLanguages.join(", ")
                  : "Select languages"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search languages..." />
                <CommandList>
                  {availableLanguages.map((lang) => (
                    <CommandItem
                      key={lang}
                      onSelect={() => toggleLanguage(lang)}
                      className="cursor-pointer flex items-center"
                    >
                      {selectedLanguages.includes(lang) && (
                        <CheckIcon className="mr-2 h-4 w-4" />
                      )}
                      {lang}
                    </CommandItem>
                  ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {selectedLanguages.includes("Other") && (
            <div className="mt-2">
              <Label className="text-sm font-medium">Other Language(s)*</Label>
              <Input
                name="otherLanguage"
                placeholder="Enter language"
                value={otherLanguage}
                onChange={makeOnChange<"otherLanguage">(
                  "otherLanguage",
                  [noLeadingSpace, noMultipleSpaces, lettersAndSpaces],
                  "Language must contain only letters & spaces, no edge spaces.",
                  ({ otherLanguage }) => {
                    setOtherLanguage(otherLanguage);
                    if (otherLangError) setOtherLangError("");
                  }
                )}
                onBlur={() => {
                  // final trim + collapse spaces
                  const clean = otherLanguage.trim().replace(/\s+/g, " ");
                  setOtherLanguage(clean);
                  validateOtherLanguage();
                }}
                className={`mt-1 w-full ${
                  otherLangError ? "border-red-500" : ""
                }`}
              />
              {otherLangError && (
                <p className="text-red-500 text-sm mt-1">{otherLangError}</p>
              )}
            </div>
          )}
          {formData.service === "Concierge" && (
            <p className="text-sm text-custom-orange-1 mt-2">
              Please note that all Amplify hosting will be in English. If you
              need in-language hosting, please select in-Language Services on
              the previous screen.
            </p>
          )}
        </div>

        {/* Respondent Country  */}
        <div>
          <Label className="text-sm font-medium">Respondent Country</Label>
          <Select
            value={countrySelection}
            onValueChange={(value: "USA" | "Other") =>
              handleCountrySelection(value)
            }
          >
            <SelectTrigger className="w-full">{countrySelection}</SelectTrigger>
            <SelectContent>
              <SelectItem value="USA">USA</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
          {countrySelection === "Other" && (
            <div className="mt-2">
              <Label className="text-sm font-medium">
                Specify Country Name
              </Label>
              <Input
                name="otherCountry"
                placeholder="Enter country"
                value={otherCountry}
                onChange={makeOnChange<"otherCountry">(
                  "otherCountry",
                  [noLeadingSpace, noMultipleSpaces, lettersAndSpaces],
                  "Country must contain only letters & spaces, no edge spaces.",
                  ({ otherCountry }) => {
                    setOtherCountry(otherCountry);
                    if (otherCountryError) setOtherCountryError("");
                  }
                )}
                onBlur={() => {
                  const clean = otherCountry.trim().replace(/\s+/g, " ");
                  setOtherCountry(clean);
                  validateOtherCountry();
                }}
                className={`mt-1 w-full ${
                  otherCountryError ? "border-red-500" : ""
                }`}
              />
              {otherCountryError && (
                <p className="text-red-500 text-sm mt-1">{otherCountryError}</p>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Sessions Table */}
      <div>
        <h2 className="text-lg font-bold flex items-center">
          Sessions Information
          <Tooltip>
            <TooltipTrigger asChild>
              <BiQuestionMark className="ml-2 h-5 w-5 text-custom-orange-2 hover:text-custom-orange-1 cursor-help rounded-full border-custom-orange-2 border-[1px] p-0.5" />
            </TooltipTrigger>
            <TooltipContent
              side="top"
              align="start"
              className="
        bg-white 
        border border-gray-200 
        rounded-lg 
        p-3 
        max-w-xs 
        shadow-lg
      "
            >
              <div className="text-sm text-gray-700">
                If you have sessions of varying lengths, use the{" "}
                <span
                  className="
            inline-flex items-center justify-center 
            w-5 h-5 border-[1px]
           border-custom-orange-2 p-0.5 
            rounded-full 
            text-custom-orange-2 
            font-bold
          "
                >
                  +
                </span>{" "}
                to add additional sessions.
              </div>
            </TooltipContent>
          </Tooltip>
        </h2>

        <SessionsTable
          initialSessions={sessionRows}
          onChange={(newRows) => setSessionRows(newRows)}
        />
      </div>
    </div>
  );
};

export default Step3;

```

Path: frontend/components/projects/createProject/step4Component/ProjectDetails.tsx

```

import { Step4Props } from '@shared/interface/CreateProjectInterface';
import React from 'react';


export function ProjectDetails({ data }: { data: Step4Props['formData'] }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Project Details</h2>
      <p><strong>Project Name:</strong> {data.name}</p>
      <p><strong>Service:</strong> {data.service}</p>
      <p><strong>Respondent Market:</strong> {data.respondentCountry}</p>
      <p><strong>Respondent Language:</strong> {
        Array.isArray(data.respondentLanguage)
          ? data.respondentLanguage.join(', ')
          : data.respondentLanguage
      }</p>
    </div>
  );
}

```

Path: frontend/components/projects/createProject/step4Component/ProjectEstimateTable.tsx

```
import React from 'react';
import { Card, CardContent } from 'components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from 'components/ui/table';
import { durationMapping } from 'constant';
import { Step4Props } from '@shared/interface/CreateProjectInterface';

export function ProjectEstimateTable({ sessions, service }: { sessions: Step4Props['formData']['sessions'], service: string }) {
  
  
  const rows = sessions.map(s => {
    const qty = s.number;
    const dur = Number(durationMapping[s.duration] || s.duration);
    const hours = (qty * dur) / 60;
    const credits = qty * dur * 2.75;
    return { service, qty, dur, hours: hours.toFixed(2), credits: credits.toFixed(2) };
  });
  // const totalHours = rows.reduce((sum, r) => sum + parseFloat(r.hours), 0).toFixed(2);
  const totalCredits = rows.reduce((sum, r) => sum + parseFloat(r.credits), 0).toFixed(2);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Project Estimate</h2>
      <Card className="shadow-md">
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow className="text-custom-teal">
                <TableHead className="pl-6">Service</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Session Duration (mins)</TableHead>
                <TableHead className="text-right">Estimated Hours</TableHead>
                <TableHead className="text-right">Total Credits Needed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="pl-6">{r.service}</TableCell>
                  <TableCell className="text-right">{r.qty}</TableCell>
                  <TableCell className="text-right">{r.dur}</TableCell>
                  <TableCell className="text-right">{r.hours}</TableCell>
                  <TableCell className="text-right">{r.credits}</TableCell>
                </TableRow>
              ))}
              <TableRow className="font-semibold">
                <TableCell colSpan={4} className="pl-6">TOTAL</TableCell>
                {/* <TableCell className="text-right">{totalHours}</TableCell> */}
                <TableCell className="text-right">{totalCredits}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <p className="pt-5 text-sm">
        *Final billing will be based on actual streaming hours for sessions booked.
      </p>
    </div>
  );
}

```

Path: frontend/components/projects/createProject/step4Component/PurchaseCreditsTable.tsx

```
// components/projects/review/PurchaseCreditsTable.tsx
import React from 'react';
import { creditPackages, quantityOptions } from 'constant';
import { Card, CardContent } from 'components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from 'components/ui/table';
import { Select, SelectTrigger, SelectContent, SelectItem } from 'components/ui/select';

export function PurchaseCreditsTable({
  purchaseQuantities,
  onChange,
  totalPrice
}: {
  purchaseQuantities: Record<number, number>;
  onChange: (pkg: number, qty: number) => void;
  totalPrice: number;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Purchase Credits</h2>
      <Card className="shadow-sm">
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow className="text-custom-teal">
                <TableHead className="pl-6">Quantity</TableHead>
                <TableHead className="text-right">Credit Package</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Total Price (USD)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {creditPackages.map(pkg => {
                const qty = purchaseQuantities[pkg.package] || 0;
                return (
                  <TableRow key={pkg.package}>
                    <TableCell className="pl-6">
                      <Select
                        value={qty.toString()}
                        onValueChange={v => onChange(pkg.package, +v)}
                      >
                        <SelectTrigger className="w-20">{qty || 'Select'}</SelectTrigger>
                        <SelectContent>
                          {quantityOptions.map(opt => (
                            <SelectItem key={opt} value={opt.toString()}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">{pkg.package}</TableCell>
                    <TableCell className="text-right">{pkg.cost}</TableCell>
                    <TableCell className="text-right">{(qty * pkg.cost).toFixed(2)}</TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="font-semibold">
                <TableCell colSpan={3} className="pl-6 text-left">Total Price (USD)</TableCell>
                <TableCell className="text-right">{totalPrice.toFixed(2)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

```

Path: frontend/components/projects/createProject/step4Component/TermsAndConditions.tsx

```
// components/projects/review/TermsAndConditions.tsx
import React from 'react';

export function TermsAndConditions() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Terms and Conditions</h2>
      <p className="text-sm">
        Credits purchased are tied to your account and can be used for any
          project you create. You can add credits at any time. Signature Service
          will be billed based on actual streaming time and will be charged in
          15-minute increments. Concierge Service is billed based on scheduled
          sessions. You may reschedule or modify a session up to three business
          days in advance without penalty. Cancellations, changes, or no-shows
          within three business days of any session will be charged the full
          time of the original scheduled session, along with any additional time
          required for rescheduling. Sessions will be charged in 15-minute
          increments. If you exceed your pre-paid credits—including time
          overages and/or scheduling changes—you will be billed at a rate of
          $175 per 100 credits, billed in 100 credit increments to replenish
          your account. These credits will be automatically charged to your
          credit card on file on the day the usage is incurred.
      </p>
    </div>
  );
}

```

Path: frontend/components/projects/createProject/Step4Component.tsx

```
"use client";
import React, { useState } from "react";
import { creditPackages } from "constant";
import {
  IProjectFormState,
  Step4Props,
} from "@shared/interface/CreateProjectInterface";

import PurchaseModal from "./PurchaseModal";
import { ProjectDetails } from "./step4Component/ProjectDetails";
import { TermsAndConditions } from "./step4Component/TermsAndConditions";
import { PurchaseCreditsTable } from "./step4Component/PurchaseCreditsTable";
import { ProjectEstimateTable } from "./step4Component/ProjectEstimateTable";

const Step4: React.FC<Step4Props> = ({ formData, uniqueId }) => {
  const [purchaseQuantities, setPurchaseQuantities] = useState<{
    [key: number]: number;
  }>({
    500: 0,
    2500: 0,
    15000: 0,
    50000: 0,
  });

  // Handle changes to the quantity of a credit package
  const handleQuantityChange = (pkg: number, qty: number) => {
    setPurchaseQuantities((prev) => ({
      ...prev,
      [pkg]: qty,
    }));
  };

  // Calculate the total purchase price from selected credit packages
  const totalPurchasePrice = creditPackages.reduce((acc, pkg) => {
    const quantity = purchaseQuantities[pkg.package] || 0;
    return acc + quantity * pkg.cost;
  }, 0);

  //  Calculate the total credits based on the Purchase Credits table selection.
  const totalPurchasedCredits = creditPackages.reduce((acc, pkg) => {
    const quantity = purchaseQuantities[pkg.package] || 0;
    return acc + quantity * pkg.package;
  }, 0);

  return (
   
      <div className="space-y-6 ">
        {/* Project Details */}
        <ProjectDetails data={formData} />

        <ProjectEstimateTable
          sessions={formData.sessions}
          service={formData.service}
        />

        {/* Available Credits */}
        <div className="">
          <h2 className="text-xl font-semibold ">Available Credits: 0</h2>
        </div>

        {/* Purchase Credits Table */}

        <PurchaseCreditsTable
          purchaseQuantities={purchaseQuantities}
          onChange={handleQuantityChange}
          totalPrice={totalPurchasePrice}
        />

        {/* Terms and Conditions */}

        <TermsAndConditions />

        {/* Pay Now Modal Trigger */}
        <div className="text-center mt-6">
          {uniqueId && (
            <PurchaseModal
              creditPackages={creditPackages}
              purchaseQuantities={purchaseQuantities}
              totalPurchasePrice={totalPurchasePrice}
              totalCreditsNeeded={totalPurchasedCredits}
              projectData={formData as IProjectFormState}
            />
          )}
        </div>
      </div>
   
  );
};

export default Step4;

```

Path: frontend/components/projects/NoSearchResult.tsx

```
"use client";

import { FolderSearch } from "lucide-react";
import { cn } from "lib/utils";

interface NoSearchResultProps {
  className?: string;
}

const NoSearchResult = ({ className }: NoSearchResultProps) => {
  return (
    <div className={cn("flex justify-center items-center", className)}>
      <div className="flex flex-col justify-center items-center gap-5 pt-32">
        <FolderSearch className="h-48 w-48 text-gray-200" />
        <h1 className="text-blue-900 text-4xl font-bold text-center">
          NO RESULTS FOUND
        </h1>
        <p className="text-center text-2xl text-blue-950">
          Ooops… We can&apos;t find any projects matching your search. <br />{" "}
          Try searching again.
        </p>
      </div>
    </div>
  );
};

export default NoSearchResult;

```

Path: frontend/components/projects/observerDocuments/UploadObserverDocuments.tsx

```
"use client";

import React, { useState } from "react";
import {
  keepPreviousData,
  useQuery,
} from "@tanstack/react-query";
import api from "../../../lib/api";
import CustomButton from "../../shared/CustomButton";
import { Upload } from "lucide-react";
import { ISession } from "@shared/interface/SessionInterface";
import { IPaginationMeta } from "@shared/interface/PaginationInterface";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import useUploadObserverDocument from "../../../hooks/useUploadObserverDocument";

interface UploadProps {
  projectId: string;
  onClose: ()=> void;
}

const UploadObserverDocument: React.FC<UploadProps> = ({ projectId, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [sessionId, setSessionId] = useState<string>("");

  // 1️⃣ Fetch all sessions for this project
  const {
    data: sessionsData,
    isLoading: isSessionsLoading,
    error: sessionsError,
  } = useQuery<{ data: ISession[]; meta: IPaginationMeta }, Error>({
    queryKey: ["sessions", projectId],
    queryFn: () =>
      api
        .get<{ data: ISession[]; meta: IPaginationMeta }>(
          `/api/v1/sessions/project/${projectId}`,
          { params: { page: 1, limit: 100 } }
        )
        .then((res) => res.data),
    enabled: !!projectId,
    placeholderData: keepPreviousData,
  });


  // 2️⃣ Mutation to upload the file + projectId + sessionId + user info
  const {
   mutate: upload,
   isPending: isUploading,
   isError: uploadError,
   error: uploadErrorObj,
 } = useUploadObserverDocument(projectId, onClose);

  if (sessionsError) {
    return (
      <p className="text-red-500">
        Error loading sessions: {sessionsError.message}
      </p>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 pt-5">
        <Select
          value={sessionId}
          onValueChange={setSessionId}
          disabled={isSessionsLoading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a session…" />
          </SelectTrigger>
          <SelectContent>
            {sessionsData?.data.map((s) => (
              <SelectItem key={s._id} value={s._id}>
                {s.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input
          type="file"
          accept="*/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block pr-3"
        />
      </div>
      <div className="flex justify-center pt-5">
        <CustomButton
          icon={<Upload />}
          text={isUploading ? "Uploading..." : "Upload"}
          onClick={() => file && sessionId && upload({ file, sessionId })}
          disabled={!file || !sessionId || isUploading}
          variant="default"
          className="bg-custom-orange-2 text-white hover:bg-custom-orange-1"
        />
      </div>
      {uploadError  && (
        <p className="text-red-500">
          Error: {(uploadErrorObj as Error).message}
        </p>
      )}
    </div>
  );
};

export default UploadObserverDocument;

```

Path: frontend/components/projects/polls/AddPollDialog.tsx

```
import { Switch } from "components/ui/switch";
import {
  CreatePollPayload,
  DraftQuestion,
  IPoll,
  QuestionType,
} from "@shared/interface/PollInterface";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import CustomButton from "components/shared/CustomButton";
import { Button } from "components/ui/button";
import { Card, CardContent, CardFooter } from "components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "components/ui/dropdown-menu";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";
import api from "lib/api";
import {
  AlignJustify,
  ArrowUpDown,
  CheckSquare,
  Circle,
  Edit2,
  LinkIcon,
  Minus,
  MoreHorizontal,
  Plus,
  Smile,
  TypeIcon,
  Upload,
} from "lucide-react";
import React, { useRef, useState } from "react";
import { toast } from "sonner";
import SingleChoiceQuestion from "./SingleChoiceQuestion";
import MultipleChoiceQuestion from "./MultipleChoiceQuestion";
import MatchingQuestion from "./MatchingQuestion";
import RankOrderQuestion from "./RankOrderQuestion";
import FillInBlankQuestion from "./FillInBlankQuestion";
import RatingScaleQuestion from "./RatingScaleQuestion";
import {
  lettersAndSpaces,
  noLeadingSpace,
  noMultipleSpaces,
  noSpecialChars,
  validate,
} from "schemas/validators";

const questionTypeOptions: {
  value: QuestionType;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "SINGLE_CHOICE",
    label: "Single Choice",
    icon: <Circle className="mr-2 h-4 w-4" />,
  },
  {
    value: "MULTIPLE_CHOICE",
    label: "Multiple Choice",
    icon: <CheckSquare className="mr-2 h-4 w-4" />,
  },
  {
    value: "MATCHING",
    label: "Matching",
    icon: <LinkIcon className="mr-2 h-4 w-4" />,
  },
  {
    value: "RANK_ORDER",
    label: "Rank Order",
    icon: <ArrowUpDown className="mr-2 h-4 w-4" />,
  },
  {
    value: "SHORT_ANSWER",
    label: "Short Answer",
    icon: <TypeIcon className="mr-2 h-4 w-4" />,
  },
  {
    value: "LONG_ANSWER",
    label: "Long Answer",
    icon: <AlignJustify className="mr-2 h-4 w-4" />,
  },
  {
    value: "FILL_IN_BLANK",
    label: "Fill in the Blank",
    icon: <Edit2 className="mr-2 h-4 w-4" />,
  },
  {
    value: "RATING_SCALE",
    label: "Rating Scale",
    icon: <Smile className="mr-2 h-4 w-4" />,
  },
];

export type WithImage = {
  imageFile?: File;
  tempImageName?: string;
  imageUrl?: string;
};

type DraftWithImage = DraftQuestion & WithImage;

const defaultQuestion = (
  overrides: Partial<DraftQuestion & WithImage> = {}
): DraftQuestion & WithImage => ({
  id: crypto.randomUUID(),
  prompt: "",
  type: "SINGLE_CHOICE",
  options: ["", ""],
  answers: overrides.type === "FILL_IN_BLANK" ? [] : ["", ""],
  rows: [],
  columns: [],
  required: false,
  correctAnswer: 0,
  showDropdown: true,
  correctAnswers: [],
  minChars: 1,
  maxChars: 200,
  scoreFrom: 0,
  scoreTo: 10,
  lowLabel: "",
  highLabel: "",
  ...overrides,
});

interface CreatePollResponse {
  data: IPoll;
}

// Returns an error message or null if that question is valid
export const validateQuestion = (q: DraftWithImage): string | null => {
  const prompt = q.prompt.trimEnd();

  // 0) Prompt must not be blank
  if (!prompt) {
    return "Question text is required";
  }
  // 1) No leading space
  if (!noLeadingSpace(prompt)) {
    return "Question must not start with a space";
  }
  // 2) No multiple spaces
  if (!noMultipleSpaces(prompt)) {
    return "Question must not contain consecutive spaces";
  }

  switch (q.type) {
    case "SINGLE_CHOICE":
      if (q.answers.length < 2) return "Need at least two choices";
      if (q.answers.some((a) => !a.trim())) return "All choices must be filled";
      if (q.correctAnswer == null) return "Select a correct answer";
      return null;

    case "MULTIPLE_CHOICE":
      if (q.answers.length < 2) return "Need at least two choices";
      if (q.answers.some((a) => !a.trim())) return "All choices must be filled";
      if (!q.correctAnswers?.length)
        return "Select at least one correct answer";
      return null;

    case "MATCHING":
      if (q.options.length < 1 || q.answers.length < 1) {
        return "Need at least one matching pair";
      }
      if (q.options.length !== q.answers.length) {
        return "Options and answers count must match";
      }
      if (
        q.options.some((o) => !o.trim()) ||
        q.answers.some((a) => !a.trim())
      ) {
        return "All matching pairs must be filled";
      }
      return null;

    case "RANK_ORDER": {
  const rows    = q.rows?.length    ? q.rows    : q.options;
    const columns = q.columns?.length ? q.columns : q.answers;

  if (rows.length < 2) {
    return "Need at least two items to rank";
  }
  if (rows.some((r) => !r.trim())) {
    return "All rank items must be filled";
  }
  if (columns.length < 2) {
    return "Need at least two columns";
  }
  if (columns.some((c) => !c.trim())) {
    return "All rank columns must be filled";
  }
  if (rows.length !== columns.length) {
    return "Rows and columns count must match";
  }
  return null;
}
    case "FILL_IN_BLANK":
      const blanks = Array.from(q.prompt.matchAll(/\[blank \d+\]/g)).length;
      if (blanks === 0) {
        return "Insert at least one blank (`[blank N]`) tag";
      }
      if (q.answers.length !== blanks) {
        return "Number of answers must match number of blanks";
      }
      if (q.answers.some((a) => !a.trim())) {
        return "All blank answers must be filled";
      }
      return null;

    case "SHORT_ANSWER":
    case "LONG_ANSWER":
      if (q.minChars! > q.maxChars!)
        return "Min characters cannot exceed max characters";
      return null;

    case "RATING_SCALE":
      if (q.scoreFrom == null || q.scoreTo == null)
        return "Specify both score From and To";
      if (q.scoreFrom! >= q.scoreTo!)
        return "`scoreFrom` must be less than `scoreTo`";
      return null;

    default:
      return null;
  }
};

// Runs validateQuestion on every question; returns true if all pass
const titleValidators = [
  noLeadingSpace,
  noMultipleSpaces,
  noSpecialChars,
  lettersAndSpaces,
];

export const validateTitle = (t: string): string | null => {
  if (!t.trim()) return "Title is required";
  if (!validate(t, titleValidators))
    return "Title must only contain letters and single spaces, with no leading/multiple spaces or special characters";
  return null;
};

export function allQuestionsValid(qs: DraftQuestion[]) {
  return qs.every((q) => validateQuestion(q) === null);
}

const AddPollDialog = ({
  projectId,
  user,
}: {
  projectId: string;
  user: { _id: string; role: string };
}) => {
  const queryClient = useQueryClient();

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [title, setTitle] = useState("");
  const [open, setOpen] = useState(false);
  const [questions, setQuestions] = useState<DraftWithImage[]>(() => [
    defaultQuestion(),
  ]);

  const resetForm = () => {
    setTitle("");
    setQuestions([defaultQuestion()]);
  };

  const createPollMutation = useMutation<
    IPoll,
    AxiosError<CreatePollResponse> | Error,
    CreatePollPayload
  >({
    mutationFn: () => {
      const formData = new FormData();

      const questionsPayload = questions.map((q) => {
      // Drop the two file fields from every question
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { imageFile, tempImageName, ...rest } = q;

      if (q.type === "RANK_ORDER") {
        // Pull out the legacy fields and spit back in rows/columns
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { options, answers } = rest as any;
        return {
          ...rest,
          type: "RANK_ORDER",
          rows: options,
          columns: answers,
        };
      }

      // Everything else just keeps the other properties
      return rest;
    });

      formData.append("questions", JSON.stringify(questionsPayload));
      formData.append("projectId", projectId);
      formData.append("title", title.trim());
      formData.append("createdBy", user._id);
      formData.append("createdByRole", user.role);

      // attach actual files under "images"
      questions.forEach((q) => {
        if (q.imageFile && q.tempImageName) {
          formData.append("images", q.imageFile, q.tempImageName);
        }
      });

      return api
        .post<CreatePollResponse>("/api/v1/polls", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((r) => r.data.data);
    },

    // 2) callbacks
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["polls", projectId] });
      toast.success("Poll created!");
      setOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to create poll"
      );
    },
  });

  // 2️⃣ hook up Save
  const onSave = () => {
    if (!projectId || !user) return;

    const titleError = validateTitle(title);
    if (titleError) {
      toast.error(titleError);
      return;
    }

    if (!allQuestionsValid(questions)) {
      // Find the first invalid question and report its error
      const firstError = questions
        .map((q) => ({ id: q.id, err: validateQuestion(q) }))
        .find((x) => x.err !== null);
      toast.error(
        firstError
          ? `Question ${
              questions.findIndex((q) => q.id === firstError.id) + 1
            }: ${firstError.err}`
          : "Please fix the errors in your questions"
      );
      return;
    }

    const payloadQs = questions.map((q) => {
      if (q.type === "RANK_ORDER") {
        const { options, answers, ...rest } = q;
        return {
          ...rest,
          type: "RANK_ORDER",
          rows: options,
          columns: answers,
        };
      }
      return q;
    });

    createPollMutation.mutate({
      projectId,
      // sessionId: ,
      title: title.trim(),
      questions: payloadQs as unknown as DraftQuestion[],
      createdBy: user._id,
      createdByRole: user.role,
    });
  };

  const addQuestion = () => {
    setQuestions((qs) => [...qs, defaultQuestion()]);
  };

  const updateQuestion = (id: string, patch: Partial<DraftWithImage>) =>
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));

  const removeQuestion = (id: string) =>
    setQuestions((qs) => qs.filter((q) => q.id !== id));

  const duplicateQuestion = (id: string) => {
    const orig = questions.find((q) => q.id === id)!;
    setQuestions((qs) => [
      ...qs,
      defaultQuestion({ ...orig, id: crypto.randomUUID() }),
    ]);
  };

  const updateType = (id: string, type: QuestionType) => {
    if (type === "SINGLE_CHOICE") {
      updateQuestion(id, {
        type,
        options: ["", ""],
        answers: ["", ""],
        correctAnswer: 0,
        showDropdown: true,
        correctAnswers: [],
      });
    } else if (type === "MULTIPLE_CHOICE") {
      updateQuestion(id, {
        type,
        options: ["", ""],
        answers: ["", ""],
        correctAnswer: undefined,
        showDropdown: undefined,
        correctAnswers: [],
      });
    } else if (type === "RATING_SCALE") {
      updateQuestion(id, {
        type,
        scoreFrom: 0,
        scoreTo: 10,
        lowLabel: "",
        highLabel: "",
        options: [],
        answers: [],
        rows: [],
        columns: [],
      });
    } else if (type === "MATCHING")
      updateQuestion(id, { type, options: ["", ""], answers: ["", ""] });
    else if (type === "SHORT_ANSWER")
      updateQuestion(id, {
        type,
        options: [],
        answers: [],
        minChars: 1,
        maxChars: 200,
      });
    else if (type === "LONG_ANSWER")
      updateQuestion(id, {
        type,
        options: [],
        answers: [],
        minChars: 1,
        maxChars: 2000,
      });
    else if (type === "FILL_IN_BLANK") {
      updateQuestion(id, { type, prompt: "", answers: [] });
    } else updateQuestion(id, { type, options: [], answers: ["", ""] });
  };

  // Single/multi choice handlers
  const addChoice = (id: string) => {
    const q = questions.find((q) => q.id === id)!;
    updateQuestion(id, { answers: [...q.answers, ""] });
  };
  const updateChoice = (id: string, i: number, val: string) => {
    const q = questions.find((q) => q.id === id)!;
    updateQuestion(id, {
      answers: q.answers.map((a, j) => (j === i ? val : a)),
    });
  };
  const removeChoice = (id: string, i: number) => {
    const q = questions.find((q) => q.id === id)!;
    updateQuestion(id, { answers: q.answers.filter((_, j) => j !== i) });
  };

  // Matching row handlers
  const addOption = (id: string) => {
    const q = questions.find((q) => q.id === id)!;
    updateQuestion(id, { options: [...q.options, ""] });
  };
  const updateOption = (id: string, i: number, val: string) => {
    const q = questions.find((q) => q.id === id)!;
    updateQuestion(id, {
      options: q.options.map((o, j) => (j === i ? val : o)),
    });
  };
  const removeOption = (id: string, i: number) => {
    const q = questions.find((q) => q.id === id)!;
    updateQuestion(id, { options: q.options.filter((_, j) => j !== i) });
  };

  // Matching column / blanks handlers
  const addAnswer = (id: string) => {
    const q = questions.find((q) => q.id === id)!;
    updateQuestion(id, { answers: [...q.answers, ""] });
  };
  const updateAnswer = (id: string, i: number, val: string) => {
    const q = questions.find((q) => q.id === id)!;
    updateQuestion(id, {
      answers: q.answers.map((a, j) => (j === i ? val : a)),
    });
  };
  const removeAnswer = (id: string, i: number) => {
    const q = questions.find((q) => q.id === id)!;
    updateQuestion(id, { answers: q.answers.filter((_, j) => j !== i) });
  };

  // Fill-in-Blank: insert <blank N> at cursor
  function addBlank(id: string) {
    const q = questions.find((x) => x.id === id)!;
    const n = (q.answers || []).length + 1;
    const tag = `[blank ${n}]`;

    const input = inputRefs.current[id];
    if (input) {
      // 1️⃣ Grab the raw value
      const value = input.value;

      // 2️⃣ Null-coalesce onto the ends
      const start = input.selectionStart ?? value.length;
      const end = input.selectionEnd ?? value.length;

      // 3️⃣ Split/insert
      const before = value.slice(0, start);
      const after = value.slice(end);
      const newPrompt = before + tag + after;

      updateQuestion(id, {
        prompt: newPrompt,
        answers: [...(q.answers || []), ""],
      });

      // 4️⃣ restore focus/caret
      setTimeout(() => {
        input.focus();
        const pos = before.length + tag.length;
        input.setSelectionRange(pos, pos);
      });
    } else {
      // fallback
      updateQuestion(id, {
        prompt: q.prompt + tag,
        answers: [...(q.answers || []), ""],
      });
    }
  }

  // Short/Long toggles
  const changeMin = (id: string, d: number) => {
    const q = questions.find((q) => q.id === id)!;
    updateQuestion(id, { minChars: Math.max(1, (q.minChars || 1) + d) });
  };
  const changeMax = (id: string, d: number) => {
    const q = questions.find((q) => q.id === id)!;
    const cap = q.type === "SHORT_ANSWER" ? 200 : 2000;
    updateQuestion(id, { maxChars: Math.min(cap, (q.maxChars || cap) + d) });
  };

  const isSaving = createPollMutation.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        // if we’re closing the dialog (e.g. user clicked the ×)…
        if (!nextOpen) {
          resetForm();
        }
        setOpen(nextOpen);
      }}
    >
      <DialogTrigger asChild>
        <CustomButton
          className="bg-custom-orange-1 hover:bg-custom-orange-2 rounded-lg"
          icon={<Plus />}
          text="Add Poll"
          variant="default"
        />
      </DialogTrigger>

      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <div className="flex justify-between items-center mt-5">
            <DialogTitle>Add Poll</DialogTitle>
            <CustomButton
              className="bg-custom-teal hover:bg-custom-dark-blue-3 rounded-lg"
              onClick={onSave}
              text={isSaving ? "Saving…" : "Save Poll"}
              disabled={isSaving}
              variant="default"
            />
          </div>
        </DialogHeader>

        {/* ← NEW: Poll Title input */}
        <div className="mt-4 space-y-4">
          <Input
            id="poll-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Enter poll title"
            className="mt-1 py-2"
            disabled={isSaving}
          />
        </div>

        {/* Questions list */}
        <div className="mt-6 space-y-6 max-h-[60vh] overflow-y-auto pr-2">
          {questions.map((q) => (
            <Card key={q.id} className="border">
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label>Question</Label>
                    <Input
                      value={q.prompt}
                      placeholder={
                        q.type === "FILL_IN_BLANK"
                          ? "Enter text with [blank N] tags"
                          : "Enter question text"
                      }
                      onChange={(e) =>
                        updateQuestion(q.id, { prompt: e.target.value })
                      }
                      onBlur={() => {
                        const cleaned = q.prompt.trimEnd();
                        if (cleaned !== q.prompt) {
                          updateQuestion(q.id, { prompt: cleaned });
                        }
                      }}
                      className="mt-1"
                      disabled={isSaving}
                    />
                  </div>
                  <div className="w-48">
                    <Label>Question Type</Label>
                    <Select
                      value={q.type}
                      onValueChange={(val) =>
                        updateType(q.id, val as QuestionType)
                      }
                      disabled={isSaving}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {questionTypeOptions.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            <div className="flex items-center">
                              {o.icon}
                              {o.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {q.type === "SHORT_ANSWER" || q.type === "LONG_ANSWER" ? (
                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex items-center gap-2">
                      <Label>Min Characters*</Label>
                      <CustomButton
                        icon={<Minus />}
                        variant="ghost"
                        size="icon"
                        onClick={() => changeMin(q.id, -1)}
                        disabled={isSaving}
                      />
                      <span className="w-8 text-center">{q.minChars}</span>
                      <CustomButton
                        icon={<Plus />}
                        variant="ghost"
                        size="icon"
                        onClick={() => changeMin(q.id, +1)}
                        disabled={isSaving}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label>Max Characters*</Label>
                      <CustomButton
                        icon={<Minus />}
                        variant="ghost"
                        size="icon"
                        onClick={() => changeMax(q.id, -1)}
                        disabled={isSaving}
                      />
                      <span className="w-12 text-center">{q.maxChars}</span>
                      <CustomButton
                        icon={<Plus />}
                        variant="ghost"
                        size="icon"
                        onClick={() => changeMax(q.id, +1)}
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                ) : q.type === "SINGLE_CHOICE" ? (
                  <SingleChoiceQuestion
                    id={q.id}
                    answers={q.answers}
                    correctAnswer={q.correctAnswer}
                    showDropdown={q.showDropdown!}
                    onAnswerChange={(idx, val) => updateChoice(q.id, idx, val)}
                    onAddChoice={() => addChoice(q.id)}
                    onRemoveChoice={(idx) => removeChoice(q.id, idx)}
                    onToggleShowDropdown={(show) =>
                      updateQuestion(q.id, { showDropdown: show })
                    }
                    onCorrectAnswerChange={(idx) =>
                      updateQuestion(q.id, { correctAnswer: idx })
                    }
                    disabled={isSaving}
                  />
                ) : q.type === "MULTIPLE_CHOICE" ? (
                  <MultipleChoiceQuestion
                    id={q.id}
                    answers={q.answers}
                    correctAnswers={q.correctAnswers!}
                    onAnswerChange={(idx, val) => updateChoice(q.id, idx, val)}
                    onAddChoice={() => addChoice(q.id)}
                    onRemoveChoice={(idx) => removeChoice(q.id, idx)}
                    onToggleCorrectAnswer={(idx, checked) => {
                      const next = checked
                        ? [...(q.correctAnswers || []), idx]
                        : (q.correctAnswers || []).filter((x) => x !== idx);
                      updateQuestion(q.id, { correctAnswers: next });
                    }}
                    disabled={isSaving}
                  />
                ) : q.type === "MATCHING" ? (
                  <MatchingQuestion
                    // id={q.id}
                    options={q.options}
                    answers={q.answers}
                    onOptionChange={(i, val) => updateOption(q.id, i, val)}
                    onAddOption={() => addOption(q.id)}
                    onRemoveOption={(i) => removeOption(q.id, i)}
                    onAnswerChange={(i, val) => updateAnswer(q.id, i, val)}
                    onAddAnswer={() => addAnswer(q.id)}
                    onRemoveAnswer={(i) => removeAnswer(q.id, i)}
                    disabled={isSaving}
                  />
                ) : q.type === "RANK_ORDER" ? (
                  <RankOrderQuestion
                    // id={q.id}
                    rows={q.options}
                    columns={q.answers}
                    onRowChange={(i, val) => updateOption(q.id, i, val)}
                    onAddRow={() => addOption(q.id)}
                    onRemoveRow={(i) => removeOption(q.id, i)}
                    onColumnChange={(i, val) => updateAnswer(q.id, i, val)}
                    onAddColumn={() => addAnswer(q.id)}
                    onRemoveColumn={(i) => removeAnswer(q.id, i)}
                    disabled={isSaving}
                  />
                ) : q.type === "RATING_SCALE" ? (
                  <RatingScaleQuestion
                    // id={q.id}
                    scoreFrom={q.scoreFrom}
                    scoreTo={q.scoreTo}
                    lowLabel={q.lowLabel}
                    highLabel={q.highLabel}
                    onScoreFromChange={(val) =>
                      updateQuestion(q.id, { scoreFrom: val })
                    }
                    onScoreToChange={(val) =>
                      updateQuestion(q.id, { scoreTo: val })
                    }
                    onLowLabelChange={(val) =>
                      updateQuestion(q.id, { lowLabel: val })
                    }
                    onHighLabelChange={(val) =>
                      updateQuestion(q.id, { highLabel: val })
                    }
                    disabled={isSaving}
                  />
                ) : (
                  q.type === "FILL_IN_BLANK" && (
                    <FillInBlankQuestion
                      // id={q.id}
                      answers={q.answers}
                      onAddBlank={() => addBlank(q.id)}
                      onAnswerChange={(idx, val) =>
                        updateAnswer(q.id, idx, val)
                      }
                      onRemoveAnswer={(idx) => removeAnswer(q.id, idx)}
                      disabled={isSaving}
                    />
                  )
                )}
              </CardContent>

              <CardFooter className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={q.required}
                    onCheckedChange={(v) =>
                      updateQuestion(q.id, { required: v })
                    }
                    disabled={isSaving}
                  />
                  <span>Required</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 cursor-pointer text-sm text-gray-600">
                    <Upload className="h-5 w-5" />
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        updateQuestion(q.id, {
                          imageFile: file,
                          tempImageName: file.name,
                        });
                      }}
                      disabled={isSaving}
                    />
                    {q.imageFile ? q.imageFile.name : "Attach image"}
                  </label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <CustomButton
                        icon={<MoreHorizontal />}
                        variant="ghost"
                        size="icon"
                        disabled={isSaving}
                      />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => removeQuestion(q.id)}>
                        Delete
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => duplicateQuestion(q.id)}
                      >
                        Duplicate
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Add Question */}
        <div className="mt-6 text-center">
          <Button onClick={addQuestion} disabled={isSaving}>
            <Plus className="mr-2 h-4 w-4" /> Add Question
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddPollDialog;

```

Path: frontend/components/projects/polls/EditPollDialog.tsx

```
"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "components/ui/select";
import { Switch } from "components/ui/switch";
import {
  Plus,
  MoreHorizontal,
  Edit2,
  Circle,
  CheckSquare,
  LinkIcon,
  ArrowUpDown,
  TypeIcon,
  AlignJustify,
  Smile,
  Minus,
  Upload,
} from "lucide-react";
import {
  DraftQuestion,
  QuestionType,
  IPoll,
  PollQuestion,
} from "@shared/interface/PollInterface";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "lib/api";
import { toast } from "sonner";
import { Card, CardContent, CardFooter } from "components/ui/card";
import SingleChoiceQuestion from "./SingleChoiceQuestion";
import MultipleChoiceQuestion from "./MultipleChoiceQuestion";
import MatchingQuestion from "./MatchingQuestion";
import RankOrderQuestion from "./RankOrderQuestion";
import RatingScaleQuestion from "./RatingScaleQuestion";
import FillInBlankQuestion from "./FillInBlankQuestion";
import {
  allQuestionsValid,
  validateQuestion,
  validateTitle,
  WithImage,
} from "./AddPollDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "components/ui/dropdown-menu";
import { AxiosError } from "axios";
import Image from "next/image";

// wherever you define WithImage
// export interface WithImage {
//   imageFile?: File;
//   tempImageName?: string;
//   imageUrl?: string;
// }

const questionTypeOptions: {
  value: QuestionType;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "SINGLE_CHOICE",
    label: "Single Choice",
    icon: <Circle className="mr-2 h-4 w-4" />,
  },
  {
    value: "MULTIPLE_CHOICE",
    label: "Multiple Choice",
    icon: <CheckSquare className="mr-2 h-4 w-4" />,
  },
  {
    value: "MATCHING",
    label: "Matching",
    icon: <LinkIcon className="mr-2 h-4 w-4" />,
  },
  {
    value: "RANK_ORDER",
    label: "Rank Order",
    icon: <ArrowUpDown className="mr-2 h-4 w-4" />,
  },
  {
    value: "SHORT_ANSWER",
    label: "Short Answer",
    icon: <TypeIcon className="mr-2 h-4 w-4" />,
  },
  {
    value: "LONG_ANSWER",
    label: "Long Answer",
    icon: <AlignJustify className="mr-2 h-4 w-4" />,
  },
  {
    value: "FILL_IN_BLANK",
    label: "Fill in the Blank",
    icon: <Edit2 className="mr-2 h-4 w-4" />,
  },
  {
    value: "RATING_SCALE",
    label: "Rating Scale",
    icon: <Smile className="mr-2 h-4 w-4" />,
  },
];

const defaultQuestion = (
  overrides: Partial<DraftQuestion & WithImage> = {}
): DraftQuestion & WithImage => ({
  id: crypto.randomUUID(),
  prompt: "",
  type: "SINGLE_CHOICE",
  options: ["", ""],
  answers: overrides.type === "FILL_IN_BLANK" ? [] : ["", ""],
  rows: [],
  columns: [],
  required: false,
  correctAnswer: 0,
  showDropdown: true,
  correctAnswers: [],
  minChars: 1,
  maxChars: 200,
  scoreFrom: 0,
  scoreTo: 10,
  lowLabel: "",
  highLabel: "",
  ...overrides,
});

interface EditPollDialogProps {
  poll: IPoll;
  onClose: () => void;
}

type DraftWithImage = DraftQuestion & WithImage;

export default function EditPollDialog({ poll, onClose }: EditPollDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(poll.title);
  const [questions, setQuestions] = useState<DraftWithImage[]>([]);

  // keep in sync when poll changes
  useEffect(() => {
    setTitle(poll.title);
    const initialQs: DraftWithImage[] = poll.questions.map((q: PollQuestion) =>
      defaultQuestion({
        id: q._id,
        prompt: q.prompt,
        type: q.type,
        required: q.required,
        imageUrl: q.image,
        tempImageName: undefined,
        ...(q.type === "SINGLE_CHOICE" && {
          answers: q.answers,
          correctAnswer: q.correctAnswer,
          showDropdown: q.showDropdown,
        }),
        ...(q.type === "MULTIPLE_CHOICE" && {
          answers: q.answers,
          correctAnswers: q.correctAnswers,
        }),
        ...(q.type === "MATCHING" && {
          options: q.options,
          answers: q.answers,
        }),
        ...(q.type === "RANK_ORDER" && {
          rows: q.rows,
          columns: q.columns,
        }),
        ...(q.type === "SHORT_ANSWER" && {
          minChars: q.minChars ?? 1,
          maxChars: q.maxChars ?? 200,
        }),
        ...(q.type === "LONG_ANSWER" && {
          minChars: q.minChars ?? 1,
          maxChars: q.maxChars ?? 2000,
        }),
        ...(q.type === "FILL_IN_BLANK" && {
          answers: q.answers,
        }),
        ...(q.type === "RATING_SCALE" && {
          scoreFrom: q.scoreFrom,
          scoreTo: q.scoreTo,
          lowLabel: q.lowLabel,
          highLabel: q.highLabel,
        }),
      })
    );

    setQuestions(initialQs);
    setOpen(true);
  }, [poll]);

  // PATCH-mutation
  const updateMutation = useMutation<
    IPoll,
    AxiosError,
    { id: string; formData: FormData }
  >({
    mutationFn: ({ id, formData }) =>
      api
        .patch<{ data: IPoll }>(`/api/v1/polls/${id}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
        .then((r) => r.data.data),

    onSuccess: () => {
      toast.success("Poll updated");
      queryClient.invalidateQueries({ queryKey: ["polls", poll.projectId] });
      setOpen(false);
      onClose();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unknown error");
    },
  });

  // handlers copied from AddPollDialog (add/remove/duplicate/update question, etc.)
  const updateQuestion = (id: string, patch: Partial<DraftWithImage>) =>
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  const addQuestion = () => setQuestions((qs) => [...qs, defaultQuestion()]);
  const removeQuestion = (id: string) =>
    setQuestions((qs) => qs.filter((q) => q.id !== id));

  function duplicateQuestion(id: string) {
    setQuestions((qs) => {
      const orig = qs.find((q) => q.id === id)!;
      const copy = structuredClone(orig);
      copy.id = crypto.randomUUID();
      return [...qs, copy];
    });
  }

  const updateType = (id: string, type: QuestionType) => {
    if (type === "SINGLE_CHOICE") {
      updateQuestion(id, {
        type,
        options: ["", ""],
        answers: ["", ""],
        correctAnswer: 0,
        showDropdown: true,
        correctAnswers: [],
      });
    } else if (type === "MULTIPLE_CHOICE") {
      updateQuestion(id, {
        type,
        options: ["", ""],
        answers: ["", ""],
        correctAnswer: undefined,
        showDropdown: undefined,
        correctAnswers: [],
      });
    } else if (type === "RATING_SCALE") {
      updateQuestion(id, {
        type,
        scoreFrom: 0,
        scoreTo: 10,
        lowLabel: "",
        highLabel: "",
        options: [],
        answers: [],
        rows: [],
        columns: [],
      });
    } else if (type === "MATCHING")
      updateQuestion(id, { type, options: ["", ""], answers: ["", ""] });
      else if (type === "RANK_ORDER") {
    // ← NEW: initialise both rows & columns to two empty slots
    updateQuestion(id, {
      type,
      rows:    ["", ""],
      columns: ["", ""],
      // clear legacy fields if you want
      options:  [],
      answers:  [],
    });
  }
    else if (type === "SHORT_ANSWER")
      updateQuestion(id, {
        type,
        options: [],
        answers: [],
        minChars: 1,
        maxChars: 200,
      });
    else if (type === "LONG_ANSWER")
      updateQuestion(id, {
        type,
        options: [],
        answers: [],
        minChars: 1,
        maxChars: 2000,
      });
      
    else if (type === "FILL_IN_BLANK") {
      updateQuestion(id, { type, prompt: "", answers: [] });
    } else updateQuestion(id, { type, options: [], answers: ["", ""] });
  };

  // Single/Multiple choice
  const addChoice = (id: string) => {
    const q = questions.find((q) => q.id === id)!;
    updateQuestion(id, { answers: [...q.answers, ""] });
  };
  const updateChoice = (id: string, idx: number, val: string) => {
    const q = questions.find((q) => q.id === id)!;
    updateQuestion(id, {
      answers: q.answers.map((a, i) => (i === idx ? val : a)),
    });
  };
  const removeChoice = (id: string, idx: number) => {
    const q = questions.find((q) => q.id === id)!;
    updateQuestion(id, {
      answers: q.answers.filter((_, i) => i !== idx),
    });
  };

  // Matching rows/columns
  const addOption = (id: string) => {
    const q = questions.find((q) => q.id === id)!;
    updateQuestion(id, { options: [...q.options, ""] });
  };
  const updateOption = (id: string, idx: number, val: string) => {
    const q = questions.find((q) => q.id === id)!;
    updateQuestion(id, {
      options: q.options.map((o, i) => (i === idx ? val : o)),
    });
  };
  const removeOption = (id: string, idx: number) => {
    const q = questions.find((q) => q.id === id)!;
    updateQuestion(id, {
      options: q.options.filter((_, i) => i !== idx),
    });
  };

  const addAnswer = (id: string) => {
    const q = questions.find((q) => q.id === id)!;
    updateQuestion(id, { answers: [...q.answers, ""] });
  };
  const updateAnswer = (id: string, idx: number, val: string) => {
    const q = questions.find((q) => q.id === id)!;
    updateQuestion(id, {
      answers: q.answers.map((a, i) => (i === idx ? val : a)),
    });
  };
  const removeAnswer = (id: string, idx: number) => {
    const q = questions.find((q) => q.id === id)!;
    updateQuestion(id, {
      answers: q.answers.filter((_, i) => i !== idx),
    });
  };

  // Fill‐in‐the‐blank fallback
  const addBlank = (id: string) => {
    const q = questions.find((q) => q.id === id)!;
    const n = q.answers.length + 1;
    const tag = `[blank ${n}]`;
    updateQuestion(id, {
      prompt: q.prompt + tag,
      answers: [...q.answers, ""],
    });
  };

  // Short/Long answer min/max
  const changeMin = (id: string, d: number) => {
    const q = questions.find((q) => q.id === id)!;
    updateQuestion(id, { minChars: Math.max(1, q.minChars + d) });
  };
  const changeMax = (id: string, d: number) => {
    const q = questions.find((q) => q.id === id)!;
    const cap = q.type === "SHORT_ANSWER" ? 200 : 2000;
    updateQuestion(id, { maxChars: Math.min(cap, q.maxChars + d) });
  };

  // Rating scale
  const changeScoreFrom = (id: string, v: number) =>
    updateQuestion(id, { scoreFrom: v });
  const changeScoreTo = (id: string, v: number) =>
    updateQuestion(id, { scoreTo: v });
  const changeLowLabel = (id: string, v: string) =>
    updateQuestion(id, { lowLabel: v });
  const changeHighLabel = (id: string, v: string) =>
    updateQuestion(id, { highLabel: v });

  // Save

  const handleSave = () => {
    const titleError = validateTitle(title);
    if (titleError) {
      toast.error(titleError);
      return;
    }

    // 2️⃣ questions
    if (!allQuestionsValid(questions)) {
      // find first invalid
      const { idx, err } = questions
        .map((q, i) => ({ idx: i + 1, err: validateQuestion(q) }))
        .find((x) => x.err !== null)!;
      toast.error(`Question ${idx}: ${err}`);
      return;
    }

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("projectId", poll.projectId!);
    formData.append("createdBy", poll.createdBy._id);
    formData.append("createdByRole", poll.createdByRole);

    const questionsPayload = questions.map((q) => ({
      // copy everything else
      ...q,
      // drop the File object
      imageFile: undefined,
      // but keep tempImageName if there is one
      ...(q.imageFile ? { tempImageName: q.tempImageName } : {}),
    }));

    formData.append("questions", JSON.stringify(questionsPayload));

    // now append the raw files under the same fieldname "images"
    questions.forEach((q) => {
      if (q.imageFile && q.tempImageName) {
        formData.append("images", q.imageFile, q.tempImageName);
      }
    });

    // finally call the mutation
    updateMutation.mutate({ id: poll._id, formData });
  };

  const isUpdating = updateMutation.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (!val) onClose();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Edit2 />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <div className="flex justify-between items-center mt-5">
            <DialogTitle>Edit Poll</DialogTitle>
            <Button onClick={handleSave} disabled={isUpdating}>
              {isUpdating ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Poll title"
            className="mt-1"
            disabled={isUpdating}
          />
        </div>

        <div className="mt-6 space-y-6 max-h-[60vh] overflow-y-auto pr-2">
          {questions.map((q) => (
            <Card key={q.id} className="border">
              <CardContent className="space-y-4">
                {/* prompt & type */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label>Question</Label>
                    <Input
                      value={q.prompt}
                      onChange={(e) =>
                        updateQuestion(q.id, { prompt: e.target.value })
                      }
                      disabled={isUpdating}
                      className="mt-1"
                      placeholder={
                        q.type === "FILL_IN_BLANK"
                          ? "Enter text with [blank] tags"
                          : "Enter question text"
                      }
                    />
                  </div>
                  <div className="w-48">
                    <Label>Type</Label>
                    <Select
                      value={q.type}
                      onValueChange={(val) =>
                        updateType(q.id, val as QuestionType)
                      }
                      disabled={isUpdating}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {questionTypeOptions.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            <div className="flex items-center">
                              {o.icon}
                              {o.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* per-type UI */}
                {q.type === "SHORT_ANSWER" || q.type === "LONG_ANSWER" ? (
                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex items-center gap-2">
                      <Label>Min Characters</Label>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => changeMin(q.id, -1)}
                        disabled={isUpdating}
                      >
                        <Minus />
                      </Button>
                      <span className="w-8 text-center">{q.minChars}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => changeMin(q.id, +1)}
                        disabled={isUpdating}
                      >
                        <Plus />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label>Max Characters</Label>
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={isUpdating}
                        onClick={() => changeMax(q.id, -1)}
                      >
                        <Minus />
                      </Button>
                      <span className="w-12 text-center">{q.maxChars}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={isUpdating}
                        onClick={() => changeMax(q.id, +1)}
                      >
                        <Plus />
                      </Button>
                    </div>
                  </div>
                ) : q.type === "SINGLE_CHOICE" ? (
                  <SingleChoiceQuestion
                    id={q.id}
                    answers={q.answers}
                    correctAnswer={q.correctAnswer!}
                    showDropdown={q.showDropdown!}
                    onAnswerChange={(i, v) => updateChoice(q.id, i, v)}
                    onAddChoice={() => addChoice(q.id)}
                    onRemoveChoice={(i) => removeChoice(q.id, i)}
                    onToggleShowDropdown={(v) =>
                      updateQuestion(q.id, { showDropdown: v })
                    }
                    onCorrectAnswerChange={(i) =>
                      updateQuestion(q.id, { correctAnswer: i })
                    }
                    disabled={isUpdating}
                  />
                ) : q.type === "MULTIPLE_CHOICE" ? (
                  <MultipleChoiceQuestion
                    id={q.id}
                    answers={q.answers}
                    correctAnswers={q.correctAnswers!}
                    onAnswerChange={(i, v) => updateChoice(q.id, i, v)}
                    onAddChoice={() => addChoice(q.id)}
                    onRemoveChoice={(i) => removeChoice(q.id, i)}
                    onToggleCorrectAnswer={(i, checked) => {
                      const next = checked
                        ? [...(q.correctAnswers || []), i]
                        : (q.correctAnswers || []).filter((x) => x !== i);
                      updateQuestion(q.id, { correctAnswers: next });
                    }}
                    disabled={isUpdating}
                  />
                ) : q.type === "MATCHING" ? (
                  <MatchingQuestion
                    // id={q.id}
                    options={q.options}
                    answers={q.answers}
                    onOptionChange={(i, v) => updateOption(q.id, i, v)}
                    onAddOption={() => addOption(q.id)}
                    onRemoveOption={(i) => removeOption(q.id, i)}
                    onAnswerChange={(i, v) => updateAnswer(q.id, i, v)}
                    onAddAnswer={() => addAnswer(q.id)}
                    onRemoveAnswer={(i) => removeAnswer(q.id, i)}
                    disabled={isUpdating}
                  />
                ) : q.type === "RANK_ORDER" ? (
                  <RankOrderQuestion
                    // id={q.id}
                    rows={q.rows}
                    columns={q.columns}
                    onRowChange={(i, v) =>
                      updateQuestion(q.id, {
                        rows: q.rows.map((r, j) => (j === i ? v : r)),
                      })
                    }
                    onAddRow={() =>
                      updateQuestion(q.id, { rows: [...q.rows, ""] })
                    }
                    onRemoveRow={(i) =>
                      updateQuestion(q.id, {
                        rows: q.rows.filter((_, j) => j !== i),
                      })
                    }
                    onColumnChange={(i, v) =>
                      updateQuestion(q.id, {
                        columns: q.columns.map((c, j) => (j === i ? v : c)),
                      })
                    }
                    onAddColumn={() =>
                      updateQuestion(q.id, { columns: [...q.columns, ""] })
                    }
                    onRemoveColumn={(i) =>
                      updateQuestion(q.id, {
                        columns: q.columns.filter((_, j) => j !== i),
                      })
                    }
                    disabled={isUpdating}
                  />
                ) : q.type === "RATING_SCALE" ? (
                  <RatingScaleQuestion
                    // id={q.id}
                    scoreFrom={q.scoreFrom}
                    scoreTo={q.scoreTo}
                    lowLabel={q.lowLabel}
                    highLabel={q.highLabel}
                    onScoreFromChange={(v) => changeScoreFrom(q.id, v)}
                    onScoreToChange={(v) => changeScoreTo(q.id, v)}
                    onLowLabelChange={(v) => changeLowLabel(q.id, v)}
                    onHighLabelChange={(v) => changeHighLabel(q.id, v)}
                    disabled={isUpdating}
                  />
                ) : (
                  q.type === "FILL_IN_BLANK" && (
                    <FillInBlankQuestion
                      // id={q.id}
                      answers={q.answers}
                      onAddBlank={() => addBlank(q.id)}
                      onAnswerChange={(i, v) => updateAnswer(q.id, i, v)}
                      onRemoveAnswer={(i) => removeAnswer(q.id, i)}
                      disabled={isUpdating}
                    />
                  )
                )}
              </CardContent>

              <CardFooter className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={q.required}
                    disabled={isUpdating}
                    onCheckedChange={(v) =>
                      updateQuestion(q.id, { required: v })
                    }
                  />
                  <span>Required</span>
                </div>
                <div className="flex items-center gap-2">
                  {q.imageUrl && !q.imageFile && (
                    <Image
                      src={q.imageUrl}
                      alt="Question image"
                      height={64}
                      width={64}
                      className="max-h-16 rounded-md mr-2"
                    />
                  )}

                  {/* ← this label/file-input combo */}
                  <label className="flex items-center gap-1 cursor-pointer text-sm text-gray-600">
                    <Upload className="h-5 w-5" />
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        updateQuestion(q.id, {
                          imageFile: file,
                          tempImageName: file.name,
                        });
                      }}
                      disabled={isUpdating}
                    />
                    {q.imageFile
                      ? q.imageFile.name
                      : q.tempImageName
                      ? q.tempImageName
                      : q.imageUrl
                      ? "Replace image"
                      : "Attach image"}
                  </label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" disabled={isUpdating}>
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => removeQuestion(q.id)}>
                        Delete
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => duplicateQuestion(q.id)}
                      >
                        Duplicate
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-6 text-center">
          <Button onClick={addQuestion} disabled={isUpdating}>
            <Plus className="mr-2 h-4 w-4" /> Add Question
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

```

Path: frontend/components/projects/polls/FillInBlankQuestion.tsx

```
"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import CustomButton from "components/shared/CustomButton";
import { Label } from "@radix-ui/react-label";
import { Input } from "components/ui/input";

export interface FillInBlankQuestionProps {
  // id: string;
  answers: string[];
  onAddBlank: () => void;
  onAnswerChange: (index: number, value: string) => void;
  onRemoveAnswer: (index: number) => void;
  disabled?: boolean;
}

const FillInBlankQuestion: React.FC<FillInBlankQuestionProps> = ({
  // id,
  answers,
  onAddBlank,
  onAnswerChange,
  onRemoveAnswer,
  disabled
}) => (
  <div className="space-y-4">
    {/* 1) + Add Blank button */}
    <div>
      <CustomButton
        text="+ Add Blank"
        variant="outline"
        size="sm"
        onClick={onAddBlank}
          disabled={disabled}
      />
    </div>

    {/* 2) Answers for each <blank> */}
    <div className="space-y-2">
      <Label>Answers</Label>
      {answers.map((ans, idx) => (
        <div key={idx} className="relative group flex items-center space-x-2">
          {/* numbering */}
          <span className="text-gray-500">{idx + 1}.</span>

          {/* text input */}
          <Input
            value={ans}
            onChange={(e) => onAnswerChange(idx, e.target.value)}
            placeholder={`Answer ${idx + 1}`}
            className="pr-10 flex-1"
              disabled={disabled}
          />

          {/* delete blank-answer button */}
          <CustomButton
            icon={<Trash2 />}
            variant="ghost"
            size="icon"
            onClick={() => onRemoveAnswer(idx)}
            className="absolute right-2 top-1/2 -translate-y-1/2
                       opacity-0 group-focus-within:opacity-100 transition-opacity"
                         disabled={disabled}
          />
        </div>
      ))}

     
    </div>
  </div>
);

export default FillInBlankQuestion;

```

Path: frontend/components/projects/polls/MatchingQuestion.tsx

```
"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { Label } from "@radix-ui/react-label";
import { Input } from "components/ui/input";
import CustomButton from "components/shared/CustomButton";

export interface MatchingQuestionProps {
  // id: string;
  options: string[];
  answers: string[];
  onOptionChange: (index: number, value: string) => void;
  onAddOption: () => void;
  onRemoveOption: (index: number) => void;
  onAnswerChange: (index: number, value: string) => void;
  onAddAnswer: () => void;
  onRemoveAnswer: (index: number) => void;
  disabled?: boolean;
}

const MatchingQuestion: React.FC<MatchingQuestionProps> = ({
  // id,
  options,
  answers,
  onOptionChange,
  onAddOption,
  onRemoveOption,
  onAnswerChange,
  onAddAnswer,
  onRemoveAnswer,
  disabled
}) => (
  <div className="grid grid-cols-2 gap-6">
    {/* Left column: Options */}
    <div className="space-y-4">
      <Label>Options</Label>
      {options.map((opt, i) => (
        <div key={i} className="relative group">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            {String.fromCharCode(65 + i)}.
          </span>
          <Input
            className="pl-8 pr-10 mt-1"
            value={opt}
            placeholder={`Option ${i + 1}`}
            onChange={(e) => onOptionChange(i, e.target.value)}
              disabled={disabled}
          />
          <CustomButton
            icon={<Trash2 />}
            variant="ghost"
            size="icon"
            onClick={() => onRemoveOption(i)}
            className="absolute right-2 top-1/2 -translate-y-1/2
                       opacity-0 group-focus-within:opacity-100 transition-opacity"
                         disabled={disabled}
          />
        </div>
      ))}
      <CustomButton
        text="+ Add Option"
        variant="outline"
        size="sm"
        onClick={onAddOption}
          disabled={disabled}
      />
    </div>

    {/* Right column: Answers */}
    <div className="space-y-4">
      <Label>Answers</Label>
      {answers.map((ans, i) => (
        <div key={i} className="relative group">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            {i + 1}.
          </span>
          <Input
            className="pl-8 pr-10 mt-1"
            value={ans}
            placeholder={`Answer ${i + 1}`}
            onChange={(e) => onAnswerChange(i, e.target.value)}
              disabled={disabled}
          />
          <CustomButton
            icon={<Trash2 />}
            variant="ghost"
            size="icon"
            onClick={() => onRemoveAnswer(i)}
            className="absolute right-2 top-1/2 -translate-y-1/2
                       opacity-0 group-focus-within:opacity-100 transition-opacity"
                         disabled={disabled}
          />
        </div>
      ))}
      <CustomButton
        text="+ Add Answer"
        variant="outline"
        size="sm"
        onClick={onAddAnswer}
          disabled={disabled}
      />
    </div>
  </div>
);

export default MatchingQuestion;

```

Path: frontend/components/projects/polls/MultipleChoiceQuestion.tsx

```
"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { Input } from "components/ui/input";
import CustomButton from "components/shared/CustomButton";

export interface MultipleChoiceQuestionProps {
  id: string;
  answers: string[];
  correctAnswers: number[];
  onAnswerChange: (index: number, value: string) => void;
  onAddChoice: () => void;
  onRemoveChoice: (index: number) => void;
  onToggleCorrectAnswer: (index: number, checked: boolean) => void;
  disabled?: boolean;
}

const MultipleChoiceQuestion: React.FC<MultipleChoiceQuestionProps> = ({
  id,
  answers,
  correctAnswers,
  onAnswerChange,
  onAddChoice,
  onRemoveChoice,
  onToggleCorrectAnswer,
  disabled
}) => {
  return (
    <div className="space-y-4">
      {answers.map((ans, i) => (
        <div key={i} className="relative group flex items-center space-x-2">
          <input
            type="checkbox"
            name={`correct-${id}-${i}`}
            checked={correctAnswers.includes(i)}
            onChange={(e) => onToggleCorrectAnswer(i, e.target.checked)}
            className="cursor-pointer"
            disabled={disabled}
          />

          <Input
            value={ans}
            onChange={(e) => onAnswerChange(i, e.target.value)}
            placeholder={`Enter choice ${i + 1}`}
            className="pr-10 flex-1"
              disabled={disabled}
          />

          <CustomButton
            icon={<Trash2 />}
            variant="ghost"
            size="icon"
            onClick={() => onRemoveChoice(i)}
            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity"
              disabled={disabled}
          />
        </div>
      ))}

      <CustomButton
        text="+ Add Choice"
        variant="outline"
        size="sm"
        onClick={onAddChoice}
          disabled={disabled}
      />
    </div>
  );
};

export default MultipleChoiceQuestion;

```

Path: frontend/components/projects/polls/PollsTable.tsx

```
"use client";

import React from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableFooter,
} from "components/ui/table";
import { Button } from "components/ui/button";
import { Eye, Edit2, Trash2 } from "lucide-react";
import { IPoll } from "@shared/interface/PollInterface";
import { IPaginationMeta } from "@shared/interface/PaginationInterface";
import CustomPagination from "components/shared/Pagination";

interface PollsTableProps {
  polls: IPoll[];
  meta: IPaginationMeta;
  onPageChange: (newPage: number) => void;
  onDelete: (pollId: string) => void;
  onEdit: (poll: IPoll) => void;
  onPreview: (poll: IPoll) => void;
}

const PollsTable: React.FC<PollsTableProps> = ({
  polls,
  meta,
  onPageChange,
  onDelete,
  onEdit,
  onPreview,
}) => {
  return (
    <div className=" rounded-lg shadow-lg overflow-x-auto ">
      <div className="bg-white rounded-lg shadow-lg">
        <Table className="min-w-full divide-y divide-gray-200">
          <TableHeader>
            <TableRow>
              {[
                "Title",
                "Question Count",
                "Created By",
                "Last Modified",
                "Responses",
                "Actions",
              ].map((col) => (
                <TableHead
                  key={col}
                  className=" py-5 text-center text-xs font-semibold text-custom-dark-blue-1 uppercase tracking-wider whitespace-normal break-words"
                >
                  <div className="inline-flex items-center space-x-1">
                    {col}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white divide-y divide-gray-100">
            {polls.map((poll) => (
              <TableRow key={poll._id}>
                <TableCell className="text-center">{poll.title}</TableCell>
                <TableCell className="text-center">
                  {poll.questions.length}
                </TableCell>
                <TableCell className="text-center">
                  {poll.createdBy.firstName} {poll.createdBy.lastName}
                </TableCell>
                <TableCell className="text-center">
                  {new Date(poll.lastModified).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-center">
                  {poll.isRun ? poll.responsesCount : "–"}
                </TableCell>
                <TableCell className="space-x-2 text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onPreview(poll)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(poll)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(poll._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={6}>
                <div className="flex justify-center">
                  <CustomPagination
                    currentPage={meta.page}
                    totalPages={meta.totalPages}
                    onPageChange={onPageChange}
                  />
                </div>
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
};

export default PollsTable;

```

Path: frontend/components/projects/polls/PreviewPollDialog.tsx

```
// components/projects/polls/PreviewPollDialog.tsx
"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";
import {
  FillInBlankQuestion,
  IPoll,
  LongAnswerQuestion,
  MatchingQuestion,
  MultipleChoiceQuestion,
  RankOrderQuestion,
  RatingScaleQuestion,
  ShortAnswerQuestion,
  SingleChoiceQuestion,
} from "@shared/interface/PollInterface";
import { RadioGroup, RadioGroupItem } from "components/ui/radio-group";
import { Label } from "components/ui/label";
import { Checkbox } from "components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";
import { Textarea } from "components/ui/textarea";
import { Input } from "components/ui/input";
import Image from "next/image";

interface PreviewPollDialogProps {
  poll: IPoll;
  onClose: () => void;
}

const PreviewPollDialog: React.FC<PreviewPollDialogProps> = ({
  poll,
  onClose,
}) => {
  const [textValues, setTextValues] = React.useState<Record<string, string>>(
    {}
  );

  const handleChange = (id: string, value: string) => {
    setTextValues((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl w-full max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preview: {poll.title}</DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-8 px-2">
          {poll.questions.map((q, idx) => {
            const typeLabel =
              q.type === "SINGLE_CHOICE"
                ? "(Single choice)"
                : q.type === "MULTIPLE_CHOICE"
                ? "(Multiple choice)"
                : q.type === "SHORT_ANSWER"
                ? "(Short answer)"
                : q.type === "LONG_ANSWER"
                ? "(Long answer)"
                : q.type === "FILL_IN_BLANK"
                ? "(Fill in the blank)"
                : q.type === "RATING_SCALE"
                ? "(Rating scale)"
                : q.type === "MATCHING"
                ? "(Matching)"
                : q.type === "RANK_ORDER"
                ? "(Rank order)"
                : "";

            return (
              <div key={q._id} className="mb-5">
                <h4 className="font-semibold">
                  {idx + 1}. {q.prompt}{" "}
                  <span className="text-sm text-gray-500">{typeLabel}</span>
                </h4>

 {/* ← New: show uploaded image if present */}
      {q.image && (
        <Image
        width={200}
        height={200}
        unoptimized
          src={q.image}
          alt={`Question ${idx + 1} Illustration`}
          className="my-4 max-h-60 w-auto object-contain rounded border"
        />
      )}
                {/* SINGLE_CHOICE */}
                {q.type === "SINGLE_CHOICE" &&
                  (() => {
                    const scq = q as SingleChoiceQuestion;

                    // If showDropdown is true, render a select
                    if (scq.showDropdown) {
                       const val = textValues[q._id] ?? "";
                      return (
                       <div className="mt-2">
          <select
            id={`select-${q._id}`}
            value={val}
            onChange={(e) => handleChange(q._id, e.target.value)}
            className="block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="" disabled>
              Select
            </option>
            {scq.answers.map((ans, i) => (
              <option key={i} value={String(i)}>
                {ans}
              </option>
            ))}
          </select>
        </div>
                      );
                    }

                    // Otherwise, fall back to inline radios
                    return (
                      <RadioGroup defaultValue="">
                        <div className="mt-2 space-y-1">
                          {scq.answers.map((label: string, i: number) => (
                            <div
                              key={i}
                              className="flex items-center space-x-2"
                            >
                              <RadioGroupItem
                                id={`q${idx}-opt-${i}`}
                                value={String(i)}
                              />
                              <Label htmlFor={`q${idx}-opt-${i}`}>
                                {label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    );
                  })()}

                {/* MULTIPLE_CHOICE */}
                {q.type === "MULTIPLE_CHOICE" &&
                  (() => {
                    const mcq = q as MultipleChoiceQuestion;
                    return (
                      <div className="mt-2 space-y-1">
                        {mcq.answers.map((label, i) => (
                          <div key={i} className="flex items-center space-x-2">
                            <Checkbox id={`q${idx}-opt-${i}`} />
                            <Label htmlFor={`q${idx}-opt-${i}`}>{label}</Label>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                {/* SHORT_ANSWER */}
                {q.type === "SHORT_ANSWER" &&
                  (() => {
                    const sa = q as ShortAnswerQuestion;
                    const val = textValues[q._id] || "";
                    const min = sa.minChars ?? 0;
                    const max = sa.maxChars ?? 200;

                    return (
                      <div className="mt-2">
                        <Input
                          id={`short-${q._id}`}
                          value={val}
                          maxLength={max}
                          onChange={(e) => handleChange(q._id, e.target.value)}
                          className="w-full"
                        />
                        <p className="text-xs text-gray-500 text-right">
                          {val.length}/{max}
                          {min > 0 && <> (min {min})</>}
                        </p>
                      </div>
                    );
                  })()}

                {/* LONG_ANSWER */}
                {q.type === "LONG_ANSWER" &&
                  (() => {
                    const la = q as LongAnswerQuestion;
                    const val = textValues[q._id] || "";
                    const min = la.minChars ?? 0;
                    const max = la.maxChars ?? 2000;

                    return (
                      <div className="mt-2">
                        <Textarea
                          id={`long-${q._id}`}
                          value={val}
                          maxLength={max}
                          placeholder="Please input"
                          onChange={(e) => handleChange(q._id, e.target.value)}
                          className="w-full h-24"
                        />
                        <p className="text-xs text-gray-500 text-right">
                          {val.length}/{max}
                          {min > 0 && <> (min {min})</>}
                        </p>
                      </div>
                    );
                  })()}

                {/* FILL_IN_BLANK */}
                {q.type === "FILL_IN_BLANK" &&
                  (() => {
                    const fib = q as FillInBlankQuestion;
                    return (
                      <div className="mt-2 space-y-4">
                        {fib.answers.map((_, i) => {
                          const key = `${q._id}-${i}`;
                          return (
                            <div key={i}>
                              <Label htmlFor={`fib-${key}`}>
                                Answer {i + 1}
                              </Label>
                              <Input
                                id={`fib-${key}`}
                                value={textValues[key] || ""}
                                onChange={(e) =>
                                  handleChange(key, e.target.value)
                                }
                                className="w-full"
                              />
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                {/* RATING_SCALE */}
                {q.type === "RATING_SCALE" &&
                  (() => {
                    const rs = q as RatingScaleQuestion;
                    const name = `rating-${q._id}`;
                    const scale: number[] = [];
                    for (let v = rs.scoreFrom; v <= rs.scoreTo; v++)
                      scale.push(v);

                    return (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">
                          {rs.lowLabel || rs.scoreFrom} …{" "}
                          {rs.highLabel || rs.scoreTo}
                        </p>
                        <div className="flex space-x-2 overflow-x-auto">
                          {scale.map((val) => (
                            <label
                              key={val}
                              className="relative inline-flex items-center justify-center rounded border px-3 py-1 cursor-pointer"
                            >
                              <input
                                type="radio"
                                name={name}
                                value={val}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                              />
                              <span className="relative z-10 text-sm">
                                {val}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                {/* MATCHING */}
                {q.type === "MATCHING" &&
                  (() => {
                    const mq = q as MatchingQuestion;
                    return (
                      <div className="mt-2 space-y-4">
                        {mq.options.map((option, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between"
                          >
                            <span className="font-medium">{option}</span>
                            <Select defaultValue="">
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="—" />
                              </SelectTrigger>
                              <SelectContent>
                                {mq.answers.map((ans, j) => (
                                  <SelectItem key={j} value={ans}>
                                    {ans}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                {/* RANK_ORDER */}
                {q.type === "RANK_ORDER" &&
                  (() => {
                    const rq = q as RankOrderQuestion;
                    return (
                      <div className="mt-2 overflow-x-auto">
                        <table className="w-full table-fixed border-collapse text-sm">
                          <thead>
                            <tr>
                              <th className="p-2 text-left"></th>
                              {rq.columns.map((col) => (
                                <th
                                  key={col}
                                  className="p-2 text-center font-medium"
                                >
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {rq.rows.map((row, ri) => (
                              <tr key={ri} className="border-t">
                                <td className="p-2">{row}</td>
                                {rq.columns.map((col, ci) => (
                                  <td key={ci} className="p-2 text-center">
                                    <input
                                      type="radio"
                                      name={`rank-${q._id}-${ri}`}
                                      value={col}
                                      className="h-4 w-4"
                                    />
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PreviewPollDialog;

```

Path: frontend/components/projects/polls/RankOrderQuestion.tsx

```
"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { Label } from "components/ui/label";
import { Input } from "components/ui/input";
import CustomButton from "components/shared/CustomButton";

export interface RankOrderQuestionProps {
  // id: string;
  rows: string[];
  columns: string[];
  onRowChange: (index: number, value: string) => void;
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
  onColumnChange: (index: number, value: string) => void;
  onAddColumn: () => void;
  onRemoveColumn: (index: number) => void;
  disabled?: boolean;
}

const RankOrderQuestion: React.FC<RankOrderQuestionProps> = ({
  // id,
  rows,
  columns,
  onRowChange,
  onAddRow,
  onRemoveRow,
  onColumnChange,
  onAddColumn,
  onRemoveColumn,
  disabled
}) => (
  <div className="grid grid-cols-2 gap-6">
    <div className="space-y-4">
      <Label>Rows</Label>
      {rows.map((row, i) => (
        <div key={i} className="relative group">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            {i + 1}.
          </span>
          <Input
            className="pl-8 pr-10 mt-1"
            value={row}
            placeholder={`Row ${i + 1}`}
            onChange={(e) => onRowChange(i, e.target.value)}
              disabled={disabled}
          />
          <CustomButton
            icon={<Trash2 />}
            variant="ghost"
            size="icon"
            onClick={() => onRemoveRow(i)}
            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity"
              disabled={disabled}
          />
        </div>
      ))}
      <CustomButton
        text="+ Add row"
        variant="outline"
        size="sm"
        onClick={onAddRow}
          disabled={disabled}
      />
    </div>

    <div className="space-y-4">
      <Label>Columns</Label>
      {columns.map((col, i) => (
        <div key={i} className="relative group">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            {i + 1}.
          </span>
          <Input
            className="pl-8 pr-10 mt-1"
            value={col}
            placeholder={`Column ${i + 1}`}
            onChange={(e) => onColumnChange(i, e.target.value)}
              disabled={disabled}
          />
          <CustomButton
            icon={<Trash2 />}
            variant="ghost"
            size="icon"
            onClick={() => onRemoveColumn(i)}
            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity"
              disabled={disabled}
          />
        </div>
      ))}
      <CustomButton
        text="+ Add column"
        variant="outline"
        size="sm"
        onClick={onAddColumn}
          disabled={disabled}
      />
    </div>
  </div>
);

export default RankOrderQuestion;

```

Path: frontend/components/projects/polls/RatingScaleQuestion.tsx

```
"use client";

import React from "react";

import { Minus, Plus } from "lucide-react";
import { Label } from "components/ui/label";
import { Input } from "components/ui/input";
import { Button } from "components/ui/button";

export interface RatingScaleQuestionProps {
  // id: string;
  scoreFrom: number;
  scoreTo: number;
  lowLabel: string;
  highLabel: string;
  onScoreFromChange: (newFrom: number) => void;
  onScoreToChange: (newTo: number) => void;
  onLowLabelChange: (value: string) => void;
  onHighLabelChange: (value: string) => void;
  disabled?: boolean;
}

const RatingScaleQuestion: React.FC<RatingScaleQuestionProps> = ({
  // id,
  scoreFrom,
  scoreTo,
  lowLabel,
  highLabel,
  onScoreFromChange,
  onScoreToChange,
  onLowLabelChange,
  onHighLabelChange,
  disabled,
}) => (
  <div className="space-y-4">
    {/* 1) Score from / to */}
    <div className="grid grid-cols-2 gap-6">
      <div className="flex items-center space-x-2">
        <Label className="whitespace-nowrap">Score from</Label>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onScoreFromChange(Math.max(0, scoreFrom - 1))}
            disabled={disabled}
          >
            <Minus />
          </Button>

          <span className="w-8 text-center">{scoreFrom}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onScoreFromChange(scoreFrom + 1)}
            disabled={disabled}
          >
            <Plus />{" "}
          </Button>
        </div>
      </div>
      <div className="flex items-center space-x-2">
          <Label className="whitespace-nowrap">To</Label>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onScoreToChange(Math.max(scoreFrom, scoreTo - 1))}
              disabled={disabled}
            >
              <Minus />
            </Button>
            <span className="w-8 text-center">{scoreTo}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onScoreToChange(scoreTo + 1)}
              disabled={disabled}
            >
              <Plus />
            </Button>
          </div>
        </div>
      </div>

    {/* 2) Low / High labels */}
    <div className="grid grid-cols-2 gap-6">
      <div>
        <Label>Low score label</Label>
        <Input
          value={lowLabel}
          onChange={(e) => onLowLabelChange(e.target.value)}
          placeholder="e.g. Not likely"
          className="mt-1"
          disabled={disabled}
        />
      </div>
      <div>
        <Label>High score label</Label>
        <Input
          value={highLabel}
          onChange={(e) => onHighLabelChange(e.target.value)}
          placeholder="e.g. Extremely likely"
          className="mt-1"
          disabled={disabled}
        />
      </div>
    </div>
  </div>
);

export default RatingScaleQuestion;

```

Path: frontend/components/projects/polls/SingleChoiceQuestion.tsx

```
// components/polls/SingleChoiceQuestion.tsx
"use client";

import React from "react";

import { Trash2 } from "lucide-react";
import { Input } from "components/ui/input";
import CustomButton from "components/shared/CustomButton";
import { Switch } from "components/ui/switch";

export interface SingleChoiceQuestionProps {
  id: string;
  answers: string[];
  correctAnswer: number;
  showDropdown: boolean;
  onAnswerChange: (index: number, value: string) => void;
  onAddChoice: () => void;
  onRemoveChoice: (index: number) => void;
  onToggleShowDropdown: (show: boolean) => void;
  onCorrectAnswerChange: (index: number) => void;
  disabled?: boolean;
}

const SingleChoiceQuestion: React.FC<SingleChoiceQuestionProps> = ({
  id,
  answers,
  correctAnswer,
  showDropdown,
  onAnswerChange,
  onAddChoice,
  onRemoveChoice,
  onToggleShowDropdown,
  onCorrectAnswerChange,
  disabled,
}) => (
  <div className="space-y-4">
    {answers.map((ans, i) => (
      <div key={i} className="relative group flex items-center space-x-2">
        <input
          type="radio"
          name={`correct-${id}`}
          checked={correctAnswer === i}
          onChange={() => onCorrectAnswerChange(i)}
          className="cursor-pointer"
          disabled={disabled}
        />

        <Input
          value={ans}
          onChange={(e) => onAnswerChange(i, e.target.value)}
          placeholder={`Enter choice ${i + 1}`}
          className="pr-10 flex-1"
          disabled={disabled}
        />

        <CustomButton
          icon={<Trash2 />}
          variant="ghost"
          size="icon"
          onClick={() => onRemoveChoice(i)}
          className="absolute right-2 top-1/2 -translate-y-1/2
                     opacity-0 group-focus-within:opacity-100
                     transition-opacity"
          disabled={disabled}
        />
      </div>
    ))}

    <div className="flex items-center gap-2">
      <Switch
        checked={showDropdown}
        onCheckedChange={(v) => onToggleShowDropdown(v)}
        disabled={disabled}
      />
      <span>Show dropdown</span>
    </div>

    <CustomButton
      text="+ Add Choice"
      variant="outline"
      size="sm"
      onClick={onAddChoice}
      disabled={disabled}
    />
  </div>
);

export default SingleChoiceQuestion;

```

Path: frontend/components/projects/ProjectRow.tsx

```
// frontend/components/projects/ProjectRow.tsx
"use client";

import React from "react";
import { IProject } from "@shared/interface/ProjectInterface";
import {
  TableRow,
  TableCell,
} from "components/ui/table";
import { Badge } from "components/ui/badge";
import CustomButton from "components/shared/CustomButton";
import { getFirstSessionDate } from "utils/getFirstSessionDate";
import { format } from "date-fns";

interface ProjectRowProps {
  project: IProject;
  onRowClick: (projectId: string) => void;
  onShareClick: (project: IProject, type: "observer" | "participant") => void;
}

const ProjectRow: React.FC<ProjectRowProps> = ({
  project,
  onRowClick,
  onShareClick,
}) => {
  const firstDate = getFirstSessionDate(project);

  return (
    <TableRow
      // Entire row is clickable:
      className="cursor-pointer hover:bg-gray-50"
      onClick={() => onRowClick(project._id)}
    >
      {/* 1) Project Name */}
      <TableCell className="flex-1">
        {project.name}
      </TableCell>

      {/* 2) Tags */}
      <TableCell className="flex flex-wrap gap-1">
           {project.tags && project.tags.length > 0 ? (
          project.tags.map((tag) => (
            <Badge
              key={tag._id}
              style={{
                backgroundColor: tag.color,
                color: "#fff",  
              }}
              className="px-2 py-0.5 rounded"
            >
              {tag.title}
            </Badge>
          ))
        ) : (
          "—"
        )}
      </TableCell>

      {/* 3) Status */}
      <TableCell>
        <Badge variant="outline">{project.status}</Badge>
      </TableCell>

      {/* 4) First Session / Start Date */}
      <TableCell>
        {firstDate ? format(firstDate, "MM/dd/yyyy") : "—"}
      </TableCell>

      {/* 5) Share Buttons: stop propagation so row click still works */}
      <TableCell
        className="space-x-2 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <CustomButton
          size="sm"
          variant="outline"
          className="bg-custom-teal"
          onClick={() => onShareClick(project, "observer")}
        >
          Observer Link
        </CustomButton>
        <CustomButton
          size="sm"
          variant="outline"
          className="bg-custom-teal"
          onClick={() => onShareClick(project, "participant")}
        >
          Participant Link
        </CustomButton>
      </TableCell>
    </TableRow>
  );
};

export default ProjectRow;

```

Path: frontend/components/projects/ProjectsFilter.tsx

```
// frontend/components/projects/ProjectsFilter.tsx
"use client";

import React from "react";
import { Input } from "components/ui/input";
import { SearchIcon, CalendarIcon, TagIcon } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "components/ui/popover";
import { Button } from "components/ui/button";
import { Calendar } from "components/ui/calendar";
import { format } from "date-fns";

export interface DateRange {
  from: Date | undefined;
  to?: Date | undefined;
}

interface ProjectsFilterProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  tagSearchTerm: string;
  onTagSearchChange: (val: string) => void;
  dateRange?: DateRange;
  onDateRangeChange: (range: DateRange | undefined) => void;
}

const ProjectsFilter: React.FC<ProjectsFilterProps> = ({
  searchTerm,
  onSearchChange,
    tagSearchTerm,
 onTagSearchChange,
  dateRange,
  onDateRangeChange,
}) => {
  return (
    <div className="flex justify-between gap-4 mb-6">
      {/* Search input */}
      <div className="relative flex-1 max-w-sm">
        <Input
          placeholder="Search projects..."
          className="pl-9 rounded-none"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      </div>
      
    {/* Search tags */}
     <div className="relative flex-1 max-w-sm">
       <Input
         placeholder="Search tags..."
         className="pl-9 rounded-none"
         value={tagSearchTerm}
         onChange={(e) => onTagSearchChange(e.target.value)}
       />
       <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
     </div>

      {/* Date-range picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-[220px] justify-start text-left rounded-none"
          >
            {dateRange?.from && dateRange.to ? (
              <>
                {format(dateRange.from, "dd/MM/yy")} – {format(dateRange.to, "dd/MM/yy")}
              </>
            ) : (
              <span className="text-muted-foreground">DD/MM/YY – DD/MM/YY</span>
            )}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={onDateRangeChange}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ProjectsFilter;

```

Path: frontend/components/projects/ProjectsHeader.tsx

```
// frontend/components/projects/ProjectsHeader.tsx
"use client";

import React from "react";
import { Plus } from "lucide-react";
import HeadingBlue25px from "components/shared/HeadingBlue25pxComponent";
import CustomButton from "components/shared/CustomButton";

interface ProjectsHeaderProps {
  onCreateClick: () => void;
}

const ProjectsHeader: React.FC<ProjectsHeaderProps> = ({ onCreateClick }) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <HeadingBlue25px>Projects Dashboard</HeadingBlue25px>
      <CustomButton
        icon={<Plus />}
        className="bg-custom-orange-1 hover:bg-custom-orange-2 text-custom-white"
        onClick={onCreateClick}
      >
        Create New Project
      </CustomButton>
    </div>
  );
};

export default ProjectsHeader;

```

Path: frontend/components/projects/ProjectsPagination.tsx

```
// frontend/components/projects/ProjectsPagination.tsx
"use client";

import React from "react";
import CustomPagination from "components/shared/Pagination";

interface ProjectsPaginationProps {
  totalPages: number;
  currentPage: number;
  onPageChange: (newPage: number) => void;
}

const ProjectsPagination: React.FC<ProjectsPaginationProps> = ({
  totalPages,
  currentPage,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-4">
      <CustomPagination
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={onPageChange}
      />
    </div>
  );
};

export default ProjectsPagination;

```

Path: frontend/components/projects/ProjectsTable.tsx

```
// frontend/components/projects/ProjectsTable.tsx
import React from "react";
import { IProject } from "@shared/interface/ProjectInterface";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import ProjectRow from "./ProjectRow";

interface ProjectsTableProps {
  filteredProjects: IProject[];
  isLoading: boolean;
  onRowClick: (projectId: string) => void;
  onShareClick: (project: IProject, type: "observer" | "participant") => void;
}

const ProjectsTable: React.FC<ProjectsTableProps> = ({
  filteredProjects,
  isLoading,
  onRowClick,
  onShareClick,
}) => {
  return (
    <div className="bg-white shadow-all-sides overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="flex-1">Project Name</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead className="text-center">Share</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-gray-200">
          {isLoading
            ? // same skeleton rows as before…
              [...Array(5)].map((_, idx) => (
                <TableRow key={`skeleton-${idx}`}>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
            : filteredProjects.map((project) => (
                <ProjectRow
                  key={project._id}
                  project={project}
                  onRowClick={onRowClick}
                  onShareClick={onShareClick}
                />
              ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProjectsTable;

```

Path: frontend/components/projects/projectTeam/AddModeratorModal.tsx

```
"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "components/ui/dialog";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Checkbox } from "components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "components/ui/form";
import ConfirmationModalComponent from "components/shared/ConfirmationModalComponent";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "lib/api";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  addModeratorSchema,
  AddModeratorValues,
} from "schemas/addModeratorSchema";
import { ALL_ROLES, textFields } from "constant";

interface AddModeratorModalProps {
  open: boolean;
  onClose: () => void;
}

type Role = z.infer<typeof addModeratorSchema>["roles"][number];

export default function AddModeratorModal({
  open,
  onClose,
}: AddModeratorModalProps) {
  const form = useForm<AddModeratorValues>({
    resolver: zodResolver(addModeratorSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      companyName: "",
      roles: [],
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const params = useParams();
  if (!params.projectId || Array.isArray(params.projectId)) {
    throw new Error("projectId is required and must be a string");
  }
  const projectId = params.projectId;
  const queryClient = useQueryClient();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingRole, setPendingRole] = useState<Role | null>(null);
  const [prevRoles, setPrevRoles] = useState<Role[]>([]);

  const createProjectTeamMember = useMutation({
    mutationFn: (payload: AddModeratorValues & { projectId: string }) =>
      api.post("/api/v1/moderators/add-moderator", payload),
    onSuccess: () => {
      toast.success("Team member added successfully!");
      queryClient.invalidateQueries({
        queryKey: ["projectTeam", projectId],
      });
      form.reset();
      onClose();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unknown error");
    },
  });

  const onConfirm = (yes: boolean) => {
    if (yes && pendingRole) {
      form.setValue("roles", [...prevRoles, pendingRole]);
    } else {
      form.setValue("roles", prevRoles);
    }
    setPendingRole(null);
    setIsConfirmOpen(false);
  };

  const onSubmit = form.handleSubmit(
    (values) => {
      createProjectTeamMember.mutate({
        ...values,
        projectId,
      });
    },
    (errors) => {
      // pick first error and toast it
      const firstError = Object.values(errors)[0]?.message;
      if (typeof firstError === "string") toast.error(firstError);
    }
  );

  const isSaving = createProjectTeamMember.isPending;

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          // if the dialog is closing…
          if (!nextOpen) {
            form.reset();
            onClose();
          }
        }}
      >
        <DialogContent className="w-full max-w-2xl overflow-x-auto border-0">
          <DialogHeader>
            <DialogTitle>Add Project Team</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-4">
              {/* First Name */}
              {textFields.map(({ name, label, type }) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{label}</FormLabel>
                      <FormControl>
                        <Input
                          type={type}
                          placeholder={label}
                          {...field}
                          disabled={isSaving}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}

              {/* Roles */}
              <FormField
                control={form.control}
                name="roles"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        {ALL_ROLES.map((role) => (
                          <div
                            key={role}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              checked={field.value.includes(role)}
                              disabled={isSaving}
                              onCheckedChange={(checked) => {
                                // same confirm logic for Admin
                                if (role === "Admin" && checked) {
                                  setPrevRoles(field.value);
                                  setPendingRole("Admin");
                                  setIsConfirmOpen(true);
                                } else {
                                  field.onChange(
                                    checked
                                      ? [...field.value, role]
                                      : field.value.filter((r) => r !== role)
                                  );
                                }
                              }}
                            />
                            <span>{role}</span>
                          </div>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    form.reset();
                    onClose();
                  }}
                >
                  Cancel
                </Button>
                <Button disabled={isSaving} type="submit">
                  {" "}
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmationModalComponent
        open={isConfirmOpen}
        heading="Confirm Admin Role"
        text="Are you sure you want to add this person as an Admin for this project? Adding an Admin authorizes this individual to incur charges on your behalf."
        onCancel={() => onConfirm(false)}
        onYes={() => onConfirm(true)}
      />
    </>
  );
}

```

Path: frontend/components/projects/projectTeam/EditModeratorModal.tsx

```
// components/projects/projectTeam/EditModeratorModal.tsx
"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { IModerator } from "@shared/interface/ModeratorInterface";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "components/ui/dialog";
import { Input } from "components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "components/ui/form";
import { Switch } from "components/ui/switch";
import { useParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "lib/api";
import CustomButton from "components/shared/CustomButton";
import { textFields } from "constant";
import { zodResolver } from "@hookform/resolvers/zod";
import { editModeratorSchema } from "schemas/editModeratorSchema";

export interface EditModeratorForm {
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  adminAccess: boolean;
  isActive: boolean;
}

interface EditModeratorModalProps {
  open: boolean;
  moderator: IModerator | null;
  onClose: () => void;
}

export default function EditModeratorModal({
  open,
  moderator,
  onClose,
}: EditModeratorModalProps) {
  const form = useForm<EditModeratorForm>({
    resolver: zodResolver(editModeratorSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      companyName: "",
      adminAccess: false,
      isActive: true,
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const { projectId } = useParams() as { projectId: string };
  const qc = useQueryClient();

  useEffect(() => {
    if (moderator) {
      form.reset({
        firstName: moderator.firstName,
        lastName: moderator.lastName,
        email: moderator.email,
        companyName: moderator.companyName,
        adminAccess: moderator.adminAccess,
        isActive: moderator.isActive,
      });
    }
  }, [moderator, form]);

  // mutation to update moderator
  const editModerator = useMutation<
    IModerator,
    Error,
    { id: string; values: EditModeratorForm }
  >({
    mutationFn: ({ id, values }) =>
      api
        .put<{ data: IModerator }>(`/api/v1/moderators/${id}`, values)
        .then((res) => res.data.data),
    onSuccess: () => {
      toast.success("Project team member updated successfully");
      qc.invalidateQueries({ queryKey: ["projectTeam", projectId] });
      onClose();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unknown error");
    },
  });

  // handle form submit
  const onSubmit = form.handleSubmit(
    (values) => {
      if (!moderator?._id) return;
      editModerator.mutate({ id: moderator._id, values });
    },
    (errors) => {
      const firstError = Object.values(errors)[0]?.message;
      if (typeof firstError === "string") toast.error(firstError);
    }
  );

  const isVerified = moderator?.isVerified;
  const isSaving = editModerator.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-2xl overflow-x-auto border-0">
        <DialogHeader>
          <DialogTitle>Edit Moderator</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-6">
            {textFields.map(({ name, label, type }) => (
              <div key={name}>
                {isVerified ? (
                  <p>
                    <span className="font-semibold">{label}:</span>{" "}
                    {moderator?.[name]}
                  </p>
                ) : (
                  <FormField
                    control={form.control}
                    name={name}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{label}</FormLabel>
                        <FormControl>
                          <Input disabled={isSaving} type={type} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            ))}

            {/* Admin Access toggle */}
            <FormField
              control={form.control}
              name="adminAccess"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <FormLabel className="m-0">Admin Access</FormLabel>
                  <FormControl>
                    <Switch
                      disabled={isSaving}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <FormLabel className="m-0">
                    {field.value ? "Active" : "Inactive"}
                  </FormLabel>
                  <FormControl>
                    <Switch
                      disabled={isSaving}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4 flex justify-end space-x-2">
              <CustomButton
                variant="outline"
                onClick={() => {
                  form.reset();
                  onClose();
                }}
              >
                Cancel
              </CustomButton>
              <CustomButton
                type="submit"
                className="bg-custom-teal hover:bg-custom-dark-blue-3"
                disabled={isSaving}
              >
                {isSaving ? "Saving…" : "Save"}
              </CustomButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

```

Path: frontend/components/projects/projectTeam/ProjectTeamsTable.tsx

```
import { IModerator } from "@shared/interface/ModeratorInterface";
import { IPaginationMeta } from "@shared/interface/PaginationInterface";
import CustomButton from "components/shared/CustomButton";
import CustomPagination from "components/shared/Pagination";
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
} from "components/ui/table";
import {  Pencil } from "lucide-react";
import React, { useState } from "react";
import EditModeratorModal from "./EditModeratorModal";

export interface ProjectTeamsTableProps {
  moderators: IModerator[];
  meta: IPaginationMeta;
  onPageChange: (newPage: number) => void;
}

const ProjectTeamsTable: React.FC<ProjectTeamsTableProps> = ({
  moderators,
  meta,
  onPageChange,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeModerator, setActiveModerator] = useState<IModerator | null>(
    null
  );

  const openModal = (mod: IModerator) => {
    setActiveModerator(mod);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setActiveModerator(null);
  };

  return (
    <div className=" rounded-lg shadow-lg overflow-x-auto">
      <div className="bg-white rounded-lg shadow-lg">
        <Table className="min-w-full divide-y divide-gray-200">
          <TableHeader>
            <TableRow className="">
              {["Member Name", "Role", "Activity Log", "Actions"].map((col) => (
                <TableHead
                  key={col}
                  className="px-6 py-3 text-center text-xs font-semibold text-custom-dark-blue-1 uppercase tracking-wider"
                >
                  <div className="inline-flex items-center space-x-1">
                    <span>{col}</span>
                    {/* <ChevronsUpDown className="h-4 w-4 text-gray-400" /> */}
                  </div>
                </TableHead>
              ))}
              <TableHead className="px-6 py-3" />
            </TableRow>
          </TableHeader>

          <TableBody className="bg-white divide-y divide-gray-100 text-left">
            {moderators.map((m) => {
              const rowClass = m.isActive
      ? "cursor-pointer hover:bg-gray-50"
      : "bg-gray-100 text-gray-400";
            return (
              <TableRow key={m._id} className={`${rowClass}`}>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {m.firstName} {m.lastName}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 ">
                  {m.roles?.length ? (
                    m.roles.join(", ")
                  ) : (
                    <span className="text-gray-400">No role assigned</span>
                  )}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {/*activity log*/}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                  <CustomButton
                    icon={<Pencil />}
                    onClick={() => openModal(m)}
                    className=" bg-custom-orange-1 text-white hover:bg-custom-orange-2 font-semibold px-2"
                  />
                </TableCell>
              </TableRow>
            )
            }
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={5} className="px-6 bg-white">
                <div className="flex justify-center">
                  <CustomPagination
                    currentPage={meta.page}
                    totalPages={meta.totalPages}
                    onPageChange={onPageChange}
                  />
                </div>
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
      <EditModeratorModal
        open={isModalOpen}
        moderator={activeModerator}
        onClose={closeModal}
      />
    </div>
  );
};

export default ProjectTeamsTable;

```

Path: frontend/components/projects/sessions/AddModeratorModal.tsx

```
// components/projects/sessions/AddModeratorModal.tsx
"use client";

import { useState } from "react";

import { useMutation } from "@tanstack/react-query";
import api from "lib/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";
import { Label } from "components/ui/label";
import { Input } from "components/ui/input";
import CustomButton from "components/shared/CustomButton";
import { ApiResponse } from "@shared/interface/ApiResponseInterface";
import { IModerator } from "@shared/interface/ModeratorInterface";
import { useParams } from "next/navigation";
import { Switch } from "components/ui/switch";
import {
  alphanumericSingleSpace,
  alphaSingleSpace,
  emailChars,
  lettersAndSpaces,
  noLeadingSpace,
  noMultipleSpaces,
  noTrailingSpace,
  validate,
} from "schemas/validators";
import { makeOnChange } from "utils/validationHelper";

interface AddModeratorModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ModeratorFormData {
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  adminAccess: boolean;
}

const AddModeratorModal: React.FC<AddModeratorModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const params = useParams();
  // coerce it into a string (or throw if missing)
  if (!params.projectId || Array.isArray(params.projectId)) {
    throw new Error("projectId is required and must be a string");
  }
  const projectId = params.projectId;
  const [formData, setFormData] = useState<ModeratorFormData>({
    firstName: "",
    lastName: "",
    email: "",
    companyName: "",
    adminAccess: false,
  });

  const addModeratorMutation = useMutation<
    ApiResponse<IModerator>,
    Error,
    ModeratorFormData & { projectId: string; roles: string[] }
  >({
    mutationFn: (payload) =>
      api
        .post<ApiResponse<IModerator>>(
          `/api/v1/moderators/add-moderator`,
          payload
        )
        .then((res) => res.data),

    onSuccess: () => {
      toast.success("Moderator added successfully!");
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        companyName: "",
        adminAccess: false,
      });
      onClose();
      onSuccess?.();
    },

    onError: (error) => {
      console.error("error", error);
      toast.error(error instanceof Error ? error.message : "Unknown error");
    },
  });

  const handleSubmit = () => {
    const roles = formData.adminAccess ? ["Moderator", "Admin"] : ["Moderator"];

    const clean = (s: string) => s.trim().replace(/\s+/g, " ");
    const data = {
      ...formData,
      firstName: clean(formData.firstName),
      lastName: clean(formData.lastName),
      companyName: clean(formData.companyName),
      email: formData.email.trim(),
    };
    if (
      !validate(data.firstName, [
        noLeadingSpace,
        noTrailingSpace,
        alphaSingleSpace,
      ]) ||
      !validate(data.lastName, [
        noLeadingSpace,
        noTrailingSpace,
        alphaSingleSpace,
      ]) ||
      !validate(data.companyName, [
        noLeadingSpace,
        noTrailingSpace,
        noMultipleSpaces,
        alphanumericSingleSpace,
      ]) ||
      !emailChars(data.email)
    ) {
      toast.error("Please fix the highlighted fields before saving.");
      return;
    }

    addModeratorMutation.mutate({ ...data, roles, projectId });
  };

  const handleClose = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      companyName: "",
      adminAccess: false,
    });
    onClose();
  };

  const isSaving = addModeratorMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-2xl overflow-x-auto border-0">
        <DialogHeader>
          <DialogTitle>Add Moderator</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {(["firstName", "lastName", "email", "companyName"] as const).map(
            (field) => {
              const label =
                field === "firstName"
                  ? "First Name"
                  : field === "lastName"
                  ? "Last Name"
                  : field === "companyName"
                  ? "Company Name"
                  : "Email";

              return (
                <div key={field}>
                  <Label className="capitalize">{label}*</Label>
                  <Input
                    name={field}
                    placeholder={`Enter ${label}`}
                    value={formData[field]}
                    // onChange only checks everything *except* trailing‐space
                    onChange={makeOnChange(
                      field,
                      field === "firstName" || field === "lastName"
                        ? [noLeadingSpace, noMultipleSpaces, lettersAndSpaces]
                        : field === "companyName"
                        ? [
                            noLeadingSpace,
                            noMultipleSpaces,
                            alphanumericSingleSpace,
                          ]
                        : /* email */ [noLeadingSpace, emailChars],
                      field === "companyName"
                        ? "Company Name must contain only letters/numbers & single spaces."
                        : field === "email"
                        ? "Please enter a valid email address."
                        : `${label} must be letters, single spaces, no edge spaces.`,
                      (upd) => setFormData((prev) => ({ ...prev, ...upd }))
                    )}
                    // onBlur now does the edge‐space trim + final trailing‐space check
                    onBlur={() => {
                      const cleaned = formData[field]
                        .trim()
                        .replace(/\s+/g, " ");
                      setFormData(
                        (prev) =>
                          ({
                            ...prev,
                            [field]: cleaned,
                          } as ModeratorFormData)
                      );
                      if (
                        field === "email"
                          ? !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)
                          : !validate(cleaned, [
                              noLeadingSpace,
                              noTrailingSpace,
                              alphaSingleSpace,
                            ])
                      ) {
                        toast.error(
                          field === "email"
                            ? "Please enter a valid email address."
                            : `${label} must be letters only, single spaces, no edge spaces.`
                        );
                      }
                    }}
                    className="mt-3"
                    required
                    disabled={isSaving}
                  />
                </div>
              );
            }
          )}

          <div className="flex items-center space-x-3 gap-3">
            <Label className="m-0">Admin Access</Label>
            <Switch
              checked={formData.adminAccess}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, adminAccess: checked }))
              }
              disabled={isSaving}
            />
            <span className="text-sm font-medium">
              {formData.adminAccess ? "Yes" : "No"}
            </span>
          </div>

          <div>
            <p className="text-sm">
              <strong>Note:</strong> All Admins can add, start, or delete
              meetings and materials, and can incur charges to your account for
              this project.
            </p>
          </div>
          <div className="flex justify-end pt-2">
            <CustomButton
              onClick={handleSubmit}
              disabled={isSaving}
              className="bg-custom-orange-2 hover:bg-custom-orange-1 text-white"
            >
              {isSaving ? "Saving..." : "Save"}
            </CustomButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddModeratorModal;

```

Path: frontend/components/projects/sessions/AddSessionModal.tsx

```
// components/projects/sessions/AddSessionModal.tsx

"use client";
import CustomButton from "components/shared/CustomButton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";
import React, { useEffect, useState } from "react";
import AddSessionStep1 from "./AddSessionStep1";
import AddSessionStep2 from "./AddSessionStep2";
import { IModerator } from "@shared/interface/ModeratorInterface";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "lib/api";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import { IProject } from "@shared/interface/ProjectInterface";

interface AddSessionModalProps {
  open: boolean;
  onClose: () => void;
}

export interface ISessionFormData {
  numberOfSessions: number;
  selectedModerators: string[];
  allModerators?: IModerator[];
  timeZone: string;
  sameModerator: boolean;
  sameSession: boolean;
  sessions: Array<{
    title: string;
    date: string;
    startTime: string;
    duration: string;
    moderators: string[];
  }>;
}

const initialFormData: ISessionFormData = {
  numberOfSessions: 0,
  selectedModerators: [],
  allModerators: [],
  timeZone: "",
  sameModerator: false,
  sameSession: false,
  sessions: [
    { title: "", date: "", startTime: "", duration: "0", moderators: [] },
  ],
};

const AddSessionModal: React.FC<AddSessionModalProps> = ({ open, onClose }) => {
  const params = useParams();
  if (!params.projectId || Array.isArray(params.projectId)) {
    throw new Error("projectId is required and must be a string");
  }
  const projectId = params.projectId;
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<ISessionFormData>(initialFormData);

  const { data: project } = useQuery<IProject, Error>({
    queryKey: ["project", projectId],
    queryFn: () =>
      api
        .get(`/api/v1/projects/get-project-by-id/${projectId}`)
        .then((res) => res.data.data),
    enabled: Boolean(projectId),
  });

  // When project defaults load, prefill the form
  useEffect(() => {
    if (!project) return;
    // Use project's IANA default timezone directly if provided
    if (project.defaultTimeZone) {
      setFormData((prev) => ({
        ...prev,
        timeZone: project.defaultTimeZone!,
      }));
    }
  }, [project]);

  // whenever numberOfSessions changes, resize the sessions array
  useEffect(() => {
    setFormData((f) => ({
      ...f,
      sessions: Array.from(
        { length: f.numberOfSessions },
        (_, i) =>
          f.sessions[i] || {
            title: "",
            date: "",
            startTime: "",
            duration: 0,
            moderators: [],
          }
      ),
    }));
  }, [formData.numberOfSessions]);

  const createSessions = useMutation({
    mutationFn: (payload: {
      projectId: string;
      timeZone: string;
      sameSession: boolean;
      sessions: {
        title: string;
        date: string;
        startTime: string;
        duration: number;
        moderators: string[];
      }[];
    }) => api.post("/api/v1/sessions", payload),

    onSuccess: () => {
      toast.success("Sessions created!");
      queryClient.invalidateQueries({
        queryKey: ["sessions", projectId],
      });
      setFormData(initialFormData);
      onClose();
      setStep(1);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unknown error");
    },
  });

  const handleSave = () => {
    // Required fields validation before conflict checks
    if (!formData.sessions || formData.sessions.length === 0) {
      toast.error("Please add at least one session.");
      return;
    }

    if (formData.sameSession) {
      const sharedDuration = Number(formData.sessions[0]?.duration);
      if (!sharedDuration || sharedDuration <= 0) {
        toast.error("Please select a session length.");
        return;
      }
    }

    // Per-session validation
    for (let i = 0; i < formData.sessions.length; i++) {
      const s = formData.sessions[i];
      const label = s.title?.trim() ? s.title.trim() : `Session ${i + 1}`;

      if (!s.title || !s.title.trim()) {
        toast.error(`Please enter a title for ${label}.`);
        return;
      }
      if (!s.date) {
        toast.error(`Please select a date for ${label}.`);
        return;
      }
      if (!s.startTime) {
        toast.error(`Please select a start time for ${label}.`);
        return;
      }
      if (!formData.sameSession) {
        const dur = Number(s.duration);
        if (!dur || dur <= 0) {
          toast.error(`Please select a duration for ${label}.`);
          return;
        }
      }
      if (!formData.sameModerator) {
        if (!s.moderators || s.moderators.length === 0) {
          toast.error(`Please select at least one moderator for ${label}.`);
          return;
        }
      } else {
        if (
          !formData.selectedModerators ||
          formData.selectedModerators.length === 0
        ) {
          toast.error("Please select at least one moderator in Step 1.");
          return;
        }
      }
    }

    // Frontend conflict check: ensure no overlapping sessions
    const parseToUtcMs = (dateStr: string, timeStr: string): number | null => {
      if (!dateStr || !timeStr) return null;
      const [y, m, d] = dateStr.split("-").map(Number);
      const [hh, mm] = timeStr.split(":").map(Number);
      if ([y, m, d, hh, mm].some((n) => Number.isNaN(n))) return null;
      // Treat entered local clock time as naive time and map to UTC epoch consistently
      return Date.UTC(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
    };

    const sessionsWithTimes = formData.sessions
      .map((s, idx) => {
        const durationMin = Number(
          formData.sameSession
            ? formData.sessions[0]?.duration ?? 0
            : s.duration ?? 0
        );
        const startMs = parseToUtcMs(s.date, s.startTime);
        const endMs =
          startMs !== null
            ? startMs + Math.max(0, durationMin) * 60 * 1000
            : null;
        const label = s.title?.trim() ? s.title.trim() : `Session ${idx + 1}`;
        return { idx, startMs, endMs, label } as const;
      })
      // consider only rows with complete timing info and positive duration
      .filter((r) => r.startMs !== null && r.endMs !== null) as Array<{
      idx: number;
      startMs: number;
      endMs: number;
      label: string;
    }>;

    if (sessionsWithTimes.length > 1) {
      const sorted = [...sessionsWithTimes].sort(
        (a, b) => a.startMs - b.startMs
      );
      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const curr = sorted[i];
        if (curr.startMs < prev.endMs) {
          toast.error(
            `Time conflict: "${prev.label}" overlaps with "${curr.label}".`
          );
          return;
        }
      }
    }

    if (project?.service === "Concierge") {
      const now = new Date();
      const cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() + 14);

      const tooSoon = formData.sessions.some((s) => {
        const sessionDate = new Date(s.date);
        return sessionDate < cutoff;
      });

      if (tooSoon) {
        toast.error(
          "You have selected Concierge Service for your project. " +
            "Sessions cannot be added for dates less than 2 weeks in the future. " +
            "Please contact info@amplifyresearch.com to check availability within this time window."
        );
        return;
      }
    }
    createSessions.mutate({
      projectId,
      timeZone: formData.timeZone,
      sameSession: formData.sameSession,
      sessions: formData.sessions.map((s) => ({
        title: s.title,
        date: s.date,
        startTime: s.startTime,
        duration: Number(s.duration),
        moderators: formData.sameModerator
          ? formData.selectedModerators
          : s.moderators,
      })),
    });
  };

  const handleNext = () => {
    if (formData.selectedModerators.length === 0) {
      return toast.error("Please select at least one moderator.");
    }
    if (formData.numberOfSessions < 1) {
      return toast.error("Please select the number of sessions (minimum 1).");
    }
    if (!formData.timeZone) {
      if (project?.defaultTimeZone) {
        setFormData((f) => ({ ...f, timeZone: project.defaultTimeZone! }));
      } else {
        return toast.error("Project time zone is loading. Please try again.");
      }
    }
    // If sessions share the same length, require a selection before continuing
    if (formData.sameSession) {
      const lengthValue = formData.sessions[0]?.duration;
      if (!lengthValue || Number(lengthValue) <= 0) {
        return toast.error("Please select a session length.");
      }
    }
    setStep(2);
  };

  const isSaving = createSessions.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setFormData(initialFormData);
          setStep(1);
          onClose();
        }
      }}
    >
      <DialogContent className="w-full max-w-5xl overflow-x-auto border-0">
        <DialogHeader>
          <DialogTitle>Add New Session</DialogTitle>
        </DialogHeader>
        {step === 1 && (
          <>
            <AddSessionStep1
              formData={formData}
              updateFormData={(fields) =>
                setFormData((f) => ({ ...f, ...fields }))
              }
            />
            <div className="flex justify-end">
              <CustomButton
                onClick={handleNext}
                disabled={
                  formData.sameSession &&
                  !(Number(formData.sessions[0]?.duration) > 0)
                }
                className="bg-custom-teal hover:bg-custom-dark-blue-3"
              >
                Next
              </CustomButton>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <AddSessionStep2
              formData={formData}
              updateFormData={(fields) =>
                setFormData((f) => ({ ...f, ...fields }))
              }
              isSaving={isSaving}
            />
            <div className="flex justify-between">
              <CustomButton
                onClick={() => setStep(1)}
                className="bg-custom-teal hover:bg-custom-dark-blue-3"
              >
                Back
              </CustomButton>
              <CustomButton
                onClick={handleSave}
                disabled={isSaving}
                className="bg-custom-orange-2 hover:bg-custom-orange-1"
              >
                {isSaving ? "Saving…" : "Save Sessions"}
              </CustomButton>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddSessionModal;

```

Path: frontend/components/projects/sessions/AddSessionStep1.tsx

```
"use client";

import { Switch } from "components/ui/switch";
import { IModerator } from "@shared/interface/ModeratorInterface";
import { IPaginationMeta } from "@shared/interface/PaginationInterface";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import CustomButton from "components/shared/CustomButton";
import { Label } from "components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from "components/ui/tooltip";
// import { timeZones } from "constant";
import { durations } from "constant";
import api from "lib/api";
import React, { useEffect, useRef, useState } from "react";
import AddModeratorModal from "./AddModeratorModal";
import { ISessionFormData } from "./AddSessionModal";
import MultiSelectDropdown from "./MultiSelectDropdown";
import { useParams } from "next/navigation";
// import { BiQuestionMark } from "react-icons/bi";

interface AddSessionStep1Props {
  formData: ISessionFormData;
  updateFormData: (fields: Partial<ISessionFormData>) => void;
}

const AddSessionStep1: React.FC<AddSessionStep1Props> = ({
  formData,
  updateFormData,
}) => {
  const { projectId } = useParams();
  const limit = 100;
  const page = 1;
  const [showAddModal, setShowAddModal] = useState(false);
  const prevNumRef = useRef<number>(formData.numberOfSessions);

  const {
    data,
    // isLoading,
    error,
    refetch: refetchModerators,
  } = useQuery<{ data: IModerator[]; meta: IPaginationMeta }, Error>({
    queryKey: ["moderators", projectId],
    queryFn: () =>
      api
        .get<{ data: IModerator[]; meta: IPaginationMeta }>(
          `/api/v1/moderators/project/${projectId}`,
          { params: { page, limit } }
        )
        .then((res) => res.data),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    // only re-run when the count changes
    if (prevNumRef.current === formData.numberOfSessions) {
      return;
    }
    prevNumRef.current = formData.numberOfSessions;

    updateFormData({
      sessions: Array.from(
        { length: formData.numberOfSessions },
        (_, i) =>
          formData.sessions[i] || {
            title: "",
            date: "",
            startTime: "",
            duration: "",
            moderators: [],
          }
      ),
    });
  }, [formData.numberOfSessions, formData.sessions, updateFormData]);

  useEffect(() => {
    if (data?.data && formData.allModerators?.length === 0) {
      updateFormData({ allModerators: data.data });
    }
  }, [data?.data]);

  if (error) {
    console.error("Error fetching moderators:", error.message);
  }

  return (
    <div className="space-y-5">
      {/* Number of Sessions */}
      <div>
        <Label className="font-semibold text-sm mb-1 block">
          Number of Sessions<span className="text-red-500">*</span>
        </Label>
        <Select
          onValueChange={(val) =>
            updateFormData({ numberOfSessions: Number(val) })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select number" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 60 }, (_, i) => (
              <SelectItem key={i + 1} value={(i + 1).toString()}>
                {i + 1}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Are all sessions the same length? */}
      <div className="flex items-center justify-between">
        <Label className="font-medium text-sm">
          Are all sessions the same length?
        </Label>
        <div className="flex items-center gap-2">
          <Switch
            className="cursor-pointer"
            checked={formData.sameSession}
            onCheckedChange={(b) => updateFormData({ sameSession: b })}
          />
          <span className="text-sm font-medium">
            {formData.sameSession ? "Yes" : "No"}
          </span>
        </div>
      </div>

      {formData.sameSession && (
        <div>
          <Label className="font-semibold text-sm mb-1 block">
            Session Length
          </Label>
          <Select
            onValueChange={(val) =>
              updateFormData({
                sessions: Array.from(
                  { length: formData.numberOfSessions },
                  (_, i) => ({
                    title: formData.sessions[i]?.title ?? "",
                    date: formData.sessions[i]?.date ?? "",
                    startTime: formData.sessions[i]?.startTime ?? "",
                    duration: val,
                    moderators: formData.sameModerator
                      ? formData.selectedModerators
                      : formData.sessions[i]?.moderators ?? [],
                  })
                ),
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              {durations.map((d) => (
                <SelectItem key={d.minutes} value={String(d.minutes)}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Same Moderator for All Sessions */}
      <div className="flex items-center justify-between">
        <Label className="font-medium text-sm">
          Do you want the same moderator for all of your sessions?
        </Label>
        <div className="flex items-center gap-2">
          <Switch
            className="cursor-pointer"
            checked={formData.sameModerator}
            onCheckedChange={(b) => updateFormData({ sameModerator: b })}
          />
          <span className="text-sm font-medium">
            {formData.sameModerator ? "Yes" : "No"}
          </span>
        </div>
      </div>

      {/* Moderators */}
      <div>
        <div className="flex gap-3 items-end">
          <div>
            <Label className="font-semibold text-sm mb-1 block">
              Moderators<span className="text-red-500">*</span>
            </Label>
            <MultiSelectDropdown
              moderators={data?.data || []}
              selected={formData.selectedModerators}
              onChange={(ids) => updateFormData({ selectedModerators: ids })}
            />
          </div>

          <CustomButton
            className="bg-custom-teal text-white hover:bg-custom-dark-blue-3"
            onClick={() => setShowAddModal(true)}
          >
            Add Study Moderator
          </CustomButton>
        </div>
      </div>

      <AddModeratorModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={refetchModerators}
      />
    </div>
  );
};

export default AddSessionStep1;

```

Path: frontend/components/projects/sessions/AddSessionStep2.tsx

```
"use client";

import React from "react";
import { ISessionFormData } from "./AddSessionModal";
import { Label } from "components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import { Input } from "components/ui/input";
import { Card } from "components/ui/card";
import MultiSelectDropdown from "./MultiSelectDropdown";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";
import { durations } from "constant";
import { makeOnChange } from "utils/validationHelper";
import {
  alphanumericSingleSpace,
  noLeadingSpace,
  noMultipleSpaces,
} from "schemas/validators";

interface AddSessionStep2Props {
  formData: ISessionFormData;
  updateFormData: (fields: Partial<ISessionFormData>) => void;
  isSaving: boolean;
}

const AddSessionStep2: React.FC<AddSessionStep2Props> = ({
  formData,
  updateFormData,
  isSaving,
}) => {
  const { allModerators = [], selectedModerators, sessions } = formData;

  // only the ones picked in step 1
  const availableMods = allModerators.filter((m) =>
    selectedModerators.includes(m._id!)
  );
  const updateSession = (
    index: number,
    fields: Partial<(typeof sessions)[0]>
  ) => {
    const updated = sessions.map((s, i) =>
      i === index ? { ...s, ...fields } : s
    );
    updateFormData({ sessions: updated });
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Session Table</Label>
      <div className="overflow-x-auto">
        <Card className="max-h-[400px] overflow-y-auto border-0 shadow-sm py-0 min-w-[900px]">
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10">
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Moderator</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((sess, idx) => {
                const rowMods = formData.sameModerator
                  ? formData.selectedModerators
                  : sess.moderators;

                return (
                  <TableRow key={idx}>
                    <TableCell>
                      <Input
                        value={sess.title}
                        placeholder="Title"
                        maxLength={20}
                        className="w-full"
                        disabled={isSaving}
                        onChange={makeOnChange<"title">(
                          "title",
                          [
                            noLeadingSpace,

                            noMultipleSpaces,
                            alphanumericSingleSpace,
                          ],
                          "Title must be letters/numbers only, single spaces, no edge spaces.",
                          (upd) => updateSession(idx, { title: upd.title })
                        )}
                        onBlur={(e) => {
                          const cleaned = e.target.value
                            .trim()
                            .replace(/\s+/g, " ");
                          if (cleaned !== e.target.value) {
                            updateSession(idx, { title: cleaned });
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        value={sess.date}
                        disabled={isSaving}
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full"
                        onChange={(e) =>
                          updateSession(idx, { date: e.target.value })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="time"
                        value={sess.startTime}
                        className="w-full"
                        disabled={isSaving}
                        onChange={(e) =>
                          updateSession(idx, { startTime: e.target.value })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={sess.duration}
                        disabled={isSaving}
                        onValueChange={(val) =>
                          updateSession(idx, { duration: val })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Duration" />
                        </SelectTrigger>
                        <SelectContent>
                          {durations.map(({ label, minutes }) => (
                            <SelectItem
                              key={minutes}
                              value={minutes.toString()}
                            >
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {formData.sameModerator ? (
                        <div className="flex flex-wrap gap-2">
                          {availableMods.map((mod) => (
                            <span
                              key={mod._id}
                              className="text-xs bg-muted px-2 py-1 rounded-full border"
                            >
                              {mod.firstName} {mod.lastName}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <MultiSelectDropdown
                          moderators={availableMods}
                          selected={rowMods}
                          onChange={(ids) => {
                            if (!formData.sameModerator) {
                              updateSession(idx, { moderators: ids });
                            }
                          }}
                          disabled={formData.sameModerator || isSaving}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
};

export default AddSessionStep2;

```

Path: frontend/components/projects/sessions/EditSessionModal.tsx

```
// components/projects/sessions/EditSessionModal.tsx
"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "components/ui/form";
import { Input } from "components/ui/input";
import { Button } from "components/ui/button";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ISession } from "@shared/interface/SessionInterface";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "components/ui/select";
import { durations } from "constant";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { IProject } from "@shared/interface/ProjectInterface";
import api from "lib/api";
import { toast } from "sonner";
import { Switch } from "components/ui/switch";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "components/ui/tooltip";
import { businessDaysBetween } from "utils/countDaysBetween";
import {
  alphanumericSingleSpace,
  noLeadingSpace,
  noMultipleSpaces,
  validate,
} from "schemas/validators";

// 1️⃣ Define a Zod schema matching your ISession fields including timeZone
const editSessionSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .refine(noLeadingSpace, {
      message: "Cannot start with a space",
    })
    .refine(noMultipleSpaces, {
      message: "Cannot have multiple spaces in a row",
    })
    .refine(alphanumericSingleSpace, {
      message: "Only letters/numbers and single spaces allowed",
    }),
  date: z.string(),
  startTime: z.string(),
  duration: z.number().min(1, "Duration must be at least 1 minute"),
  timeZone: z.string().min(1, "Time zone is required"),
  breakoutRoom: z.boolean(),
});

export type EditSessionValues = z.infer<typeof editSessionSchema>;

interface EditSessionModalProps {
  open: boolean;
  session: ISession | null;
  onClose: () => void;
  onSave: (values: EditSessionValues) => void;
  isSaving: boolean;
}

export default function EditSessionModal({
  open,
  session,
  onClose,
  onSave,
  isSaving,
}: EditSessionModalProps) {
  const params = useParams();
  if (!params.projectId || Array.isArray(params.projectId)) {
    throw new Error("projectId is required and must be a string");
  }
  const projectId = params.projectId;

  const { data: project } = useQuery<IProject, Error>({
    queryKey: ["project", projectId],
    queryFn: () =>
      api
        .get(`/api/v1/projects/get-project-by-id/${projectId}`)
        .then((res) => res.data.data),
    enabled: Boolean(projectId),
  });

  const form = useForm<EditSessionValues>({
    resolver: zodResolver(editSessionSchema),
    defaultValues: {
      title: session?.title ?? "",
      date: session
        ? new Date(session.date).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      startTime: session?.startTime ?? "",
      duration: session?.duration ?? 30,
      timeZone: session?.timeZone ?? "",
      breakoutRoom: session?.breakoutRoom ?? false,
    },
  });

  const { handleSubmit, control, reset } = form;

  React.useEffect(() => {
    if (session) {
      reset({
        title: session.title,
        date: new Date(session.date).toISOString().slice(0, 10),
        startTime: session.startTime,
        duration: session.duration,
        timeZone: session.timeZone,
        breakoutRoom: session.breakoutRoom,
      });
    }
  }, [session, reset]);

  // count business days between today and `target`

  const onSubmit = (data: EditSessionValues) => {
    // only enforce for Concierge
    if (project?.service === "Concierge") {
      const selDate = new Date(data.date);
      const diff = businessDaysBetween(selDate);

      if (diff <= 3) {
        toast.error(
          "You have selected Concierge Service for your project. Sessions scheduled within 3 business days cannot be cancelled or rescheduled. Please contact info@amplifyresearch.com to discuss any last minute scheduling needs."
        );
        return;
      }
    }
    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="w-full max-w-[calc(100%-2rem)] sm:max-w-lg ">
        <DialogTitle>Edit Session</DialogTitle>
        <Form {...form}>
          <form
            id="edit-session-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Session title"
                      {...field}
                      disabled={isSaving}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (
                          !validate(v, [
                            noLeadingSpace,
                            noMultipleSpaces,
                            alphanumericSingleSpace,
                          ])
                        ) {
                          toast.error(
                            "Only letters/numbers + single spaces; no edge/multiple spaces allowed."
                          );
                          return;
                        }
                        field.onChange(e);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      disabled={isSaving}
                      {...field}
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} disabled={isSaving} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration</FormLabel>
                  <FormControl>
                    <Select
                      value={String(field.value)}
                      onValueChange={(val) => field.onChange(Number(val))}
                      disabled={isSaving}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        {durations.map((d) => (
                          <SelectItem key={d.minutes} value={String(d.minutes)}>
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

         

            <FormField
              control={control}
              name="breakoutRoom"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between px-1 py-2">
                  <div className="flex justify-start item-center gap-2">
                    <FormLabel className="mb-0">
                      Do you need breakout room functionality?
                    </FormLabel>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info
                            size={16}
                            className="text-muted-foreground cursor-pointer"
                          />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs bg-white text-black shadow-sm">
                          Breakout rooms allow you to split participants into
                          separate rooms during your session for smaller group
                          discussions or activities. The moderator can only be
                          present in one room at a time, but all breakout rooms
                          will be streamed to the backroom for observers to view
                          and will be recorded.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSaving}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <DialogFooter className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="edit-session-form" disabled={isSaving}>
            {isSaving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

```

Path: frontend/components/projects/sessions/MultiSelectDropdown.tsx

```
import React, { useEffect, useRef, useState } from "react";
import { IModerator } from "@shared/interface/ModeratorInterface";

interface MultiSelectDropdownProps {
  moderators: IModerator[];
  selected: string[];
  onChange: (selectedIds: string[]) => void;
   disabled?: boolean; 
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  moderators,
  selected,
  onChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleSelect = (id: string) => {
    const newSelected = selected.includes(id)
      ? selected.filter((sid) => sid !== id)
      : [...selected, id];
    onChange(newSelected);
  };

  const selectedCount = selected.length;
  const displayText =
    selectedCount > 0
      ? `${selectedCount} moderator${selectedCount > 1 ? "s" : ""} selected`
      : "Select moderators";

  return (
    <div className="relative w-full min-w-[250px]" ref={dropdownRef}>
      <div
       onClick={() => !disabled && setIsOpen((prev) => !prev)}
         className={
          "border border-gray-300 rounded px-3 py-2 text-sm " +
          (disabled
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-white cursor-pointer")
        }
      >
        {displayText}
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-20 w-full bg-white border rounded shadow max-h-60 overflow-y-auto mt-1">
          {moderators.map((mod) => {
            const isChecked = selected.includes(mod._id!);
            return (
              <div
                key={mod._id}
                onClick={() => toggleSelect(mod._id!)}
                className={`flex items-center px-3 py-2 cursor-pointer text-xs ${
                  isChecked ? "bg-blue-50" : ""
                }`}
              >
                {/* Custom checkbox */}
                <div
                  className={`mr-2 w-4 h-4   flex items-center justify-center ${
                    isChecked ? "bg-custom-orange-1" : "bg-white"
                  }`}
                >
                  {isChecked && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      viewBox="0 0 24 24"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                {mod.firstName} {mod.lastName}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;

```

Path: frontend/components/projects/sessions/SessionsTable.tsx

```
"use client";
import React, { useEffect, useRef, useState } from "react";
import { resolveToIana } from "../../../utils/timezones";
import { DateTime } from "luxon";
import { ISession } from "@shared/interface/SessionInterface";
import { IPaginationMeta } from "@shared/interface/PaginationInterface";
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
} from "components/ui/table";
import { Button } from "components/ui/button";
import { ChevronsUpDown, MoreVertical } from "lucide-react";
import CustomPagination from "components/shared/Pagination";

export interface SessionsTableProps {
  sessions: ISession[];
  meta: IPaginationMeta;
  onPageChange: (newPage: number) => void;
  // onRowClick: (sessionId: string) => void;
  onModerate: (sessionId: string) => void;
  onObserve: (sessionId: string) => void;
  onAction: (
    action: "edit" | "delete" | "duplicate",
    session: ISession
  ) => void;
}

// helper to format Date+Time in Pacific with the “Pacific” label
function formatDateTimeWithZone(
  date: Date | string,
  timeStr: string,
  timeZone: string
): string {
  // resolve UI label (e.g., "Buenos Aires") to IANA (e.g., "America/Argentina/Buenos_Aires")
  const ianaZone = resolveToIana(timeZone) || "UTC";

  // Build the local date-time in the target zone
  const dateISO =
    typeof date === "string"
      ? date.split("T")[0]
      : DateTime.fromJSDate(date).toISODate()!;
  const dt = DateTime.fromISO(`${dateISO}T${timeStr}`, { zone: ianaZone });
  if (!dt.isValid) return "";

  // Format like "Mar 06, 2025 | 03:00PM"
  return dt.toFormat("LLL dd, yyyy | hh:mma");
}

export const SessionsTable: React.FC<SessionsTableProps> = ({
  sessions,
  meta,
  onPageChange,
  // onRowClick,
  onModerate,
  onObserve,
  onAction,
}) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        openMenuId &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuId]);

  return (
    <div className=" rounded-lg shadow-lg overflow-x-auto">
      <div className="bg-white rounded-lg shadow-lg">
        <Table className="min-w-full divide-y divide-gray-200 ">
          <TableHeader>
            <TableRow className="">
              {[
                "Session Title",
                "Start Date & Time",
                "Service Type",
                "Participant Count",
                "Observer Count",
                "Final Session Minutes",
                "Lunch",
              ].map((col) => (
                <TableHead
                  key={col}
                  className=" py-5 text-center text-xs font-semibold text-custom-dark-blue-1 uppercase tracking-wider whitespace-normal break-words"
                >
                  <div className="inline-flex items-center space-x-1">
                    <span>{col}</span>
                    <ChevronsUpDown className="h-4 w-4 text-gray-400" />
                  </div>
                </TableHead>
              ))}
              <TableHead className="px-6 py-3" />
            </TableRow>
          </TableHeader>

          <TableBody className="bg-white divide-y divide-gray-100">
            {sessions.map((s) => (
              <TableRow
                key={s._id}
                className="cursor-pointer hover:bg-gray-50"
                // onClick={() => onRowClick(s._id)}
              >
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {s.title}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {formatDateTimeWithZone(s.date, s.startTime, s.timeZone)}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {" "}
                  {typeof s.projectId !== "string"
                    ? (s.projectId as { service: string }).service
                    : ""}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {/* participant count */}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {/* observer count */}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {/* finalSessionMinutes */}
                </TableCell>

                <TableCell
                  className="px-6 py-4 whitespace-nowrap"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex space-x-2">
                    <Button
                      className="bg-custom-orange-1"
                      size="sm"
                      onClick={() => onModerate(s._id)}
                    >
                      Moderate
                    </Button>
                    <Button
                      size="sm"
                      className="bg-custom-dark-blue-1"
                      onClick={() => onObserve(s._id)}
                    >
                      Observe
                    </Button>
                  </div>
                </TableCell>

                <TableCell
                  className="px-6 py-4 whitespace-nowrap text-right relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* trigger */}
                  <button
                    onClick={() =>
                      setOpenMenuId(openMenuId === s._id ? null : s._id)
                    }
                    className="p-2 rounded hover:bg-gray-100 focus:outline-none cursor-pointer"
                    aria-haspopup="true"
                    aria-expanded={openMenuId === s._id}
                  >
                    <MoreVertical className="h-5 w-5 text-gray-500 cursor-pointer" />
                  </button>

                  {/* custom pop-over */}
                  {openMenuId === s._id && (
                    <div
                      ref={menuRef}
                      className="absolute right-10 top-5 mt-2 w-32 bg-white border border-gray-200 rounded shadow-lg z-10 cursor-pointer"
                    >
                      <button
                        onClick={() => {
                          onAction("edit", s);
                          setOpenMenuId(null);
                        }}
                        className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          onAction("delete", s);
                          setOpenMenuId(null);
                        }}
                        className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => {
                          onAction("duplicate", s);
                          setOpenMenuId(null);
                        }}
                        className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      >
                        Duplicate
                      </button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={8}>
                <div className="flex justify-center">
                  <CustomPagination
                    currentPage={meta.page}
                    totalPages={meta.totalPages}
                    onPageChange={onPageChange}
                  />
                </div>
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
};

```

Path: frontend/components/projects/ShareProjectModal.tsx

```
// frontend/components/projects/ShareProjectModal.tsx
"use client";

import React from "react";
import ShareDialog from "components/viewProject/ShareDialog";
import { IProject } from "@shared/interface/ProjectInterface";

interface ShareProjectModalProps {
  open: boolean;
  shareType: "observer" | "participant" | null;
  project: IProject | null;
  onClose: () => void;
}

const ShareProjectModal: React.FC<ShareProjectModalProps> = ({
  open,
  shareType,
  project,
  onClose,
}) => {
  if (!open || !shareType || !project) return null;

  const isObserver = shareType === "observer";
  const baseOrigin = window.location.origin;

  return (
    <ShareDialog
      open={true}
      onOpenChange={onClose}
      triggerLabel=""
      badgeLabel={isObserver ? "Observer Link" : "Participant Link"}
      description={
        isObserver
          ? `You have been invited to the observer for ${project.name}.`
          : "You have been invited to participate in an upcoming research session. Please check the confirmation details from your recruiter for the time and date of your session."
      }
      fields={
        isObserver
          ? [
              {
                label: "Meeting Link:",
                value: `${baseOrigin}/join/observer/${project._id}`,
              },
              {
                label: "Passcode:",
                value: project.projectPasscode ?? "",
              },
            ]
          : [
              { label: "Project:", value: project.name },
              {
                label: "Session Link:",
                value: `${baseOrigin}/join/participant/${project._id}`,
              },
            ]
      }
      copyPayload={
        isObserver
          ? `Link: ${baseOrigin}/join/observer/${project._id}\nPasscode: ${
              project.projectPasscode ?? ""
            }`
          : `${baseOrigin}/join/participant/${project._id}`
      }
      footerText={
        isObserver
          ? "Once you click the link and enter your passcode, you will be prompted to create an account or login to your existing account. After completing this process once, you may then access your meeting via the link or your account login."
          : undefined
      }
    />
  );
};

export default ShareProjectModal;

```

Path: frontend/components/reset-password/ResetPasswordForm.tsx

```
// components/ResetPasswordForm.tsx
"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import PasswordField from "../createAccount/PasswordField";
import { Button } from "components/ui/button";
import { Alert, AlertDescription } from "components/ui/alert";
import {
  ResetPasswordInputs,
  resetPasswordSchema,
} from "schemas/resetPasswordSchema";
import useResetPassword from "hooks/useResetPassword";
import { Form } from "../../components/ui/form";

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const form = useForm<ResetPasswordInputs>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const {
    mutate: reset,
    isPending,
    isError,
    isSuccess,
    error,
    data,
  } = useResetPassword();

  const { handleSubmit, control } = form;

  const onSubmit = (values: ResetPasswordInputs) => {
    if (!token) {
      return;
    }
    reset(
      { token, newPassword: values.newPassword },
      {
        onSuccess: () => {
          setTimeout(() => router.push("/login"), 1500);
        },
      }
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="py-20 flex-grow flex items-center justify-center">
        <div className="max-w-md w-full mx-auto p-8 bg-white rounded-xl shadow-lg">
          <h1 className="text-2xl font-bold text-center mb-6">
            Reset Password
          </h1>
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <PasswordField
                control={control}
                name="newPassword"
                label="New Password"
                placeholder="••••••••"
                disabled={isPending}
              />
              <PasswordField
                control={control}
                name="confirmPassword"
                label="Confirm New Password"
                placeholder="••••••••"
                disabled={isPending}
              />

              <Button type="submit" 
              disabled={isPending}
               className="w-full bg-orange-500 hover:bg-orange-600"
              >
                {isPending ? "Resetting…" : "Reset Password"}

              </Button>
            </form>
          </Form>
          {isSuccess && (
            <Alert variant="default" className="mt-4 bg-green-50">
              <AlertDescription className="text-green-600 text-center">
                {data!.message} – redirecting to login…
              </AlertDescription>
            </Alert>
          )}

          {isError && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription className="text-center">
                {error.response?.data.message || error.message}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}

```

Path: frontend/components/shared/ComponentContainer.tsx

```
import React from 'react';

interface ComponentContainerProps {
  children: React.ReactNode;
}

const ComponentContainer = ({ children }: ComponentContainerProps) => (
  <div className="bg-white">
    {children}
  </div>
);

export default ComponentContainer;

```

Path: frontend/components/shared/ConfirmationModalComponent.tsx

```
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";

interface ConfirmationModalProps {
  open: boolean;
  onCancel: () => void;
  onYes: () => void;
  heading: string;
  text: string;
  cancelText?: "Cancel" | "No";
}

const ConfirmationModalComponent: React.FC<ConfirmationModalProps> = ({
  open,
  onCancel,
  onYes,
  heading,
  text,
  cancelText = "Cancel",
}) => {
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="rounded-2xl w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-[#031F3A] text-2xl">
            {heading}
          </DialogTitle>
          <DialogDescription className=" text-[13px]">{text}</DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-4 sm:justify-end mt-12">
          <Button
            variant="dark-blue"
            type="button"
            onClick={onCancel}
            className="rounded-xl py-1 px-7 shadow-[0px_3px_6px_#031F3A59] text-base"
          >
            {cancelText}
          </Button>
          <Button
            variant="orange"
            type="button"
            onClick={onYes}
            className="rounded-xl py-1 px-10 shadow-[0px_3px_6px_#031F3A59] text-base"
          >
            Yes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmationModalComponent;

```

Path: frontend/components/shared/CustomButton.tsx

```
// components/ui/CustomButton.tsx
import * as React from 'react'
import { Button } from 'components/ui/button'
import { cn } from 'lib/utils'

type ShadcnButtonProps = React.ComponentProps<typeof Button>

export interface CustomButtonProps extends ShadcnButtonProps {
  /** optional icon (e.g. <FaPlus />) */
  icon?: React.ReactNode
  /** where to put the icon relative to the text */
  iconPosition?: 'left' | 'right'
  /** button label; falls back to children if omitted */
  text?: React.ReactNode
}

const CustomButton = React.forwardRef<HTMLButtonElement, CustomButtonProps>(
  (
    {
      icon,
      iconPosition = 'left',
      text,
      children,
      className,
      ...buttonProps
    },
    ref
  ) => {
    // allow either `text` or `children`
    const content = text ?? children

    return (
      <Button
        ref={ref}
        className={cn('inline-flex items-center', className)}
        {...buttonProps}
      >
        {icon && iconPosition === 'left' && (
          <span className="mr-1 flex items-center">{icon}</span>
        )}
        {content}
        {icon && iconPosition === 'right' && (
          <span className="ml-1 flex items-center">{icon}</span>
        )}
      </Button>
    )
  }
)

CustomButton.displayName = 'CustomButton'
export default CustomButton


// ! Usage examples:

// import { FaPlus, FaTrash } from 'react-icons/fa'
// import CustomButton from 'components/ui/CustomButton'

// just text
// <CustomButton onClick={() => console.log('clicked')}>Click me</CustomButton>

// icon on the left, full width, outline variant
// <CustomButton
//   icon={<FaPlus />}
//   text="Add Item"
//   variant="outline"
//   className="w-full"
//   onClick={handleAdd}
// />

// icon on the right
// <CustomButton
//   icon={<FaTrash />}
//   iconPosition="right"
//   text="Delete"
//   variant="destructive"
//   onClick={handleDelete}
// />

```

Path: frontend/components/shared/FooterComponent.tsx

```
import { FaEnvelope } from 'react-icons/fa'
import { IoCall } from 'react-icons/io5'
import { PiLineVerticalLight } from 'react-icons/pi'

const FooterComponent = () => {
  return (
    <div>
      {/* for large screen */}
      <div className='h-20 bg-[#00293C] w-full lg:flex justify-center items-center space-x-4 hidden z-10'>
        <div className='flex justify-center items-center gap-2'>
          <FaEnvelope className='text-white' />
          <p className='text-white text-sm'>info@amplifyresearch.com</p>
        </div>
        <PiLineVerticalLight className='text-white' />
        <div className='flex justify-center items-center gap-2'>
          <IoCall className='text-white' />
          <p className='text-white text-sm'>925 236 9700</p>
        </div>
        <PiLineVerticalLight className='text-white' />
        <p className='text-white text-sm'>Terms & Conditions</p>
        <PiLineVerticalLight className='text-white' />
        <p className='text-white text-sm'>Privacy Policy</p>
      </div>
      {/* for small screen */}
      <div className=' bg-[#00293C] w-full  lg:hidden py-5'>
        <div className='flex justify-center items-center gap-2'>
          <FaEnvelope className='text-white text-xs' />
          <p className='text-white text-xs'>info@amplifyresearch.com</p>
        </div>
        <div className='flex justify-center items-center space-x-2 pt-3'>
          <div className='flex justify-center items-center gap-2 '>
            <IoCall className='text-white text-xs' />
            <p className='text-white text-xs'>925 236 9700</p>
          </div>
          <PiLineVerticalLight className='text-white' />
          <p className='text-white text-xs'>Terms & Conditions</p>
          <PiLineVerticalLight className='text-white' />
          <p className='text-white text-xs'>Privacy Policy</p>
        </div>
      </div>
    </div>
  )
}

export default FooterComponent

```

Path: frontend/components/shared/Heading20pxBlueUCComponent.tsx

```
import React, { ReactNode } from "react";

interface Heading20pxBlueUCProps {
  children: ReactNode;
}

const Heading20pxBlueUC: React.FC<Heading20pxBlueUCProps> = ({ children }) => {
  return (
    <h3 className="text-xl text-custom-dark-blue-2 font-bold uppercase">
      {children}
    </h3>
  );
};

export default Heading20pxBlueUC;

```

Path: frontend/components/shared/HeadingBlue25pxComponent.tsx

```
import { cn } from 'lib/utils'
import React, { ReactNode } from 'react'


interface HeadingBlue25pxProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode
}

const HeadingBlue25px: React.FC<HeadingBlue25pxProps> = ({
  children,
  className,
  ...rest
}) => {
  return (
    <h1
      className={cn(
        'text-custom-dark-blue-1 text-2xl text-center md:text-start font-bold',
        className
      )}
      {...rest}
    >
      {children}
    </h1>
  )
}

export default HeadingBlue25px

```

Path: frontend/components/shared/HeadingParagraphComponent.tsx

```
import React from 'react'

interface HeadingParagraphProps {
  heading: string
  paragraph: string
}

const HeadingParagraphComponent: React.FC<HeadingParagraphProps> = ({
  heading,
  paragraph,
}) => {
  return (
    <div>
      <h1 className='text-lg font-semibold text-custom-dark-blue-1'>
        {heading}
      </h1>
      <p className='text-lg font-medium text-custom-dark-blue-2'>{paragraph}</p>
    </div>
  )
}

export default HeadingParagraphComponent

```

Path: frontend/components/shared/InputFieldComponent.tsx

```
"use client";

import * as React from "react";
import { BiSolidErrorAlt } from "react-icons/bi";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface InputFieldProps {
  label: string;
  type?: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  icon?: React.ReactNode;
  emailSuccess?: boolean;
  disabled?: boolean;
}

const InputFieldComponent: React.FC<InputFieldProps> = ({
  label,
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  error,
  icon,
  emailSuccess,
  disabled = false,
}) => {
  return (
    <div className="mb-4">
      <Label
        htmlFor={name}
        className="block text-sm font-semibold text-black mb-2"
      >
        {label}
      </Label>
      <div className="relative">
        <Input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`pr-10 ${error ? "border-custom-red" : "border-black"}`}
        />
        {icon && (
          <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5">
            {icon}
          </span>
        )}
      </div>
      {error && (
        <div className="flex items-start gap-1 mt-2 text-sm text-custom-red">
          <BiSolidErrorAlt className="mt-0.5" />
          <p className="text-xs">{error}</p>
        </div>
      )}
      {emailSuccess && (
        <div className="flex items-start gap-1 mt-2 text-sm text-custom-green">
          <BiSolidErrorAlt className="mt-0.5" />
          <p className="text-xs">Your Email is available.</p>
        </div>
      )}
    </div>
  );
};

export default InputFieldComponent;

```

Path: frontend/components/shared/LogoComponent.tsx

```
import Image from "next/image";

const Logo = () => {
  return (
    <div className="md:flex">
      <Image src="/logo.svg" alt="logo" height={60} width={180} />
    </div>
  );
};

export default Logo;

```

Path: frontend/components/shared/Pagination.tsx

```

import { Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink, } from "components/ui/pagination";
import { ChevronLeft, ChevronRight } from "lucide-react";
import getPages from "utils/getPages";

export default function CustomPagination({
  totalPages,
  currentPage,
  onPageChange,
}: {
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}) {
 
    const pages = getPages(totalPages, currentPage);
  const isFirst = currentPage === 1;
  const isLast = currentPage === totalPages;
  return (
    <Pagination className="flex mt-6 list-none p-">
      {/* ← Previous */}
       <PaginationItem>
        <PaginationLink
          href="#"
          // semantic disabled
          aria-disabled={isFirst}
          // visually disable & block clicks
          className={`p-2 rounded ${
            isFirst
              ? "pointer-events-none opacity-50"
              : "hover:bg-gray-100"
          }`}
          onClick={(e) => {
            e.preventDefault();
            if (!isFirst) onPageChange(currentPage - 1);
          }}
        >
          {/* replace text with the Lucide icon */}
          <ChevronLeft className="w-4 h-4" />
        </PaginationLink>
      </PaginationItem>

      <PaginationContent>
        {pages.map((p, idx) =>
          typeof p === "number" ? (
            <PaginationItem key={p}>
              <PaginationLink
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(p);
                }}
                className={`
                  w-9 h-9 flex items-center justify-center
                  rounded-md text-sm font-medium
                  ${currentPage === p
                    ? "bg-custom-dark-blue-1 text-white"
                    : "text-gray-600 hover:bg-gray-100"}
                `}
              >
                {p}
              </PaginationLink>
            </PaginationItem>
          ) : (
            <PaginationItem key={`dot-${idx}`} className="pointer-events-none">
              <span className="w-9 h-9 flex items-center justify-center text-gray-400">
                {p}
              </span>
            </PaginationItem>
          )
        )}
      </PaginationContent>

      {/* Next → */}
              <PaginationItem>
        <PaginationLink
          href="#"
          aria-disabled={isLast}
          className={`p-2 rounded ${
            isLast
              ? "pointer-events-none opacity-50"
              : "hover:bg-gray-100"
          }`}
          onClick={(e) => {
            e.preventDefault();
            if (!isLast) onPageChange(currentPage + 1);
          }}
        >
          <ChevronRight className="w-4 h-4" />
        </PaginationLink>
      </PaginationItem>
    </Pagination>
  );
}

```

Path: frontend/components/sidebar/DashboardSidebarComponent.tsx

```
"use client";

import React, { useState } from "react";
import { FaBars } from "react-icons/fa";
import { Sheet, SheetContent, SheetTrigger } from "components/ui/sheet";
import { Button } from "components/ui/button";
import Logo from "../shared/LogoComponent";
import SidebarContent from "./SidebarContent";

export default function DashboardSidebar({
  handleLogoutModalOpen,
}: {
  handleLogoutModalOpen: () => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <div className="md:hidden fixed top-4 left-4 z-40 bg-[#D5D6D8]">
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <FaBars />
            </Button>
          </SheetTrigger>
        </div>
        <SheetContent side="left" className="p-0 w-64 bg-[#D5D6D8]">
          <div className="p-6">
            <Logo />
          </div>
          <SidebarContent handleLogoutModalOpen={handleLogoutModalOpen} />
        </SheetContent>
      </Sheet>

      {/* Desktop aside */}
      <aside className="hidden md:flex flex-col fixed top-0 left-0 h-screen w-64 bg-[#D5D6D8] shadow">
        <div className="p-6">
          <Logo />
        </div>
        <SidebarContent handleLogoutModalOpen={handleLogoutModalOpen} />
      </aside>
    </>
  );
}

```

Path: frontend/components/sidebar/SidebarContent.tsx

```
// components/SidebarContent.tsx
"use client";

import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FaBars, FaListAlt, FaUserClock } from "react-icons/fa";
import { MdOutlineInsertChart } from "react-icons/md";
import {
  ChevronDown,
  ChevronUp,
  CircleUser,
  FileText,
  UserPen,
} from "lucide-react";
import { ScrollArea } from "components/ui/scroll-area";
import { Separator } from "components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "components/ui/avatar";
import { Button } from "components/ui/button";
import api from "lib/api";
import { useGlobalContext } from "context/GlobalContext";
import { IProject } from "@shared/interface/ProjectInterface";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "components/ui/collapsible";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "components/ui/accordion";
import { IoIosLogOut } from "react-icons/io";
import { projectSections } from "constant/projectSections";

export default function SidebarContent({
  handleLogoutModalOpen,
}: {
  handleLogoutModalOpen: () => void;
}) {
  const pathname = usePathname()!;
  const router = useRouter();
  const { user } = useGlobalContext();
  const userId = user?._id;
  const { data: projects = [] } = useQuery<IProject[], Error>({
    queryKey: ["projectsByUser", userId],
    queryFn: () =>
      api
        .get(
          `/api/v1/projects/get-project-by-userId/${userId}?search=&status=Active&page=1&limit=100`
        )
        .then((r) => r.data.data),
    staleTime: 300_000,
    enabled: Boolean(userId),
  });

  const [projectsOpen, setProjectsOpen] = useState(
    pathname.startsWith("/projects")
  );
  const accountActive = [`/my-profile/${userId}`, "/payment"].some((p) =>
    pathname.startsWith(p)
  );
  const [acctOpen, setAcctOpen] = useState(accountActive);

  // logout menu logic (only for desktop; mobile can ignore or adapt)
  const menuRef = useRef<HTMLDivElement>(null);
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowLogoutMenu(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // inside SidebarContent.tsx, above your component or at top of it:
  function formatDisplayName(firstName: string, lastName: string) {
    const initial = lastName.charAt(0).toUpperCase();
    const maxLen = 16;
    const spacePlusInit = ` ${initial}`; // 2 chars

    // If it already fits, just return "FirstName I"
    if (`${firstName}${spacePlusInit}`.length <= maxLen) {
      return `${firstName}${spacePlusInit}`;
    }

    // Otherwise, truncate firstName so that:
    //  truncatedFirst.length + 2 (for "..") + 2 (for " I") === maxLen
    const truncatedFirstLen = maxLen - 4; // maxLen - (".." + spacePlusInit).length
    const truncatedFirst = firstName.slice(0, truncatedFirstLen);

    return `${truncatedFirst}..${spacePlusInit}`;
  }

  return (
    <>
      <ScrollArea className="flex-1 px-6 overflow-y-auto">
        {/* Projects group */}
        <Collapsible open={projectsOpen} onOpenChange={setProjectsOpen}>
          <CollapsibleTrigger
            className={`flex items-center justify-between w-full py-1 px-2 rounded-xl font-semibold cursor-pointer bg-custom-white ${
              pathname.startsWith("/projects")
                ? "text-custom-dark-blue-1"
                : "text-custom-blue-gray-1 hover:text-custom-gray-5"
            }`}
            onClick={() => {
              // Always toggle the panel...
              setProjectsOpen(!projectsOpen);
              // ...then navigate to /projects
              router.push("/projects");
            }}
          >
            <div className="flex items-center gap-3 ">
              <FaListAlt className="h-4 w-4" />
              <span className="">Projects</span>
            </div>
            {projectsOpen ? (
              <ChevronUp className="" />
            ) : (
              <ChevronDown className="" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="ml-6 mt-1 py-1 px-2 bg-[#F3F4F6] rounded-xl">
            <Accordion type="single" collapsible className="space-y-1">
              {projects?.map((p) => {
                const base = `/projects/${p._id}`;
                return (
                  <AccordionItem key={p._id} value={p?._id}>
                    <AccordionTrigger
                      className={`flex items-center justify-between py-1 ${
                        pathname.startsWith(base)
                          ? "text-custom-dark-blue-1 font-medium bg-white rounded px-2"
                          : "text-custom-blue-gray-1 hover:text-custom-gray-5"
                      }`}
                    >
                      <Link href={`/view-project/${p._id}`} className="flex-1">
                        {p.name}
                      </Link>
                    </AccordionTrigger>

                    <AccordionContent className="pl-4 space-y-1">
                      {projectSections.map(({ slug, label }) => (
                        <Link
                          key={slug}
                          href={`${base}/${slug}`}
                          className={`block py-1 rounded px-2 ${
                            pathname === `${base}/${slug}`
                              ? "bg-white text-custom-dark-blue-1 font-medium"
                              : "text-custom-blue-gray-1 hover:text-custom-gray-5"
                          }`}
                        >
                          {label}
                        </Link>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CollapsibleContent>
        </Collapsible>

        <Separator className="my-2" />

        {/* Static links */}
        <div className="space-y-4 pb-5">
          {/* Account group */}
          <Collapsible open={acctOpen} onOpenChange={setAcctOpen}>
            <CollapsibleTrigger
              className={`flex items-center justify-between w-full py-1 px-2 rounded-xl font-semibold cursor-pointer bg-custom-white ${
                accountActive
                  ? "text-custom-dark-blue-1"
                  : "text-custom-blue-gray-1 hover:text-custom-gray-5"
              }`}
            >
              <div className="flex items-center gap-3">
                <CircleUser className="h-5 w-5" />
                <span className="">Account</span>
              </div>
              {acctOpen ? (
                <ChevronUp className="" />
              ) : (
                <ChevronDown className="" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="ml-6 mt-2 py-1 px-2 bg-[#F3F4F6] rounded-xl space-y-2 text-sm">
              <Link
                href={`/my-profile/${user?._id}`}
                className={`flex items-center gap-2 ${
                  pathname === `/my-profile/${user?._id}`
                    ? "text-custom-dark-blue-1 font-medium"
                    : "text-custom-blue-gray-1 hover:text-custom-gray-5"
                }`}
              >
                <UserPen className="h-3.5 w-3.5" /> Profile
              </Link>
              <Link
                href="/payment"
                className={`flex items-center gap-2 ${
                  pathname === `/payment`
                    ? "text-custom-dark-blue-1 font-medium"
                    : "text-custom-blue-gray-1 hover:text-custom-gray-5"
                }`}
              >
                <FileText className="h-3.5 w-3.5" /> Billing
              </Link>
            </CollapsibleContent>
          </Collapsible>

          {/* Admin-only */}
          {user?.role === "AmplifyAdmin" && (
            <>
              <Link
                href="/external-admins"
                className="flex items-center gap-3 text-custom-blue-gray-1 hover:text-custom-gray-5"
              >
                <FaUserClock />
                <span>External Admins</span>
              </Link>
              <Link
                href="/internal-admins"
                className="flex items-center gap-3 text-custom-blue-gray-1 hover:text-custom-gray-5"
              >
                <FaUserClock />
                <span>Internal Admins</span>
              </Link>
              <Link
                href="/companies"
                className="flex items-center gap-3 text-custom-blue-gray-1 hover:text-custom-gray-5"
              >
                <MdOutlineInsertChart />
                <span>Companies</span>
              </Link>
            </>
          )}
        </div>
      </ScrollArea>

      {/* User info */}
      <div className="px-2 py-2 bg-gray-100">
        <div className="relative flex items-center justify-between p-3 rounded-lg">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src="/user.jpg" alt="avatar" />
              <AvatarFallback>
                {(user?.firstName?.[0] || "U").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-sm truncate">
              <p className="font-semibold">
                {user ? formatDisplayName(user.firstName, user.lastName) : ""}
              </p>
              <p className="text-xs text-gray-600 truncate">{user?.email}</p>
            </div>
          </div>
          <div ref={menuRef}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowLogoutMenu((v) => !v)}
            >
              <FaBars />
            </Button>
            {showLogoutMenu && (
              <div className="absolute bottom-full right-0 mb-2 w-36 bg-white border rounded shadow-md">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    setShowLogoutMenu(false);
                    handleLogoutModalOpen();
                  }}
                >
                  <IoIosLogOut className="mr-2" /> Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

```

Path: frontend/components/verify-email/VerifyAccountClient.tsx

```
// pages/verify-email.tsx
"use client";

import React, { useEffect } from "react";
import {  useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useVerifyEmail } from "../../hooks/useVerifyEmail";
import { Button } from "../../components/ui/button";

const VerifyAccountClient = () => {
  
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";

  const verifyEmail = useVerifyEmail();

  useEffect(() => {
    if (!token) {
      toast.error("No verification token found in URL");
      return;
    }

    verifyEmail.mutate(token, {
      onSuccess: () => {
        toast.success("Email verified! Redirecting to login…");
        setTimeout(() => router.replace("/login"), 1500);
      },
      onError: (err) => {
        const msg = err.response?.data?.message ?? err.message;
        toast.error(`Verification failed: ${msg}`);
      },
    });
  }, [token]);

  // Render different states:
  if (verifyEmail.isPending) {
    return <p className="p-8 text-center">Verifying your email…</p>;
  }

  if (verifyEmail.isError) {
    return (
      <div className="p-8 max-w-md mx-auto text-center space-y-4">
        <p className="text-red-600">
          {verifyEmail.error?.response?.data?.message ??
            verifyEmail.error?.message ??
            "Something went wrong."}
        </p>
        {token && (
          <Button onClick={() => verifyEmail.mutate(token)}>
            Try Again
          </Button>
        )}
      </div>
    );
  }

  // On success we already navigated away, but just in case:
  return (
    <div className="p-8 max-w-md mx-auto text-center">
      <p className="mb-4">Email verified! Redirecting…</p>
      <Button onClick={() => router.replace("/login")}>
        Go to Login
      </Button>
    </div>
  );
};

export default VerifyAccountClient;

```

Path: frontend/components/viewProject/AssignTagModal.tsx

```
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";
import { Button } from "components/ui/button";
import { ScrollArea } from "components/ui/scroll-area";
import CreateTag from "./CreateTag";

interface Tag {
  _id: string;
  name: string;
  color: string;
  description?: string;
}

interface Project {
  _id: string;
  name: string;
  tags: Tag[];
}

interface AssignTagModalProps {
  userId: string;
  project: Project;
  onClose: () => void;
  fetchProjects: () => void;
  page: number;
  open: boolean;
}

const AssignTagModal: React.FC<AssignTagModalProps> = ({
  userId,
  project,
  onClose,
  fetchProjects,
  page,
  open,
}) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isCreateTagModalOpen, setIsCreateTagModalOpen] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [tagsToRemove, setTagsToRemove] = useState<string[]>([]);

console.log('page', page)

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/tags/getAllTags/${userId}`
        );
        const data = await response.json();
        setTags(data);
      } catch (error) {
        console.error("Error fetching tags:", error);
      }
    };

    fetchTags();
  }, [userId, refreshTrigger]);

  const handleAddTag = (tagId: string) => {
    const isAssigned = project.tags.some((tag) => tag._id === tagId);

    if (isAssigned) {
      // Tag is currently assigned, mark for removal or undo removal
      setTagsToRemove((prev) =>
        prev.includes(tagId)
          ? prev.filter((id) => id !== tagId)
          : [...prev, tagId]
      );

      // If it was previously added, remove it from the "to add" list
      setSelectedTagIds((prev) => prev.filter((id) => id !== tagId));
    } else {
      // Tag is not assigned, add to selected tags or remove from "to remove"
      setSelectedTagIds((prev) =>
        prev.includes(tagId)
          ? prev.filter((id) => id !== tagId)
          : [...prev, tagId]
      );

      // If it was marked for removal, undo that
      setTagsToRemove((prev) => prev.filter((id) => id !== tagId));
    }
  };

  const getContrastColor = (bgColor: string): string => {
    // Remove the "#" if it exists
    const color = bgColor.replace("#", "");

    // Convert to RGB
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);

    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance < 0.5 ? "#FFFFFF" : "#000000";
  };

  const handleComplete = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/project/assignTagsToProject`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tagsToAdd: selectedTagIds,
            tagsToRemove,
            projectId: project._id,
          }),
        }
      );

      if (response.ok) {
        fetchProjects();
        onClose();
      } else {
        console.error("Failed to update tags");
      }
    } catch (error) {
      console.error("Error updating tags:", error);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-teal-600">
              Assign Tag
            </DialogTitle>
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-gray-500 text-4xl hover:text-gray-700"
            >
              ×
            </button>
          </DialogHeader>

          <ScrollArea className="max-h-60 overflow-y-auto pr-4">
            <div className="space-y-2">
              {tags.map((tag) => {
                const isAssigned =
                  (project.tags.some(
                    (assignedTag) => assignedTag._id === tag._id
                  ) &&
                    !tagsToRemove.includes(tag._id)) ||
                  selectedTagIds.includes(tag._id);

                return (
                  <div
                    key={tag._id}
                    className="flex items-center justify-between p-2 border rounded-md"
                  >
                    <span
                      className="px-2 py-1 rounded-full border-2 font-semibold text-sm"
                      style={{
                        backgroundColor: `${tag.color}20`,
                        color: getContrastColor(tag.color),
                        borderColor: tag.color,
                      }}
                    >
                      {tag.name}
                    </span>
                    <button
                      className={`text-sm font-bold hover:underline ${
                        isAssigned ? "text-red-500" : "text-teal-600"
                      }`}
                      onClick={() => handleAddTag(tag._id)}
                    >
                      {isAssigned ? "Remove" : "Assign"}
                    </button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <div className="flex justify-end mt-4">
            <button
              className="mt-2 text-lg text-teal-600 font-bold hover:underline"
              onClick={() => setIsCreateTagModalOpen(true)}
            >
              Add New Tag
            </button>
          </div>

          <Button
            variant="default"
            onClick={handleComplete}
            className="rounded-lg text-white py-1 px-6 mt-4 bg-teal-600 hover:bg-teal-700"
          >
            Complete
          </Button>
        </DialogContent>
      </Dialog>

      {isCreateTagModalOpen && (
        <CreateTag
          userId={userId}
          onClose={() => setIsCreateTagModalOpen(false)}
          onTagCreated={() => setRefreshTrigger((prev) => prev + 1)}
          open={isCreateTagModalOpen}
        />
      )}
    </>
  );
};

export default AssignTagModal;

```

Path: frontend/components/viewProject/CreateTag.tsx

```
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Textarea } from "components/ui/textarea";
import { Label } from "components/ui/label";

interface CreateTagProps {
  userId: string;
  onClose: () => void;
  onTagCreated?: () => void;
  open: boolean;
}

interface ColorMapping {
  [key: string]: string;
}

const CreateTag: React.FC<CreateTagProps> = ({
  userId,
  onClose,
  onTagCreated,
  open,
}) => {
  const [name, setName] = useState("New Project");
  const [description, setDescription] = useState(
    "New project added to the system..."
  );
  const [selectedColor, setSelectedColor] = useState("bg-green-600");

  const colors = [
    "bg-green-600",
    "bg-yellow-300",
    "bg-blue-500",
    "bg-purple-600",
    "bg-gray-700",
    "bg-green-200",
    "bg-yellow-200",
    "bg-blue-200",
    "bg-purple-200",
    "bg-gray-300",
  ];

  const handleSaveTag = async () => {
    try {
      const colorMap: ColorMapping = {
        "bg-green-600": "#34D399",
        "bg-yellow-300": "#FCD34D",
        "bg-blue-500": "#3B82F6",
        "bg-purple-600": "#9333EA",
        "bg-gray-700": "#374151",
        "bg-green-200": "#B5E2CC",
        "bg-yellow-200": "#FEF08A",
        "bg-blue-200": "#BFDBFE",
        "bg-purple-200": "#E9D5FF",
        "bg-gray-300": "#D1D5DB",
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/tags/createTag`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name,
            description: description,
            color: colorMap[selectedColor],
            createdById: userId,
          }),
        }
      );

      if (response.ok) {
        onClose();
        // Trigger refetch in parent component
        if (typeof onTagCreated === "function") {
          onTagCreated();
        }
      }
    } catch (error) {
      console.error("Error creating tag:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Create Tag
          </DialogTitle>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 text-5xl"
          >
            &times;
          </button>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-700 font-semibold">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-green-300"
              placeholder="New Project"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="description"
              className="text-gray-700 font-semibold"
            >
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-green-300"
              placeholder="New project added to the system..."
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700 font-semibold">Colors</Label>
            <div className="flex space-x-2">
              {colors.map((color, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedColor(color)}
                  className={`${color} w-8 h-8 rounded-full border-2 ${
                    selectedColor === color
                      ? "border-green-600"
                      : "border-transparent"
                  }`}
                  type="button"
                  aria-label={`Select color ${index + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700 font-semibold">Preview</Label>
            <div className="flex justify-center items-center p-5 border-2 rounded-lg">
              <div
                className={`inline-block px-4 py-2 text-white rounded-lg ${selectedColor}`}
              >
                {name}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="default"
              className="rounded-lg text-white py-1 px-10 bg-green-600 hover:bg-green-700"
              onClick={handleSaveTag}
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTag;

```

Path: frontend/components/viewProject/CreateTagModal.tsx

```
"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "components/ui/dialog";
import { Input } from "components/ui/input";
import { Badge } from "components/ui/badge";
import { ApiResponse } from "@shared/interface/ApiResponseInterface";
import { ITag } from "@shared/interface/TagInterface";
import api from "lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useGlobalContext } from "context/GlobalContext";
import { toast } from "sonner";
import CustomButton from "components/shared/CustomButton";
import { AxiosError } from "axios";

interface CreateTagModalProps {
  projectId: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: (tag: ITag) => void;
}

const COLORS = [
  "#28a745",
  "#ffc107",
  "#007bff",
  "#6f42c1",
  "#343a40",
  "#c3e6cb",
  "#ffeeba",
  "#bee5eb",
  "#f5c6cb",
  "#d6d8db",
];

export default function CreateTagModal({
  projectId,
  open,
  onOpenChange,
  onCreated,
}: CreateTagModalProps) {
  const { user } = useGlobalContext();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  const create = useMutation<ApiResponse<ITag>, AxiosError<ApiResponse<{ message: string }>>, Partial<ITag>>({
    mutationFn: async (payload) => {
      const res = await api.post<ApiResponse<ITag>>("/api/v1/tags", payload);
      return res.data;
    },
    onSuccess: ({ data }) => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast.success("Tag created");
      onCreated(data);
      setTitle("");
      setColor(COLORS[0]);
    },
     onError: (err) => {
    
    const msg =
      err.response?.data?.message ??
      err.message;
    console.error("Error creating tag:", err);
    toast.error(msg);
  },
  });

  const handleSave = () => {
      
const trimmed = title.trim();

    create.mutate({
      title: trimmed,
      color,
      createdBy: user!._id,
      projectId,
    });
  };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    if (newVal.length <= 30) {
      setTitle(newVal);
    } else {
      toast.error("Tag name cannot exceed 30 characters");
    }
 };

  const isSaving = create.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Tag</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Name</label>
            <Input
              value={title}
              // maxLength={30}
              onChange={handleTitleChange}
              placeholder="Tag name"
              disabled={isSaving}
            />
                       <p className="mt-1 text-xs text-gray-500">
             {title.length}/30 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Colors</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <span
                  key={c}
                  className={`h-6 w-6 rounded-full cursor-pointer border-2 ${
                    c === color ? "border-black" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Preview</label>
            <div className="p-4 border rounded">
              <Badge
                className="px-4 py-2 text-white"
                style={{ backgroundColor: color }}
              >
                {title || "Your Tag"}
              </Badge>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-end gap-2 mt-4">
          <CustomButton
            onClick={handleSave}
            disabled={!title.trim() || isSaving}
            className="bg-custom-teal hover:bg-custom-dark-blue-2"
          >
            {isSaving ? "Saving…" : "Save"}
          </CustomButton>
         
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

```

Path: frontend/components/viewProject/CreditSummary.tsx

```
"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "components/ui/card";
import { IProject } from "@shared/interface/ProjectInterface";
import { calculateOriginalEstimatedProjectCredits } from "utils/calculateOriginalEstimatedProjectCredits";
import { useRouter } from "next/navigation";
import CustomButton from "components/shared/CustomButton";
import { calculateRemainingScheduleCredits } from "utils/calculateCreditsNeededForRemainingSchedules";

interface CreditSummaryProps {
  project: IProject;
}

export default function CreditSummary({ project }: CreditSummaryProps) {
  const router = useRouter();

  const originalEstimateCreditSummary =
    calculateOriginalEstimatedProjectCredits(project.sessions);

  const creditNeededForRemainingSessions = calculateRemainingScheduleCredits(
    project.meetings
  );

  const usedToDate = project.cumulativeMinutes;

  const newTotal = usedToDate + creditNeededForRemainingSessions;

  const rows: Array<{ label: string; value: number | string }> = [
    {
      label: "Original Estimated Project Credits",
      value: originalEstimateCreditSummary,
    },
    { label: "Project Credits Used to Date", value: usedToDate },
    {
      label: "Project Credits Needed for Remaining Schedule",
      value: creditNeededForRemainingSessions,
    },
    { label: "New Total Project Credit Estimate", value: newTotal },
  ];
  return (
    <Card className="border-0 shadow-all-sides">
      <CardHeader>
        <CardTitle className="text-custom-teal">Credit Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        
        {rows.map(({ label, value }) => (
          <div key={label} className="flex justify-between">
            <span className="text-sm text-gray-600">{label}:</span>
            <span className="font-medium">{value}</span>
          </div>
        ))}

        <div className="pt-4">
          <p className="text-sm text-gray-500 mb-2">
            Need more credits or want to check your account balance?
          </p>
          <div className="flex justify-end">
            <CustomButton
              className="
      bg-gradient-to-r from-[#E29C4D] to-[rgb(234,185,94)] text-white px-3 py-2.5  
      rounded-2xl
    "
              onClick={() => {
                router.push("/billing");
              }}
            >
              View Credits
            </CustomButton>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

```

Path: frontend/components/viewProject/InlineEditable.tsx

```

import { Button } from "../ui/button";
import { Input  } from "../ui/input";
import { Textarea  } from "../ui/textarea";
import { CheckIcon, XIcon, PencilIcon } from "lucide-react";
import React, { useEffect } from "react";
import { toast } from "sonner";

type Validator = { fn: (val: string) => boolean; message: string };

interface InlineEditableProps {
  label: string;
  value: string;
  editing: boolean;
  isPending: boolean;
  validators?: Validator[];
  onStart: () => void;
  onCancel: () => void;
  onSave: (newValue: string) => void;
  /** If "input", renders a one-line Input; if "textarea", a multi-line Textarea */
  editControlType: "input" | "textarea";
}

const InlineEditable: React.FC<InlineEditableProps> = ({
  label,
  value,
  editing,
  isPending,
  validators = [],
  onStart,
  onCancel,
  onSave,
  editControlType,
}) => {
  const [draft, setDraft] = React.useState(value);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [editing, value]);

  const attemptSave = () => {
    for (const { fn, message } of validators) {
      if (!fn(draft)) {
        toast.error(message);
        return;
      }
    }
    onSave(draft);
  };

  const Control = editControlType === "textarea" ? Textarea : Input;

  return (
    <div className="flex justify-between items-start">
      <div className="flex-1 text-sm text-gray-600">
        <span className="">{label}:</span>{" "}
        {editing ? (
          <Control
            value={draft}
            onChange={(e) => setDraft(e.currentTarget.value)}
            disabled={isPending}
            {...(editControlType === "textarea" ? { rows: 3 } : {})}
            className="mt-1 w-full"
          />
        ) : (
          <span className="font-normal">{value || "—"}</span>
        )}
      </div>

      {editing ? (
        <div className="flex items-center gap-2 ml-4">
          <Button size="icon" onClick={attemptSave} disabled={isPending}>
            <CheckIcon className="h-4 w-4" />
          </Button>
          <Button size="icon" onClick={onCancel}>
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className="flex items-center gap-1 cursor-pointer text-sm ml-4"
          onClick={onStart}
        >
          <PencilIcon className="h-4 w-4" /> Edit
        </div>
      )}
    </div>
  );
};

export default InlineEditable;
```

Path: frontend/components/viewProject/ProjectSummary.tsx

```
"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "components/ui/card";
import { Switch } from "components/ui/switch";
import { IProject } from "@shared/interface/ProjectInterface";
import { getFirstSessionDate } from "utils/getFirstSessionDate";
import { useEditProjectName } from "hooks/useEditProjectName";
import { useEditProjectDescription } from "hooks/useEditProjectDescription";
import { useToggleRecordingAccess } from "hooks/useToggleRecordingAccess";
import { Tooltip, TooltipContent, TooltipTrigger } from "components/ui/tooltip";
import { BiQuestionMark } from "react-icons/bi";
import {
  alphanumericSingleSpace,
  noLeadingSpace,
  noMultipleSpaces,
} from "schemas/validators";
import InlineEditable from "./InlineEditable";
import { PencilIcon } from "lucide-react";
import { Badge } from "components/ui/badge";

const sharedValidators = [
  { fn: noLeadingSpace, message: "No leading spaces allowed" },
  { fn: noMultipleSpaces, message: "No consecutive spaces allowed" },
  {
    fn: alphanumericSingleSpace,
    message: "Only letters, numbers, and single spaces allowed",
  },
];

interface ProjectSummaryProps {
  project: IProject;
  onTagEditClick: () => void;
}

export default function ProjectSummary({
  project,
  onTagEditClick,
}: ProjectSummaryProps) {
  const projectId = project._id!;

  // Internal-name editing
  const firstSessionDate = React.useMemo(
    () => getFirstSessionDate(project),
    [project]
  );

  // Inline‐edit state + mutations
  const [editingName, setEditingName] = React.useState(false);
  const [editingDesc, setEditingDesc] = React.useState(false);
  const { mutate: editName, isPending: isEditingName } =
    useEditProjectName(projectId);
  const { mutate: editDesc, isPending: isEditingDesc } =
    useEditProjectDescription(projectId);
  const { mutate: toggleRecording, isPending: isTogglingRecording } =
    useToggleRecordingAccess(projectId);

  // Static info rows
  const infoRows: Array<{
    label: string;
    /** If you need custom left‐side icon (e.g. tooltip), put it here */
    leftIcon?: React.ReactNode;
    /** value on left */
    value: React.ReactNode;
    /** if defined, clicking the icon triggers this */
    onIconClick?: () => void;
    /** control on right side */
    rightControl?: React.ReactNode;
  }> = [
    {
      label: "Fieldwork Start Date",
      value: firstSessionDate ? firstSessionDate.toLocaleDateString() : "—",
    },
    {
      label: "Service Type",
      value: project.service,
    },
    {
      label: "Observer Recording Access",
      leftIcon: (
        <Tooltip>
          <TooltipTrigger asChild>
            <BiQuestionMark className="ml-2 h-4 w-4 text-custom-orange-2 hover:text-custom-orange-1 cursor-help rounded-full border-custom-orange-2 border-[1px] p-0.5" />
          </TooltipTrigger>
          <TooltipContent side="top" align="start">
            Allow observers to see all recordings?
          </TooltipContent>
        </Tooltip>
      ),
      value: project.recordingAccess ? "Yes" : "No",
      rightControl: (
        <Switch
          checked={project.recordingAccess}
          onCheckedChange={() => toggleRecording()}
          disabled={isTogglingRecording}
        />
      ),
    },
  ];

  return (
    <Card className="border-0 shadow-all-sides">
      <CardHeader className="flex justify-between items-center">
        <CardTitle className="text-custom-teal">Project Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-1">
          <span className="text-sm text-gray-600">Project Name:</span>
          <span className="text-sm text-gray-600">{project.name}</span>
        </div>

        <InlineEditable
          label="Internal Project Name"
          value={project.internalProjectName || ""}
          editing={editingName}
          isPending={isEditingName}
          validators={sharedValidators}
          onStart={() => setEditingName(true)}
          onCancel={() => setEditingName(false)}
          onSave={(newVal) =>
            editName(
              { projectId, internalProjectName: newVal },
              { onSuccess: () => setEditingName(false) }
            )
          }
          editControlType="input"
        />

        <InlineEditable
          label="Description"
          value={project.description || ""}
          editing={editingDesc}
          isPending={isEditingDesc}
          validators={sharedValidators}
          onStart={() => setEditingDesc(true)}
          onCancel={() => setEditingDesc(false)}
          onSave={(newVal) =>
            editDesc(
              { projectId, description: newVal },
              { onSuccess: () => setEditingDesc(false) }
            )
          }
          editControlType="textarea"
        />

        <div className="flex justify-between items-center text-sm text-gray-600">
          <div className="flex-1 flex flex-wrap items-center gap-1">
            <span className="font-medium">Tags:</span>
            {project.tags.length > 0 ? (
              project.tags.map((tag) => (
                <Badge
                  key={tag._id}
                  style={{ backgroundColor: tag.color, color: "#fff" }}
                  className="px-2 py-0.5 rounded"
                >
                  {tag.title}
                </Badge>
              ))
            ) : (
              <span className="ml-1">—</span>
            )}
          </div>
          <div
            className="flex items-center gap-1 cursor-pointer text-sm text-black"
            onClick={onTagEditClick}
          >
            <PencilIcon className="h-4 w-4" />
            {project.tags.length > 0 ? "Edit" : "Add"}
          </div>
        </div>

        {/* Static rows */}
        {infoRows.map(
          ({ label, leftIcon, value, onIconClick, rightControl }, i) => (
            <div
              key={i}
              className="flex justify-between items-center text-sm text-gray-600"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{label}:</span>
                <span>{value}</span>
                {leftIcon && (
                  <span onClick={onIconClick} className="ml-1">
                    {leftIcon}
                  </span>
                )}
              </div>
              {rightControl}
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}

```

Path: frontend/components/viewProject/SessionAccess.tsx

```
// components/viewProject/SessionAccess.tsx
"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "components/ui/card";
import type { IProject } from "@shared/interface/ProjectInterface";
import ShareDialog from "./ShareDialog";

interface SessionAccessProps {
  project: IProject;
}

export interface ShareField {
  label: string;
  value: string;
}
type AccessConfig = {
  key: string;
  triggerLabel: string;
  badgeLabel: string;
  description: string;
  fields: ShareField[];
  copyPayload: string;
  footerText?: string;
};

const SessionAccess: React.FC<SessionAccessProps> = ({ project }) => {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const participantLink = `${origin}/join/participant/${project._id ?? ""}`;
  const observerLink   = `${origin}/join/observer/${project._id ?? ""}`;
  const passcode       = project.projectPasscode ?? "";

  const accessConfigs: AccessConfig[] = [
    {
      key: "observer",
      triggerLabel: "Observer Link",
      badgeLabel:   "Observer Link",
      description:  `You have been invited to the observer for ${project.name}.`,
      fields: [
        { label: "Meeting Link:", value: observerLink },
        { label: "Passcode:",      value: passcode },
      ],
      copyPayload: `Link: ${observerLink}\nPasscode: ${passcode}`,
      footerText:
        "Once you click the link and enter your passcode, you will be prompted to create an account or login to your existing account. After completing this process once, you may then access your meeting via the link or your account login.",
    },
    {
      key: "participant",
      triggerLabel: "Participant Link",
      badgeLabel:   "Participant Link",
      description:
        "You have been invited to participate in an upcoming research session. Please check the confirmation details from your recruiter for the time and date of your session.",
      fields: [
        { label: "Project:",      value: project.name },
        { label: "Session Link:", value: participantLink },
      ],
      copyPayload: participantLink,
    },
  ];

  return (
    <Card className="w-full mt-10 border-0 shadow-all-sides">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-0">
        <CardHeader className="flex-1">
          <CardTitle className="text-custom-teal">Session Access</CardTitle>
        </CardHeader>

        <CardContent className="flex items-center gap-4">
         {accessConfigs.map((cfg) => (
          <ShareDialog
            key={cfg.key}
            triggerLabel={cfg.triggerLabel}
            badgeLabel={cfg.badgeLabel}
            description={cfg.description}
            fields={cfg.fields}
            copyPayload={cfg.copyPayload}
            footerText={cfg.footerText}
          />
        ))}
        </CardContent>
      </div>
    </Card>
  );
};

export default SessionAccess;

```

Path: frontend/components/viewProject/ShareDialog.tsx

```
// components/viewProject/ShareDialog.tsx
"use client";

import React from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "components/ui/dialog";
import CustomButton from "components/shared/CustomButton";
import { toast } from "sonner";
import { Copy } from "lucide-react";

interface ShareDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerLabel: string;
  badgeLabel: string;
  description: string;
  fields: Array<{ label: string; value: string }>;
  copyPayload: string;
  footerText?: string;               // ← new
}

const ShareDialog: React.FC<ShareDialogProps> = ({
    open,
  onOpenChange,
  triggerLabel,
  badgeLabel,
  description,
  fields,
  copyPayload,
  footerText,                        // ← new
}) => {
  const copyLink = () => {
    if (!navigator.clipboard) {
      return toast.error("Clipboard unsupported");
    }
    navigator.clipboard.writeText(copyPayload).then(
      () => toast.success("Invite copied"),
      () => toast.error("Copy failed")
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
       {triggerLabel && (
      <DialogTrigger asChild>
        <CustomButton
          icon={<Copy />}
          className="bg-custom-teal hover:bg-custom-dark-blue-1"
        >
          {triggerLabel}
        </CustomButton>
      </DialogTrigger>
 )}
      <DialogContent className="rounded-2xl w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-center text-custom-black">
            Share Project Access
          </DialogTitle>
          <p className="mt-2 text-sm font-medium text-custom-gray-1 text-center bg-custom-gray-3 px-5 py-2">
            {badgeLabel.toUpperCase()}
          </p>
          <DialogDescription className="text-custom-black text-sm mt-2">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3 text-sm text-custom-black">
          {fields.map(({ label, value }) => (
            <p key={label}>
              <strong>{label}</strong>{" "}
              <span className="break-all">{value}</span>
            </p>
          ))}

          {footerText && (
            <p className="mt-2 text-xs text-custom-black">
              {footerText}
            </p>
          )}
        </div>

        <DialogFooter className="mt-6">
          <CustomButton
            className="w-full bg-custom-teal hover:bg-custom-dark-blue-3 rounded-lg"
            onClick={copyLink}
          >
            Copy Project Invite
          </CustomButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;

```

Path: frontend/components/viewProject/TagModel.tsx

```
"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";
import { Badge } from "components/ui/badge";
import { Plus, XIcon } from "lucide-react";
import { ITag } from "@shared/interface/TagInterface";
import api from "lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import CreateTagModal from "./CreateTagModal";
import CustomButton from "components/shared/CustomButton";
import { toast } from "sonner";
import ConfirmationModalComponent from "components/shared/ConfirmationModalComponent";
import { ApiResponse } from "@shared/interface/ApiResponseInterface";
import { useParams } from "next/navigation";

interface TagModalProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingTags: ITag[];
}

export default function TagModal({
  projectId,
  open,
  onOpenChange,
  existingTags,
}: TagModalProps) {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [selectedTags, setSelectedTags] = useState<ITag[]>(existingTags);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // For confirmation dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<ITag | null>(null);

  // Fetch all available tags
  const { data: allTags = [] } = useQuery<ITag[]>({
    queryKey: ["tags"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<ITag[]>>(
        `/api/v1/tags/project/${id}`
      );
      return res.data.data;
    },
  });

  // Delete a tag globally
  const deleteTag = useMutation<void, Error, string>({
    mutationFn: async (tagId) => {
      await api.delete(`/api/v1/tags/${tagId}`);
    },
    onSuccess: (_, tagId) => {
      // Remove from local selection
      setSelectedTags((st) => st.filter((t) => t._id !== tagId));
      // Re-fetch tags list and project
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast.success("Tag deleted");
    },
    onError: (err) => {
      toast.error(`Failed to delete tag: ${err.message}`);
    },
  });

  // reset when opening
  useEffect(() => {
    if (open) setSelectedTags(existingTags);
  }, [open, existingTags]);

  // when a new tag is created, add it to both caches + selection
  const handleNewTag = (tag: ITag) => {
    queryClient.setQueryData<ITag[]>(["tags"], (old = []) => [...old, tag]);
    setSelectedTags((st) => [...st, tag]);
    setIsCreateOpen(false);
  };

  const handleDeleteClick = (tag: ITag) => {
    setTagToDelete(tag);
    setConfirmOpen(true);
  };

  const handleConfirmYes = () => {
    if (tagToDelete) {
      deleteTag.mutate(tagToDelete._id);
      setTagToDelete(null);
    }
    setConfirmOpen(false);
  };

  const handleConfirmCancel = () => {
    setTagToDelete(null);
    setConfirmOpen(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex justify-between items-center pt-5">
              <DialogTitle className="text-custom-dark-blue-1">
                Assign Tags
              </DialogTitle>
              <CustomButton
                icon={<Plus />}
                className="bg-custom-teal 
            hover:bg-custom-dark-blue-1
            "
                onClick={() => setIsCreateOpen(true)}
              >
                Add New Tag
              </CustomButton>
            </div>
          </DialogHeader>

          {/* Currently assigned tags */}
          <div className="flex flex-wrap gap-2 mb-4 pt-5">
            {selectedTags.map((tag) => (
              <Badge
                key={tag._id}
                className="flex items-center text-white p-1 pl-2"
                style={{ backgroundColor: tag.color }}
              >
                {tag.title}
                <XIcon
                  onClick={() => handleDeleteClick(tag)}
                  className="ml-1 h-4 w-4 cursor-pointer"
                  style={{ pointerEvents: "all" }}
                />
              </Badge>
            ))}
            {!selectedTags.length && (
              <p className="text-sm text-gray-500">No tags assigned</p>
            )}
          </div>

          {/* Quick-add from existing */}
          <div className="flex flex-wrap gap-2 mb-4 max-h-40 overflow-auto">
            {allTags
              .filter((t) => !selectedTags.some((st) => st._id === t._id))
              .map((tag) => (
                <Badge
                  key={tag._id}
                  className="cursor-pointer hover:bg-blue-200"
                  onClick={() => setSelectedTags((st) => [...st, tag])}
                >
                  {tag.title}
                </Badge>
              ))}
          </div>
        </DialogContent>
      </Dialog>
      {/* nested create-tag dialog */}
      <CreateTagModal
        projectId={projectId}
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreated={handleNewTag}
      />

      <ConfirmationModalComponent
        open={confirmOpen}
        onCancel={handleConfirmCancel}
        onYes={handleConfirmYes}
        heading="Delete Tag?"
        text={`Are you sure you want to delete “${tagToDelete?.title}”? This cannot be undone.`}
      />
    </>
  );
}

```

Path: frontend/constant/index.ts

```
import { Role } from "@shared/interface/ModeratorInterface";
import { FieldConfig } from "../components/projects/createProject/Step2Component";
import { EditUserFormValues } from "../schemas/editUserSchema";
import { LoginFormValues } from "../schemas/loginSchema";
import { RegisterFormValues } from "../schemas/registerSchema";

export const durations = [
  { label: "15 mins", minutes: 15 },
  { label: "20 mins", minutes: 20 },
  { label: "30 mins", minutes: 30 },
  { label: "40 mins", minutes: 40 },
  { label: "45 mins", minutes: 45 },
  { label: "1.00 hr", minutes: 60 },
  { label: "1.25 hrs", minutes: 75 },
  { label: "1.5 hrs", minutes: 90 },
  { label: "1.75 hrs", minutes: 105 },
  { label: "2.00 hrs", minutes: 120 },
  { label: "2.25 hrs", minutes: 135 },
  { label: "2.5 hrs", minutes: 150 },
  { label: "2.75 hrs", minutes: 165 },
  { label: "3.00 hrs", minutes: 180 },
  { label: "4.00 hrs", minutes: 240 },
  { label: "5.00 hrs", minutes: 300 },
  { label: "6.00 hrs", minutes: 360 },
  { label: "7.00 hrs", minutes: 420 },
  { label: "8.00 hrs", minutes: 480 },
];

export const durationStep3 = durations.map((d) => d.label);
// Map each duration option to its minute value for calculation purposes
export const durationMapping: Record<string, number> = durations.reduce(
  (acc, { label, minutes }) => {
    acc[label] = minutes;
    return acc;
  },
  {} as Record<string, number>
);

export const availableLanguages = [
  "English",
  "French",
  "German",
  "Spanish",
  "Other",
];

export const creditPackages = [
  { package: 500, cost: 750 },
  { package: 2500, cost: 3550 },
  { package: 15000, cost: 20000 },
  { package: 50000, cost: 60000 },
];

export const quantityOptions = [1, 2, 3, 4, 5, 6, 7, 8];

export const optionalAddOnServices = [
  "Top-Notch Recruiting",
  "Insight-Driven Moderation and Project Design",
  "Multi-Language Services",
  "Asynchronous Activities (Pretasks, Bulletin Boards, etc.)",
];

// constants/timezones.ts

export const timeZones = [
  { utc: "-10", name: "Hawaii Time" },
  { utc: "-09", name: "Alaska Time" },
  { utc: "-08", name: "Pacific Time" },
  { utc: "-07", name: "Mountain Time" },
  { utc: "-06", name: "Central Time" },
  { utc: "-05", name: "Eastern Time" },
  { utc: "-04", name: "Buenos Aires" },
  { utc: "-03", name: "Rio de Janeiro" },
  { utc: "-02", name: "Sandwich Islands" },
  { utc: "-01", name: "Cape Verde" },
  { utc: "+00", name: "London Time" },
  { utc: "+01", name: "Paris" },
  { utc: "+02", name: "Athens" },
  { utc: "+03", name: "Moscow" },
  { utc: "+04", name: "Dubai" },
  { utc: "+05", name: "Pakistan" },
  { utc: "+05.5", name: "Delhi" },
  { utc: "+06", name: "Bangladesh" },
  { utc: "+07", name: "Bangkok" },
  { utc: "+08", name: "Beijing" },
  { utc: "+09", name: "Tokyo" },
  { utc: "+10", name: "Sydney" },
  { utc: "+11", name: "Solomon Islands" },
  { utc: "+12", name: "Auckland" },
];

export const registerDefaults: RegisterFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  companyName: "",
  password: "",
  confirmPassword: "",
  terms: false,
};

export const loginDefaults: LoginFormValues = {
  email: "",
  password: "Ab123456@",
  rememberMe: false,
};

export const ALPHA_REGEX = /^[A-Za-z\s]+$/;

export const PROJECT_NAME_REGEX = /^[A-Za-z0-9 _-]+$/;

export const textFields = [
  { name: "firstName" as const, label: "First Name", type: "text" },
  { name: "lastName" as const, label: "Last Name", type: "text" },
  { name: "email" as const, label: "Email", type: "email" },
  { name: "companyName" as const, label: "Company Name", type: "text" },
];

export const ALL_ROLES: Role[] = ["Admin", "Moderator", "Observer"];

export const personalFields: Array<{
  name: keyof EditUserFormValues;
  label: string;
}> = [
  { name: "firstName", label: "First Name*" },
  { name: "lastName", label: "Last Name*" },
  { name: "phoneNumber", label: "Phone Number*" },
  { name: "companyName", label: "Company Name*" },
];

export const numberFields: FieldConfig[] = [
  { name: "respondentsPerSession", label: "Number of Respondents per Session" },
  { name: "numberOfSessions", label: "Number of Sessions" },
  { name: "sessionLength", label: "Length(s) of Sessions (minutes)" },
];

export const recruitingFields: FieldConfig[] = [
  {
    name: "recruitmentSpecs",
    label:
      "What are the target recruitment specs? Please include as much information as possible.",
  },
  {
    name: "preWorkDetails",
    label: "Will there be any pre–work or additional assignments?",
  },
];

```

Path: frontend/constant/index.ts

```
export const SOCKET_URL =
    process.env.NEXT_PUBLIC_BACKEND_BASE_URL ?? "http://localhost:8008";
```

Path: frontend/constant/projectSections.ts

```
export type ProjectSection = {
  slug: string;
  label: string;
};

export const projectSections: ProjectSection[] = [
  { slug: "sessions", label: "Sessions" },
  { slug: "project-team", label: "Project Team" },
  { slug: "session-deliverables", label: "Session Deliverables" },
  { slug: "observer-documents", label: "Observer Documents" },
  { slug: "polls", label: "Polls" },
  { slug: "reports", label: "Reports" },
];

```

Path: frontend/hooks/use-mobile.ts

```
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

```

Path: frontend/hooks/useChangePassword.ts

```
// hooks/useChangePassword.ts
import { useMutation } from "@tanstack/react-query";

import { toast } from "sonner";
import type { ApiResponse, ErrorResponse } from "@shared/interface/ApiResponseInterface";
import api from "../lib/api";

export interface ChangePasswordPayload {
  userId: string;
  oldPassword: string;
  newPassword: string;
}

export default function useChangePassword() {
  return useMutation<
    ApiResponse<null>,
    { response?: { data: ErrorResponse } } & Error,
    ChangePasswordPayload
  >({
    mutationFn: ({ userId, oldPassword, newPassword }) =>
      api
        .post<ApiResponse<null>>("/api/v1/users/change-password", {
          userId,
          oldPassword,
          newPassword,
        })
        .then((r) => r.data),

    onSuccess: (response) => {
      toast.success(response.message);
    },

    onError: (err) => {
      const msg =
        err.response?.data.message || err.message || "Something went wrong";
      toast.error(msg);
    },
  });
}

```

Path: frontend/hooks/useChargePayment.ts

```
// hooks/useChargePayment.ts
"use client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "../lib/api";
import { IUser } from "@shared/interface/UserInterface";
import { ApiResponse } from "@shared/interface/ApiResponseInterface";
import { useGlobalContext } from "../context/GlobalContext";

export interface ChargeParams {
  amount: number;
  credits: number;
  customerId: string;
  userId: string;
}

/**
 * Charges a saved card, updates the user in context and localStorage,
 * then calls onSuccess (e.g. to kick off project creation).
 */
export function useChargePayment(onSuccess: () => void) {
  const { setUser } = useGlobalContext();
 
  return useMutation<{ data: { user: IUser } }, Error, ChargeParams>({
    mutationFn: ({ amount, credits, customerId, userId }) =>
      api
        .post<ApiResponse<{ user: IUser }>>("/api/v1/payment/charge", {
          customerId,
          amount,
          currency: "usd",
          userId,
          purchasedCredit: credits,
        })
        .then((res) => res.data),

    onSuccess: (apiResp) => {
      const updatedUser = apiResp.data.user;
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      toast.success("Payment successful");
      onSuccess();
    },

    onError: (err) => {
      toast.error(err.message ?? "Unknown error");
    },
  });
}

```

Path: frontend/hooks/useCountryList.ts

```
// hooks/useCountryList.ts
"use client";

import { useState, useEffect } from "react";
import axios from "axios";

export interface CountryCode {
  country: string;
  code: string;
  iso: string;
}

export function useCountryList(defaultIso: string = "US") {
  const [countries, setCountries] = useState<CountryCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode | null>(
    null
  );

  useEffect(() => {
    let isMounted = true;

    async function fetchCountries() {
      try {
        setIsLoading(true);
        const response = await axios.get<CountryCode[]>(
          "https://api.npoint.io/900fa8cc45c942a0c38e"
        );
        if (!isMounted) return;

        setCountries(response.data);

        // Pick default (if found), otherwise first in list
        const defaultCountry =
          response.data.find((c) => c.iso === defaultIso) || response.data[0];
        setSelectedCountry(defaultCountry);
      } catch (err) {
        console.error("Error fetching country data:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchCountries();
    return () => {
      isMounted = false;
    };
  }, [defaultIso]);

  return { countries, isLoading, selectedCountry, setSelectedCountry };
}

```

Path: frontend/hooks/useCreateCustomer.ts

```
// hooks/useCreateCustomer.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import api from "lib/api";
import { toast } from "sonner";
import { useGlobalContext } from "context/GlobalContext";

export function useCreateCustomer() {
  const { user, setUser } = useGlobalContext();

  return useMutation({
    mutationFn: () =>
      api.post("/api/v1/payment/create-customer", {
        userId: user?._id,
        billingInfo: user?.billingInfo,
      }),
    onSuccess: (res) => {
      // response contains stripeCustomerId
      setUser({ ...user!, stripeCustomerId: res.data.data.stripeCustomerId });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unknown error");
    },
  });
}

```

Path: frontend/hooks/useCreateProject.ts

```
// hooks/useCreateProject.ts
"use client";

import { useState, useEffect, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import api from "lib/api";
import {
  ApiResponse,
  ErrorResponse,
} from "@shared/interface/ApiResponseInterface";
import { useGlobalContext } from "context/GlobalContext";
import Step1 from "components/projects/createProject/Step1Component";
import Step2 from "components/projects/createProject/Step2Component";
import Step3 from "components/projects/createProject/Step3Component";
import Step4 from "components/projects/createProject/Step4Component";
import {
  IProjectFormState,
  StepProps,
} from "@shared/interface/CreateProjectInterface";

/**
 * Custom hook that centralizes:
 *  - formData + updateFormData
 *  - currentStep / step logic
 *  - saveMutation (calling /api/v1/projects/save-progress)
 */
export function useCreateProject() {
  const { user } = useGlobalContext();
  const userId = user?._id || "";

  // 1) form data state
  const [formData, setFormData] = useState<IProjectFormState>({
    user: userId,
    name: "",
    service: "",
    addOns: [],
    respondentCountry: "",
    respondentLanguage: [],
    sessions: [],
    firstDateOfStreaming: "",
    projectDate: "",
    respondentsPerSession: 1,
    numberOfSessions: 1,
    sessionLength: 30,
    recruitmentSpecs: "",
    preWorkDetails: "",
    selectedLanguage: "",
    inLanguageHosting: "",
    provideInterpreter: "",
    languageSessionBreakdown: "",
    additionalInfo: "",
    defaultTimeZone: undefined,
    defaultBreakoutRoom: false,
    emailSent: "",
  });

  const updateFormData = (fields: Partial<IProjectFormState>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  };

  // 2) dynamically decide which steps apply, based on service / date / addOns
  const steps = useMemo<React.FC<StepProps>[]>(() => {
    if (formData.service === "Signature") {
      return [Step1, Step3, Step4];
    }
    if (formData.service === "Concierge") {
      if (formData.firstDateOfStreaming) {
        const diffDays =
          (new Date(formData.firstDateOfStreaming).getTime() - Date.now()) /
          (1000 * 3600 * 24);
        if (diffDays < 14 || formData.addOns.length > 0) {
          return [Step1, Step2];
        }
        return [Step1, Step3, Step4];
      }
      return [Step1, Step2];
    }
    return [Step1];
  }, [formData.service, formData.firstDateOfStreaming, formData.addOns]);

  // 3) keep track of which step we’re on
  const [currentStep, setCurrentStep] = useState<number>(0);

  // if steps array shrinks, clamp currentStep to valid index
  useEffect(() => {
    if (currentStep >= steps.length) {
      setCurrentStep(steps.length - 1);
    }
  }, [steps, currentStep]);

  // 4) "save-progress" mutation
  const [uniqueId, setUniqueId] = useState<string | null>(null);

  const saveMutation = useMutation<
    ApiResponse<{ uniqueId: string }>,
    AxiosError<ErrorResponse>,
    { uniqueId: string | null; formData: IProjectFormState; userId: string }
  >({
    mutationFn: (payload) =>
      api
        .post<ApiResponse<{ uniqueId: string }>>(
          "/api/v1/projects/save-progress",
          payload
        )
        .then((res) => res.data),

    onSuccess: (resp) => {
      if (resp.data.uniqueId) {
        setUniqueId(resp.data.uniqueId);
      }
      setCurrentStep((prev) => prev + 1);
    },

    onError: (err) => {
      const msg =
        axios.isAxiosError(err) && err.response?.data.message
          ? err.response.data.message
          : err.message;
      toast.error(msg);
    },
  });

  const isLoading = saveMutation.isPending;

  // 5) helpers to navigate Back / Next
  const isLastStep =
    (formData.service === "Concierge" && currentStep === steps.length - 1) ||
    (formData.service === "Signature" && currentStep === steps.length - 1);

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleNext = () => {
    saveMutation.mutate({ uniqueId, formData, userId });
  };

  const isNextButtonDisabled = () => {
    if (currentStep === 0) {
      return !formData.service || !formData.firstDateOfStreaming;
    }

    if (steps[currentStep] === Step3) {
      const nameEmpty = !formData.name?.trim();
      const noLang =
        !formData.respondentLanguage ||
        (Array.isArray(formData.respondentLanguage) &&
          formData.respondentLanguage.length === 0);
      return nameEmpty || noLang;
    }

    return false;
  };

  const totalSteps = steps.length;

  return {
    formData,
    updateFormData,
    currentStep,
    StepComponent: steps[currentStep],
    totalSteps,
    handleBack,
    handleNext,
    isNextButtonDisabled,
    isLastStep,
    isLoading,
    uniqueId,
  };
}

```

Path: frontend/hooks/useCreateProjectByExternalAdmin.ts

```
// hooks/useCreateProjectByExternalAdmin.ts
"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "../lib/api";
import { ApiResponse } from "@shared/interface/ApiResponseInterface";
import { IProjectFormState } from "@shared/interface/CreateProjectInterface";
import { useGlobalContext } from "../context/GlobalContext";
import { IProject } from "@shared/interface/ProjectInterface";

export interface CreateProjectParams {
  uniqueId: string;
  formState: IProjectFormState;
  totalPurchasePrice: number;
  totalCreditsNeeded: number;
}

/**
 * Hits “create-project-by-external-admin”, invalidates the user’s projects list,
 * and calls onSuccess with the new project’s ID to open the modal.
 */
export function useCreateExternalProject(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formatProjectData: (raw: IProjectFormState) => Partial<IProject>,
  onSuccess: (newProjectId: string) => void
) {
  const { user } = useGlobalContext();
  const qc = useQueryClient();

  return useMutation<
    ApiResponse<{ data: { _id: string } }>,
    Error,
    CreateProjectParams
  >({
    mutationFn: ({ uniqueId, formState, totalPurchasePrice, totalCreditsNeeded }) =>
      api.post("/api/v1/projects/create-project-by-external-admin", {
        userId: user?._id,
        uniqueId,
        projectData: formatProjectData(formState),
        totalPurchasePrice,
        totalCreditsNeeded,
      }),

    onSuccess: (resp) => {
      const newId = resp.data.data._id;
      toast.success("Project created");
      qc.invalidateQueries({ queryKey: ["projectsByUser", user?._id] });
      onSuccess(newId);
    },

    onError: (err) => {
      toast.error(err.message ?? "Could not create project");
    },
  });
}

```

Path: frontend/hooks/useDeleteUser.ts

```
// hooks/useDeleteUser.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import api from "lib/api";
import { toast } from "sonner";
import { useGlobalContext } from "context/GlobalContext";
import { useRouter } from "next/navigation";
import { ErrorResponse } from "@shared/interface/ApiResponseInterface";

export function useDeleteUser() {
  const { setUser } = useGlobalContext();
  const router = useRouter();

  return useMutation<void, ErrorResponse, string>({
    mutationFn: (userId) =>
      api
        .delete(`/api/v1/users/${userId}`)
        .then(res => res.data.data),
    onSuccess: () => {
      toast.success("Account deleted");
      setUser(null);
      router.push("/login");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete account");
    },
  });
}

```

Path: frontend/hooks/useEditProjectDescription.ts

```
// frontend/hooks/useEditProjectDescription.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "lib/api";
import { ApiResponse } from "@shared/interface/ApiResponseInterface";
import { IProject } from "@shared/interface/ProjectInterface";
import { toast } from "sonner";

interface EditDescPayload {
  projectId: string;
  description: string;
}

/**
 * Hook for editing a project's description.
 *
 * Usage:
 *  const { mutate: editDesc, isPending } = useEditProjectDescription(projectId);
 *  editDesc({ description: "New description" });
 */
export function useEditProjectDescription(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<IProject>, Error, EditDescPayload>({
    mutationFn: async ({ projectId, description }) => {
      const res = await api.patch<ApiResponse<IProject>>(
        "/api/v1/projects/edit-project",
        { projectId, description }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast.success("Description updated");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
}

```

Path: frontend/hooks/useEditProjectName.ts

```
// frontend/hooks/useEditProjectName.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "lib/api";
import { ApiResponse } from "@shared/interface/ApiResponseInterface";
import { IProject } from "@shared/interface/ProjectInterface";
import { toast } from "sonner";

interface EditNamePayload {
  projectId: string;
  internalProjectName: string;
}


export function useEditProjectName(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<IProject>, Error, EditNamePayload>({
    mutationFn: async ({ projectId, internalProjectName }) => {
      const res = await api.patch<ApiResponse<IProject>>(
        "/api/v1/projects/edit-project",
        { projectId, internalProjectName }
      );
      return res.data;
    },
    onSuccess: () => {
     
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast.success("Internal project name updated");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
}

```

Path: frontend/hooks/useForgotPassword.ts

```
import { useMutation } from "@tanstack/react-query";
import type {
  ApiResponse,
  ErrorResponse,
} from "@shared/interface/ApiResponseInterface";
import { toast } from "sonner";
import api from "lib/api";

interface ForgotPasswordData {
  email: string;
}

export default function useForgotPassword() {
  return useMutation<
    ApiResponse<null>,
    { response?: { data: ErrorResponse } } & Error,
    ForgotPasswordData
  >({
    mutationFn: ({ email }) =>
      api
        .post<ApiResponse<null>>("/api/v1/users/forgot-password", { email })
        .then((res) => res.data),

    onSuccess: (response) => {
      toast.success(response.message);
    },

    onError: (error) => {
      const msg =
        error.response?.data.message || error.message || "Something went wrong";
      toast.error(msg);
    },
  });
}

```

Path: frontend/hooks/useLogin.ts

```
// hooks/useLogin.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import api from "lib/api";
import { IUser } from "@shared/interface/UserInterface";
import { ApiResponse, ErrorResponse } from "@shared/interface/ApiResponseInterface";
import { LoginFormValues } from "schemas/loginSchema";
import { useGlobalContext } from "context/GlobalContext";

/**
 * Custom hook that returns a login‐mutation object.
 * On success, it saves the user into global context + localStorage and navigates to "/projects".
 * On error, it toasts the appropriate message.
 */
export function useLogin() {
  const router = useRouter();
  const { setUser } = useGlobalContext();

  return useMutation<ApiResponse<{ user: IUser; token: string }>, AxiosError<ErrorResponse>, LoginFormValues>({
    mutationFn: (vals) =>
      api
        .post<ApiResponse<{ user: IUser; token: string }>>(
          "/api/v1/users/login",
          {
            email: vals.email,
            password: vals.password,
          },
          { withCredentials: true }
        )
        .then((res) => res.data),

    onSuccess: (resp) => {
      const { user } = resp.data;
      setUser(user);
      localStorage.setItem("user", JSON.stringify(user));
      toast.success(resp.message);
      router.replace("/projects");
    },

    onError: (err) => {
      console.error('err', err)
      const msg = axios.isAxiosError(err)
        ? err.response?.data.message ?? err.message
        : "Login failed";
      toast.error(msg);
    },
  });
}

```

Path: frontend/hooks/useProfileModals.ts

```
// hooks/useProfileModals.ts
"use client";
import { useState } from "react";

export function useProfileModals() {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  return {
    showPasswordModal,
    setShowPasswordModal,
    showDeleteModal,
    setShowDeleteModal,
  };
}

```

Path: frontend/hooks/useProject.ts

```
// frontend/hooks/useProject.ts
"use client";

import { ApiResponse } from "@shared/interface/ApiResponseInterface";
import { IProject } from "@shared/interface/ProjectInterface";
import { useQuery } from "@tanstack/react-query";
import api from "lib/api";

/**
 * Fetch a single project by ID.
 */
async function fetchProjectById(id: string): Promise<IProject> {
  const res = await api.get<ApiResponse<IProject>>(
    `/api/v1/projects/get-project-by-id/${id}`
  );
  return res.data.data;
}

export function useProject(projectId: string | undefined) {
  return useQuery<IProject, Error>({
    queryKey: ["project", projectId],
    queryFn: () => fetchProjectById(projectId!),
    enabled: Boolean(projectId),
  });
}

```

Path: frontend/hooks/useProjects.ts

```
// frontend/utils/hooks/useProjects.ts
"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import api from "lib/api";
import { IProject } from "@shared/interface/ProjectInterface";
import { IPaginationMeta } from "@shared/interface/PaginationInterface";

export interface UseProjectsParams {
  userId: string | undefined;
  page: number;
  limit?: number;
  search?: string;
  tag?: string;
  from?: string;
  to?: string;
}

export interface UseProjectsResult {
  projects: IProject[];
  meta: IPaginationMeta;
  isLoading: boolean;
  isError: boolean;
  error?: Error;
}

/**
 * Fetch projects for a given userId / page / search.
 * Returns: { projects, meta, isLoading, isError, error }.
 *
 * Automatically keeps previous data while paginating.
 */
export function useProjects({
  userId,
  page,
  limit = 10,
  search = "",
  tag="",
  from, to
}: UseProjectsParams): UseProjectsResult {
  const {
    data,
    error,
    isLoading,
    isError,
  } = useQuery<
    { data: IProject[]; meta: IPaginationMeta },
    Error
  >({
    queryKey: ["projects", userId, page, search, tag, from, to],
    queryFn: () =>
      api
        .get<{
          data: IProject[];
          meta: IPaginationMeta;
        }>(`/api/v1/projects/get-project-by-userId/${userId}`, {
          params: { page, limit, search, tag, from, to },
        })
        .then((res) => res.data),

    placeholderData: keepPreviousData,

  });

  return {
    projects: data?.data ?? [],
    meta: data?.meta ?? { totalItems: 0, totalPages: 0, page, limit, hasPrev: false, hasNext: false },
    isLoading,
    isError,
    error: isError ? error : undefined,
  };
}

```

Path: frontend/hooks/useRegister.ts

```
// hooks/useRegister.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import api from "lib/api";
import { IUser } from "@shared/interface/UserInterface";
import { ApiResponse } from "@shared/interface/ApiResponseInterface";
import { RegisterFormValues } from "schemas/registerSchema";

/**
 * Custom hook that returns a `useMutation`-powered object for registering a user.
 * It automatically handles the API call, error toasting, and redirect on success.
 */
export function useRegister() {
  const router = useRouter();

  return useMutation<IUser, unknown, { values: RegisterFormValues; fullPhoneNumber: string }>({
    // 1) mutation function: call the API
    mutationFn: async ({ values, fullPhoneNumber }) => {
      const res = await api.post<ApiResponse<IUser>>(
        "/api/v1/users/register",
        {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phoneNumber: fullPhoneNumber,
          companyName: values.companyName,
          password: values.password,
          termsAccepted: values.terms,
          role: "Admin",
        }
      );
      return res.data.data;
    },

    // 2) on success: show toast & redirect to account activation
    onSuccess: (_, { values }) => {
      toast.success("Your registration was successful!");
      router.push(`/account-activation?email=${encodeURIComponent(values.email)}`);
    },

    // 3) on error: toast the error message
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || "Registration failed";
        toast.error(message);
      } else {
        toast.error("Registration failed");
      }
    },
  });
}

```

Path: frontend/hooks/useResetPassword.ts

```
// hooks/useResetPassword.ts
import { useMutation } from "@tanstack/react-query";

import type { ApiResponse, ErrorResponse } from "@shared/interface/ApiResponseInterface";
import { toast } from "sonner";
import api from "../lib/api";

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export default function useResetPassword() {
  return useMutation<
    ApiResponse<null>,
    { response?: { data: ErrorResponse } } & Error,
    ResetPasswordPayload
  >({
    mutationFn: ({ token, newPassword }) =>
      api
        .post<ApiResponse<null>>("/api/v1/users/reset-password", { token, newPassword })
        .then((res) => res.data),

    onSuccess: (response) => {
      toast.success(response.message);
    },

    onError: (error) => {
      const msg =
        error.response?.data.message || error.message || "Something went wrong";
      toast.error(msg);
    },
  });
}

```

Path: frontend/hooks/useSaveBilling.ts

```
// hooks/useSaveBilling.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "lib/api";
import axios, { AxiosError } from "axios";
import { ApiResponse, ErrorResponse } from "@shared/interface/ApiResponseInterface";
import { IBillingInfo } from "@shared/interface/UserInterface";

interface SaveBillingPayload {
  userId: string;
  billingInfo: IBillingInfo;
}

export function useSaveBilling(onSuccessCallback: () => void) {
  return useMutation<
    ApiResponse<null>,
    AxiosError<ErrorResponse>,
    SaveBillingPayload
  >({
    mutationFn: ({ userId, billingInfo }) =>
      api
        .post<ApiResponse<null>>(
          "/api/v1/payment/save-billing-info",
          { userId, billingInfo }
        )
        .then((res) => res.data),

    onSuccess: () => {
      toast.success("Billing info saved successfully");
      onSuccessCallback();
    },

    onError: (error) => {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message ?? error.message
        : "Unknown error";
      toast.error(message);
    },
  });
}

```

Path: frontend/hooks/useSaveCard.ts

```
// hooks/useSaveCard.ts
"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "lib/api";
import { IUser } from "@shared/interface/UserInterface";
import { ApiResponse, ErrorResponse } from "@shared/interface/ApiResponseInterface";
import { useGlobalContext } from "../context/GlobalContext";

export function useSaveCard() {
  const { user, setUser } = useGlobalContext();
  const qc = useQueryClient();

  return useMutation<IUser, ErrorResponse, string>({
    mutationFn: async (paymentMethodId) => {
      if (!user) throw new Error("Not authenticated");
      const res = await api.post<ApiResponse<{ user: IUser }>>(
        "/api/v1/payment/save-payment-method",
        {
          customerId: user.stripeCustomerId!,
          paymentMethodId,
        }
      );
      return res.data.data.user;
    },
    onSuccess: (newUser) => {
      setUser(newUser);
      qc.invalidateQueries({ queryKey: ["stripeSetupIntent", user!._id] });
      toast.success("Card saved successfully");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unknown error");
    },
  });
}

```

Path: frontend/hooks/useStep2.ts

```
// hooks/useStep2.ts
"use client";

import { useRouter } from "next/navigation";
import { useForm, SubmitHandler} from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import {
  IProjectFormState,
  Step2FormValues,
} from "@shared/interface/CreateProjectInterface";

interface UseStep2Props {
  formData: IProjectFormState;
  updateFormData: (fields: Partial<IProjectFormState>) => void;
  uniqueId: string | null;
}

export function useStep2({
  formData,
  updateFormData,
  uniqueId,
}: UseStep2Props) {
  const router = useRouter();

  // 1) Initialize React Hook Form
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Step2FormValues>({
    defaultValues: {
      respondentsPerSession: formData.respondentsPerSession,
      numberOfSessions: formData.numberOfSessions,
      sessionLength: formData.sessionLength,
      preWorkDetails: formData.preWorkDetails,
      selectedLanguage: formData.selectedLanguage,
      languageSessionBreakdown: formData.languageSessionBreakdown,
      additionalInfo: formData.additionalInfo,
      inLanguageHosting: (formData.inLanguageHosting as "yes" | "no") || undefined,
      recruitmentSpecs: formData.recruitmentSpecs || "",
      provideInterpreter: formData.provideInterpreter || "",
    },
  });

  // 2) Set up the mutation that emails project info
  const mutation = useMutation({
    mutationFn: (data: {
      userId: string;
      uniqueId: string | null;
      formData: IProjectFormState;
    }) =>
      axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/v1/projects/email-project-info`,
        data
      ),
    onSuccess: () => {
      toast.success("Project information sent successfully");
      router.push("/projects");
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Unknown error");
    },
  });

  const isLoading = mutation.isPending;

  // 3) onSubmit merges Step2 values into formData and triggers mutation
  const onSubmit: SubmitHandler<Step2FormValues> = (data) => {
    const { respondentsPerSession, numberOfSessions, sessionLength } = data;

 // ① Prevent zero‐values right at submit time
    if (
      respondentsPerSession === 0 ||
      numberOfSessions === 0 ||
      sessionLength === 0
    ) {
      toast.error(
        "Respondents per session, Number of session and session length all three fields must have value at least 1."
      );
      return; // stop here
    }

    const mergedData: IProjectFormState = { ...formData, ...data };
    updateFormData(data);

    mutation.mutate({
      userId: formData.user,
      uniqueId,
      formData: mergedData,
    });
  };

  // 4) Expose everything needed by the component
  return {
    register,
    handleSubmit,
    watch,
    errors,
    onSubmit,
    isLoading,
  };
}

```

Path: frontend/hooks/useToggleRecordingAccess.ts

```
// frontend/hooks/useToggleRecordingAccess.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "lib/api";
import { ApiResponse } from "@shared/interface/ApiResponseInterface";
import { IProject } from "@shared/interface/ProjectInterface";
import { toast } from "sonner";

/**
 * Hook for toggling a project's recordingAccess flag.
 *
 * Usage:
 *  const { mutate: toggleRecording, isPending } = useToggleRecordingAccess(projectId);
 *  toggleRecording();
 */
export function useToggleRecordingAccess(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<IProject>, Error, void>({
    mutationFn: async () => {
      const res = await api.patch<ApiResponse<IProject>>(
        "/api/v1/projects/toggle-recording-access",
        { projectId }
      );
      return res.data;
    },
    onSuccess: (response) => {
      const updated = response.data;
      if (updated.recordingAccess) {
        toast.success("Recording access granted");
      } else {
        toast.success("Recording access revoked");
      }
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
}

```

Path: frontend/hooks/useUpdateUser.ts

```
// hooks/useUpdateUser.ts
"use client";
import { useMutation } from "@tanstack/react-query";
import api from "lib/api";
import { ApiResponse } from "@shared/interface/ApiResponseInterface";
import { ErrorResponse } from "@shared/interface/ApiResponseInterface";
import { useGlobalContext } from "context/GlobalContext";
import { toast } from "sonner";
import { IUser, EditUser } from "@shared/interface/UserInterface";
import { useRouter } from "next/navigation";

export function useUpdateUser(id: string) {
  const { setUser: setGlobalUser } = useGlobalContext();
  const router = useRouter();

  return useMutation<IUser, ErrorResponse, EditUser>({
    mutationFn: updatedFields =>
      api
        .put<ApiResponse<IUser>>(`/api/v1/users/edit/${id}`, updatedFields)
        .then(res => res.data.data),

    onSuccess: updatedUser => {
      setGlobalUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      toast.success("Profile updated successfully");
      router.push(`/my-profile/${id}`);
    },

    onError: err => {
      console.error("Error updating profile:", err);
      toast.error(err.message || "Failed to update profile");
    },
  });
}

```

Path: frontend/hooks/useUploadObserverDocument.ts

```
// hooks/useUploadObserverDocument.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useGlobalContext } from "../context/GlobalContext";
import api from "../lib/api";
import { toast } from "sonner";

interface UploadInput {
  file: File;
  sessionId: string;
}

export default function useUploadObserverDocument(
  projectId: string,
  onSuccessCallback?: () => void
) {
  const { user } = useGlobalContext();
  const queryClient = useQueryClient();

  return useMutation<void, Error, UploadInput>({
    mutationFn: ({ file, sessionId }) => {
      if (!user) {
        return Promise.reject(new Error("You must be logged in"));
      }
      if (!file) {
        return Promise.reject(new Error("Please select a file"));
      }
      if (!sessionId) {
        return Promise.reject(new Error("Please select a session"));
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectId", projectId);
      formData.append("sessionId", sessionId);
      formData.append("addedBy", user._id);
      formData.append("addedByRole", user.role);

      return api.post("/api/v1/observerDocuments", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },

    onSuccess: () => {
      toast.success("Document uploaded successfully.");
      queryClient.invalidateQueries({ queryKey: ["observerDocs", projectId] });
      onSuccessCallback?.();
    },
  });
}

```

Path: frontend/hooks/useUserById.ts

```
// hooks/useUserById.ts
"use client";
import { useQuery } from "@tanstack/react-query";
import api from "lib/api";
import { ApiResponse, ErrorResponse } from "@shared/interface/ApiResponseInterface";
import { IUser } from "@shared/interface/UserInterface";

export function useUserById(id: string) {
  return useQuery<IUser, ErrorResponse>({
    queryKey: ["user", id],
    queryFn: () =>
      api
        .get<ApiResponse<IUser>>("/api/v1/users/find-by-id", { params: { id } })
        .then(res => res.data.data),
  });
}

```

Path: frontend/hooks/useVerifyEmail.ts

```
// hooks/useVerifyEmail.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import api from "lib/api";
import { ApiResponse, ErrorResponse } from "@shared/interface/ApiResponseInterface";

export function useVerifyEmail() {
  return useMutation<void, AxiosError<ErrorResponse>, string>({
    /**
     * We call GET /api/v1/users/verify-email?token=…
     * (adjust the path if yours is under /users/verify-email)
     */
    mutationFn: (token) =>
      api
        .get<ApiResponse<null>>("/api/v1/users/verify-email", { params: { token } })
        .then((res) => {
          // we only care about side-effects here
          console.log(res)
        }),
  });
}

```

Path: frontend/lib/api.ts

```
// lib/api.ts
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL ?? 'https://bamplify.hgsingalong.com';

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, 
});

interface FailedQueueItem {
  resolve: () => void;
  reject: (error: unknown) => void;
}

/** ✅  Auth routes that should NOT trigger silent refresh */
const AUTH_ROUTES_REGEX = [
  /\/api\/v1\/auth\/(login|register|forgot-password|reset-password)$/,
  /\/api\/v1\/users\/login$/,          // 👈  your current login URL
];

const REFRESH_ENDPOINT = "/api/v1/auth/refreshToken";

const isAuthRoute = (url?: string): boolean =>
  AUTH_ROUTES_REGEX.some((re) => re.test(url ?? ""));

let isRefreshing = false;
let failedQueue: FailedQueueItem[] = [];

/**
 * Drain the queue: either retry all or reject all.
 */
function processQueue(error?: unknown): void {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve();
    }
  });
  failedQueue = [];
}



api.interceptors.response.use(
  (response: AxiosResponse<unknown>) => response,
   async (error: AxiosError & {
    config?: AxiosRequestConfig & { _retry?: boolean };
  }) => {
     const { config: originalRequest, response } = error;

    /* 1️⃣  Put backend “message” onto error.message for easy toasting */
   if (axios.isAxiosError(error)) {
  const msg = (error.response?.data as { message?: string } | undefined)?.message;
  if (msg) {
    error.message = msg;
  }
}


    /* 2️⃣  Silent token refresh (but skip for auth routes) */
    if (
      response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthRoute(originalRequest.url)
    ) {
      originalRequest._retry = true;

       if (isRefreshing) {
        // queue while a refresh is already in flight
        await new Promise<void>((resolve, reject) =>
          failedQueue.push({ resolve, reject })
        );
        return api(originalRequest); // retry after queue is released
      }

      isRefreshing = true;

   isRefreshing = true;
      try {
        await axios.post(`${BASE_URL}${REFRESH_ENDPOINT}`, null, {
          withCredentials: true,
        });
        processQueue();
        return api(originalRequest); // retry original
      } catch (refreshErr) {
        processQueue(refreshErr);
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    /* 3️⃣  Anything else bubbles up */
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  response => response,
  (error: unknown) => {
    if (axios.isAxiosError<{ message: string }>(error) && error.response?.data?.message) {
      // override the built-in AxiosError.message
      error.message = error.response.data.message;
    }
    return Promise.reject(error);
  }
);

export default api;

```

Path: frontend/lib/utils.ts

```
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

```

Path: frontend/provider/Providers.tsx

```
import { Toaster } from 'components/ui/sonner'
import { AuthProvider } from 'context/AuthContext'
import { DashboardProvider } from 'context/DashboardContext'
import { GlobalProvider } from 'context/GlobalContext'
import { MeetingProvider } from 'context/MeetingContext'
import React, { ReactNode } from 'react'

type ProvidersProps = {
  children: ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <GlobalProvider>
      <AuthProvider>
        <DashboardProvider>
          <MeetingProvider>
            {children}
            <Toaster richColors />
          </MeetingProvider>
        </DashboardProvider>
      </AuthProvider>
    </GlobalProvider>
  )
}

```

Path: frontend/provider/TanstackProvider.tsx

```
// app/provider/TanstackProvider.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const queryClient = new QueryClient();

export default function TanstackProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      
    </QueryClientProvider>
  );
}

```

Path: frontend/schemas/addModeratorSchema.ts

```
import { z } from "zod";
import { alphanumericSingleSpace, alphaSingleSpace, noLeadingSpace, noMultipleSpaces, noTrailingSpace } from "./validators";

export const addModeratorSchema = z.object({
  firstName: z
    .string()
    .min(1, "First Name is required")
    .refine(noLeadingSpace, { message: "Cannot start with a space" })
    .refine(noTrailingSpace, { message: "Cannot end with a space" })
    .refine(alphaSingleSpace, {
      message: "Only letters and single spaces allowed",
    }),
  lastName: z
    .string()
    .min(1, "Last Name is required")
    .refine(noLeadingSpace, { message: "Cannot start with a space" })
    .refine(noTrailingSpace, { message: "Cannot end with a space" })
    .refine(alphaSingleSpace, {
      message: "Only letters and single spaces allowed",
    }),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Must be a valid email")
    .refine(noLeadingSpace, { message: "Cannot start with a space" })
    .refine(noTrailingSpace, { message: "Cannot end with a space" }),
  companyName: z
    .string()
    .min(1, "Company Name is required")
    .refine(noLeadingSpace, { message: "Cannot start with a space" })
    .refine(noTrailingSpace, { message: "Cannot end with a space" })
    .refine(noMultipleSpaces, {
      message: "No multiple spaces allowed",
    })
    .refine(alphanumericSingleSpace, {
      message: "Only letters/numbers & single spaces",
    }),
  roles: z
    .array(z.enum(["Admin", "Moderator", "Observer"]))
    .min(1, "Please select at least one role"),
});

export type AddModeratorValues = z.infer<typeof addModeratorSchema>;
```

Path: frontend/schemas/changePasswordSchema.ts

```
// schemas/changePasswordSchema.ts
import { z } from "zod";

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(9, "Password must be at least 9 characters")
      .regex(
        /(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*\W)/,
        "Must include uppercase, lowercase, number & special char"
      ),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  // confirm matches newPassword
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords must match",
  })
  // newPassword ≠ currentPassword
  .refine((d) => d.newPassword !== d.currentPassword, {
    path: ["newPassword"],
    message: "New password cannot be the same as the current password",
  });

export type ChangePasswordInputs = z.infer<typeof changePasswordSchema>;

```

Path: frontend/schemas/editModeratorSchema.ts

```
import { z } from "zod";
import { alphanumericSingleSpace, alphaSingleSpace, noLeadingSpace, noMultipleSpaces, noTrailingSpace } from "./validators";

export const editModeratorSchema = z.object({
  firstName: z
    .string()
    .min(1, "First Name is required")
    .refine(noLeadingSpace, { message: "First Name Cannot start with a space" })
    .refine(noTrailingSpace, { message: "First Name Cannot end with a space" })
    .refine(alphaSingleSpace, {
      message: "Only letters and single spaces allowed in first name",
    }),
  lastName: z
    .string()
    .min(1, "Last Name is required")
    .refine(noLeadingSpace, { message: "Last Name Cannot start with a space" })
    .refine(noTrailingSpace, { message: "Last Name Cannot end with a space" })
    .refine(alphaSingleSpace, {
      message: "Only letters and single spaces allowed in last name ",
    }),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Must be a valid email")
    .refine(noLeadingSpace, { message: "Email Cannot start with a space" })
    .refine(noTrailingSpace, { message: "Email Cannot end with a space" }),
  companyName: z
    .string()
    .min(1, "Company Name is required")
    .refine(noLeadingSpace, { message: "Company Name Cannot start with a space" })
    .refine(noTrailingSpace, { message: "Company Name Cannot end with a space" })
    .refine(noMultipleSpaces, { message: "No multiple spaces allowed in company name " })
    .refine(alphanumericSingleSpace, {
      message: "Company Name can only contain letters/numbers & single spaces",
    }),
  adminAccess: z.boolean(),
  isActive:    z.boolean(),
});

export type EditModeratorForm = z.infer<typeof editModeratorSchema>;

```

Path: frontend/schemas/editUserSchema.ts

```
import { z } from "zod";

const onlyLettersSpaces = /^[A-Za-z ]+$/;

// Will trim and collapse multiple spaces between words
const normalizeSpaces = (val: string) => val.replace(/\s+/g, " ").trim();

export const editUserSchema = z.object({
  firstName: z
    .string()
    .max(50, { message: "First Name can be at most 50 characters long" })
    .regex(onlyLettersSpaces, { message: "First Name can only contain letters and spaces" })
    .transform(normalizeSpaces)
    .refine((val) => val.length > 0, { message: "First Name cannot be empty or only spaces" }),
  lastName: z
    .string()
    .max(50, { message: "Last Name can be at most 50 characters long" })
    .regex(onlyLettersSpaces, { message: "Last Name can only contain letters and spaces" })
    .transform(normalizeSpaces)
    .refine((val) => val.length > 0, { message: "Last Name cannot be empty or only spaces" }),
  companyName: z
    .string()
    .max(50, { message: "Company Name can be at most 50 characters long" })
    .regex(onlyLettersSpaces, { message: "Company Name can only contain letters and spaces" })
    .transform(normalizeSpaces)
    .refine((val) => val.length > 0, { message: "Company Name cannot be empty or only spaces" }),
  phoneNumber: z
    .string()
    .min(10, { message: "Phone Number must be at least 10 digits long" })
    .max(15, { message: "Phone Number can be at most 15 digits long" })
    .regex(/^\+?[0-9]{10,15}$/, { message: "Phone Number must be 10–15 digits long, and may start with a ‘+’" }),
});

export type EditUserFormValues = z.infer<typeof editUserSchema>;

```

Path: frontend/schemas/loginSchema.ts

```
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
  rememberMe: z.boolean(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
```

Path: frontend/schemas/registerSchema.ts

```
// shared/schemas/auth.ts
import { z } from "zod";

const nameRegex = /^(?=.*[A-Za-z])[A-Za-z ]+$/;

export const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(1, { message: "First Name is required" })
      .max(50, { message: "First Name can be at most 50 characters long" })
      .regex(nameRegex, {
        message: "First Name must contain only letters/spaces and at least one letter",
      }),
    lastName: z
      .string()
      .min(1, { message: "Last Name is required" })
       .max(50, { message: "Last Name can be at most 50 characters long" })
      .regex(nameRegex, {
        message: "Last Name must contain only letters/spaces and at least one letter",
      }),
    email: z.string().email({ message: "Please enter a valid email address" }),
    companyName: z
      .string()
      .min(1, { message: "Company name is required" })
      .max(50, { message: "Company Name can be at most 50 characters long" })
      .regex(/^[A-Za-z ]+$/, {
        message: "Company Name can only contain letters and spaces",
      }),
      phoneNumber: z
      .string()
      .min(10, { message: "Phone number must be at least 10 digits" })
      .max(12, { message: "Phone number cannot exceed 12 digits" })
      .regex(/^\d+$/, { message: "Phone number must contain only digits" }),

    password: z.string().min(9, {
      message: "Password must be at least 9 characters long",
    }),
    confirmPassword: z
      .string()
      .min(1, { message: "Please confirm your password" }),
    terms: z.boolean().refine((val) => val === true, {
      message: "You must accept the Terms & Conditions",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Export the inferred TypeScript type as well, if needed:
export type RegisterFormValues = z.infer<typeof registerSchema>;

```

Path: frontend/schemas/resetPasswordSchema.ts

```
// schemas/resetPasswordSchema.ts
import { z } from "zod";

export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(9, "Password must be at least 9 characters")
      .regex(
        /(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*\W)/,
        "Must include uppercase, lowercase, number & special char"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

export type ResetPasswordInputs = z.infer<typeof resetPasswordSchema>;

```

Path: frontend/schemas/validationConfigs.ts

```
// schemas/validationConfigs.ts
import {
  noLeadingSpace,
  noTrailingSpace,
  noMultipleSpaces,
  alphanumericSingleSpace,
  alphaSingleSpace,
} from "./validators";

export const textRules = [
  { fn: noLeadingSpace, message: "Cannot start with a space" },
  { fn: noTrailingSpace, message: "Cannot end with a space" },
  { fn: noMultipleSpaces, message: "No multiple spaces allowed" },
];

export const alphaRules = [
  ...textRules,
  { fn: alphaSingleSpace, message: "Only letters & single spaces allowed" },
];

export const alphanumericRules = [
  ...textRules,
  {
    fn: alphanumericSingleSpace,
    message: "Only letters, numbers & single spaces allowed",
  },
];

```

Path: frontend/schemas/validators.ts

```
// /utils/validators.ts
export type Validator = (value: string) => boolean

/** only digits 0–9 */
export const onlyDigits: Validator = v => /^[0-9]+$/.test(v)

/** no leading space */
export const noLeadingSpace: Validator = v => !/^\s/.test(v)

/** no trailing space */
export const noTrailingSpace: Validator = v => !/\s$/.test(v)

/** no multiple spaces in a row */
export const noMultipleSpaces: Validator = v => !/ {2,}/.test(v)

/** no special characters (only letters, numbers, spaces) */
export const noSpecialChars: Validator = v => /^[A-Za-z0-9 ]*$/.test(v)

/** only letters, single spaces allowed between words */
export const alphaSingleSpace: Validator = v =>
  /^[A-Za-z]+(?: [A-Za-z]+)*$/.test(v)

/** only letters & numbers, single spaces allowed between words */
export const alphanumericSingleSpace: Validator = v => /^[A-Za-z0-9 ]*$/.test(v)

// utils/validators.ts
/** only letters and spaces (allows trailing/leading spaces, but no special chars or digits) */
export const lettersAndSpaces: Validator = v => /^[A-Za-z ]*$/.test(v)

/** only email-safe characters (no spaces) */
export const emailChars: Validator = v =>
  /^[A-Za-z0-9@.\-_+]*$/.test(v)

/**
 * Runs `value` through every validator in `rules`.
 * Returns `true` if **all** pass.
 */
export function validate(value: string, rules: Validator[]): boolean {
  return rules.every((fn) => fn(value))
}

```

Path: frontend/utils/calculateCreditsNeededForRemainingSchedules.ts

```
// shared/utils/credits.ts

import { ISession } from "@shared/interface/SessionInterface"; 

/**
 * Sum all remaining meeting durations (in minutes)
 * and multiply by the per-minute credit rate.
 */
export function calculateRemainingScheduleCredits(
  meetings: ISession[],
  ratePerMinute = 2.75,
): number {
  const totalMinutes = meetings.reduce(
    (sum, { duration }) => sum + duration,
    0,
  );

  return totalMinutes * ratePerMinute;
}

```

Path: frontend/utils/calculateOriginalEstimatedProjectCredits.ts

```
import { IProjectSession } from "@shared/interface/ProjectInterface";


export function calculateOriginalEstimatedProjectCredits(
  sessions: IProjectSession[],
  ratePerMinute = 2.75,
): number {
  const totalMinutes = sessions.reduce((sum, { number, duration }) => {

    const match = duration.match(/^\s*(\d+)\s*/);
    const minutes = match ? parseInt(match[1], 10) : 0;
    return sum + number * minutes;
  }, 0);

  return totalMinutes * ratePerMinute;
}
```

Path: frontend/utils/countDaysBetween.tsx

```
export function businessDaysBetween(target: Date): number {
    const today = new Date();
    // zero out time
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    let count = 0;
    const cursor = new Date(start);
    while (cursor < target) {
      cursor.setDate(cursor.getDate() + 1);
      const day = cursor.getDay();
      if (day !== 0 && day !== 6) {
        count++;
      }
    }
    return count;
  }
```

Path: frontend/utils/formatProjectData.tsx

```
import { IProjectFormState } from "@shared/interface/CreateProjectInterface";
import { IProject } from "@shared/interface/ProjectInterface";

export const formatProjectData = (
  rawData: Partial<IProjectFormState>
): Partial<IProject> => {
  return {
    name: rawData.name,
    description: "",
    startDate: new Date(rawData.firstDateOfStreaming!),
    service: rawData.service as "Concierge" | "Signature",
    respondentCountry: rawData.respondentCountry,
    respondentLanguage: Array.isArray(rawData.respondentLanguage)
      ? rawData.respondentLanguage.join(", ")
      : rawData.respondentLanguage,
    sessions: rawData.sessions!.map((session) => ({
      number: session.number,
      duration: session.duration,
    })),
    defaultTimeZone: rawData.defaultTimeZone,
    defaultBreakoutRoom: Boolean(rawData.defaultBreakoutRoom),
    cumulativeMinutes: 0,
    status: "Draft",
    tags: [],
  };
};

```

Path: frontend/utils/getFirstSessionDate.ts

```
import { IProject } from "@shared/interface/ProjectInterface";

export function getFirstSessionDate(project: IProject): Date | null {
  if (!project?.meetings?.length) {
    return project.startDate ? new Date(project.startDate) : null;
  }

  const sessionDateTimes = project.meetings
    .filter((m) => m?.startTime && m?.date)
    .map((m) => {
      const meetingDate = new Date(m.date);
      const [hour, minute] = m.startTime.split(":").map(Number);
      return new Date(
        meetingDate.getFullYear(),
        meetingDate.getMonth(),
        meetingDate.getDate(),
        hour,
        minute
      );
    });

  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const upcoming = sessionDateTimes.filter((dt) => dt >= todayMidnight);

  return upcoming.length
    ? upcoming.reduce((earliest, curr) => (curr < earliest ? curr : earliest), upcoming[0])
    : project.startDate
    ? new Date(project.startDate)
    : null;
}

```

Path: frontend/utils/getPages.tsx

```
function getPages(totalPages: number, currentPage: number): (number | "…")[] {
  const pages: (number | "…")[] = [];

  // always show page 1
  pages.push(1);

  // if there's a gap between 1 and currentPage-1, show "…"
  if (currentPage - 2 > 1) {
    pages.push("…");
  }

  // show the page before current, current, and after current
  for (let p = Math.max(2, currentPage - 1); p <= Math.min(totalPages - 1, currentPage + 1); p++) {
    pages.push(p);
  }

  // if there's a gap between currentPage+1 and last page
  if (currentPage + 2 < totalPages) {
    pages.push("…");
  }

  // always show the last page (if it's not page 1)
  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return pages;
}

export default getPages;
```

Path: frontend/utils/payment.ts

```
// /utils/payment.ts
import axios from "axios";
import { IUser } from "@shared/interface/UserInterface";

// Retrieves the token from localStorage
export const getToken = (): string => {
  const userStr = localStorage.getItem("user");
  if (userStr) {
    try {
      const userObj = JSON.parse(userStr);
      return userObj.token || "";
    } catch (error) {
      console.error("Error in getToken function", error);
      return "";
    }
  }
  return "";
};

// Retrieves the user object from localStorage
export const getUser = (): IUser | null => {
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (error) {
    console.error("Error in getUser function", error);
    return null;
  }
};

// Charges the customer using the saved card for a given amount (in cents)
export const chargeWithSavedCard = async (
  amountCents: number,
  totalCreditsNeeded: number
): Promise<IUser> => {
  const token = getToken();
  const user = getUser();

  if (!user || !user.stripeCustomerId) {
    throw new Error("No Stripe customer ID available");
  }

  const response = await axios.post(
    `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/v1/payment/charge`,
    {
      customerId: user.stripeCustomerId,
      amount: amountCents,
      currency: "usd",
      userId: user._id,
      purchasedCredit: totalCreditsNeeded,
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  localStorage.setItem("user", JSON.stringify(response.data.data.user));
  
  return response.data;
};

```

Path: frontend/utils/timezones.ts

```
// shared/timezones.ts
import { DateTime, IANAZone } from "luxon";

// Map your UI labels to canonical IANA zones (same mapping you used on backend)
const DISPLAY_TZ_TO_IANA: Record<string, string> = {
  "Eastern Time": "America/New_York",
  "(UTC-05) Eastern Time": "America/New_York",

  "Central Time": "America/Chicago",
  "(UTC-06) Central Time": "America/Chicago",

  "Mountain Time": "America/Denver",
  "(UTC-07) Mountain Time": "America/Denver",

  "Pacific Time": "America/Los_Angeles",
  "(UTC-08) Pacific Time": "America/Los_Angeles",

  "Alaska Time": "America/Anchorage",
  "(UTC-09) Alaska Time": "America/Anchorage",

  "Hawaii Time": "Pacific/Honolulu",
  "(UTC-10) Hawaii Time": "Pacific/Honolulu",

  "London Time": "Europe/London",
  "(UTC-00) London Time": "Europe/London",

  "Cape Verde": "Atlantic/Cape_Verde",
  "(UTC-01) Cape Verde": "Atlantic/Cape_Verde",

  "Sandwich Islands": "Atlantic/South_Georgia",
  "(UTC-02) Sandwich Islands": "Atlantic/South_Georgia",

  "Rio de Janeiro": "America/Sao_Paulo",
  "(UTC-03) Rio de Janeiro": "America/Sao_Paulo",

  "Buenos Aires": "America/Argentina/Buenos_Aires",
  "(UTC-04) Buenos Aires": "America/Argentina/Buenos_Aires",

  "Paris": "Europe/Paris",
  "(UTC+01) Paris": "Europe/Paris",

  "Athens": "Europe/Athens",
  "(UTC+02) Athens": "Europe/Athens",

  "Moscow": "Europe/Moscow",
  "(UTC+03) Moscow": "Europe/Moscow",

  "Dubai": "Asia/Dubai",
  "(UTC+04) Dubai": "Asia/Dubai",

  "Pakistan": "Asia/Karachi",
  "(UTC+05) Pakistan": "Asia/Karachi",

  "Delhi": "Asia/Kolkata",
  "(UTC+05.5) Delhi": "Asia/Kolkata",

  "Bangladesh": "Asia/Dhaka",
  "(UTC+06) Bangladesh": "Asia/Dhaka",

  "Bangkok": "Asia/Bangkok",
  "(UTC+07) Bangkok": "Asia/Bangkok",

  "Beijing": "Asia/Shanghai",
  "(UTC+08) Beijing": "Asia/Shanghai",

  "Tokyo": "Asia/Tokyo",
  "(UTC+09) Tokyo": "Asia/Tokyo",

  "Sydney": "Australia/Sydney",
  "(UTC+10) Sydney": "Australia/Sydney",

  "Solomon Islands": "Pacific/Guadalcanal",
  "(UTC+11) Solomon Islands": "Pacific/Guadalcanal",

  "Auckland": "Pacific/Auckland",
  "(UTC+12) Auckland": "Pacific/Auckland",
};

export const resolveToIana = (label?: string | null): string | null => {
  if (!label) return null;
  if (IANAZone.isValidZone(label)) return label; // already IANA
  const trimmed = label.trim();
  const direct = DISPLAY_TZ_TO_IANA[trimmed];
  if (direct) return direct;
  const withoutPrefix = trimmed.replace(/^\(UTC[+-]?\d+(?:\.\d+)?\)\s*/, "");
  return DISPLAY_TZ_TO_IANA[withoutPrefix] ?? null;
};

export const formatUtcOffset = (iana: string, at: Date | string | number): string => {
  const dt = typeof at === "string" || typeof at === "number"
    ? DateTime.fromISO(String(at), { zone: iana })
    : DateTime.fromJSDate(at, { zone: iana });
  const minutes = dt.isValid ? dt.offset : DateTime.now().setZone(iana).offset;
  const sign = minutes >= 0 ? "+" : "-";
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `UTC${sign}${h}${m ? ":" + String(m).padStart(2, "0") : ""}`;
};

export const formatUiTimeZone = (displayLabel: string, at?: Date | string | number): string => {
  const iana = resolveToIana(displayLabel);
  if (!iana) return displayLabel; // fallback
  const when = at ?? new Date();
  const offset = formatUtcOffset(iana, when);
  const cleanName = displayLabel.replace(/^\(UTC[^\)]+\)\s*/, "");
  return `${offset} ${cleanName}`;
};

```

Path: frontend/utils/validationHelper.ts

```
// /utils/field-helpers.ts

import { validate, Validator } from "schemas/validators"
import { toast } from "sonner"


export function makeOnChange<Key extends string>(
  key: Key,
  rules: Validator[],
  errorMsg: string,
  setter: (upd: Record<Key,string>) => void
) {
  return (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    if (!validate(v, rules)) {
      toast.error(errorMsg)
      return
    }
    setter({ [key]: v } as Record<Key,string>)
  }
}

```

Path: frontend/components.json

```
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

Path: frontend/eslint.config.mjs

```
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;

```

Path: frontend/next.config.ts

```
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: [
     
      "interview-234343.s3.ap-southeast-2.amazonaws.com",
    ],
  },
};

export default nextConfig;

```

Path: frontend/package.json

```
{
  "name": "frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "build:shared": "tsc --build ../shared",
    "dev": "next dev",
    "build": "npm run build:shared && next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@hookform/resolvers": "^5.0.1",
    "@livekit/components-react": "^2.9.14",
    "@livekit/components-styles": "^1.1.6",
    "@radix-ui/react-accordion": "^1.2.10",
    "@radix-ui/react-alert-dialog": "^1.1.6",
    "@radix-ui/react-avatar": "^1.1.3",
    "@radix-ui/react-checkbox": "^1.1.4",
    "@radix-ui/react-dialog": "^1.1.7",
    "@radix-ui/react-dropdown-menu": "^2.1.6",
    "@radix-ui/react-label": "^2.1.2",
    "@radix-ui/react-popover": "^1.1.7",
    "@radix-ui/react-progress": "^1.1.7",
    "@radix-ui/react-radio-group": "^1.2.3",
    "@radix-ui/react-scroll-area": "^1.2.3",
    "@radix-ui/react-select": "^2.1.6",
    "@radix-ui/react-separator": "^1.1.2",
    "@radix-ui/react-slot": "^1.1.2",
    "@radix-ui/react-switch": "^1.2.4",
    "@radix-ui/react-tabs": "^1.1.3",
    "@radix-ui/react-tooltip": "^1.1.8",
    "@stripe/react-stripe-js": "^3.6.0",
    "@stripe/stripe-js": "^7.0.0",
    "@tanstack/react-query": "^5.71.10",
    "axios": "^1.8.4",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.1.1",
    "date-fns": "^4.1.0",
    "livekit-client": "^2.15.5",
    "lucide-react": "^0.487.0",
    "luxon": "^3.7.1",
    "next": "15.2.4",
    "next-themes": "^0.4.6",
    "react": "^19.0.0",
    "react-day-picker": "^9.9.0",
    "react-dom": "^19.0.0",
    "react-hook-form": "^7.55.0",
    "react-icons": "^5.5.0",
    "socket.io-client": "^4.8.1",
    "sonner": "^2.0.3",
    "tailwind-merge": "^3.1.0",
    "tw-animate-css": "^1.2.5",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3",
    "@tailwindcss/postcss": "^4.1.3",
    "@types/luxon": "^3.7.1",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "autoprefixer": "^10.4.21",
    "eslint": "^9",
    "eslint-config-next": "15.2.4",
    "postcss": "^8.5.3",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}

```

Path: frontend/postcss.config.mjs

```
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}

export default config

```

Path: frontend/tailwind.config.ts

```
// import type { Config } from 'tailwindcss'

// const config = {
//   // In Tailwind v4 the plugin scans your project automatically via PostCSS.
//   // We still include globs for compatibility and to work with editors/tools.
//   content: [
//     './app/**/*.{js,ts,jsx,tsx,mdx}',
//     './components/**/*.{js,ts,jsx,tsx,mdx}',
//     './pages/**/*.{js,ts,jsx,tsx,mdx}',
//     './provider/**/*.{js,ts,jsx,tsx,mdx}',
//     './context/**/*.{js,ts,jsx,tsx,mdx}',
//     './hooks/**/*.{js,ts,jsx,tsx,mdx}',
//     './lib/**/*.{js,ts,jsx,tsx,mdx}',
//   ],
//   theme: {
//     extend: {
//       colors: {
//         'custom-meet-bg': '#fde2d0',
//         'custom-gray-1': '#E8E8E8',
//         'custom-white': '#FFFFFF',
//         'custom-gray-2': '#F7F8F9',
//         'custom-black': '#000000',
//         'custom-orange-1': '#FF6600',
//         'custom-dark-blue-1': '#00293C',
//         'custom-dark-blue-2': '#031F3A',
//         'custom-light-blue-1': '#2976a5',
//         'custom-pink': '#FF7E296E',
//         'custom-light-blue-2': '#369CFF',
//         'custom-light-blue-3': '#559FFB',
//         'custom-red': '#FF3838',
//         'custom-green': '#07C800',
//         'custom-gray-3': '#707070',
//         'custom-orange-2': '#FC6E15',
//         'custom-gray-4': '#00000029',
//         'custom-teal': '#1E656D',
//         'custom-yellow': '#FCD860',
//         'custom-orange-3': '#E39906',
//         'custom-gray-5': '#A8A8A8',
//         'custom-gray-6': '#AFAFAF',
//         'custom-gray-7': '#EAEAEA',
//         'custom-gray-8': '#EBEBEB',
//       },
//       fontFamily: {
//         montserrat: ['Montserrat', 'sans-serif'],
//       },
//       backgroundImage: {
//         'sidebar-gradient':
//           'linear-gradient(28deg, #FC6E15 0%, #031f3a 100%) 0% 0% no-repeat',
//       },
//     },
//   },
//   plugins: [],
// } satisfies Config

// export default config

```

Path: frontend/tsconfig.json

```
{
  "compilerOptions": {
    "composite": true,
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"],
      "@shared/*": ["../shared/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"],
  "references": [
    { "path": "../shared" }  
  ]
}

```

Path: shared/interface/ApiResponseInterface.ts

```

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}


export interface ErrorResponse {
  message: string;
}
```

Path: shared/interface/ChatMessageInterface.d.ts

```
export interface IChatMessage {
    _id: string;
    senderName: string;
    receiverName: string;
    senderEmail: string;
    receiverEmail: string;
    message: string;
    timestamp: Date;
}
//# sourceMappingURL=ChatMessageInterface.d.ts.map
```

Path: shared/interface/ChatMessageInterface.ts

```
export interface IChatMessage {
  _id: string;
  senderName: string;
  receiverName: string;
  senderEmail: string;
  receiverEmail: string;
  message: string;
  timestamp: Date;
}

```

Path: shared/interface/CountryCodeInterface.ts

```
export interface CountryCode {
  country: string;
  code: string;
  iso: string;
}

```

Path: shared/interface/CreateProjectInterface.ts

```
import { IProjectForm } from "./ProjectFormInterface";


export type IProjectFormState = Omit<
  IProjectForm,
  "firstDateOfStreaming" | "projectDate"
> & {
  firstDateOfStreaming: string;
  projectDate: string;
};

export interface StepProps {
  formData: IProjectFormState;
  updateFormData: (fields: Partial<IProjectFormState>) => void;
  uniqueId: string | null;
}

export interface Step1Props {
  formData: Omit<IProjectFormState, "firstDateOfStreaming" | "projectDate"> & {
    firstDateOfStreaming: string;
    projectDate: string;
  };
  updateFormData: (
    fields: Partial<
      Omit<IProjectFormState, "firstDateOfStreaming" | "projectDate"> & {
        firstDateOfStreaming: string;
        projectDate: string;
      }
    >
  ) => void;
}

export interface Step2Props {
  formData: IProjectFormState;
  updateFormData: (fields: Partial<IProjectFormState>) => void;
  uniqueId: string | null;
}

export type Step2FormValues = {
  respondentsPerSession: number;
  numberOfSessions: number;
  sessionLength: number;
  preWorkDetails: string;
  selectedLanguage: string;
  languageSessionBreakdown: string;
  additionalInfo: string;
  inLanguageHosting?: "yes" | "no";
  recruitmentSpecs?: string;
  provideInterpreter?: "yes" | "no" | "";
};

export interface Step3Props {
  formData: IProjectFormState;
  updateFormData: (fields: Partial<IProjectFormState>) => void;
  uniqueId: string | null;
}

export interface Step4Props {
  formData: {
    name: string;
    service: string;
    respondentCountry: string;
    respondentLanguage: string | string[];
    sessions: Array<{ number: number; duration: string }>;
    description?: string;
    firstDateOfStreaming: string;
  };
  updateFormData: (fields: Partial<IProjectFormState>) => void;
  uniqueId: string | null;
}

export interface PaymentIntegrationProps {
  totalPurchasePrice: number;
  totalCreditsNeeded: number;
  projectData: IProjectFormState;
  uniqueId: string | null;
}

export interface BillingFormProps {
  onSuccess: () => void;
}

export interface CardSetupFormProps {
  onCardSaved: () => void;
}

```

Path: shared/interface/ErrorInterface.d.ts

```
export interface ICustomError extends Error {
    statusCode?: number;
    message: string;
    name: string;
    code?: number;
    keyValue?: any;
    path?: string;
}
//# sourceMappingURL=ErrorInterface.d.ts.map
```

Path: shared/interface/ErrorInterface.ts

```
// error.interface.ts
export interface ICustomError extends Error {
  statusCode?: number;
  message: string;
  name: string;
  code?: number;
  keyValue?: any;
  path?: string;
}

```

Path: shared/interface/FilterValuesInterface.ts

```
export interface FilterValues {
  startDate: string;
  endDate: string;
  status: string;
  role: string;
  tag: string;
}

```

Path: shared/interface/GroupMessageInterface.d.ts

```
export interface IGroupMessage {
    _id: string;
    meetingId: string;
    senderEmail: string;
    name: string;
    content: string;
    timestamp: Date;
}
//# sourceMappingURL=GroupMessageInterface.d.ts.map
```

Path: shared/interface/GroupMessageInterface.ts

```
export interface IGroupMessage {
  _id: string;
  meetingId: string;
  senderEmail: string;
  name: string;
  content: string;
  timestamp: Date;
}

```

Path: shared/interface/LiveSessionInterface.d.ts

```
export type UserRole = "Participant" | "Observer" | "Moderator" | "Admin";
export interface IWaitingUser {
    name: string;
    email: string;
    role: Extract<UserRole, "Participant" | "Moderator" | "Admin">;
    joinedAt: Date;
}
export interface IObserverWaitingUser {
    userId?: string;
    name: string;
    email: string;
    role: Extract<UserRole, "Observer" | "Moderator" | "Admin">;
    joinedAt: Date;
}
export interface IParticipant {
    name: string;
    email: string;
    role: Extract<UserRole, "Participant" | "Moderator" | "Admin">;
    joinedAt: Date;
}
export interface IObserver {
    userId?: string;
    name: string;
    email: string;
    role: Extract<UserRole, "Observer" | "Moderator" | "Admin">;
    joinedAt: Date;
}
export interface ILiveSession {
    _id: string;
    sessionId: string;
    ongoing: boolean;
    startTime?: Date;
    endTime?: Date;
    participantWaitingRoom: IWaitingUser[];
    observerWaitingRoom: IObserverWaitingUser[];
    participantsList: IParticipant[];
    observerList: IObserver[];
}
//# sourceMappingURL=LiveSessionInterface.d.ts.map
```

Path: shared/interface/LiveSessionInterface.ts

```
// shared/interfaces/LiveSessionInterface.ts

export type UserRole = "Participant" | "Observer" | "Moderator" | "Admin";

export interface IWaitingUser {
  name: string;
  email: string;
  role: Extract<UserRole, "Participant" | "Moderator"  | "Admin">;
  joinedAt: Date;
}

export interface IObserverWaitingUser {
  userId?: string;
  name: string;
  email: string;
  role: Extract<UserRole, "Observer" | "Moderator"  | "Admin">;
  joinedAt: Date;
}

export interface IParticipant {
  name: string;
  email: string;
  role: Extract<UserRole, "Participant" | "Moderator" | "Admin">;
  joinedAt: Date;
}

export interface IObserver {
  userId?: string;
  name: string;
  email: string;
  role: Extract<UserRole, "Observer" | "Moderator" | "Admin">;
  joinedAt: Date;
}

export interface ILiveSession {
  _id: string;
  sessionId: string; 
  ongoing: boolean; 
  startTime?: Date;
  endTime?: Date;
  participantWaitingRoom: IWaitingUser[];
  observerWaitingRoom: IObserverWaitingUser[];
  participantsList: IParticipant[];
  observerList: IObserver[];
  hlsPlaybackUrl: string | null;
  hlsEgressId: string | null;
  hlsPlaylistName: string | null;
  fileEgressId: string | null;
  startedBy: string;
  endedBy: string;
}

// export interface ILiveSession {
//   _id: string;
//   sessionId: string; // ref to ISession._id
//   ongoing: boolean; // toggled when moderator clicks “Start”
//   startTime?: Date;
//   endTime?: Date;
//   participantWaitingRoom: Array<{
//     name: string;
//     email: string;
//     role: "Participant" | "Moderator";
//     joinedAt: Date;
//   }>;
//   observerWaitingRoom: Array<{
//     userId?: string;
//     name: string;
//     email: string;
//     role: "Observer" | "Moderator";
//     joinedAt: Date;
//   }>;
//   participantsList: Array<{
//     name: string;
//     email: string;
//     role: "Participant" | "Moderator";
//     joinedAt: Date;
//   }>;
//   observerList: Array<{
//     userId?: string;
//     name: string;
//     email: string;
//     role: "Observer" | "Moderator";
//     joinedAt: Date;
//   }>;
//   // add any other runtime flags here (e.g. breakRooms, currentPollId, etc.)
// }

```

Path: shared/interface/ModeratorAddedEmailInterface.d.ts

```
export interface ModeratorAddedEmailParams {
    moderatorName: string;
    addedByName: string;
    projectName: string;
    loginUrl: string;
}
//# sourceMappingURL=ModeratorAddedEmailInterface.d.ts.map
```

Path: shared/interface/ModeratorAddedEmailInterface.ts

```

export interface ModeratorAddedEmailParams {
  moderatorName: string;
  addedByName: string;
  projectName: string;
  loginUrl: string;
  roles: string[]
}
```

Path: shared/interface/ModeratorInterface.d.ts

```
export type Role = "Admin" | "Moderator" | "Observer";
export interface IModerator {
    _id?: string;
    firstName: string;
    lastName: string;
    email: string;
    companyName: string;
    adminAccess: boolean;
    roles: Role[];
    projectId: string;
    isVerified: boolean;
    isActive: boolean;
}
//# sourceMappingURL=ModeratorInterface.d.ts.map
```

Path: shared/interface/ModeratorInterface.ts

```
export type Role = "Admin" | "Moderator" | "Observer";

export interface IModerator {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  adminAccess: boolean;
  roles: Role[];
  projectId: string;
  isVerified: boolean;
  isActive: boolean;
}
```

Path: shared/interface/ObserverDocumentInterface.d.ts

```
export interface IObserverDocument {
    _id: string;
    projectId: string;
    sessionId: string;
    displayName: string;
    size: number;
    storageKey: string;
    addedBy: string;
    addedByRole: "ADMIN" | "MODERATOR" | "OBSERVER";
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=ObserverDocumentInterface.d.ts.map
```

Path: shared/interface/ObserverDocumentInterface.ts

```
// shared/interfaces/IObserverDocument.ts
export interface IObserverDocument {
  _id: string;  
  projectId: string;  
  sessionId: string;  
  displayName: string;
  size: number;  
  storageKey: string;  
  addedBy: string;  
  addedByRole: "ADMIN" | "MODERATOR" | "OBSERVER";
  createdAt: Date;
  updatedAt: Date;
}

```

Path: shared/interface/ObserverGroupMessageInterface.d.ts

```
export interface IObserverGroupMessage {
    _id: string;
    meetingId: string;
    senderEmail: string;
    name: string;
    content: string;
    timestamp: Date;
}
//# sourceMappingURL=ObserverGroupMessageInterface.d.ts.map
```

Path: shared/interface/ObserverGroupMessageInterface.ts

```
export interface IObserverGroupMessage {
  _id: string;
  meetingId: string;
  senderEmail: string;
  name: string;
  content: string;
  timestamp: Date;
}

```

Path: shared/interface/PaginationInterface.ts

```
export interface IPaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
}
```

Path: shared/interface/PollInterface.d.ts

```
export type QuestionType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "MATCHING" | "RANK_ORDER" | "SHORT_ANSWER" | "LONG_ANSWER" | "FILL_IN_BLANK" | "RATING_SCALE";
export type BaseQuestion = {
    _id: string;
    type: QuestionType;
    prompt: string;
    required: boolean;
    image?: string;
};
export interface SingleChoiceQuestion extends BaseQuestion {
    type: "SINGLE_CHOICE";
    answers: string[];
    correctAnswer: number;
    showDropdown: boolean;
}
export interface MultipleChoiceQuestion extends BaseQuestion {
    type: "MULTIPLE_CHOICE";
    answers: string[];
    correctAnswers: number[];
}
export interface MatchingQuestion extends BaseQuestion {
    type: "MATCHING";
    options: string[];
    answers: string[];
}
export interface RankOrderQuestion extends BaseQuestion {
    type: "RANK_ORDER";
    rows: string[];
    columns: string[];
}
interface TextQuestionBase extends BaseQuestion {
    minChars?: number;
    maxChars?: number;
}
export interface ShortAnswerQuestion extends TextQuestionBase {
    type: "SHORT_ANSWER";
}
export interface LongAnswerQuestion extends TextQuestionBase {
    type: "LONG_ANSWER";
}
export interface FillInBlankQuestion extends BaseQuestion {
    type: "FILL_IN_BLANK";
    answers: string[];
}
export interface RatingScaleQuestion extends BaseQuestion {
    type: "RATING_SCALE";
    scoreFrom: number;
    scoreTo: number;
    lowLabel: string;
    highLabel: string;
}
export type PollQuestion = SingleChoiceQuestion | MultipleChoiceQuestion | MatchingQuestion | RankOrderQuestion | ShortAnswerQuestion | LongAnswerQuestion | FillInBlankQuestion | RatingScaleQuestion;
export interface IPoll {
    _id: string;
    projectId: string;
    sessionId?: string;
    title: string;
    questions: PollQuestion[];
    createdBy: string;
    createdByRole: "Admin" | "Moderator";
    lastModified: Date;
    responsesCount: number;
    isRun: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface DraftQuestion {
    id: string;
    prompt: string;
    type: QuestionType;
    options: string[];
    answers: string[];
    rows: string[];
    columns: string[];
    required: boolean;
    correctAnswer: number;
    showDropdown: boolean;
    correctAnswers: number[];
    scoreFrom: number;
    scoreTo: number;
    lowLabel: string;
    highLabel: string;
    minChars: number;
    maxChars: number;
}
export type CreatePollPayload = {
    projectId: string;
    sessionId?: string;
    title: string;
    questions: APIPollQuestion[];
    createdBy: string;
    createdByRole: string;
};
export type APIPollQuestion = (DraftQuestion & {}) | {
    id: string;
    prompt: string;
    required: boolean;
    type: "RANK_ORDER";
    rows: string[];
    columns: string[];
};
export {};
//# sourceMappingURL=PollInterface.d.ts.map
```

Path: shared/interface/PollInterface.ts

```
/* ──────────────────────────  Question unions  ────────────────────────── */

export type QuestionType =
  | "SINGLE_CHOICE"
  | "MULTIPLE_CHOICE"
  | "MATCHING"
  | "RANK_ORDER"
  | "SHORT_ANSWER"
  | "LONG_ANSWER"
  | "FILL_IN_BLANK"
  | "RATING_SCALE";

export type BaseQuestion = {
  _id: string; 
  type: QuestionType;
  prompt: string;
  required: boolean;
  image?: string; 
};

/* SINGLE_CHOICE */
export interface SingleChoiceQuestion extends BaseQuestion {
  type: "SINGLE_CHOICE";
  answers: string[];
  correctAnswer: number; 
  showDropdown: boolean;
}

/* MULTIPLE_CHOICE */
export interface MultipleChoiceQuestion extends BaseQuestion {
  type: "MULTIPLE_CHOICE";
  answers: string[];
  correctAnswers: number[];   
}

/* MATCHING */
export interface MatchingQuestion extends BaseQuestion {
  type: "MATCHING";
  options: string[];  
  answers: string[];  
}

/* RANK_ORDER */
export interface RankOrderQuestion extends BaseQuestion {
  type: "RANK_ORDER";
  rows: string[];
  columns: string[];
}

/* SHORT / LONG ANSWER */
interface TextQuestionBase extends BaseQuestion {
  minChars?: number;
  maxChars?: number;
}
export interface ShortAnswerQuestion extends TextQuestionBase {
  type: "SHORT_ANSWER";
}
export interface LongAnswerQuestion extends TextQuestionBase {
  type: "LONG_ANSWER";
}

/* FILL_IN_BLANK */
export interface FillInBlankQuestion extends BaseQuestion {
  type: "FILL_IN_BLANK";
  answers: string[];  
}

/* RATING_SCALE */
export interface RatingScaleQuestion extends BaseQuestion {
  type: "RATING_SCALE";
  scoreFrom: number;
  scoreTo: number;
  lowLabel: string;
  highLabel: string;
}

/* Union of all question shapes */
export type PollQuestion =
  | SingleChoiceQuestion
  | MultipleChoiceQuestion
  | MatchingQuestion
  | RankOrderQuestion
  | ShortAnswerQuestion
  | LongAnswerQuestion
  | FillInBlankQuestion
  | RatingScaleQuestion;

/* ──────────────────────────  Poll interface  ────────────────────────── */

export interface IPoll {
  _id: string;
  projectId: string;
  sessionId?: string; 
  title: string;
  questions: PollQuestion[];

  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdByRole: "Admin" | "Moderator";
  lastModified: Date;

  responsesCount: number;
  isRun: boolean;

  createdAt: Date;
  updatedAt: Date;
}


export interface DraftQuestion {
  id: string;
  prompt: string;
  type: QuestionType;
  options: string[];
  answers: string[];
  rows: string[];
  columns: string[];
  required: boolean;
  correctAnswer: number;
  showDropdown: boolean;
  correctAnswers: number[];
  scoreFrom: number;
  scoreTo: number;
  lowLabel: string;
  highLabel: string;
  minChars: number;
  maxChars: number;
}

export type CreatePollPayload = {
  projectId: string;
  sessionId?: string;
  title: string;
  questions: APIPollQuestion[];
  createdBy: string;
  createdByRole: string;
};

export type APIPollQuestion =
  | (DraftQuestion & {})
  | { id: string;
      prompt: string;
      required: boolean;
      type: "RANK_ORDER";
      rows: string[];
      columns: string[];
    };


```

Path: shared/interface/ProjectFormInterface.d.ts

```
import { IProjectSession } from "./ProjectInterface";
export type InLanguageHostingOption = "yes" | "no" | "";
export type ProvideInterpreterOption = "yes" | "no" | "";
export interface IProjectForm {
    user: string;
    name: string;
    service: string;
    addOns: string[];
    respondentCountry: string;
    respondentLanguage: string[];
    sessions: IProjectSession[];
    firstDateOfStreaming: Date;
    projectDate: Date;
    respondentsPerSession: number;
    numberOfSessions: number;
    sessionLength: string;
    recruitmentSpecs: string;
    preWorkDetails: string;
    selectedLanguage: string;
    inLanguageHosting: InLanguageHostingOption;
    provideInterpreter: ProvideInterpreterOption;
    languageSessionBreakdown: string;
    additionalInfo: string;
    emailSent: string;
    createdAt?: Date;
    updatedAt?: Date;
}
//# sourceMappingURL=ProjectFormInterface.d.ts.map
```

Path: shared/interface/ProjectFormInterface.ts

```
import { IProjectSession } from "./ProjectInterface";

export type InLanguageHostingOption = "yes" | "no" | "";
export type ProvideInterpreterOption = "yes" | "no" | "";

export interface IProjectForm {
  user: string;
  name: string;
  service: string;
  addOns: string[];
  respondentCountry: string;
  respondentLanguage: string[];
  sessions: IProjectSession[];
  firstDateOfStreaming: Date;
  projectDate: Date;
  respondentsPerSession: number;
  numberOfSessions: number;
  sessionLength: number;
  recruitmentSpecs: string;
  preWorkDetails: string;
  selectedLanguage: string;
  inLanguageHosting: InLanguageHostingOption;
  provideInterpreter: ProvideInterpreterOption;
  languageSessionBreakdown: string;
  additionalInfo: string;
  defaultTimeZone?:
    | "(UTC-05) Eastern Time"
    | "(UTC-06) Central Time"
    | "(UTC-07) Mountain Time"
    | "(UTC-08) Pacific Time"
    | "(UTC-09) Alaska Time"
    | "(UTC-10) Hawaii Time"
    | "(UTC-00) London Time"
    | "(UTC-01) Cape Verde"
    | "(UTC-02) Sandwich Islands"
    | "(UTC-03) Rio de Janeiro"
    | "(UTC-04) Buenos Aires"
    | "(UTC+01) Paris"
    | "(UTC+02) Athens"
    | "(UTC+03) Moscow"
    | "(UTC+04) Dubai"
    | "(UTC+05) Pakistan"
    | "(UTC+05.5) Delhi"
    | "(UTC+06) Bangladesh"
    | "(UTC+07) Bangkok"
    | "(UTC+08) Beijing"
    | "(UTC+09) Tokyo"
    | "(UTC+10) Sydney"
    | "(UTC+11) Solomon Islands"
    | "(UTC+12) Auckland";
  defaultBreakoutRoom?: boolean;
  emailSent: string;
  createdAt?: Date;
  updatedAt?: Date;
}

```

Path: shared/interface/ProjectInfoEmailInterface.d.ts

```
export interface TemplateParams {
    user: {
        firstName: string;
        lastName: string;
        email: string;
    };
    formData: any;
    formattedSessions: string;
}
export interface ProjectCreateAndPaymentConfirmationEmailTemplateParams {
    firstName: string;
    purchaseAmount: number;
    creditsPurchased: number;
    transactionDate: string;
    newCreditBalance: number;
}
//# sourceMappingURL=ProjectInfoEmailInterface.d.ts.map
```

Path: shared/interface/ProjectInfoEmailInterface.ts

```
export interface TemplateParams {
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  formData: any;
  formattedSessions: string;
}


export interface ProjectCreateAndPaymentConfirmationEmailTemplateParams {
  firstName: string;
  purchaseAmount: number;
  creditsPurchased: number;
  transactionDate: string;
  newCreditBalance: number;
}
```

Path: shared/interface/ProjectInterface.d.ts

```
import { IModerator } from "./ModeratorInterface";
import { ISession } from "./SessionInterface";
import { ITag } from "./TagInterface";
export interface IProjectSession {
    number: number;
    duration: string;
}
export type ProjectStatus = "Draft" | "Active" | "Inactive" | "Closed" | "Archived";
export type ProjectService = "Concierge" | "Signature";
export interface IProject {
    _id: string;
    name: string;
    internalProjectName: string;
    description: string;
    startDate: Date;
    status: ProjectStatus;
    createdBy: string;
    tags: ITag[];
    moderators: IModerator[];
    meetings: ISession[];
    projectPasscode?: string;
    cumulativeMinutes: number;
    service: ProjectService;
    respondentCountry: string;
    respondentLanguage: string;
    sessions: IProjectSession[];
    recordingAccess: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface SessionRow {
    id: string;
    number: number;
    duration: string;
}
//# sourceMappingURL=ProjectInterface.d.ts.map
```

Path: shared/interface/ProjectInterface.ts

```
// src/interfaces/project.interface.ts

import { IModerator } from "./ModeratorInterface";
import { ISession } from "./SessionInterface";
import { ITag } from "./TagInterface";

export interface IProjectSession {
  number: number;
  duration: string;
}

export type ProjectStatus =
  | "Draft"
  | "Active"
  | "Inactive"
  | "Closed"
  | "Archived";
export type ProjectService = "Concierge" | "Signature";

export interface IProject {
  _id: string;
  name: string;
  internalProjectName: string;
  description: string;
  startDate: Date;
  status: ProjectStatus;
  createdBy: string;
  tags: ITag[];
  moderators: IModerator[];
  meetings: ISession[];
  projectPasscode?: string;
  cumulativeMinutes: number;
  service: ProjectService;
  respondentCountry: string;
  respondentLanguage: string;
  sessions: IProjectSession[];
  recordingAccess: boolean;
  defaultTimeZone?:
    | "(UTC-05) Eastern Time"
    | "(UTC-06) Central Time"
    | "(UTC-07) Mountain Time"
    | "(UTC-08) Pacific Time"
    | "(UTC-09) Alaska Time"
    | "(UTC-10) Hawaii Time"
    | "(UTC-00) London Time"
    | "(UTC-01) Cape Verde"
    | "(UTC-02) Sandwich Islands"
    | "(UTC-03) Rio de Janeiro"
    | "(UTC-04) Buenos Aires"
    | "(UTC+01) Paris"
    | "(UTC+02) Athens"
    | "(UTC+03) Moscow"
    | "(UTC+04) Dubai"
    | "(UTC+05) Pakistan"
    | "(UTC+05.5) Delhi"
    | "(UTC+06) Bangladesh"
    | "(UTC+07) Bangkok"
    | "(UTC+08) Beijing"
    | "(UTC+09) Tokyo"
    | "(UTC+10) Sydney"
    | "(UTC+11) Solomon Islands"
    | "(UTC+12) Auckland";
  defaultBreakoutRoom?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SessionRow {
  id: string;
  number: number;
  duration: string;
}

```

Path: shared/interface/SearchPropsInterface.ts

```
interface SearchProps {
  placeholder?: string;
  onSearch: (value: string) => void;
  inputClassName?: string;
  iconClassName?: string;
}

```

Path: shared/interface/SendEmailInterface.d.ts

```
export interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
}
//# sourceMappingURL=SendEmailInterface.d.ts.map
```

Path: shared/interface/SendEmailInterface.ts

```
export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}
```

Path: shared/interface/SessionDeliverableInterface.d.ts

```
export type DeliverableType = "AUDIO" | "VIDEO" | "TRANSCRIPT" | "BACKROOM_CHAT" | "SESSION_CHAT" | "WHITEBOARD" | "POLL_RESULT";
export interface ISessionDeliverable {
    _id: string;
    sessionId: string;
    projectId: string;
    type: DeliverableType;
    displayName: string;
    size: number;
    storageKey: string;
    uploadedBy: string;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=SessionDeliverableInterface.d.ts.map
```

Path: shared/interface/SessionDeliverableInterface.ts

```
export type DeliverableType =
  | "AUDIO"
  | "VIDEO"
  | "TRANSCRIPT"
  | "BACKROOM_CHAT"
  | "SESSION_CHAT"
  | "WHITEBOARD"
  | "POLL_RESULT";

export interface ISessionDeliverable {
  _id: string; 
  sessionId: string;  
  projectId: string;   
  type: DeliverableType;
  displayName: string;  
  size: number; 
  storageKey: string;
  uploadedBy: string; 
  createdAt: Date;
  updatedAt: Date;
}

```

Path: shared/interface/SessionInterface.d.ts

```
export interface ISession {
    _id: string;
    title: string;
    projectId: string;
    date: Date;
    startTime: string;
    duration: number;
    moderators: string[];
    timeZone: string;
    breakoutRoom: boolean;
}
//# sourceMappingURL=SessionInterface.d.ts.map
```

Path: shared/interface/SessionInterface.ts

```
export interface ISession {
  _id: string;
  title: string;
  projectId: string;
  date: Date;
  startTime: string;
  duration: number;
  moderators: string[];
  timeZone: string;
  startAtEpoch: number;
  endAtEpoch: number;
  breakoutRoom: boolean;
}

```

Path: shared/interface/TagInterface.d.ts

```
/**
 * A plain-TS interface (no Mongoose stuff) that you can also reuse
 * on the frontend through your `shared/` folder if you like.
 */
export interface ITag {
    _id: string;
    title: string;
    color: string;
    createdBy: string;
    projectId: string;
}
//# sourceMappingURL=TagInterface.d.ts.map
```

Path: shared/interface/TagInterface.ts

```
/**
 * A plain-TS interface (no Mongoose stuff) that you can also reuse
 * on the frontend through your `shared/` folder if you like.
 */
export interface ITag {
  _id: string;
  title: string;
  color: string;             
  createdBy: string;
  projectId: string;
}

```

Path: shared/interface/UserActivityInterface.d.ts

```
export interface IUserActivity {
    _id: string;
    sessionId: string;
    userId?: string;
    role: 'Participant' | 'Observer' | 'Moderator' | 'Admin';
    joinTime: Date;
    leaveTime?: Date;
    deviceInfo?: {
        ip: string;
        deviceType: string;
        platform: string;
        browser: string;
        location: string;
    };
}
//# sourceMappingURL=UserActivityInterface.d.ts.map
```

Path: shared/interface/UserActivityInterface.ts

```
// shared/interfaces/UserActivityInterface.ts
export interface IUserActivity {
  _id: string;
  sessionId: string;     // ref to LiveSession._id
  userId?: string;
  role: 'Participant' | 'Observer' | 'Moderator' | 'Admin';
  joinTime: Date;
  leaveTime?: Date;
  deviceInfo?: {
    ip: string;
    deviceType: string;
    platform: string;
    browser: string;
    location: string;
  };
}

```

Path: shared/interface/UserInterface.d.ts

```
export interface IBillingInfo {
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
}
export interface ICreditCardInfo {
    last4: string;
    brand: string;
    expiryMonth: string;
    expiryYear: string;
}
export interface IUser {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    companyName: string;
    password: string;
    role: 'Admin' | 'Moderator' | 'Observer' | 'Participant' | 'AmplifyAdmin' | 'AmplifyModerator' | 'AmplifyObserver' | 'AmplifyParticipant' | 'AmplifyTechHost';
    status: string;
    isEmailVerified: boolean;
    termsAccepted: boolean;
    termsAcceptedTime: Date;
    isDeleted: boolean;
    createdBy?: string;
    createdById?: string;
    credits: number;
    stripeCustomerId?: string;
    billingInfo?: IBillingInfo;
    creditCardInfo?: ICreditCardInfo;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface EditUser {
    firstName: string;
    lastName: string;
    email: string;
    role?: string;
    [key: string]: any;
}
//# sourceMappingURL=UserInterface.d.ts.map
```

Path: shared/interface/UserInterface.ts

```
export interface IBillingInfo {
  address: string
  city: string
  state: string
  country: string
  postalCode: string
}

export interface ICreditCardInfo {
  last4: string
  brand: string
  expiryMonth: string
  expiryYear: string
}

export interface IUser {

  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  companyName: string;
  password: string;
  role:
    | 'Admin'
    | 'Moderator'
    | 'Observer'
    | 'Participant'
    | 'AmplifyAdmin'
    | 'AmplifyModerator'
    | 'AmplifyObserver'
    | 'AmplifyParticipant'
    | 'AmplifyTechHost'
  status: string
  isEmailVerified: boolean
  termsAccepted: boolean
  termsAcceptedTime: Date
  isDeleted: boolean
  createdBy?: string
  createdById?: string
  credits: number
  stripeCustomerId?: string
  billingInfo?: IBillingInfo
  creditCardInfo?: ICreditCardInfo
  createdAt?: Date
  updatedAt?: Date
}

export interface EditUser {
  firstName: string
  lastName: string
  phoneNumber: string
  companyName: string
  role?: string
  [key: string]: any
}

```

Path: shared/interface/WaitingRoomChatInterface.d.ts

```
export interface IWaitingRoomChat {
    _id: string;
    sessionId: string;
    email: string;
    senderName: string;
    role: 'Participant' | 'Observer' | 'Moderator';
    content: string;
    timestamp: Date;
}
//# sourceMappingURL=WaitingRoomChatInterface.d.ts.map
```

Path: shared/interface/WaitingRoomChatInterface.ts

```
// shared/interfaces/WaitingRoomChatInterface.ts
export interface IWaitingRoomChat {
  _id: string;
  sessionId: string; 
  email: string;
  senderName: string;
  role: 'Participant' | 'Observer' | 'Moderator';
  content: string;
  timestamp: Date;
}

```

Path: shared/utils/ErrorHandler.d.ts

```
declare class ErrorHandler extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number);
}
export default ErrorHandler;
//# sourceMappingURL=ErrorHandler.d.ts.map
```

Path: shared/utils/ErrorHandler.ts

```
class ErrorHandler extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    (Error as any).captureStackTrace(this, this.constructor);
  }
}

export default ErrorHandler;

```


# Epic: Live Meetings + Observers + Whiteboard + Polls

Link to PRs: …
Owner: …
Target release: …

## Milestone 1 — Live skeleton & waiting room
- [ ] Backend: Wire existing routes  
  - [ ] POST `/api/v1/liveSessions/:sessionId/start` → `startLiveSession` (mod/admin only)  
  - [ ] POST `/api/v1/liveSessions/:sessionId/end` → `endLiveSession`  
  - [ ] POST `/api/v1/livekit/token` → `getLivekitToken` (reuse)  
  - [ ] GET  `/api/v1/livekit/:sessionId/hls` → `getObserverHls` (reuse)
- [ ] Socket hub bootstrap with namespace and auth
- [ ] Models: `JoinLink`, `WaitingRoomEntry`
- [ ] UI: participant join page → waiting room
- [ ] UI: moderator waiting panel (admit / remove / admit-all)
- [ ] QA: happy path join/admit/remove; 20 concurrent users

## Milestone 2 — Meeting controls & permissions
- [ ] LiveKit connect on admit (start cam/mic **off**)
- [ ] Mute/unmute (server can mute; cannot force unmute)
- [ ] Disable/enable camera (server can disable; cannot force enable)
- [ ] Screen share: request/allow/revoke; allow for ALL toggle
- [ ] Model: `ScreenShareGrant`
- [ ] QA: revoke when sharing; client auto-stops

## Milestone 3 — HLS streaming & observers
- [ ] Start/Stop HLS egress on moderator command
- [ ] Persist `hlsPlaybackUrl` to `LiveSessionModel`
- [ ] Observer join (dashboard + link/password)
- [ ] Observer waiting room + streaming page (no cam/mic prompts)
- [ ] QA: observer can switch to live stream when started

## Milestone 4 — Chat (group + DM) across scopes
- [ ] Socket events: group & 1:1 (only with Moderator)
- [ ] Models: `ChatMessage`
- [ ] Scopes: waiting / main / breakout / observer
- [ ] UI surfaces for each scope
- [ ] QA: transcripts persist with timestamps

## Milestone 5 — Whiteboard
- [ ] Reuse whiteboard open/close/history endpoints
- [ ] Models: `WhiteboardSession`, `WhiteboardStroke`, `WhiteboardSnapshot`
- [ ] Socket: `wb:state`, `wb:stroke`, `wb:clear`, snapshot save
- [ ] UI: overlay hydration + snapshot download/upload to S3
- [ ] QA: latency & replay from history

## Milestone 6 — Breakouts
- [ ] Create N breakouts with timer; join/assign/move back
- [ ] Auto start recording + HLS for each breakout
- [ ] Model: `BreakoutRoom`
- [ ] Observer: switch stream between Main/Breakouts
- [ ] QA: timer brings everyone back; close room manually

## Milestone 7 — Polls
- [ ] Reuse Poll CRUD; add `launch` & `submit`
- [ ] Model: `PollResponse`
- [ ] Moderator: live response counts + per-response view
- [ ] Participant: modal auto-shows on launch
- [ ] QA: edge cases (duplicates, late submit, reconnect)

## Milestone 8 — Media hub
- [ ] Reuse Observer Document APIs in streaming page (upload/download/delete, pagination)
- [ ] Permissions: Admin/Moderator/Observer only
- [ ] QA: file appears in dashboard’s Observable Documents

## Milestone 9 — Reporting & credits
- [ ] Models: `Presence`, `LiveUsageLog`
- [ ] LiveKit webhooks → presence (join/leave, room type), usage, egress
- [ ] Report API: `/api/reports/session/:sessionId`
- [ ] Export CSV/JSON
- [ ] Credits calculation finalized and persisted

## Milestone 10 — Hardening
- [ ] AuthZ on all socket events; role checks
- [ ] Rate limits; retries; idempotency on admits/removes
- [ ] Index review for all new collections
- [ ] Load test: 100 concurrent participants + 50 observers
