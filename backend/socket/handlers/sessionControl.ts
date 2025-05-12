// backend/socket/handlers/sessionControl.ts

import { Server, Socket } from "socket.io";
import * as sessionService from "../../processors/liveSession/sessionService";
import { LiveSessionModel } from "../../model/LiveSessionModel";

interface AcceptPayload {
  sessionId: string;
  email: string;
}

interface RemovePayload {
  sessionId: string;
  email: string;
}

export function registerSessionControl(io: Server) {
  io.on("connection", (socket: Socket) => {
    // Moderator starts the meeting
    socket.on(
      "startMeeting",
      async (
        payload: { sessionId: string },
        callback: (res: {
          success: boolean;
          liveSession?: any;
          message?: string;
        }) => void
      ) => {
        try {
          const live = await sessionService.startSession(payload.sessionId);
          io.to(payload.sessionId).emit("meetingStarted", live);
          callback({ success: true, liveSession: live });
        } catch (err: any) {
          callback({ success: false, message: err.message });
        }
      }
    );

    // Moderator ends the meeting
    socket.on(
      "endMeeting",
      async (
        payload: { sessionId: string },
        callback: (res: { success: boolean; message?: string }) => void
      ) => {
        try {
          const live = await sessionService.endSession(payload.sessionId);
          io.to(payload.sessionId).emit("meetingEnded", {
            sessionId: payload.sessionId,
          });
          callback({ success: true });
        } catch (err: any) {
          callback({ success: false, message: err.message });
        }
      }
    );

    // Moderator admits a user from waitingRoom
    socket.on(
      "acceptFromWaitingRoom",
      async (
        payload: AcceptPayload,
        callback: (res: {
          success: boolean;
          waitingRoom?: any[];
          participantList?: any[];
          message?: string;
        }) => void
      ) => {
        console.log("[sessionControl] acceptFromWaitingRoom payload:", payload);

        try {
          const live = await LiveSessionModel.findOne({
            sessionId: payload.sessionId,
          });
          if (!live) throw new Error("LiveSession not found");

          const idx = live.participantWaitingRoom.findIndex(
            (u) => u.email === payload.email
          );
          if (idx === -1) throw new Error("User not in waiting room");

          const [user] = live.participantWaitingRoom.splice(idx, 1);
          live.participantsList.push({
            name: user.name,
            email: user.email,
            role: user.role === "Moderator" ? "Moderator" : "Participant",
            joinedAt: new Date(),
          });
          await live.save();

          io.to(payload.sessionId).emit(
            "participantWaitingRoomUpdate",
            live.participantWaitingRoom
          );
          io.to(payload.sessionId).emit(
            "participantListUpdate",
            live.participantsList
          );

          console.log(
            "[sessionControl] emitted participantWaitingRoomUpdate & participantListUpdate"
          );

          callback({
            success: true,
            waitingRoom: live.participantWaitingRoom,
            participantList: live.participantsList,
          });
        } catch (err: any) {
          console.error("[sessionControl] accept error:", err);

          callback({ success: false, message: err.message });
        }
      }
    );

    // Moderator or user removes someone from waitingRoom
    socket.on(
      "removeFromWaitingRoom",
      async (
        payload: RemovePayload,
        callback: (res: {
          success: boolean;
          waitingRoom?: any[];
          message?: string;
        }) => void
      ) => {
        console.log("[sessionControl] removeFromWaitingRoom payload:", payload);
        try {
          const live = await LiveSessionModel.findOne({
            sessionId: payload.sessionId,
          });
          if (!live) throw new Error("LiveSession not found");

          live.participantWaitingRoom = live.participantWaitingRoom.filter(
            (u) => u.email !== payload.email
          );
          await live.save();

          console.log(
            "[sessionControl] updated waitingRoom:",
            live.participantWaitingRoom
          );

          io.to(payload.sessionId).emit(
            "participantWaitingRoomUpdate",
            live.participantWaitingRoom
          );
          callback({ success: true, waitingRoom: live.participantWaitingRoom });
        } catch (err: any) {
          console.error("[sessionControl] remove error:", err);
          callback({ success: false, message: err.message });
        }
      }
    );
  });
}
