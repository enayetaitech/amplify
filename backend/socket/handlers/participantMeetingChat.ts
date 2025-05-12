import { Server, Socket } from "socket.io";
import { ParticipantMeetingChatDocument, ParticipantMeetingChatModel } from "../../model/ParticipantMeetingChatModel";

// we accept exactly the IWaitingRoomChat minus timestamp/_id
type MeetingChatPayload = Omit<ParticipantMeetingChatDocument, "_id" | "timestamp">;

let meetingChatBatch: Array<MeetingChatPayload & { timestamp: Date }> = [];
const FLUSH_INTERVAL = 10_000;

setInterval(async () => {
  if (!meetingChatBatch.length) return;

  try {
    await ParticipantMeetingChatModel.insertMany(meetingChatBatch);
    meetingChatBatch = [];
  } catch (err) {
    console.error("Failed to flush meeting chat batch:", err);
  }
}, FLUSH_INTERVAL);

export function registerParticipantMeetingChat(io: Server) {
  io.on("connection", (socket: Socket) => {
    socket.on(
      "participant-meeting-room:send-message",
      (data: MeetingChatPayload) => {
        const msg = { ...data, timestamp: new Date() };
        meetingChatBatch.push(msg);

        // broadcast to all sockets in this session room
       socket
  .broadcast
  .to(data.sessionId.toString())
  .emit("participant-meeting-room:receive-message", msg);
      }
    );
  });
}
