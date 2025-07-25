
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
