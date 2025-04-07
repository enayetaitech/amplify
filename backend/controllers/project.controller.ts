import { Request, Response, NextFunction } from "express";
import { sendResponse } from "../utils/responseHelpers";
import ProjectFormModel, { IProjectFormDocument } from "../model/ProjectFormModel";
import User from "../model/UserModel";
import ErrorHandler from "../../shared/utils/ErrorHandler";
import ProjectModel, { IProjectDocument } from "../model/ProjectModel";
import mongoose from "mongoose";


export const saveProgress = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void>  => {
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
  const { userId, uniqueId, projectData } = req.body;

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
    const createdProject = await ProjectModel.create(
      [{ ...projectData, createdBy: userId }],
      { session }
    );

    // Delete draft if uniqueId exists
    if (uniqueId) {
      await ProjectModel.findByIdAndDelete(uniqueId).session(session);
    }

    await session.commitTransaction();
    session.endSession();

    // Populate tags outside the transaction (optional)
    const populatedProject = await ProjectModel.findById(createdProject[0]._id).populate("tags");

    sendResponse(res, populatedProject, "Project created successfully", 201);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};