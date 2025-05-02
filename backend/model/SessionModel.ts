// backend/models/SessionModel.ts
import { Schema, model, Document, Types } from "mongoose";
import { ISession } from "../../shared/interface/SessionInterface";

// Omit the '_id', 'projectId', and 'moderators' from ISession,
// then re-add them with ObjectId typings
export interface ISessionDocument
  extends Omit<ISession, "_id" | "projectId" | "moderators">,
          Document {
  projectId: Types.ObjectId;
  moderators: Types.ObjectId[];
}

const SessionSchema = new Schema<ISessionDocument>(
  {
    title: { type: String, required: true, trim: true },
    projectId: { type: Types.ObjectId, ref: "Project", required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    duration: { type: Number, required: true, min: 30 },
    moderators: [
      { type: Types.ObjectId, ref: "Moderator", required: true }
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
