import { Schema, model, Document, Types } from "mongoose";

export interface PollRunDoc extends Document<Types.ObjectId> {
  pollId: Types.ObjectId;
  sessionId: Types.ObjectId;
  runNumber: number;
  status: "OPEN" | "CLOSED";
  launchedAt: Date;
  closedAt?: Date;
  anonymous: boolean;
  shareResults: "never" | "onStop" | "immediate";
  timeLimitSec?: number;
}

const PollRunSchema = new Schema<PollRunDoc>(
  {
    pollId: { type: Schema.Types.ObjectId, ref: "Poll", required: true },
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true },
    runNumber: { type: Number, required: true },
    status: { type: String, enum: ["OPEN", "CLOSED"], required: true },
    launchedAt: { type: Date, default: Date.now },
    closedAt: { type: Date },
    anonymous: { type: Boolean, default: false },
    shareResults: {
      type: String,
      enum: ["never", "onStop", "immediate"],
      default: "onStop",
    },
    timeLimitSec: { type: Number },
  },
  { timestamps: true }
);

PollRunSchema.index({ pollId: 1, sessionId: 1, status: 1 });
PollRunSchema.index({ pollId: 1, runNumber: -1 });

export const PollRunModel = model<PollRunDoc>("PollRun", PollRunSchema);
