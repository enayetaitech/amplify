"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const projectSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    internalProjectName: { type: String, default: "" },
    description: { type: String, default: "" },
    startDate: { type: Date, required: true },
    status: {
        type: String,
        enum: ["Draft", "Active", "Inactive", "Closed", "Archived"],
        default: "Draft",
    },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    tags: { type: [mongoose_1.Schema.Types.ObjectId], ref: "Tag", default: [] },
    moderators: { type: [mongoose_1.Schema.Types.ObjectId], ref: "Moderator", default: [] },
    meetings: { type: [mongoose_1.Schema.Types.ObjectId], ref: "Session", default: [] },
    projectPasscode: {
        type: String,
        default: () => Math.floor(10000000 + Math.random() * 90000000).toString(),
    },
    cumulativeMinutes: { type: Number, default: 0 },
    service: {
        type: String,
        enum: ["Concierge", "Signature"],
        required: true,
    },
    respondentCountry: { type: String },
    respondentLanguage: { type: String },
    sessions: [
        {
            number: { type: Number },
            duration: { type: String },
        },
    ],
    recordingAccess: { type: Boolean, default: false },
}, {
    timestamps: true,
});
exports.default = (0, mongoose_1.model)("Project", projectSchema);
