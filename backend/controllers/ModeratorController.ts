import { Request, Response, NextFunction } from "express";
import ModeratorModel from "../model/ModeratorModel";
import { sendResponse } from "../utils/ResponseHelpers"
import ErrorHandler from "../../shared/utils/ErrorHandler"
import ProjectModel from "../model/ProjectModel";
import User from "../model/UserModel";
import { moderatorAddedEmailTemplate } from "../constants/EmailTemplates";
import config from "../config";
import { sendEmail } from "../processors/sendEmail/SendVerifyAccountEmailProcessor";


export const addModerator = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { firstName, lastName, email, companyName, adminAccess, projectId } = req.body;

  // Validate required fields
  if (!firstName || !lastName || !email || !companyName || !projectId) {
    return next(
      new ErrorHandler("firstName, lastName, email, companyName, and projectId are required", 400)
    );
  }

   // **New**: Prevent duplicate moderator on same project
  const alreadyModerator = await ModeratorModel.findOne({ email, projectId });
  if (alreadyModerator) {
    return next(
      new ErrorHandler(
        "A moderator with the same email is already assigned to this project",
        409
      )
    );
  }

  // 1. Fetch the project (no populate here)
const project = await ProjectModel.findById(projectId);
if (!project) {
  return next(new ErrorHandler("Project not found", 404));
}

// 2. Lookup the creator user by ID
const creator = await User.findById(project.createdBy);
if (!creator) {
  return next(new ErrorHandler("Project owner not found", 500));
}


const addedByName = `${creator.firstName} ${creator.lastName}`;

    // Create new moderator document.
    const moderator = new ModeratorModel({
      firstName,
      lastName,
      email,
      companyName,
      adminAccess: adminAccess || false, 
      projectId,
    });

    await moderator.save();

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

    // Send the success response.
    sendResponse(res, moderator, "Moderator added successfully", 201);
 
};
