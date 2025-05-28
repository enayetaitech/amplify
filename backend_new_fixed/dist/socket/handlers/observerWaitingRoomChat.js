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
exports.registerObserverWaitingRoomChat = registerObserverWaitingRoomChat;
const ObserverWaitingRoomChatModel_1 = require("../../model/ObserverWaitingRoomChatModel");
let observerChatBatch = [];
const OBS_FLUSH_INTERVAL = 10000;
setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
    if (observerChatBatch.length) {
        try {
            yield ObserverWaitingRoomChatModel_1.ObserverWaitingRoomChatModel.insertMany(observerChatBatch);
            observerChatBatch = [];
        }
        catch (err) {
            console.error("Failed to flush observer waiting-room chat batch:", err);
        }
    }
}), OBS_FLUSH_INTERVAL);
function registerObserverWaitingRoomChat(io) {
    io.on("connection", (socket) => {
        socket.on("observer-waiting-room:send-message", (data) => {
            const msg = Object.assign(Object.assign({}, data), { timestamp: new Date() });
            observerChatBatch.push(msg);
            io.to(data.sessionId).emit("observer-waiting-room:receive-message", msg);
        });
    });
}
