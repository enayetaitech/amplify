"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PollModel = void 0;
const mongoose_1 = require("mongoose");
/* ---------- Question schema (all optional fields declared) ---------- */
const QuestionSchema = new mongoose_1.Schema({
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
}, { _id: true });
/* ---------- Poll schema ---------- */
const PollSchema = new mongoose_1.Schema({
    projectId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Project", required: true },
    sessionId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Session" },
    title: { type: String, required: true, trim: true },
    questions: { type: [QuestionSchema], required: true },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    createdByRole: {
        type: String,
        enum: ["Admin", "Moderator"],
        required: true,
    },
    lastModified: { type: Date, default: Date.now },
    responsesCount: { type: Number, default: 0 },
    isRun: { type: Boolean, default: false },
}, { timestamps: true });
exports.PollModel = (0, mongoose_1.model)("Poll", PollSchema);
