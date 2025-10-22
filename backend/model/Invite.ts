import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type InviteStatus =
  | "Pending"
  | "Delivered"
  | "Bounced"
  | "Accepted"
  | "Revoked";

export interface InviteDoc extends Document<Types.ObjectId> {
  userId?: Types.ObjectId;
  email: string;
  role: string;
  companyName?: string;
  token: string;
  expiresAt: Date;
  status: InviteStatus;
  lastSentAt?: Date;
  sendCount: number;
  createdBy: Types.ObjectId;
}

const InviteSchema = new Schema<InviteDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    email: { type: String, required: true, index: true },
    role: { type: String, required: true },
    companyName: { type: String },
    token: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ["Pending", "Delivered", "Bounced", "Accepted", "Revoked"],
      default: "Pending",
    },
    lastSentAt: { type: Date },
    sendCount: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

InviteSchema.index({ email: 1, status: 1 });

export const InviteModel: Model<InviteDoc> = mongoose.model<InviteDoc>(
  "Invite",
  InviteSchema
);
