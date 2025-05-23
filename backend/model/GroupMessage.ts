import mongoose, { Document, Schema, Model } from "mongoose";
import { IGroupMessage } from "../../shared/interface/GroupMessageInterface";

export interface IGroupMessageDoc
  extends Omit<IGroupMessage, "_id">,
    Document {}

const GroupMessageSchema = new Schema<IGroupMessageDoc>(
  {
    meetingId:   { type: String, required: true },
    senderEmail: { type: String, required: true },
    name:        { type: String, required: true },
    content:     { type: String, required: true },
  },
  {
    timestamps: { createdAt: "timestamp", updatedAt: false },
  }
);

export const GroupMessageModel: Model<IGroupMessageDoc> =
  mongoose.model<IGroupMessageDoc>("GroupMessage", GroupMessageSchema);

export default GroupMessageModel;
