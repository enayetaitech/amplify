import { Schema, model, Types, Document } from "mongoose";
import { IPoll } from "../../shared/interface/PollInterface";

/* Convert front-end strings → ObjectIds */
type PollDB = Omit<IPoll, "_id" | "projectId" | "sessionId" | "createdBy" | "questions"> & {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  sessionId: Types.ObjectId;
  createdBy: Types.ObjectId;
  questions: (IPoll["questions"][number] & { _id: Types.ObjectId })[];
};

export interface PollDocument
  extends Document<Types.ObjectId, {}, PollDB>,
    PollDB {}

/* ---------- Question schema (all optional fields declared) ---------- */
const QuestionSchema = new Schema(
  {
    type: {
      type: String,
      enum: [
        "SINGLE_CHOICE",
        "MULTIPLE_CHOICE",
        "MATCHING",
        "RANK_ORDER",
        "SHORT_ANSWER",
        "LONG_ANSWER",
        "FILL_IN_BLANK",
        "RATING_SCALE",
      ],
      required: true,
    },
    prompt: { type: String, required: true, trim: true },
    required: { type: Boolean, default: false },
    image: { type: String },

    /* single / multiple choice */
    answers: { type: [String] },
    correctAnswer: { type: Number },
    correctAnswers: { type: [Number] },
    showDropdown: { type: Boolean },

    /* matching */
    options: { type: [String] },

    /* rank order */
    rows: { type: [String] },
    columns: { type: [String] },

    /* text questions */
    minChars: { type: Number },
    maxChars: { type: Number },

    /* rating scale */
    scoreFrom: { type: Number },
    scoreTo: { type: Number },
    lowLabel: { type: String },
    highLabel: { type: String },
  },
  { _id: true }
);

/* ---------- Poll schema ---------- */
const PollSchema = new Schema<PollDocument>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },

    sessionId: { type: Schema.Types.ObjectId, ref: "Session" },

    title: { type: String, required: true, trim: true },
    questions: { type: [QuestionSchema], required: true },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdByRole: {
      type: String,
      enum: ["Admin", "Moderator"],
      required: true,
    },

    lastModified: { type: Date, default: Date.now },
    responsesCount: { type: Number, default: 0 },
    isRun: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const PollModel = model<PollDocument>("Poll", PollSchema);
