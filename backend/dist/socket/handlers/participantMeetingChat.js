"use strict";
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
exports.registerParticipantMeetingChat = registerParticipantMeetingChat;
const ParticipantMeetingChatModel_1 = require("../../model/ParticipantMeetingChatModel");
let meetingChatBatch = [];
const FLUSH_INTERVAL = 10000;
setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
    if (!meetingChatBatch.length)
        return;
    try {
        yield ParticipantMeetingChatModel_1.ParticipantMeetingChatModel.insertMany(meetingChatBatch);
        meetingChatBatch = [];
    }
    catch (err) {
        console.error("Failed to flush meeting chat batch:", err);
    }
}), FLUSH_INTERVAL);
function registerParticipantMeetingChat(io) {
    io.on("connection", (socket) => {
        socket.on("participant-meeting-room:send-message", (data) => {
            const msg = Object.assign(Object.assign({}, data), { timestamp: new Date() });
            meetingChatBatch.push(msg);
            // broadcast to all sockets in this session room
            socket
                .broadcast
                .to(data.sessionId.toString())
                .emit("participant-meeting-room:receive-message", msg);
        });
    });
}
