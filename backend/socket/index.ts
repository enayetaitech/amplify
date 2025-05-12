// socket/index.ts
import { Server, Socket } from "socket.io";
import http from "http";
import { registerJoinRoom } from "./handlers/joinRoom";
import { registerParticipantWaitingRoomChat } from "./handlers/participantWaitingRoomChat";
import { registerActivityLogger } from "./handlers/activityLogger";
import { registerSessionControl } from "./handlers/sessionControl";
import { registerObserverWaitingRoomChat } from "./handlers/observerWaitingRoomChat";
import { registerParticipantMeetingChat } from "./handlers/participantMeetingChat";

// we'll export the initialized io instance if you need to emit outside handlers
let io: Server;

export function initSocket(server: http.Server) {
  io = new Server(server, {
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

  registerJoinRoom(io);
  registerParticipantWaitingRoomChat(io);

  registerParticipantMeetingChat(io);
  
  registerObserverWaitingRoomChat(io);
  registerSessionControl(io);
  registerActivityLogger(io);

  io.on("connection", (socket: Socket) => {
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
export function getIO() {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
}
