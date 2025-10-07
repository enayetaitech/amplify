// backend/model/PollResponse.ts
import { Schema, model, Document, Types } from "mongoose";

type Scalar = string | number | boolean | null;

export interface PollAnswer {
  questionId: Types.ObjectId; // id of question subdocument in Poll
  // optionId removed: options are stored as indices; don't reference non-existent models
  value?: Scalar | Scalar[] | Array<number | [number, number]>; // numbers for indices, tuples for matching
}

export interface PollResponseDoc extends Document<Types.ObjectId> {
  pollId: Types.ObjectId;
  runId: Types.ObjectId;
  sessionId: Types.ObjectId;
  responder: { userId?: Types.ObjectId; name?: string; email?: string };
  answers: PollAnswer[];
  submittedAt: Date;
}

const PollAnswerSchema = new Schema<PollAnswer>(
  {
    questionId: { type: Schema.Types.ObjectId, required: true },
    value: { type: Schema.Types.Mixed }, // allows string/number/bool/array, or tuples for matching
  },
  { _id: false }
);

const PollResponseSchema = new Schema<PollResponseDoc>(
  {
    pollId: { type: Schema.Types.ObjectId, ref: "Poll", required: true },
    runId: { type: Schema.Types.ObjectId, ref: "PollRun", required: true },
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true },
    responder: {
      userId: { type: Schema.Types.ObjectId, ref: "User" },
      name: String,
      email: String,
    },
    answers: { type: [PollAnswerSchema], default: [] },
    submittedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

// unique per-run submission by userId when present
PollResponseSchema.index(
  { pollId: 1, runId: 1, "responder.userId": 1 },
  {
    unique: true,
    partialFilterExpression: { "responder.userId": { $exists: true } },
  }
);
PollResponseSchema.index({ pollId: 1, runId: 1, submittedAt: 1 });

export default model<PollResponseDoc>("PollResponse", PollResponseSchema);
