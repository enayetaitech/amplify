// backend/model/PollResponse.ts
import { Schema, model, Document, Types } from "mongoose";

type Scalar = string | number | boolean | null;

export interface PollAnswer {
  questionId: Types.ObjectId;          // which question this answer belongs to
  optionId?: Types.ObjectId;           // selected option (for MCQ), optional
  value?: Scalar | Scalar[];           // free text / numeric / boolean / multi
}

export interface PollResponseDoc extends Document<Types.ObjectId> {
  pollId: Types.ObjectId;
  sessionId: Types.ObjectId;
  responder: { userId?: Types.ObjectId; name?: string; email?: string };
  answers: PollAnswer[];
  submittedAt: Date;
}

const PollAnswerSchema = new Schema<PollAnswer>(
  {
    questionId: { type: Schema.Types.ObjectId, required: true, ref: "PollQuestion" },
    optionId: { type: Schema.Types.ObjectId, ref: "PollOption" },
    value: { type: Schema.Types.Mixed }, // allows string/number/bool/array
  },
  { _id: false }
);

const PollResponseSchema = new Schema<PollResponseDoc>(
  {
    pollId: { type: Schema.Types.ObjectId, ref: "Poll", required: true },
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

PollResponseSchema.index({ pollId: 1, sessionId: 1 });

export default model<PollResponseDoc>("PollResponse", PollResponseSchema);
