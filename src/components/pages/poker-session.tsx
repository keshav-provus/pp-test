"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiUsers,
  FiEye,
  FiCheckCircle,
  FiCopy,
  FiArrowRight,
} from "react-icons/fi";
import { toast } from "sonner";
import { getSocket } from "@/lib/socket";
import { motion, AnimatePresence } from "framer-motion";

interface PokerSessionProps {
  sessionId: string;
  user: {
    id: string;
    name: string;
    // Add other user fields as needed
  };
  isHost: boolean;
}

interface Player {
  id: string;
  name: string;
  vote?: number | null;
  // Add other player fields as needed
}

export const PokerSession = ({
  sessionId,
  user,
  isHost,
}: PokerSessionProps) => {
  const router = useRouter();
  const socket = getSocket();
  const [players, setPlayers] = useState<Player[]>([]);
  interface Issue {
    key: string;
    summary: string;
    // Add other fields as needed
  }

  const [currentIssue, setCurrentIssue] = useState<Issue | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [myVote, setMyVote] = useState<number | null>(null);

  const cardValues = [1, 2, 3, 5, 8, 13, 21];

  useEffect(() => {
    // Ensure connection and join the room
    if (!socket.connected) socket.connect();
    socket.emit("join-room", { sessionId, user, isHost });

    socket.on(
      "room-sync",
      (state: {
        participants: Player[];
        currentIssue: Issue;
        revealed: boolean;
      }) => {
        setPlayers(state.participants);
        setCurrentIssue(state.currentIssue);
        setIsRevealed(state.revealed);

        const me = state.participants.find((p: Player) => p.id === socket.id);
        if (me) setMyVote(me.vote ?? null);
      },
    );

    socket.on("issue-changed", ({ issue }: { issue: Issue }) => {
      toast.info(`New issue launched: ${issue.key}`);
      setCurrentIssue(issue);
      setIsRevealed(false);
      setMyVote(null);
    });

    socket.on("vote-registered", () => {
      // Optimistic update handled in 'room-sync' or locally
      socket.emit("join-room", { sessionId, user, isHost }); // Quick re-sync
    });

    socket.on("votes-revealed", () => setIsRevealed(true));

    socket.on("jira-success", ({ issueKey }: { issueKey: string }) => {
      toast.success(`${issueKey} updated in Jira!`);
    });

    return () => {
      socket.off("room-sync");
      socket.off("issue-changed");
      socket.off("vote-registered");
      socket.off("votes-revealed");
      socket.off("jira-success");
    };
  }, [sessionId, socket, user, isHost]);

  const handleVote = (value: number) => {
    if (isRevealed) return;
    setMyVote(value);
    socket.emit("cast-vote", { sessionId, value });
  };

  const handleSaveToJira = (points: number) => {
    if (!currentIssue) return;
    socket.emit("submit-to-jira", {
      sessionId,
      issueKey: currentIssue.key,
      points,
    });
  };

  const handleNextIssue = () => {
    // Navigates the host back to the selector without dropping the socket connection
    router.push(`/dashboard?step=launch&sessionId=${sessionId}`);
  };

  if (!currentIssue) {
    return (
      <div className="h-full flex items-center justify-center text-lime-400 font-black animate-pulse">
        WAITING FOR HOST TO LAUNCH ISSUE...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-6 p-6 text-white max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center bg-white/5 p-6 rounded-3xl border border-white/10">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-lime-400 font-black text-sm tracking-widest uppercase bg-lime-400/10 px-3 py-1 rounded-md">
              {currentIssue.key}
            </h1>
            <span className="text-zinc-500 text-[10px] font-black uppercase flex items-center gap-2">
              <FiUsers /> {players.length} JOINED | ROOM: {sessionId}
            </span>
          </div>
          <h2 className="text-2xl font-bold mt-2">{currentIssue.summary}</h2>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              navigator.clipboard.writeText(sessionId);
              toast.success("Session ID Copied");
            }}
            className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all"
          >
            <FiCopy />
          </button>

          {isHost && (
            <>
              {!isRevealed ? (
                <button
                  onClick={() => socket.emit("reveal-votes", sessionId)}
                  className="px-8 bg-lime-400 text-black rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 hover:bg-white transition-all"
                >
                  <FiEye /> REVEAL
                </button>
              ) : (
                <button
                  onClick={handleNextIssue}
                  className="px-8 bg-zinc-800 text-white rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 hover:bg-zinc-700 transition-all border border-white/10"
                >
                  NEXT ISSUE <FiArrowRight />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Players Grid */}
      <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-6 content-start">
        <AnimatePresence>
          {players.map((p: Player) => (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              key={p.id}
              className={`aspect-[3/4] rounded-[32px] border-2 flex flex-col items-center justify-center gap-4 transition-all ${p.vote ? "border-lime-400 bg-lime-400/5" : "border-white/10 bg-white/5"}`}
            >
              <span className="text-[10px] font-black uppercase text-zinc-500">
                {p.name?.split(" ")[0]}
              </span>
              <span className="text-6xl font-black italic text-white">
                {isRevealed ? p.vote || "-" : p.vote ? "✓" : "..."}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Voting Controls */}
      <div className="bg-black/40 border border-white/10 p-6 rounded-[40px] flex justify-center gap-4 overflow-x-auto">
        {cardValues.map((val) => (
          <button
            key={val}
            disabled={isRevealed}
            onClick={() => handleVote(val)}
            className={`min-w-16 h-24 shrink-0 rounded-2xl border-2 font-black italic text-2xl transition-all ${myVote === val ? "bg-lime-400 border-lime-400 text-black scale-110" : "bg-white/5 border-white/10 hover:border-lime-400/50 text-white"}`}
          >
            {val}
          </button>
        ))}
      </div>

      {/* Host Final Submission (Only shows after reveal) */}
      {isHost && isRevealed && (
        <div className="fixed bottom-36 left-1/2 -translate-x-1/2 bg-zinc-900 border border-white/10 p-4 rounded-3xl flex items-center gap-4 shadow-2xl">
          <span className="text-xs font-bold uppercase text-zinc-400">
            Final Decision:
          </span>
          {cardValues.map((val) => (
            <button
              key={`final-${val}`}
              onClick={() => handleSaveToJira(val)}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-emerald-500 hover:text-black font-black transition-all text-sm"
            >
              {val}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
