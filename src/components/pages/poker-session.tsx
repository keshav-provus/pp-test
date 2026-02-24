"use client";

import React, { useEffect, useState, useRef } from "react";
import { createClient, RealtimeChannel } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";
import { FiEye, FiRotateCcw, FiCheckCircle, FiCopy, FiUsers, FiArrowRight } from "react-icons/fi";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { updateStoryPoints } from "../../../services/jira";
import { useTheme } from "next-themes";
import { useColor } from "@/context/ColorContext";

// Initialize outside component
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- STRICT TYPES ---
export interface Issue {
  key: string;
  summary: string;
  [key: string]: unknown;
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
  const { theme } = useTheme();
  const { primaryColor } = useColor();
  
  // State
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [currentIssue, setCurrentIssue] = useState<Issue | null>(null);
  const [myVote, setMyVote] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [meetLink, setMeetLink] = useState<string | null>(null);
  const [jiraUpdatedValue, setJiraUpdatedValue] = useState<number | null>(null);

  const activeChannelRef = useRef<RealtimeChannel | null>(null);
  const currentIssueRef = useRef<Issue | null>(null);

  const cardValues = [1, 2, 3, 5, 8, 13, 21];

  // Consensus & Stats Logic
  const getNumericVotes = () => Object.values(players).map(p => p.vote).filter((v): v is number => typeof v === "number");
  const computeAverage = () => {
    const vals = getNumericVotes();
    return vals.length === 0 ? null : vals.reduce((a, b) => a + b, 0) / vals.length;
  };
  const minVote = getNumericVotes().length ? Math.min(...getNumericVotes()) : null;
  const maxVote = getNumericVotes().length ? Math.max(...getNumericVotes()) : null;
  const averageVote = computeAverage();
  const voteDifference = minVote !== null && maxVote !== null ? maxVote - minVote : null;
  const needsDiscussion = isRevealed && voteDifference !== null && voteDifference > 0;

  useEffect(() => { currentIssueRef.current = currentIssue; }, [currentIssue]);

  // Socket & Host Logic (Unchanged to preserve functionality)
  useEffect(() => {
    if (isHost && typeof window !== "undefined") {
      const savedIssue = sessionStorage.getItem(`poker_issue_${sessionId}`);
      if (savedIssue) {
        const parsedIssue = JSON.parse(savedIssue);
        setTimeout(() => setCurrentIssue(parsedIssue), 0);
      }
    }
  }, [isHost, sessionId]);

