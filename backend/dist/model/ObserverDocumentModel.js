"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObserverDocumentModel = void 0;
// backend/model/ObserverDocumentModel.ts
const mongoose_1 = require("mongoose");
const ObserverDocSchema = new mongoose_1.Schema({
    projectId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Project", required: true },
    sessionId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Session", required: true },
    displayName: { type: String, required: true, trim: true },
    size: { type: Number, required: true },
    storageKey: { type: String, required: true, trim: true },
    addedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    addedByRole: {
        type: String,
        enum: ["Admin", "Moderator", "Observer"],
        required: true,
    },
}, { timestamps: true });
exports.ObserverDocumentModel = (0, mongoose_1.model)("ObserverDocument", ObserverDocSchema);
