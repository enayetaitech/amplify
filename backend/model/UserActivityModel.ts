// backend/models/UserActivityModel.ts
import mongoose, { Document, Schema, Model, Types } from "mongoose";
import { IUserActivity } from "../../shared/interface/UserActivityInterface";

interface IUserActivityDocument extends Omit<IUserActivity, "_id"| "sessionId" | "userId">, Document {sessionId: Types.ObjectId, userId: Types.ObjectId}

const DeviceInfoSchema = new Schema<IUserActivityDocument["deviceInfo"]>(
  {
    ip: { type: String },
    deviceType: { type: String },
    platform: { type: String },
    browser: { type: String },
    location: { type: String },
  },
  { _id: false }
);

const UserActivitySchema = new Schema<IUserActivityDocument>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "LiveSession", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: false },
    role: { type: String, enum: ["Participant", "Observer", "Moderator", "Admin"], required: true },
    joinTime: { type: Date, default: () => new Date(), required: true },
    leaveTime: { type: Date },
    deviceInfo: { type: DeviceInfoSchema },
  },
  {
    timestamps: false,
  }
);

export const UserActivityModel: Model<IUserActivityDocument> =
  mongoose.model<IUserActivityDocument>("UserActivity", UserActivitySchema);