  useEffect(() => {
    const channel = supabase.channel(`poker-${sessionId}`, {
      config: { broadcast: { self: true }, presence: { key: user.id } },
    });
    activeChannelRef.current = channel;
    channel
      .on("broadcast", { event: "meet-link" }, ({ payload }) => setMeetLink(payload.url))
      .on("broadcast", { event: "cast-vote" }, ({ payload }) => {
        setPlayers((prev) => ({ ...prev, [payload.userId]: { ...prev[payload.userId], vote: payload.value } }));
      })
      .on("broadcast", { event: "reset-votes" }, () => {
        setIsRevealed(false); setMyVote(null);
        setPlayers(prev => {
          const copy: Record<string, Player> = {};
          Object.entries(prev).forEach(([k, v]) => { copy[k] = { ...v, vote: null }; });
          return copy;
        });
      })
      .on("broadcast", { event: "reveal-votes" }, () => setIsRevealed(true))
      .on("broadcast", { event: "set-issue" }, ({ payload }) => {
        setCurrentIssue(payload.issue); setIsRevealed(false); setMyVote(null);
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const currentPlayers: Record<string, Player> = {};
        Object.keys(state).forEach((key) => {
          const presenceData = state[key][0] as unknown as Player;
          if (presenceData) currentPlayers[key] = { name: presenceData.name, vote: presenceData.vote, isHost: presenceData.isHost };
        });
        setPlayers(currentPlayers);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ name: user.name, vote: null, isHost });
          if (isHost && currentIssueRef.current) channel.send({ type: "broadcast", event: "set-issue", payload: { issue: currentIssueRef.current } });
        }
      });
    return () => { supabase.removeChannel(channel); activeChannelRef.current = null; };
  }, [sessionId, user.id, user.name, isHost]);

  // Actions
  const handleVote = async (value: number) => {
    if (isRevealed || !activeChannelRef.current) return;
    setMyVote(value);
    await activeChannelRef.current.track({ name: user.name, vote: value, isHost });
    await activeChannelRef.current.send({ type: "broadcast", event: "cast-vote", payload: { userId: user.id, value } });
  };

  const handleReveal = async () => { if (activeChannelRef.current) { setIsRevealed(true); await activeChannelRef.current.send({ type: "broadcast", event: "reveal-votes" }); } };
  const handleReset = async () => {
    if (!activeChannelRef.current) return;
    setIsRevealed(false); setMyVote(null);
    setPlayers(prev => {
      const copy: Record<string, Player> = {};
      Object.entries(prev).forEach(([k, v]) => { copy[k] = { ...v, vote: null }; });
      return copy;
    });
    await activeChannelRef.current.send({ type: "broadcast", event: "reset-votes" });
  };

  const handleSaveToJira = async (points: number) => {
    if (!currentIssue) return;
    const tid = toast.loading(`Updating ${currentIssue.key}...`);
    try {
      await updateStoryPoints(currentIssue.key, points);
      toast.success(`${currentIssue.key} updated!`, { id: tid });
      setJiraUpdatedValue(points);
      setTimeout(() => setJiraUpdatedValue(null), 4000);
    } catch (err) { toast.error("Sync failed", { id: tid }); }
  };

  if (!currentIssue) return <div className="h-full flex items-center justify-center text-primary font-black animate-pulse bg-background">WAITING FOR HOST...</div>;

  return (
    <div className="flex flex-col flex-1 gap-6 p-6 text-foreground max-w-7xl mx-auto overflow-y-auto bg-background transition-colors duration-500">
      
      {/* Header Controls */}
      <div className="flex justify-between items-center bg-card p-6 rounded-3xl border border-border shadow-sm">
        <div>
          <h1 className="text-primary font-black text-xs tracking-widest uppercase bg-primary/10 px-3 py-1 rounded-md inline-block">
            {currentIssue.key}
          </h1>
          <h2 className="text-2xl font-black italic uppercase tracking-tighter mt-2">{currentIssue.summary}</h2>
        </div>
        
        <div className="flex gap-3">
          <button onClick={() => { navigator.clipboard.writeText(sessionId); toast.success("ID Copied!"); }} className="p-4 bg-muted rounded-2xl border border-border hover:bg-muted/80 transition-colors">
            <FiCopy />
          </button>
          {isHost && (
            <>
              <button onClick={handleReset} className="p-4 bg-muted rounded-2xl border border-border hover:bg-muted/80 transition-colors"><FiRotateCcw /></button>
              {!isRevealed ? (
                <button onClick={handleReveal} className="px-8 bg-primary text-primary-foreground rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 hover:opacity-90 transition-all">
                  <FiEye /> REVEAL
                </button>
              ) : (
                <button onClick={() => router.push(`/dashboard?step=launch&sessionId=${sessionId}`)} className="px-8 bg-foreground text-background rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 hover:opacity-90 transition-all">
                  NEXT ISSUE <FiArrowRight />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Stats - shown after reveal */}
      {isRevealed && averageVote !== null && (
        <div className="flex gap-4 animate-in slide-in-from-top-2">
          <div className="bg-card border border-border p-4 rounded-2xl flex-1 shadow-sm">
            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Consensus</span>
            <div className="text-3xl font-black italic text-primary">{averageVote.toFixed(1)}</div>
          </div>
          <div className="bg-card border border-border p-4 rounded-2xl flex-1 shadow-sm">
            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Spread</span>
            <div className="text-3xl font-black italic text-foreground">{voteDifference}</div>
          </div>
        </div>
      )}

      {/* Save to Jira Bar */}
      {isHost && isRevealed && averageVote !== null && (
        <div className="bg-card border border-border p-4 rounded-3xl flex items-center gap-4 shadow-xl animate-in fade-in">
          <span className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2 px-2"><FiCheckCircle /> Sync To Jira:</span>
          <button onClick={() => handleSaveToJira(minVote!)} className="px-5 h-11 rounded-xl bg-muted hover:bg-sky-500 hover:text-white font-black transition-all text-[11px] uppercase italic">Min ({minVote})</button>
          <button onClick={() => handleSaveToJira(Math.round(averageVote))} className="px-5 h-11 rounded-xl bg-primary text-primary-foreground font-black transition-all text-[11px] uppercase italic shadow-lg shadow-primary/20">Consensus ({Math.round(averageVote)})</button>
          <button onClick={() => handleSaveToJira(maxVote!)} className="px-5 h-11 rounded-xl bg-muted hover:bg-red-500 hover:text-white font-black transition-all text-[11px] uppercase italic">Max ({maxVote})</button>
        </div>
      )}

      {/* PLAYERS GRID */}
      <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-6 content-start py-4">
        <AnimatePresence>
          {Object.entries(players).map(([id, p]) => (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} key={id} 
              className={`aspect-[3/4] rounded-[32px] border-2 flex flex-col items-center justify-center gap-4 transition-all duration-500 ${p.vote ? "border-primary bg-primary/5 shadow-[0_0_30px_rgba(var(--primary),0.05)]" : "border-border bg-card/50"}`}
            >
              <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{p.name?.split(' ')[0]}</span>
              <span className={`text-6xl font-black italic transition-all ${isRevealed ? "text-primary scale-110" : "text-foreground"}`}>
                {isRevealed ? p.vote || "-" : p.vote ? "✓" : "..."}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* VOTING CARDS */}
      <div className="bg-card/50 border border-border p-6 rounded-[40px] flex justify-center gap-4 overflow-x-auto shadow-inner">
        {cardValues.map(val => (
          <button
            key={val} disabled={isRevealed} onClick={() => handleVote(val)}
            className={`min-w-16 h-24 shrink-0 rounded-2xl border-2 font-black italic text-2xl transition-all ${myVote === val ? "bg-primary border-primary text-primary-foreground scale-110 shadow-xl shadow-primary/20" : "bg-card border-border text-foreground hover:border-primary/50"}`}
          >
            {val}
          </button>
        ))}
      </div>

      {/* Feedback Notifications */}
      {jiraUpdatedValue !== null && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-6 py-3 rounded-2xl font-black text-xs uppercase flex items-center gap-3 shadow-2xl backdrop-blur-md">
          <FiCheckCircle /> Jira updated with {jiraUpdatedValue} points
        </motion.div>
      )}
    </div>
  );
};