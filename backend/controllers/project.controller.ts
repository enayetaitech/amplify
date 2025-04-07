import { Request, Response, NextFunction } from "express";
import { sendResponse } from "../utils/responseHelpers";
import ProjectFormModel, { IProjectFormDocument } from "../model/ProjectFormModel";


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
