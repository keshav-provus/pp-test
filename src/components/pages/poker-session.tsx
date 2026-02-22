"use client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiUsers, FiEye, FiCheckCircle, FiCopy, FiArrowRight } from "react-icons/fi";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client"; // ✅ Updated Import
import { updateStoryPoints } from "../../../services/jira"; 
import { motion, AnimatePresence } from "framer-motion";

interface PokerSessionProps {
  sessionId: string;
  user: { id: string; name: string };
  isHost: boolean;
}

export const PokerSession = ({ sessionId, user, isHost }: PokerSessionProps) => {
  const router = useRouter();
  const supabase = createClient(); // ✅ Updated Instantiation
  
  interface Player {
    name: string;
    vote: number | null;
    isHost: boolean;
  }
  
    const [players, setPlayers] = useState<Record<string, Player>>({});
  interface Issue {
    key: string;
    summary: string;
    // Add other fields as needed
  }
  const [currentIssue, setCurrentIssue] = useState<Issue | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [myVote, setMyVote] = useState<number | null>(null);
  // Import the type for Supabase RealtimeChannel


  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  const cardValues = [1, 2, 3, 5, 8, 13, 21];

  useEffect(() => {
    // 1. Initialize Supabase Room
    const room = supabase.channel(`poker-${sessionId}`, {
      config: {
        presence: { key: user.id },
        broadcast: { self: true }, 
      },
    });

    // 2. Presence: Handle Users Joining/Leaving seamlessly
    room.on("presence", { event: "sync" }, () => {
      const state = room.presenceState();
      const currentPlayers: Record<string, Player> = {};
      
      Object.keys(state).forEach((key) => {
        const presence = state[key][0] as Partial<Player> & { presence_ref: string };
        currentPlayers[key] = {
          name: presence.name ?? "Unknown",
          vote: presence.vote ?? null,
          isHost: presence.isHost ?? false,
        }; // Ensure Player shape
      });
      setPlayers(currentPlayers);
    });

    // 3. Broadcast: Handle Realtime Actions
    room.on("broadcast", { event: "cast-vote" }, ({ payload }) => {
      setPlayers((prev) => ({
        ...prev,
        [payload.userId]: { ...prev[payload.userId], vote: payload.value }
      }));
    });

    room.on("broadcast", { event: "reveal-votes" }, () => setIsRevealed(true));

    room.on("broadcast", { event: "set-issue" }, ({ payload }) => {
      setCurrentIssue(payload.issue);
      setIsRevealed(false);
      setMyVote(null);
      // Update our own presence to reset our vote visibility
      room.track({ name: user.name, vote: null, isHost });
      toast.info(`New issue launched: ${payload.issue.key}`);
    });

    // 4. Subscribe & Announce
    room.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        setChannel(room);
        await room.track({ name: user.name, vote: null, isHost });
      }
    });

    // Fetch initial issue if joining late (Optional depending on your setup)
    // You could fetch this from your DB or rely on the host's next broadcast

    return () => {
      supabase.removeChannel(room);
    };
  }, [sessionId, supabase, user.id, user.name, isHost]);

  // Actions
  const handleVote = async (value: number) => {
    if (isRevealed || !channel) return;
    setMyVote(value);
    
    // Update our presence state
    await channel.track({ name: user.name, vote: value, isHost });
    
    // Broadcast to everyone
    await channel.send({
      type: "broadcast",
      event: "cast-vote",
      payload: { userId: user.id, value }
    });
  };

  const handleReveal = async () => {
    if (!channel) return;
    setIsRevealed(true);
    await channel.send({ type: "broadcast", event: "reveal-votes" });
  };

  const handleSaveToJira = async (points: number) => {
    if (!currentIssue) {
      toast.error("No issue selected.");
      return;
    }
    const tid = toast.loading("Updating Jira...");
    try {
      await updateStoryPoints(currentIssue.key, points);
      toast.success(`${currentIssue.key} updated!`, { id: tid });
    } catch (err) {
      toast.error("Failed to sync with Jira", { id: tid });
    }
  };

  const handleNextIssue = () => {
    // Reuses the session. The room stays open.
    router.push(`/dashboard?step=launch&sessionId=${sessionId}`);
  };

  if (!currentIssue) {
    return (
      <div className="h-full flex items-center justify-center text-lime-400 font-black animate-pulse bg-[#0a0a0a]">
        WAITING FOR HOST TO LAUNCH ISSUE...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-6 p-6 text-white max-w-7xl mx-auto">
      {/* Header Controls */}
      <div className="flex justify-between items-center bg-white/5 p-6 rounded-3xl border border-white/10">
        <div>
          <h1 className="text-lime-400 font-black text-sm tracking-widest uppercase bg-lime-400/10 px-3 py-1 rounded-md inline-block">
            {currentIssue.key}
          </h1>
          <h2 className="text-2xl font-bold mt-2">{currentIssue.summary}</h2>
          <span className="text-zinc-500 text-[10px] font-black uppercase mt-2 flex items-center gap-2">
            <FiUsers /> {Object.keys(players).length} IN ARENA | ID: {sessionId}
          </span>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => { navigator.clipboard.writeText(sessionId); toast.success("Copied!"); }}
            className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10"
          >
            <FiCopy />
          </button>

          {isHost && (
            <>
              {!isRevealed ? (
                <button onClick={handleReveal} className="px-8 bg-lime-400 text-black rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 hover:bg-white transition-colors">
                  <FiEye /> REVEAL
                </button>
              ) : (
                <button onClick={handleNextIssue} className="px-8 bg-zinc-800 text-white rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 hover:bg-zinc-700 transition-colors">
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
          {Object.entries(players).map(([id, p]: [string, Player]) => (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              key={id} 
              className={`aspect-[3/4] rounded-[32px] border-2 flex flex-col items-center justify-center gap-4 transition-all ${p.vote ? "border-lime-400 bg-lime-400/5 shadow-[0_0_30px_rgba(163,230,53,0.1)]" : "border-white/10 bg-white/5"}`}
            >
              <span className="text-[10px] font-black uppercase text-zinc-500">{p.name?.split(' ')[0]}</span>
              <span className="text-6xl font-black italic text-white">
                {isRevealed ? p.vote || "-" : p.vote ? "✓" : "..."}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Voting Cards */}
      <div className="bg-black/40 border border-white/10 p-6 rounded-[40px] flex justify-center gap-4 overflow-x-auto">
        {cardValues.map(val => (
          <button
            key={val}
            disabled={isRevealed}
            onClick={() => handleVote(val)}
            className={`min-w-16 h-24 shrink-0 rounded-2xl border-2 font-black italic text-2xl transition-all ${myVote === val ? "bg-lime-400 border-lime-400 text-black scale-110" : "bg-white/5 border-white/10 text-white hover:border-lime-400/50"}`}
          >
            {val}
          </button>
        ))}
      </div>

      {/* Host Save to Jira (Only shows after reveal) */}
      {isHost && isRevealed && (
        <div className="fixed bottom-36 left-1/2 -translate-x-1/2 bg-zinc-900 border border-white/10 p-4 rounded-3xl flex items-center gap-4 shadow-2xl">
          <span className="text-xs font-bold uppercase text-zinc-400 flex items-center gap-2">
             <FiCheckCircle /> Submit to Jira:
          </span>
          {cardValues.map(val => (
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