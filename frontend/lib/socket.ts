"use client";

import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "constant/socket";

let socket: Socket | null = null;

export function connectSocket(opts: {
  sessionId: string;
  role: string;
  name?: string;
  email?: string;
}) {
  if (socket) return socket;
  const { sessionId, role, name, email } = opts;
  socket = io(SOCKET_URL, {
    path: "/socket.io",
    withCredentials: true,
    query: { sessionId, role, name, email },
  });
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (!socket) return;
  socket.disconnect();
  socket = null;
}

// convenience thin wrappers
// Define minimal compatible signatures without using `any`.
type AnyListener = (...args: unknown[]) => void;
type SocketLike = {
  on: (event: string, listener: AnyListener) => void;
  off: (event: string, listener?: AnyListener) => void;
  emit: (event: string, payload?: unknown, cb?: (r: unknown) => void) => void;
};

export function on(event: string, cb: AnyListener) {
  const s = socket as unknown as SocketLike | null;
  s?.on(event, cb);
}

export function off(event: string, cb?: AnyListener) {
  const s = socket as unknown as SocketLike | null;
  s?.off(event, cb);
}

export function emit(
  event: string,
  payload?: unknown,
  cb?: (r: unknown) => void
) {
  const s = socket as unknown as SocketLike | null;
  s?.emit(event, payload, cb);
}

const socketApi = {
  connectSocket,
  getSocket,
  disconnectSocket,
  on,
  off,
  emit,
};

export default socketApi;
