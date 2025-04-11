import { Request, Response, NextFunction } from "express";
import ModeratorModel from "../model/ModeratorModel";
import { sendResponse } from "../utils/ResponseHelpers"
import ErrorHandler from "../../shared/utils/ErrorHandler"
import ProjectModel from "../model/ProjectModel";


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

  // Check if a project with the given projectId exists
  const projectExists = await ProjectModel.findById(projectId);
  if (!projectExists) {
    return next(new ErrorHandler("Project not found", 404));
  }

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

    // Send the success response.
    sendResponse(res, moderator, "Moderator added successfully", 201);
 
};
