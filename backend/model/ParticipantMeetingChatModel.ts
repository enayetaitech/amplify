import mongoose, { Schema, Document, Types } from "mongoose";
import { IWaitingRoomChat } from "../../shared/interface/WaitingRoomChatInterface";


export interface ParticipantMeetingChatDocument extends Omit<IWaitingRoomChat,"sessionId" | "_id">, Document {sessionId: Types.ObjectId;}

const ParticipantMeetingChatSchema = new Schema<ParticipantMeetingChatDocument>({
   sessionId: { type: Schema.Types.ObjectId, ref: "LiveSession", required: true },
   email:   { type: String, required: true },
  senderName:    { type: String, required: true },
 role: { type: String, enum: ["Participant", "Observer", "Moderator"], required: true },
    content: { type: String, required: true },
  timestamp:     { type: Date,   required: true },
});

export const ParticipantMeetingChatModel = mongoose.model<
  ParticipantMeetingChatDocument
>("ParticipantMeetingChat", ParticipantMeetingChatSchema);
