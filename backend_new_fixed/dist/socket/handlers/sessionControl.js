"use strict";
// backend/socket/handlers/sessionControl.ts
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSessionControl = registerSessionControl;
const sessionService = __importStar(require("../../processors/liveSession/sessionService"));
const LiveSessionModel_1 = require("../../model/LiveSessionModel");
function registerSessionControl(io) {
    io.on("connection", (socket) => {
        // Moderator starts the meeting
        socket.on("startMeeting", (payload, callback) => __awaiter(this, void 0, void 0, function* () {
            try {
                const live = yield sessionService.startSession(payload.sessionId);
                io.to(payload.sessionId).emit("meetingStarted", live);
                callback({ success: true, liveSession: live });
            }
            catch (err) {
                callback({ success: false, message: err.message });
            }
        }));
        // Moderator ends the meeting
        socket.on("endMeeting", (payload, callback) => __awaiter(this, void 0, void 0, function* () {
            try {
                const live = yield sessionService.endSession(payload.sessionId);
                io.to(payload.sessionId).emit("meetingEnded", {
                    sessionId: payload.sessionId,
                });
                callback({ success: true });
            }
            catch (err) {
                callback({ success: false, message: err.message });
            }
        }));
        // Moderator admits a user from waitingRoom
        socket.on("acceptFromWaitingRoom", (payload, callback) => __awaiter(this, void 0, void 0, function* () {
            console.log("[sessionControl] acceptFromWaitingRoom payload:", payload);
            try {
                const live = yield LiveSessionModel_1.LiveSessionModel.findOne({
                    sessionId: payload.sessionId,
                });
                if (!live)
                    throw new Error("LiveSession not found");
                console.log("live", live);
                const idx = live.participantWaitingRoom.findIndex((u) => u.email === payload.email);
                if (idx === -1)
                    throw new Error("User not in waiting room");
                const [user] = live.participantWaitingRoom.splice(idx, 1);
                live.participantsList.push({
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    joinedAt: new Date(),
                });
                yield live.save();
                console.log('live after saving', live);
                io.to(payload.sessionId).emit("participantWaitingRoomUpdate", live.participantWaitingRoom);
                io.to(payload.sessionId).emit("participantListUpdate", live.participantsList);
                console.log("[sessionControl] emitted participantWaitingRoomUpdate & participantListUpdate");
                callback({
                    success: true,
                    participantsWaitingRoom: live.participantWaitingRoom,
                    observersWaitingRoom: live.observerWaitingRoom,
                    participantList: live.participantsList,
                    observerList: live.observerList,
                });
            }
            catch (err) {
                console.error("[sessionControl] accept error:", err);
                callback({ success: false, message: err.message });
            }
        }));
        // Moderator or user removes someone from waitingRoom
        socket.on("removeFromWaitingRoom", (payload, callback) => __awaiter(this, void 0, void 0, function* () {
            console.log("[sessionControl] removeFromWaitingRoom payload:", payload);
            try {
                const live = yield LiveSessionModel_1.LiveSessionModel.findOne({
                    sessionId: payload.sessionId,
                });
                if (!live)
                    throw new Error("LiveSession not found");
                live.participantWaitingRoom = live.participantWaitingRoom.filter((u) => u.email !== payload.email);
                yield live.save();
                console.log("[sessionControl] updated waitingRoom:", live.participantWaitingRoom);
                io.to(payload.sessionId).emit("participantWaitingRoomUpdate", live.participantWaitingRoom);
                callback({ success: true, waitingRoom: live.participantWaitingRoom });
            }
            catch (err) {
                console.error("[sessionControl] remove error:", err);
                callback({ success: false, message: err.message });
            }
        }));
    });
}
