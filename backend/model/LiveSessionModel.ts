// backend/models/LiveSessionModel.ts
import mongoose, { Document, Schema, Model, Types } from "mongoose";
import { ILiveSession } from "../../shared/interface/LiveSessionInterface";

export interface ILiveSessionDocument
  extends Omit<ILiveSession, "_id" | "sessionId" | "startedBy" | "endedBy">,
    Document {
  sessionId: Types.ObjectId;
  startedBy: Types.ObjectId;
  endedBy: Types.ObjectId;
}

const WaitingRoomParticipantSchema = new Schema<
  ILiveSessionDocument["participantWaitingRoom"][0]
>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  role: {
    type: String,
    enum: ["Participant", "Moderator", "Admin"],
    required: true,
  },
  joinedAt: { type: Date, required: true, default: () => new Date() },
});
const WaitingRoomObserverSchema = new Schema<
  ILiveSessionDocument["observerWaitingRoom"][0]
>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: false },
  name: { type: String, required: true },
  email: { type: String, required: true },
  role: {
    type: String,
    enum: ["Observer", "Moderator", "Admin"],
    required: true,
  },
  joinedAt: { type: Date, required: true, default: () => new Date() },
});

const ParticipantSchema = new Schema<
  ILiveSessionDocument["participantsList"][0]
>({
  email: { type: String, required: true },
  name: { type: String, required: true },
  role: {
    type: String,
    enum: ["Participant", "Moderator", "Admin"],
    required: true,
  },
  joinedAt: { type: Date, required: true, default: () => new Date() },
});

const ObserverSchema = new Schema<ILiveSessionDocument["observerList"][0]>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: false },
  name: { type: String, required: true },
  email: { type: String, required: true },
  role: {
    type: String,
    enum: ["Observer", "Moderator", "Admin"],
    required: true,
  },
});

const LiveSessionSchema = new Schema<ILiveSessionDocument>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true },
    ongoing: { type: Boolean, default: false },
    startTime: { type: Date },
    endTime: { type: Date },
    participantWaitingRoom: {
      type: [WaitingRoomParticipantSchema],
      default: [],
    },
    streaming: { type: Boolean, default: false },
    hlsStartedAt: { type: Date, default: null },
    hlsStoppedAt: { type: Date, default: null },
    observerWaitingRoom: { type: [WaitingRoomObserverSchema], default: [] },
    participantsList: { type: [ParticipantSchema], default: [] },
    observerList: { type: [ObserverSchema], default: [] },
    participantHistory: {
      type: [
        new Schema(
          {
            id: { type: Schema.Types.ObjectId },
            name: { type: String, required: true },
            email: { type: String, required: true },
            joinedAt: { type: Date, required: false, default: null },
            leaveAt: { type: Date, required: false, default: null },
            reason: {
              type: String,
              enum: [
                "Left",
                "Meeting Ended",
                "Removed by the moderator",
                "Transferred to waiting room",
              ],
              required: true,
            },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    observerHistory: {
      type: [
        new Schema(
          {
            id: { type: Schema.Types.ObjectId, ref: "User" },
            name: { type: String, required: true },
            email: { type: String, required: true },
            role: {
              type: String,
              enum: ["Observer", "Moderator", "Admin"],
              required: true,
            },
            joinedAt: { type: Date, required: false, default: null },
            leaveAt: { type: Date, required: false, default: null },
            reason: {
              type: String,
              enum: ["Left", "Streaming Stopped"],
              required: false,
              default: null,
            },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    hlsPlaybackUrl: { type: String, default: null },
    hlsEgressId: { type: String, default: null },
    hlsPlaylistName: { type: String, default: null },
    fileEgressId: { type: String, default: null },
    startedBy: { type: Schema.Types.ObjectId, ref: "User" },
    endedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);

export const LiveSessionModel: Model<ILiveSessionDocument> =
  mongoose.model<ILiveSessionDocument>("LiveSession", LiveSessionSchema);
