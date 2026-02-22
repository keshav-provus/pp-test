"use client";

import React, { useEffect, useState, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";
import { FiUsers, FiEye, FiRotateCcw, FiCheckCircle, FiArrowLeft } from "react-icons/fi";
import { toast } from "sonner";
import { updateStoryPoints } from "../../services/jira";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface User {
  id: string;
  name: string;
}

interface PokerSessionProps {
  sessionId: string;
  user: User;
  currentIssue: {
    key: string;
    summary: string;
    // Add other fields as needed
  };
  onReturnToSelector: () => void;
}

export const PokerSession = ({ sessionId, user, currentIssue, onReturnToSelector }: PokerSessionProps) => {
  interface PlayerPresence {
    userId: string;
    name: string;
    online_at: string;
    vote: number | null;
  }

  const [players, setPlayers] = useState<Record<string, PlayerPresence[]>>({});
  const [myVote, setMyVote] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isHost, setIsHost] = useState(false);

  const cardValues = [1, 2, 3, 5, 8, 13, 21];

  useEffect(() => {
    const channel = supabase.channel(`poker:${sessionId}`, {
      config: { broadcast: { self: true }, presence: { key: user.id } },
    });

    channel
      .on("broadcast", { event: "submit-vote" }, ({ payload }) => {
        setPlayers((prev) => ({
          ...prev,
          [payload.userId]: { ...prev[payload.userId], vote: payload.value },
        }));
      })
      .on("broadcast", { event: "reveal-action" }, ({ payload }) => {
        setIsRevealed(payload.reveal);
        if (!payload.reveal) {
          setMyVote(null);
          setPlayers((prev) => {
            const reset = { ...prev };
            Object.keys(reset).forEach((id) => {
              reset[id] = reset[id].map((player: PlayerPresence) => ({
                ...player,
                vote: null,
              }));
            });
            return reset;
          });
        }
      })
      .on("broadcast", { event: "redirect-to-selector" }, () => {
        onReturnToSelector();
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        // Map the raw presence state to PlayerPresence[]
        const mappedPlayers: Record<string, PlayerPresence[]> = {};
        Object.entries(state).forEach(([key, presences]) => {
          mappedPlayers[key] = (presences as unknown[])
            .map((p) => p as PlayerPresence)
            .filter((p) => p.userId && p.name && p.online_at)
            .map((p) => ({
              userId: p.userId,
              name: p.name,
              online_at: p.online_at,
              vote: typeof p.vote === "number" ? p.vote : null,
            }));
        });
        setPlayers(mappedPlayers);

        // Determine host: the oldest participant in the session
        const allPresences = Object.values(mappedPlayers).flat();
        const sorted = allPresences.sort((a, b) => 
          new Date(a.online_at).getTime() - new Date(b.online_at).getTime()
        );
        setIsHost(sorted[0]?.userId === user.id);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            userId: user.id,
            name: user.name,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => { supabase.removeChannel(channel); };
  }, [sessionId, user, onReturnToSelector]);

  const handleVote = async (value: number) => {
    setMyVote(value);
    await supabase.channel(`poker:${sessionId}`).send({
      type: "broadcast",
      event: "submit-vote",
      payload: { userId: user.id, value },
    });
  };

  const handleReveal = async () => {
    if (!isHost) return;
    await supabase.channel(`poker:${sessionId}`).send({
      type: "broadcast",
      event: "reveal-action",
      payload: { reveal: !isRevealed },
    });
  };

  const handleSaveAndExit = async () => {
    if (!isHost || !myVote) return;
    const toastId = toast.loading("Saving estimate to Jira...");
    try {
      await updateStoryPoints(currentIssue.key, myVote);
      toast.success("Jira Updated", { id: toastId });
      
      // Notify everyone to return to the board
      await supabase.channel(`poker:${sessionId}`).send({
        type: "broadcast",
        event: "redirect-to-selector",
        payload: {}
      });
    } catch (err) {
      toast.error("Failed to update Jira", { id: toastId });
    }
  };

  return (
    <div className="flex flex-col h-full gap-6 p-6 bg-[#0a0a0a]">
      <div className="flex justify-between items-center bg-white/5 p-4 rounded-3xl border border-white/10">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-lime-400 uppercase tracking-widest">{currentIssue.key}</span>
          <span className="text-sm font-bold text-white line-clamp-1">{currentIssue.summary}</span>
        </div>
        
        {isHost && (
          <div className="flex gap-3">
            <button onClick={handleReveal} className="flex items-center gap-2 px-6 py-2 bg-white/10 rounded-xl text-[10px] font-black uppercase hover:bg-white/20 transition-all">
              {isRevealed ? <FiRotateCcw /> : <FiEye />} {isRevealed ? "RESET" : "REVEAL"}
            </button>
            {isRevealed && (
              <button onClick={handleSaveAndExit} className="flex items-center gap-2 px-6 py-2 bg-lime-400 text-black rounded-xl text-[10px] font-black uppercase hover:bg-white transition-all">
                <FiCheckCircle /> SAVE & NEXT
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6 place-content-center">
        {Object.entries(players).map(([id, presence]: [string, PlayerPresence[]]) => {
          const p = presence[0];
          const hasVoted = p.vote !== null;
          return (
            <div key={id} className={`aspect-[3/4] rounded-[32px] border-2 flex flex-col items-center justify-center gap-4 transition-all ${hasVoted ? "border-lime-400 bg-lime-400/5 shadow-lg" : "border-white/10 bg-white/5"}`}>
              <span className="text-[10px] font-black uppercase text-zinc-500">{p.name} {p.userId === user.id && "(YOU)"}</span>
              <span className="text-4xl font-black italic">{isRevealed ? p.vote || "?" : hasVoted ? "✓" : "..."}</span>
            </div>
          );
        })}
      </div>

      <div className="bg-black/40 border border-white/10 p-6 rounded-[40px]">
        <div className="flex justify-center gap-3 flex-wrap">
          {cardValues.map((val) => (
            <button key={val} disabled={isRevealed} onClick={() => handleVote(val)} className={`w-14 h-20 rounded-2xl border-2 font-black italic text-xl transition-all ${myVote === val ? "bg-lime-400 border-lime-400 text-black scale-110" : "bg-white/5 border-white/10 text-white hover:border-lime-400/50"}`}>
              {val}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};