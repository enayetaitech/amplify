import { Request, Response, NextFunction } from "express";
import { sendResponse } from "../utils/responseHelpers";
import ErrorHandler from "../../shared/utils/ErrorHandler";

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
