// backend/socket/handlers/activityLogger.ts

import { Server, Socket } from "socket.io";
import * as sessionService from "../../processors/liveSession/sessionService";

export function registerActivityLogger(io: Server) {
  io.on("connection", (socket: Socket) => {
    socket.on("disconnect", async () => {
      const { sessionId, userId } = socket.data as {
        sessionId?: string;
        userId?: string;
      };
      if (sessionId && userId) {
        try {
          await sessionService.logLeave(sessionId, userId);
        } catch (err) {
          console.error("Error logging leave:", err);
        }
      }
    });
  });
}
