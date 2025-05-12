import mongoose, { Document, Schema, Model, Types } from "mongoose";
import { IWaitingRoomChat } from "../../shared/interface/WaitingRoomChatInterface";

interface IObserverWaitingRoomChatDocument
  extends Omit<IWaitingRoomChat, "sessionId" | "_id">,
    Document {
  sessionId: Types.ObjectId;
}

const ObserverWaitingRoomChatSchema = new Schema<IObserverWaitingRoomChatDocument>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "LiveSession", required: true },
    email: { type: String, required: true },
    senderName: { type: String, required: true },
    role: {
      type: String,
      enum: ["Participant", "Observer", "Moderator"],
      required: true,
    },
    content: { type: String, required: true },
    timestamp: { type: Date, default: () => new Date() },
  },
  { timestamps: false }
);

export const ObserverWaitingRoomChatModel: Model<IObserverWaitingRoomChatDocument> =
  mongoose.model<IObserverWaitingRoomChatDocument>(
    "ObserverWaitingRoomChat",
    ObserverWaitingRoomChatSchema
  );
