// backend/models/LiveSessionModel.ts
import mongoose, { Document, Schema, Model, Types } from "mongoose";
import { ILiveSession } from "../../shared/interface/LiveSessionInterface";

interface ILiveSessionDocument extends Omit<ILiveSession,'_id'| "sessionId">, Document {sessionId: Types.ObjectId;}


const WaitingRoomParticipantSchema = new Schema<
  ILiveSessionDocument["participantWaitingRoom"][0]
>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, enum: ["Participant", "Moderator"], required: true },
  joinedAt: { type: Date, required: true, default: () => new Date() },
});
const WaitingRoomObserverSchema = new Schema<
  ILiveSessionDocument["observerWaitingRoom"][0]
>({
  userId:     { type: Schema.Types.ObjectId, ref: "User", required: false },
  name: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, enum: ["Observer", "Moderator"], required: true },
  joinedAt: { type: Date, required: true, default: () => new Date() },
});

const ParticipantSchema = new Schema<
  ILiveSessionDocument["participantsList"][0]
>({
  email:   { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ["Participant", "Moderator"], required: true },
  joinedAt: { type: Date, required: true, default: () => new Date() },
});

const ObserverSchema = new Schema<
  ILiveSessionDocument["observerList"][0]
>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: false  },
  name: { type: String, required: true },
  email:   { type: String, required: true },
  role: { type: String, enum: ["Observer", "Moderator"], required: true },
  joinedAt: { type: Date, required: true, default: () => new Date() },
});

const LiveSessionSchema = new Schema<ILiveSessionDocument>(
  {
    sessionId: {  type: Schema.Types.ObjectId, ref: "Session", required: true },
    ongoing: { type: Boolean, default: false },
    startTime: { type: Date },
    endTime: { type: Date },
    participantWaitingRoom: { type: [WaitingRoomParticipantSchema], default: [] },
    observerWaitingRoom: { type: [WaitingRoomObserverSchema], default: [] },
    participantsList: { type: [ParticipantSchema], default: [] },
    observerList: { type: [ObserverSchema], default: [] },
    // add other flags or subdocuments here
  },
  {
    timestamps: true, 
  }
);

export const LiveSessionModel: Model<ILiveSessionDocument> =
  mongoose.model<ILiveSessionDocument>("LiveSession", LiveSessionSchema);
