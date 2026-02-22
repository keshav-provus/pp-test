"use client";

import io from "socket.io-client";

// 1. Magically infers the exact Socket type from the io() function
// This avoids importing the 'Socket' class/type entirely, preventing TS2749!
type ClientSocket = ReturnType<typeof io>;

let socket: ClientSocket | null = null;

export const getSocket = (): ClientSocket => {
  if (!socket) {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
    
    socket = io(socketUrl, {
      autoConnect: false,
      reconnection: true,
      transports: ["websocket"],
    });
  }

  return socket;
};

/**
 * Background pre-warming to optimize connection speed.
 */
export const initBackgroundSocket = () => {
  const s = getSocket();
  
  // No need for instanceof, 's' is strictly typed by ReturnType
  if (s && !s.connected) {
    s.connect();
    console.log("Socket background pre-warming initiated...");
  }
};