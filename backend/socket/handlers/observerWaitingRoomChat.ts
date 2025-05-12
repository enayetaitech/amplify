import { Server, Socket } from "socket.io";
import { ObserverWaitingRoomChatModel } from "../../model/ObserverWaitingRoomChatModel";


type ChatMsg = {
  sessionId: string;
  email: string;
  senderName: string;
  role: "Participant" | "Observer" | "Moderator";
  content: string;
  timestamp: Date;
};

let observerChatBatch: ChatMsg[] = [];
const OBS_FLUSH_INTERVAL = 10_000;

setInterval(async () => {
  if (observerChatBatch.length) {
    try {
      await ObserverWaitingRoomChatModel.insertMany(observerChatBatch);
      observerChatBatch = [];
    } catch (err) {
      console.error("Failed to flush observer waiting-room chat batch:", err);
    }
  }
}, OBS_FLUSH_INTERVAL);

export function registerObserverWaitingRoomChat(io: Server) {
  io.on("connection", (socket: Socket) => {
    socket.on(
      "observer-waiting-room:send-message",
      (data: Omit<ChatMsg, "timestamp">) => {
        const msg: ChatMsg = { ...data, timestamp: new Date() };
        observerChatBatch.push(msg);
        io.to(data.sessionId).emit("observer-waiting-room:receive-message", msg);
      }
    );
  });
}
