import mongoose, { Document, Schema, Model, Types } from "mongoose";
// Using a local document interface to avoid cross-package type mismatches

export interface IGroupMessageDoc extends Document {
  sessionId: Types.ObjectId;
  senderEmail: string;
  name: string;
  content: string;
  scope: string;
  timestamp: Date;
}

const GroupMessageSchema = new Schema<IGroupMessageDoc>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "LiveSession",
      required: true,
    },
    senderEmail: { type: String, required: true },
    name: { type: String, required: true },
    content: { type: String, required: true },
    scope: { type: String, required: true },
  },
  {
    timestamps: { createdAt: "timestamp", updatedAt: false },
  }
);

GroupMessageSchema.index({ sessionId: 1, scope: 1, timestamp: 1 });

export const GroupMessageModel: Model<IGroupMessageDoc> =
  mongoose.model<IGroupMessageDoc>("GroupMessage", GroupMessageSchema);

export default GroupMessageModel;
