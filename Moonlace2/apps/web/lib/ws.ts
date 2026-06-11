import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

function getWsUrl(): string {
  if (process.env.NEXT_PUBLIC_WS_URL) return process.env.NEXT_PUBLIC_WS_URL;
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  return "http://localhost:4000";
}

export function getSocket(): Socket {
  if (!socket) {
    socket = io(getWsUrl(), { transports: ["websocket"], autoConnect: true });
  }
  return socket;
}

export function joinUserRoom(userId: string) {
  getSocket().emit("join", userId);
}
