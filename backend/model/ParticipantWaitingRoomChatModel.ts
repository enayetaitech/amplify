// backend/models/WaitingRoomChatModel.ts
import mongoose, { Document, Schema, Model, Types } from "mongoose";
import {
  IWaitingRoomChat,
  ChatScope,
} from "../../shared/interface/WaitingRoomChatInterface";

export interface IParticipantWaitingRoomChatDocument
  extends Omit<IWaitingRoomChat, "sessionId" | "_id">,
    Document {
  sessionId: Types.ObjectId;
}

const ParticipantWaitingRoomChatSchema =
  new Schema<IParticipantWaitingRoomChatDocument>(
    {
      sessionId: {
        type: Schema.Types.ObjectId,
        ref: "LiveSession",
        required: true,
      },
      email: { type: String, required: true },
      senderName: { type: String, required: true },
      role: {
        type: String,
        enum: ["Participant", "Observer", "Moderator"],
        required: true,
      },
      content: { type: String, required: true },
      timestamp: { type: Date, default: () => new Date() },
      scope: { type: String, required: true },
      toEmail: { type: String, required: false },
    },
    {
      timestamps: false,
    }
  );

ParticipantWaitingRoomChatSchema.index({
  sessionId: 1,
  scope: 1,
  timestamp: 1,
});
ParticipantWaitingRoomChatSchema.index({
  sessionId: 1,
  scope: 1,
  email: 1,
  toEmail: 1,
  timestamp: 1,
});

export const ParticipantWaitingRoomChatModel: Model<IParticipantWaitingRoomChatDocument> =
  mongoose.model<IParticipantWaitingRoomChatDocument>(
    "ParticipantWaitingRoomChat",
    ParticipantWaitingRoomChatSchema
  );
