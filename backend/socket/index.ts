// backend/socket/index.ts
import type { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";

import { listState, admitByEmail, removeFromWaitingByEmail, admitAll } from "../processors/waiting/waitingService";
import { createAdmitToken } from "../processors/livekit/admitTokenService";



// In-memory map to find a participant socket by email within a session
// sessionId -> (email -> socketId)
const emailIndex = new Map<string, Map<string, string>>();

type Role = "Participant" | "Observer" | "Moderator" | "Admin";
type JoinAck = Awaited<ReturnType<typeof listState>>;


export function attachSocket(server: HTTPServer) {
  const io = new Server(server, {
    path: "/socket.io",
    cors: { origin: true, credentials: true },
  });

  io.on("connection", (socket: Socket) => {
    // Expect query: ?sessionId=...&role=...&name=...&email=...
    const q = socket.handshake.query;
    const sessionId = String(q.sessionId || "");
    const role = (String(q.role || "Participant") as Role);
    const name = (q.name as string) || "";
    const email = (q.email as string) || "";

    if (!sessionId || !role) {
      socket.emit("error:auth", "Missing sessionId or role");
      return socket.disconnect(true);
    }

    const rooms = {
      waiting: `waiting::${sessionId}`,
      meeting: `meeting::${sessionId}`,   // future milestones
      observer: `observer::${sessionId}`, // future milestones
    };

    // Join waiting room by default; participant/observer wait here
    socket.join(rooms.waiting);

    // Track email -> socket (only if email present)
    if (email) {
      if (!emailIndex.has(sessionId)) emailIndex.set(sessionId, new Map());
      emailIndex.get(sessionId)!.set(email.toLowerCase(), socket.id);
    }

    // Initial payload (lists)
    socket.on("join-room", async (_payload, ack?: (rooms: JoinAck) => void) => {
      const state = await listState(sessionId);
      if (ack) ack(state);
      // Also broadcast updated waiting list to all moderators’ panels
      io.to(rooms.waiting).emit("waiting:list", {
        participantsWaitingRoom: state.participantsWaitingRoom,
        observersWaitingRoom: state.observersWaitingRoom,
      });
    });

    // ===== Moderator actions =====
    socket.on("waiting:admit", async ({ email }: { email: string }) => {
      if (!["Moderator", "Admin"].includes(role)) return;
      const state = await admitByEmail(sessionId, email);

      // 1) issue short-lived admitToken for THIS participant
  const displayName =
  state.participantList?.find(p => p.email?.toLowerCase() === email.toLowerCase())?.name
  || email; // fallback if name not present

const admitToken = createAdmitToken({
  sessionId,
  email,
  name: displayName,
  ttlSeconds: 120,
});

      // 2) find that participant's socket & notify only them
  const targetId = emailIndex.get(sessionId)?.get(email.toLowerCase());
  if (targetId) {
    // new event for participants to listen to
    io.to(targetId).emit("participant:admitted", { admitToken });
  }

 // 3) update moderator panels as you already do
 io.to(rooms.waiting).emit("waiting:list", {
  participantsWaitingRoom: state.participantsWaitingRoom,
  observersWaitingRoom: state.observersWaitingRoom,
});

    });

    socket.on("waiting:remove", async ({ email }: { email: string }) => {
      if (!["Moderator", "Admin"].includes(role)) return;
      const state = await removeFromWaitingByEmail(sessionId, email);
      io.to(rooms.waiting).emit("waiting:list", {
        participantsWaitingRoom: state.participantsWaitingRoom,
        observersWaitingRoom: state.observersWaitingRoom,
      });

      const targetId = emailIndex.get(sessionId)?.get(email.toLowerCase());
      if (targetId) io.to(targetId).emit("waiting:removed", { reason: "Removed by moderator" });
    });

    socket.on("waiting:admitAll", async () => {
      if (!["Moderator", "Admin"].includes(role)) return;
      const state = await admitAll(sessionId);

      // for each known socket in this session, try to send an admitToken
  const idx = emailIndex.get(sessionId);
  if (idx) {
    for (const [eml, sockId] of idx.entries()) {
      const displayName =
        state.participantList?.find(p => p.email?.toLowerCase() === eml)?.name
        || eml;

      const admitToken = createAdmitToken({
        sessionId,
        email: eml,
        name: displayName,
        ttlSeconds: 120,
      });

      io.to(sockId).emit("participant:admitted", { admitToken });
    }
  }
      io.to(rooms.waiting).emit("waiting:list", {
        participantsWaitingRoom: state.participantsWaitingRoom,
        observersWaitingRoom: state.observersWaitingRoom,
      });

      
    });

    socket.on("disconnect", () => {
      if (email && emailIndex.get(sessionId)) {
        emailIndex.get(sessionId)!.delete(email.toLowerCase());
      }
    });
  });

  return io;
}

