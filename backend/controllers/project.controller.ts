import { Request, Response, NextFunction } from "express";
import { sendResponse } from "../utils/responseHelpers";
import ProjectFormModel, { IProjectFormDocument } from "../model/ProjectFormModel";
import User from "../model/UserModel";
import ErrorHandler from "../../shared/utils/ErrorHandler";
import ProjectModel, { IProjectDocument } from "../model/ProjectModel";
import mongoose from "mongoose";
import { projectCreateAndPaymentConfirmationEmailTemplate, projectInfoEmailTemplate } from "../constants/emailTemplates";
import { sendEmail } from "../processors/sendEmail/sendVerifyAccountEmailProcessor";
import { ProjectCreateAndPaymentConfirmationEmailTemplateParams } from "../../shared/interface/projectInfoEmail.interface";


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
  const { userId, uniqueId, projectData, 
    totalPurchasePrice,
    totalCreditsNeeded, } = req.body;

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
    const emailParams: ProjectCreateAndPaymentConfirmationEmailTemplateParams = {
      firstName: user.firstName || "Customer",
      purchaseAmount,
      creditsPurchased,
      transactionDate,
      newCreditBalance,
    };

    // Build the email content using the separate template function
    const emailContent = projectCreateAndPaymentConfirmationEmailTemplate(emailParams);
    const emailSubject = "Success! Your Project Has Been Created for Amplify’s Virtual Backroom";

    // Send the email using your email processor function
    await sendEmail({
      to: user.email,
      subject: emailSubject,
      html: emailContent,
    });


    sendResponse(res, createdProject, "Project created successfully", 201);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const emailProjectInfo = 
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
      `<p>Session ${index + 1}: ${session.number} sessions - Duration: ${session.duration}</p>`
  )
  .join("");

// Build HTML email template
const emailContent = projectInfoEmailTemplate({ user, formData, formattedSessions });

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
}

