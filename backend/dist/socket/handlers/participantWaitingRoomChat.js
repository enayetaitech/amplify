"use strict";
// backend/socket/handlers/participantWaitingRoomChat.ts
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
exports.registerParticipantWaitingRoomChat = registerParticipantWaitingRoomChat;
const ParticipantWaitingRoomChatModel_1 = require("../../model/ParticipantWaitingRoomChatModel");
let chatBatch = [];
const FLUSH_INTERVAL = 10000; // 10 seconds
// Periodically persist the batch
setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
    if (chatBatch.length) {
        try {
            yield ParticipantWaitingRoomChatModel_1.ParticipantWaitingRoomChatModel.insertMany(chatBatch);
            chatBatch = [];
        }
        catch (err) {
            console.error("Failed to flush waiting-room chat batch:", err);
        }
    }
}), FLUSH_INTERVAL);
function registerParticipantWaitingRoomChat(io) {
    io.on("connection", (socket) => {
        socket.on("participant-waiting-room:send-message", (data) => {
            const msg = Object.assign(Object.assign({}, data), { timestamp: new Date() });
            // Add to batch
            chatBatch.push(msg);
            console.log('chat batch', chatBatch);
            // Broadcast immediately
            io.to(data.sessionId).emit("participant-waiting-room:receive-message", msg);
        });
    });
}
