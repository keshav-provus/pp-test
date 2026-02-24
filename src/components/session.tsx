"use client";

import React, { useEffect, useState } from "react";
// Using your standard supabase-js client setup
import { createClient, RealtimeChannel } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";
import { FiEye, FiRotateCcw, FiCheckCircle } from "react-icons/fi";
import { toast } from "sonner";
import { updateStoryPoints } from "../../services/jira";

// Initialize outside component to prevent re-creation on renders
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
  };
  onReturnToSelector: () => void;
}

interface PlayerPresence {
  userId: string;
  name: string;
  online_at: string;
  vote: number | null;
}

export const PokerSession = ({ 
  sessionId, 
  user, 
  currentIssue, 
  onReturnToSelector 
}: PokerSessionProps) => {
  
  const [players, setPlayers] = useState<Record<string, PlayerPresence[]>>({});
  const [myVote, setMyVote] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isHost, setIsHost] = useState(false);
  
  // ✅ Store the active channel instance in state
  const [activeChannel, setActiveChannel] = useState<RealtimeChannel | null>(null);

  const cardValues = [1, 2, 3, 5, 8, 13, 21];

  useEffect(() => {
    // 1. Create the channel
    const channel = supabase.channel(`poker:${sessionId}`, {
      config: { broadcast: { self: true }, presence: { key: user.id } },
    });

    // 2. Save it to state after successful subscription

    channel
      .on("broadcast", { event: "submit-vote" }, ({ payload }) => {
        setPlayers((prev) => ({
          ...prev,
          [payload.userId]: [
            { 
              ...(prev[payload.userId]?.[0] || {}), 
              vote: payload.value 
            } as PlayerPresence
          ],
        }));
      })
      .on("broadcast", { event: "reveal-action" }, ({ payload }) => {
        setIsRevealed(payload.reveal);
        if (!payload.reveal) {
          setMyVote(null);
          setPlayers((prev) => {
            const reset = { ...prev };
            Object.keys(reset).forEach((id) => {
              if (reset[id]?.[0]) {
                reset[id][0].vote = null;
              }
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
        
        setPlayers((prev) => {
          const mappedPlayers: Record<string, PlayerPresence[]> = {};
          
          Object.entries(state).forEach(([key, presences]) => {
            mappedPlayers[key] = (presences as unknown[])
              .filter(
                (p: unknown): p is { userId: string; name: string; online_at: string; vote?: number | null } => {
                  if (typeof p !== "object" || p === null) return false;
                  const obj = p as { [key: string]: unknown };
                  return (
                    typeof obj.userId === "string" &&
                    typeof obj.name === "string" &&
                    typeof obj.online_at === "string"
                  );
                }
              )
              .map((p) => ({
                userId: p.userId,
                name: p.name,
                online_at: p.online_at,
                // ✅ Crucial: Preserve existing votes during presence syncs
                vote: prev[key]?.[0]?.vote ?? (typeof p.vote === "number" ? p.vote : null),
              }));
          });

          // Determine host dynamically based on who has been in the room the longest
          const allPresences = Object.values(mappedPlayers).flat();
          const sorted = allPresences.sort((a, b) => 
            new Date(a.online_at).getTime() - new Date(b.online_at).getTime()
          );
          
          setIsHost(sorted[0]?.userId === user.id);
          return mappedPlayers;
        });
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          setActiveChannel(channel);
          await channel.track({
            userId: user.id,
            name: user.name,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [sessionId, user, onReturnToSelector]);

  // --- ACTIONS ---

  const handleVote = async (value: number) => {
    if (!activeChannel) return;
    setMyVote(value);
    
    // ✅ Use the stored activeChannel to send the broadcast
    await activeChannel.send({
      type: "broadcast",
      event: "submit-vote",
      payload: { userId: user.id, value },
    });
  };

  const handleReveal = async () => {
    if (!isHost || !activeChannel) return;
    
    await activeChannel.send({
      type: "broadcast",
      event: "reveal-action",
      payload: { reveal: !isRevealed },
    });
  };

  const handleSaveAndExit = async () => {
    if (!isHost || !activeChannel) return;
    
    // Fallback: Use the host's vote as the final estimate
    if (!myVote) {
        toast.error("Host must cast a final vote before saving.");
        return;
    }

    const toastId = toast.loading("Saving estimate to Jira...");
    try {
      await updateStoryPoints(currentIssue.key, myVote);
      toast.success("Jira Updated", { id: toastId });
      
      // ✅ Notify everyone to return to the board
      await activeChannel.send({
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
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white/5 p-4 rounded-3xl border border-white/10">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-lime-400 uppercase tracking-widest">{currentIssue.key}</span>
          <span className="text-sm font-bold text-white line-clamp-1">{currentIssue.summary}</span>
        </div>
        
        {isHost && (
          <div className="flex gap-3">
            <button onClick={handleReveal} className="flex items-center gap-2 px-6 py-2 bg-white/10 rounded-xl text-[10px] font-black uppercase hover:bg-white/20 transition-all text-white">
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

      {/* PLAYERS GRID */}
      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6 place-content-center">
        <AnimatePresence>
          {Object.entries(players).map(([id, presence]) => {
            const p = presence[0];
            if (!p) return null;
            
            const hasVoted = p.vote !== null && p.vote !== undefined;
            
            return (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={id} 
                className={`aspect-[3/4] rounded-[32px] border-2 flex flex-col items-center justify-center gap-4 transition-all ${hasVoted ? "border-lime-400 bg-lime-400/5 shadow-[0_0_30px_rgba(163,230,53,0.1)] text-white" : "border-white/10 bg-white/5 text-zinc-500"}`}
              >
                <span className="text-[10px] font-black uppercase">
                  {p.name?.split(' ')[0]} {p.userId === user.id && "(YOU)"}
                </span>
                <span className="text-6xl font-black italic text-white">
                  {isRevealed ? p.vote || "-" : hasVoted ? "✓" : "..."}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* VOTING CARDS */}
      <div className="bg-black/40 border border-white/10 p-6 rounded-[40px] overflow-x-auto flex justify-center">
        <div className="flex justify-center gap-3 flex-wrap min-w-max">
          {cardValues.map((val) => (
            <button 
              key={val} 
              disabled={isRevealed} 
              onClick={() => handleVote(val)} 
              className={`w-14 h-20 shrink-0 rounded-2xl border-2 font-black italic text-xl transition-all ${myVote === val ? "bg-lime-400 border-lime-400 text-black scale-110 shadow-lg shadow-lime-400/20" : "bg-white/5 border-white/10 text-white hover:border-lime-400/50 hover:bg-white/10"}`}
            >
              {val}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};