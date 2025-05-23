"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionDeliverableModel = void 0;
const mongoose_1 = require("mongoose");
const DeliverableSchema = new mongoose_1.Schema({
    sessionId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Session", required: true },
    projectId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Project", required: true },
    type: {
        type: String,
        enum: [
            "AUDIO",
            "VIDEO",
            "TRANSCRIPT",
            "BACKROOM_CHAT",
            "SESSION_CHAT",
            "WHITEBOARD",
            "POLL_RESULT",
        ],
        required: true,
    },
    displayName: { type: String, required: true, trim: true },
    size: { type: Number, required: true },
    storageKey: { type: String, required: true, trim: true },
    uploadedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
exports.SessionDeliverableModel = (0, mongoose_1.model)("SessionDeliverable", DeliverableSchema);
