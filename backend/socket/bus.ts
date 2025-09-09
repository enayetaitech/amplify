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
