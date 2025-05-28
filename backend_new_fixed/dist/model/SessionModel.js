"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionModel = void 0;
// backend/models/SessionModel.ts
const mongoose_1 = require("mongoose");
const SessionSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true },
    projectId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Project", required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    duration: { type: Number, required: true, min: 30 },
    moderators: [
        { type: mongoose_1.Schema.Types.ObjectId, ref: "Moderator", required: true }
    ],
    timeZone: { type: String, required: true },
    breakoutRoom: { type: Boolean, required: true, default: false },
}, { timestamps: true });
exports.SessionModel = (0, mongoose_1.model)("Session", SessionSchema);
