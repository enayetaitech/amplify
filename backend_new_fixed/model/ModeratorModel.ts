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
