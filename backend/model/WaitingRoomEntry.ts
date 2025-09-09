// backend/model/WaitingRoomEntry.ts
import { Schema, model, Document, Types } from "mongoose";

export interface WaitingRoomEntryDoc extends Document<Types.ObjectId> {
  sessionId: Types.ObjectId;
  name: string;
  email: string;
  userId?: Types.ObjectId;
  ip?: string;
  ua?: string;
  status: "waiting" | "admitted" | "removed" | "left";
  removedReason?: string;
  joinedAt: Date;
}

const WaitingRoomEntrySchema = new Schema<WaitingRoomEntryDoc>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    ip: String,
    ua: String,
    status: { type: String, enum: ["waiting", "admitted", "removed", "left"], default: "waiting" },
    removedReason: String,
    joinedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);
WaitingRoomEntrySchema.index({ sessionId: 1, status: 1, joinedAt: -1 });

export default model<WaitingRoomEntryDoc>("WaitingRoomEntry", WaitingRoomEntrySchema);

