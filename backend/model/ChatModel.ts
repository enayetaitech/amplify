import mongoose, { Document, Schema, Model } from "mongoose";
import { IChatMessage } from "../../shared/interface/ChatMessageInterface";

interface IChatMessageDoc
  extends Omit<IChatMessage, "_id">,
    Document {}

const ChatMessageSchema = new Schema<IChatMessageDoc>(
  {
    senderName:   { type: String, required: true },
    receiverName: { type: String, required: true },
    senderEmail:  { type: String, required: true },
    receiverEmail:{ type: String, required: true },
    message:      { type: String, required: true },
  },
  {
    timestamps: { createdAt: "timestamp", updatedAt: false },
  }
);

export const ChatMessageModel: Model<IChatMessageDoc> =
  mongoose.model<IChatMessageDoc>("ChatMessage", ChatMessageSchema);

export default ChatMessageModel;
