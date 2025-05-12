// backend/socket/handlers/joinRoom.ts

import { Server, Socket } from "socket.io";
import * as sessionService from "../../processors/liveSession/sessionService";
import { IObserver, IObserverWaitingUser, IParticipant, IWaitingUser } from "../../../shared/interface/LiveSessionInterface";

interface JoinPayload {
  sessionId: string;
  userId?: string;
  name: string;
  email: string;
  role: "Participant" | "Observer" | "Moderator";
}

export function registerJoinRoom(io: Server) {
  io.on("connection", (socket: Socket) => {
    socket.on(
      "join-room",
      async (payload, callback: (rooms: {
        
        participantsWaitingRoom: IWaitingUser[];
        observersWaitingRoom: IObserverWaitingUser[];
        participantList: IParticipant[],
        observerList: IObserver[]
      }) => void) => {
        try {
          console.log('payload', payload)
          // Ensure a LiveSession exists
          await sessionService.createLiveSession(payload.sessionId);

          socket.join(payload.sessionId);
          // Enqueue the user
          const rooms = await sessionService.enqueueUser(
            payload.sessionId,
            payload
          );

         // emit separate updates
         io.to(payload.sessionId).emit(
           "participantWaitingRoomUpdate",
           rooms.participantsWaitingRoom
          );

          
          io.to(payload.sessionId).emit(
            "observerWaitingRoomUpdate",
            rooms.observersWaitingRoom
          );

          console.log("rooms", rooms)

          callback(rooms);
        } catch (err: any) {
          console.error("join-room error:", err);
          socket.emit("error", { message: err.message });
        }
      }
    );
  });
}
