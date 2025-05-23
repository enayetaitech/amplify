"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveSessionModel = void 0;
// backend/models/LiveSessionModel.ts
const mongoose_1 = __importStar(require("mongoose"));
const WaitingRoomParticipantSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, enum: ["Participant", "Moderator", "Admin"], required: true },
    joinedAt: { type: Date, required: true, default: () => new Date() },
});
const WaitingRoomObserverSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: false },
    name: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, enum: ["Observer", "Moderator", "Admin"], required: true },
    joinedAt: { type: Date, required: true, default: () => new Date() },
});
const ParticipantSchema = new mongoose_1.Schema({
    email: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ["Participant", "Moderator", "Admin"], required: true },
    joinedAt: { type: Date, required: true, default: () => new Date() },
});
const ObserverSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: false },
    name: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, enum: ["Observer", "Moderator", "Admin"], required: true },
    joinedAt: { type: Date, required: true, default: () => new Date() },
});
const LiveSessionSchema = new mongoose_1.Schema({
    sessionId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Session", required: true },
    ongoing: { type: Boolean, default: false },
    startTime: { type: Date },
    endTime: { type: Date },
    participantWaitingRoom: { type: [WaitingRoomParticipantSchema], default: [] },
    observerWaitingRoom: { type: [WaitingRoomObserverSchema], default: [] },
    participantsList: { type: [ParticipantSchema], default: [] },
    observerList: { type: [ObserverSchema], default: [] },
    // add other flags or subdocuments here
}, {
    timestamps: true,
});
exports.LiveSessionModel = mongoose_1.default.model("LiveSession", LiveSessionSchema);
