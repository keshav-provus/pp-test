// server.ts
import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);
  const io = new Server(httpServer);

  io.on("connection", (socket) => {
    // 2. Pre-warming logic: Handshake happens in background on Dashboard
    socket.on("prewarm-session", () => {
      console.log("Socket pre-warmed for background optimization");
    });

    socket.on("join-room", ({ sessionId, user }) => {
      socket.join(sessionId);
      io.to(sessionId).emit("user-joined", { user });
    });

    socket.on("submit-vote", (data) => {
      io.to(data.sessionId).emit("vote-update", { userId: data.userId, value: data.value });
    });

    socket.on("reveal-action", (sessionId) => {
      io.to(sessionId).emit("reveal-votes");
    });

    socket.on("reset-voting", (sessionId) => {
      io.to(sessionId).emit("clear-votes");
    });
  });

  httpServer.listen(3000);
});