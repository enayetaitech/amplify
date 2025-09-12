import type { Server } from "socket.io";

let ioRef: Server | null = null;

export function setIo(io: Server) {
  ioRef = io;
}

export function emitBreakoutsChanged(sessionId: string) {
  try {
    ioRef?.to(sessionId).emit("breakouts:changed", {});
  } catch {}
}

export function emitToRoom(room: string, event: string, payload?: any) {
  try {
    ioRef?.to(room).emit(event, payload ?? {});
  } catch {}
}

export function emitToSocket(socketId: string, event: string, payload?: any) {
  try {
    ioRef?.to(socketId).emit(event, payload ?? {});
  } catch {}
}
