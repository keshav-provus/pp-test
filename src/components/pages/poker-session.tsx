"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiUsers, FiEye, FiCheckCircle, FiCopy } from "react-icons/fi";
import { toast } from "sonner";
import { getSocket } from "@/lib/socket"; // Background socket singleton
import { updateStoryPoints } from "../../../services/jira";

type PokerSessionProps = {
  sessionId: string;
  user: { id: string; name: string };
  currentIssue: { key: string; summary: string };
  onReturnToSelector: () => void;
};

export const PokerSession = ({ sessionId, user, currentIssue, onReturnToSelector }: PokerSessionProps) => {
  type Player = { name: string; vote: number | null };
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [myVote, setMyVote] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const socket = getSocket();

  const cardValues = [1, 2, 3, 5, 8, 13, 21];

  useEffect(() => {
    // 5. Reuse socket connection: Join new room without disconnecting
    socket.emit("join-room", { sessionId, user });

    socket.on("user-joined", ({ user: newUser }: { user: { id: string; name: string } }) => {
      setPlayers(prev => ({ ...prev, [newUser.id]: { name: newUser.name, vote: null } }));
    });

    socket.on(
      "vote-update",
      ({ userId, value }: { userId: string; value: number | null }) => {
        setPlayers(prev => ({ ...prev, [userId]: { ...prev[userId], vote: value } }));
      }
    );

    socket.on("reveal-votes", () => setIsRevealed(true));

    socket.on("clear-votes", () => {
      setIsRevealed(false);
      setMyVote(null);
      setPlayers(prev => {
        const reset = { ...prev };
        Object.keys(reset).forEach(id => reset[id].vote = null);
        return reset;
      });
    });

    return () => {
      socket.off("user-joined");
      socket.off("vote-update");
      socket.off("reveal-votes");
    };
  }, [sessionId]);

  const handleVote = (value: number) => {
    setMyVote(value);
    socket.emit("submit-vote", { sessionId, userId: user.id, value });
  };

  const handleSaveToJira = async () => {
    const toastId = toast.loading("Updating Jira Story Points...");
    try {
      // 4. Update Story Points in JIRA
      await updateStoryPoints(currentIssue.key, myVote || 0);
      toast.success("Jira updated successfully!", { id: toastId });
      // 5. Host redirected to selector to vote on next issue
      onReturnToSelector(); 
    } catch (err) {
      toast.error("Failed to update Jira");
    }
  };

  return (
    <div className="flex flex-col h-full gap-6 p-6 bg-[#0a0a0a] text-white">
      {/* 3. Detailed Issue Info Header */}
      <div className="flex justify-between items-center bg-white/5 p-6 rounded-3xl border border-white/10">
        <div>
          <h1 className="text-lime-400 font-black text-xs tracking-widest uppercase">{currentIssue.key}</h1>
          <h2 className="text-xl font-bold mt-1">{currentIssue.summary}</h2>
          <div className="flex items-center gap-2 mt-2 text-zinc-500 text-[10px] font-black uppercase">
            <FiUsers /> {Object.keys(players).length} PARTICIPANTS
          </div>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => { navigator.clipboard.writeText(sessionId); toast.success("ID Copied"); }}
            className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all"
          >
            <FiCopy />
          </button>
          {!isRevealed ? (
            <button onClick={() => socket.emit("reveal-action", sessionId)} className="px-8 bg-lime-400 text-black rounded-2xl font-black uppercase text-[10px] flex items-center gap-2">
              <FiEye /> REVEAL VOTES
            </button>
          ) : (
            <button onClick={handleSaveToJira} className="px-8 bg-emerald-500 text-black rounded-2xl font-black uppercase text-[10px] flex items-center gap-2">
              <FiCheckCircle /> SUBMIT TO JIRA
            </button>
          )}
        </div>
      </div>

      {/* Arena View */}
      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6">
        {Object.entries(players).map(([id, p]: [string, { name: string; vote: number | null }]) => (
          <div key={id} className={`aspect-[3/4] rounded-[32px] border-2 flex flex-col items-center justify-center gap-4 transition-all ${p.vote ? "border-lime-400 bg-lime-400/5 shadow-lg" : "border-white/10 bg-white/5"}`}>
            <span className="text-[10px] font-black uppercase text-zinc-600">{p.name}</span>
            <span className="text-5xl font-black italic">{isRevealed ? p.vote || "?" : p.vote ? "✓" : "..."}</span>
          </div>
        ))}
      </div>

      {/* Voting Cards */}
      <div className="bg-black/40 border border-white/10 p-8 rounded-[40px] flex justify-center gap-4">
        {cardValues.map(val => (
          <button
            key={val}
            disabled={isRevealed}
            onClick={() => handleVote(val)}
            className={`w-16 h-24 rounded-2xl border-2 font-black italic text-2xl transition-all ${myVote === val ? "bg-lime-400 border-lime-400 text-black scale-110" : "bg-white/5 border-white/10 hover:border-lime-400/50"}`}
          >
            {val}
          </button>
        ))}
      </div>
    </div>
  );
};