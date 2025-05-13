// backend/socket/handlers/participantWaitingRoomChat.ts

import { Server, Socket } from "socket.io";
import { ParticipantWaitingRoomChatModel } from "../../model/ParticipantWaitingRoomChatModel";

type ChatMsg = {
  sessionId: string;
  email: string;
  senderName: string;
  role: "Participant" | "Observer" | "Moderator";
  content: string;
  timestamp: Date;
};

let chatBatch: ChatMsg[] = [];
const FLUSH_INTERVAL = 10_000; // 10 seconds

// Periodically persist the batch
setInterval(async () => {
  if (chatBatch.length) {
    try {
      await ParticipantWaitingRoomChatModel.insertMany(chatBatch);
      chatBatch = [];
    } catch (err) {
      console.error("Failed to flush waiting-room chat batch:", err);
    }
  }
}, FLUSH_INTERVAL);

export function registerParticipantWaitingRoomChat(io: Server) {
  io.on("connection", (socket: Socket) => {
    socket.on(
      "participant-waiting-room:send-message",
      (data: Omit<ChatMsg, "timestamp">) => {
        const msg: ChatMsg = {
          ...data,
          timestamp: new Date(),
        };

        // Add to batch
        chatBatch.push(msg);
        console.log('chat batch', chatBatch)

        // Broadcast immediately
        io.to(data.sessionId).emit("participant-waiting-room:receive-message", msg);
      }
    );
  });
}
