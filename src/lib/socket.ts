import io from "socket.io-client";
import type { Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io({ autoConnect: false });
  }
  return socket;
};

export const initBackgroundSocket = () => {
  const s = getSocket();
  if (!s.connected) s.connect();
};