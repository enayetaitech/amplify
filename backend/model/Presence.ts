// backend/model/Presence.ts
import { Schema, model, Document, Types } from "mongoose";

export interface PresenceDoc extends Document<Types.ObjectId> {
  sessionId: Types.ObjectId;
  projectId: Types.ObjectId;
  role: "Admin" | "Moderator" | "Participant" | "Observer";
  userId?: Types.ObjectId;
  name?: string;
  email?: string;
  device?: { os?: string; browser?: string };
  ip?: string;
  geo?: { country?: string; city?: string; lat?: number; lon?: number };
  roomType: "main" | "breakout";
  breakoutIndex?: number;
  joinedAt: Date;
  leftAt?: Date;
}

const PresenceSchema = new Schema<PresenceDoc>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    role: {
      type: String,
      enum: ["Admin", "Moderator", "Participant", "Observer"],
      required: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    name: String,
    email: String,
    device: { os: String, browser: String },
    ip: String,
    geo: { country: String, city: String, lat: Number, lon: Number },
    roomType: { type: String, enum: ["main", "breakout"], required: true },
    breakoutIndex: Number,
    joinedAt: { type: Date, default: () => new Date() },
    leftAt: Date,
  },
  { timestamps: true }
);
PresenceSchema.index({ sessionId: 1, role: 1, roomType: 1 });
PresenceSchema.index({ sessionId: 1, joinedAt: -1 });
// Additional indexes for reporting aggregations
PresenceSchema.index({ projectId: 1, role: 1 });
PresenceSchema.index({ sessionId: 1, role: 1 });
PresenceSchema.index({ projectId: 1, joinedAt: -1 });

export default model<PresenceDoc>("Presence", PresenceSchema);
