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
