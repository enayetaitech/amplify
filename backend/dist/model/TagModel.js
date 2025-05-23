"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagModel = void 0;
const mongoose_1 = require("mongoose");
const TagSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true },
    color: { type: String, required: true, trim: true },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    projectId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Project",
        required: true,
    },
}, { timestamps: true });
exports.TagModel = (0, mongoose_1.model)("Tag", TagSchema);
