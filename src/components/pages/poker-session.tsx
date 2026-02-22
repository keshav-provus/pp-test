"use client";

import React, { useEffect, useState, useRef } from "react";
import { createClient, RealtimeChannel } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";
import { FiEye, FiRotateCcw, FiCheckCircle, FiCopy, FiUsers, FiArrowRight } from "react-icons/fi";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { updateStoryPoints } from "../../../services/jira";

// Initialize outside component to prevent re-creation
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- STRICT TYPES ---
export interface Issue {
  key: string;
  summary: string;
  [key: string]: unknown; // Catch-all for extra Jira fields if needed
}

export interface Player {
  name: string;
  vote: number | null;
  isHost: boolean;
}

export interface PokerSessionProps {
  sessionId: string;
  user: { id: string; name: string };
  isHost: boolean;
}

export const PokerSession = ({ sessionId, user, isHost }: PokerSessionProps) => {
  const router = useRouter();
  
  // State
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [currentIssue, setCurrentIssue] = useState<Issue | null>(null);
  const [myVote, setMyVote] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  
  // Refs to prevent stale closures and infinite re-renders in WebSockets
  const activeChannelRef = useRef<RealtimeChannel | null>(null);
  const currentIssueRef = useRef<Issue | null>(null);

  const cardValues = [1, 2, 3, 5, 8, 13, 21];

  // Keep ref in sync with state for the socket callbacks to read without re-binding
  useEffect(() => {
    currentIssueRef.current = currentIssue;
  }, [currentIssue]);

  // ✅ HOST LOGIC: Load the issue from SessionStorage safely (SSR Friendly)
  useEffect(() => {
    if (isHost && typeof window !== "undefined") {
      try {
        const savedIssue = sessionStorage.getItem(`poker_issue_${sessionId}`);
        if (savedIssue) {
          const parsedIssue = JSON.parse(savedIssue);
          setTimeout(() => {
            setCurrentIssue(parsedIssue);
          }, 0);
          
          // If the channel is already connected, broadcast this loaded issue
          if (activeChannelRef.current?.state === "joined") {
            activeChannelRef.current.send({
              type: "broadcast",
              event: "set-issue",
              payload: { issue: parsedIssue }
            });
          }
        }
      } catch (err) {
        console.error("Failed to parse issue from session storage", err);
      }
    }
  }, [isHost, sessionId]);

  // ✅ SOCKET LIFECYCLE: Connect once, rely on Refs for dynamic data
  useEffect(() => {
    const channel = supabase.channel(`poker-${sessionId}`, {
      config: { broadcast: { self: true }, presence: { key: user.id } },
    });

    activeChannelRef.current = channel;

    channel
      .on("broadcast", { event: "cast-vote" }, ({ payload }: { payload: { userId: string, value: number } }) => {
        setPlayers((prev) => ({
          ...prev,
          [payload.userId]: { ...prev[payload.userId], vote: payload.value }
        }));
      })
      .on("broadcast", { event: "reveal-votes" }, () => setIsRevealed(true))
      .on("broadcast", { event: "set-issue" }, ({ payload }: { payload: { issue: Issue } }) => {
        setCurrentIssue(payload.issue);
        setIsRevealed(false);
        setMyVote(null);
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const currentPlayers: Record<string, Player> = {};
        
        Object.keys(state).forEach((key) => {
          // Assert type safely from Supabase presence shape
          const presenceData = state[key][0] as unknown as Player;
          if (presenceData) {
            currentPlayers[key] = {
              name: presenceData.name,
              vote: presenceData.vote,
              isHost: presenceData.isHost
            };
          }
        });
        setPlayers(currentPlayers);
      })
      .on("presence", { event: "join" }, () => {
        // Late joiner fix: use the ref so we don't need to put currentIssue in the dependency array
        if (isHost && currentIssueRef.current) {
          channel.send({
            type: "broadcast",
            event: "set-issue",
            payload: { issue: currentIssueRef.current }
          });
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ name: user.name, vote: null, isHost });
          
          if (isHost && currentIssueRef.current) {
             channel.send({
               type: "broadcast",
               event: "set-issue",
               payload: { issue: currentIssueRef.current }
             });
          }
        }
      });

    return () => { 
      supabase.removeChannel(channel); 
      activeChannelRef.current = null;
    };
  }, [sessionId, user.id, user.name, isHost]); // Removed currentIssue dependency!

  // --- ACTIONS ---

  const handleVote = async (value: number) => {
    if (isRevealed || !activeChannelRef.current) return;
    setMyVote(value);
    
    await activeChannelRef.current.track({ name: user.name, vote: value, isHost });
    await activeChannelRef.current.send({
      type: "broadcast",
      event: "cast-vote",
      payload: { userId: user.id, value }
    });
  };

  const handleReveal = async () => {
    if (!activeChannelRef.current) return;
    setIsRevealed(true);
    await activeChannelRef.current.send({ type: "broadcast", event: "reveal-votes" });
  };

  const handleSaveToJira = async (points: number) => {
    if (!currentIssue) return;
    
    const tid = toast.loading(`Updating ${currentIssue.key} in Jira...`);
    try {
      await updateStoryPoints(currentIssue.key, points);
      toast.success(`${currentIssue.key} updated successfully!`, { id: tid });
    } catch (err) {
      toast.error("Failed to sync with Jira", { id: tid });
    }
  };

  const handleNextIssue = () => {
    router.push(`/dashboard?step=launch&sessionId=${sessionId}`);
  };

  // ✅ Show Loading Screen
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
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => { navigator.clipboard.writeText(sessionId); toast.success("ID Copied!"); }}
            className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors"
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
      
      {/* PLAYERS GRID */}
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

      {/* VOTING CARDS */}
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

       {/* Host Save to Jira */}
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