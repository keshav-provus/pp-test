"use client";

import io from "socket.io-client";

// Infers the exact Socket type automatically to prevent TS value-as-type errors
export type ClientSocket = ReturnType<typeof io>;

let socket: ClientSocket | null = null;

export const getSocket = (): ClientSocket => {
  if (!socket) {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
    
    socket = io(socketUrl, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      transports: ["websocket"],
    });
  }
  return socket;
};

/**
 * Optimizes the connection by initiating the handshake in the background 
 * as soon as the host clicks "Create Session".
 */
export const initBackgroundSocket = () => {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
    console.log("⚡ Background socket pre-warming initialized");
  }
  return s;
};