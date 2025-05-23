"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const projectFormSchema = new mongoose_1.Schema({ name: { type: String },
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    service: {
        type: String,
        enum: ["Concierge", "Signature"],
        required: true,
    },
    addOns: { type: [String] },
    respondentCountry: { type: String },
    respondentLanguage: { type: [String] },
    sessions: [
        {
            number: { type: Number },
            duration: { type: String },
        },
    ],
    firstDateOfStreaming: { type: Date, required: true },
    respondentsPerSession: { type: Number, default: 0 },
    numberOfSessions: { type: Number, default: 0 },
    sessionLength: { type: String, default: " " },
    recruitmentSpecs: { type: String, default: " " },
    preWorkDetails: { type: String, default: " " },
    selectedLanguage: { type: String, default: " " },
    inLanguageHosting: {
        type: String,
        enum: ["yes", "no", ""],
        default: "",
    },
    provideInterpreter: {
        type: String,
        enum: ["yes", "no", ""],
        default: "",
    },
    languageSessionBreakdown: { type: String, default: "" },
    additionalInfo: { type: String, default: "" },
    emailSent: { type: String, default: "Pending" },
}, {
    timestamps: true,
});
exports.default = (0, mongoose_1.model)("ProjectForm", projectFormSchema);
