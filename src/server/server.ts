import { createServer } from "http";
import { Server } from "socket.io";
// Ensure you have your Jira helper imported
import { updateStoryPoints } from "../../services/jira"; 

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// Memory storage for active rooms
interface Issue {
  key: string;
  summary: string;
  [key: string]: unknown;
}

const rooms = new Map<string, {
  hostId: string;
  currentIssue: Issue | null;
  revealed: boolean;
  participants: Map<string, { name: string; vote: number | null }>;
}>();

io.on("connection", (socket) => {
  
  socket.on("join-room", ({ sessionId, user, isHost }) => {
    socket.join(sessionId);
    
    if (!rooms.has(sessionId)) {
      rooms.set(sessionId, {
        hostId: isHost ? socket.id : "",
        currentIssue: null,
        revealed: false,
        participants: new Map()
      });
    }

    const room = rooms.get(sessionId)!;
    // Set host if not already set
    if (isHost && !room.hostId) room.hostId = socket.id;
    
    room.participants.set(socket.id, { ...user, vote: null });

    io.to(sessionId).emit("room-sync", {
      currentIssue: room.currentIssue,
      revealed: room.revealed,
      participants: Array.from(room.participants.entries()).map(([id, data]) => ({ id, ...data }))
    });
  });

  // Host launches a new issue into the arena
  socket.on("set-issue", ({ sessionId, issue }) => {
    const room = rooms.get(sessionId);
    if (room && room.hostId === socket.id) {
      room.currentIssue = issue;
      room.revealed = false;
      // Reset votes
      room.participants.forEach(p => p.vote = null);
      io.to(sessionId).emit("issue-changed", { issue });
      io.to(sessionId).emit("room-sync", {
        currentIssue: room.currentIssue,
        revealed: room.revealed,
        participants: Array.from(room.participants.entries()).map(([id, data]) => ({ id, ...data }))
      });
    }
  });

  socket.on("cast-vote", ({ sessionId, value }) => {
    const room = rooms.get(sessionId);
    if (room && room.participants.has(socket.id)) {
      const participant = room.participants.get(socket.id);
      if (participant) {
        participant.vote = value;
        io.to(sessionId).emit("vote-registered", { userId: socket.id, value });
      }
    }
  });

  socket.on("reveal-votes", (sessionId) => {
    const room = rooms.get(sessionId);
    if (room && room.hostId === socket.id) {
      room.revealed = true;
      io.to(sessionId).emit("votes-revealed");
    }
  });

  socket.on("submit-to-jira", async ({ sessionId, issueKey, points }) => {
    const room = rooms.get(sessionId);
    if (room && room.hostId === socket.id) {
      try {
        await updateStoryPoints(issueKey, points);
        io.to(sessionId).emit("jira-success", { issueKey, points });
      } catch (err) {
        socket.emit("jira-error", "Failed to sync with Jira");
      }
    }
  });

  socket.on("disconnect", () => {
    // Cleanup logic for disconnected users
    rooms.forEach((room, sessionId) => {
      if (room.participants.has(socket.id)) {
        room.participants.delete(socket.id);
        io.to(sessionId).emit("user-left", socket.id);
      }
    });
  });
});

httpServer.listen(3001, () => console.log("Socket server running on port 3001"));