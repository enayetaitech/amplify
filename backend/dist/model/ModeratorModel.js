"use strict";
// src/models/moderator.model.ts
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const moderatorSchema = new mongoose_1.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    companyName: { type: String, required: true },
    roles: {
        type: [String],
        enum: ["Admin", "Moderator", "Observer"],
        default: [],
        required: true,
    },
    adminAccess: { type: Boolean, default: false },
    projectId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Project", required: true },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
}, {
    timestamps: true,
});
exports.default = (0, mongoose_1.model)("Moderator", moderatorSchema);
