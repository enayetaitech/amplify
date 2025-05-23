"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = initSocket;
exports.getIO = getIO;
// socket/index.ts
const socket_io_1 = require("socket.io");
const joinRoom_1 = require("./handlers/joinRoom");
const participantWaitingRoomChat_1 = require("./handlers/participantWaitingRoomChat");
const activityLogger_1 = require("./handlers/activityLogger");
const sessionControl_1 = require("./handlers/sessionControl");
const observerWaitingRoomChat_1 = require("./handlers/observerWaitingRoomChat");
const participantMeetingChat_1 = require("./handlers/participantMeetingChat");
// we'll export the initialized io instance if you need to emit outside handlers
let io;
function initSocket(server) {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: ["http://localhost:3000"], // match your existing CORS
            methods: ["GET", "POST"],
            credentials: true,
        },
    });
    io.use((socket, next) => {
        // optional: parse auth token from socket.handshake.auth and verify here
        // e.g.: const token = socket.handshake.auth.token; verifyJWT(token)…
        return next();
    });
    (0, joinRoom_1.registerJoinRoom)(io);
    (0, participantWaitingRoomChat_1.registerParticipantWaitingRoomChat)(io);
    (0, participantMeetingChat_1.registerParticipantMeetingChat)(io);
    (0, observerWaitingRoomChat_1.registerObserverWaitingRoomChat)(io);
    (0, sessionControl_1.registerSessionControl)(io);
    (0, activityLogger_1.registerActivityLogger)(io);
    io.on("connection", (socket) => {
        console.log("Socket connected:", socket.id);
        // register your handlers, e.g.:
        // socket.on("join-room", handleJoinRoom(io, socket));
        // socket.on("waiting-room:send-message", handleWaitingRoomChat(io, socket));
        // …
        socket.on("disconnect", () => {
            console.log("Socket disconnected:", socket.id);
            // handle leave logic
        });
    });
}
// getter if you need to emit outside of a handler
function getIO() {
    if (!io)
        throw new Error("Socket.io not initialized!");
    return io;
}
