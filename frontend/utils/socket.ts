// shared/utils/socket.ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

/**
 * Initialize socket (call once e.g. in your App root).
 */
export function initSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      withCredentials: true,
    });
  }
  return socket;
}

/**
 * Get the initialized socket instance.
 */
export function getSocket(): Socket {
  if (!socket) {
    throw new Error("Socket not initialized. Call initSocket() first.");
  }
  return socket;
}
