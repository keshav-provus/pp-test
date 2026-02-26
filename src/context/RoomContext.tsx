"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import supabase from "@/lib/supabaseClient";
import { RealtimeChannel } from "@supabase/supabase-js";

export type Participant = {
  id?: string;
  name: string;
  isHost: boolean;
};

export type SyncedIssue = {
  id: string;
  key: string;
  summary: string;
  status: string;
  statusCategory: string;
};

type TimerState = {
  duration: number;      // seconds, 0 = no timer
  startedAt: number | null; // epoch ms when timer started, null = not running
};

// Full snapshot the host sends to late-joining participants
type RoomSnapshot = {
  activeIssue: SyncedIssue | null;
  currentIssueIndex: number;
  votes: Record<string, number | null>;
  revealed: boolean;
  timer: TimerState;
};

type RoomContextType = {
  participants: Participant[];
  votes: Record<string, number | null>;
  revealed: boolean;
  sessionEnded: boolean;
  currentIssueIndex: number;
  /** The single source of truth for the active issue — broadcast by host to ALL clients */
  activeIssue: SyncedIssue | null;
  timer: TimerState;
  timerRemaining: number; // live countdown in seconds
  joinRoom: (sessionId: string, participantName: string, isHost: boolean) => void;
  castVote: (participantName: string, vote: number | null) => Promise<void>;
  revealVotes: () => Promise<void>;
  resetVotes: () => Promise<void>;
  endSession: () => Promise<void>;
  leaveSession: (participantName: string) => Promise<void>;
  /** Host calls this whenever the active issue changes — broadcasts index + full issue data */
  broadcastActiveIssue: (index: number, issue: SyncedIssue) => Promise<void>;
  setTimer: (duration: number) => Promise<void>;
  startTimer: () => Promise<void>;
  stopTimer: () => Promise<void>;
};

const RoomContext = createContext<RoomContextType | null>(null);

export function RoomProvider({ children }: { children: React.ReactNode }) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [votes, setVotes] = useState<Record<string, number | null>>({});
  const [revealed, setRevealed] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [currentIssueIndex, setCurrentIssueIndex] = useState(0);
  const [activeIssue, setActiveIssue] = useState<SyncedIssue | null>(null);
  const [timer, setTimerState] = useState<TimerState>({ duration: 0, startedAt: null });
  const [timerRemaining, setTimerRemaining] = useState(0);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  const sessionRef = useRef<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Always-fresh snapshot ref so host can respond to sync requests without stale closure issues
  const snapshotRef = useRef<RoomSnapshot>({
    activeIssue: null,
    currentIssueIndex: 0,
    votes: {},
    revealed: false,
    timer: { duration: 0, startedAt: null },
  });

  // Keep snapshot in sync with state
  useEffect(() => {
    snapshotRef.current = { activeIssue, currentIssueIndex, votes, revealed, timer };
  }, [activeIssue, currentIssueIndex, votes, revealed, timer]);

  // Live countdown tick
  useEffect(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    if (timer.startedAt && timer.duration > 0) {
      const tick = () => {
        const elapsed = Math.floor((Date.now() - timer.startedAt!) / 1000);
        const remaining = Math.max(0, timer.duration - elapsed);
        setTimerRemaining(remaining);

        if (remaining === 0) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        }
      };
      tick();
      timerIntervalRef.current = setInterval(tick, 250);
    } else {
      // Instead of calling setState synchronously, use a microtask to avoid cascading renders
      Promise.resolve().then(() => setTimerRemaining(timer.duration));
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timer]);

  const joinRoom = useCallback((roomId: string, participantName: string, isHost: boolean) => {
    if (sessionRef.current === roomId && channelRef.current) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    sessionRef.current = roomId;

    const newChannel = supabase.channel(`poker:${roomId}`, {
      config: { broadcast: { self: true } },
    });

    newChannel
      .on("presence", { event: "sync" }, () => {
        const state = newChannel.presenceState();
        const participantList: Participant[] = [];
        Object.entries(state).forEach(([, presences]) => {
          const typed = presences as unknown as Array<{ participant: Participant }>;
          typed.forEach((p) => { if (p.participant) participantList.push(p.participant); });
        });
        setParticipants(participantList);
      })
      .on("presence", { event: "join" }, ({ newPresences }) => {
        const participant = (newPresences[0] as unknown as { participant: Participant })?.participant;
        if (participant) {
          setParticipants((prev) => {
            const exists = prev.some((p) => p.name === participant.name);
            return exists ? prev : [...prev, participant];
          });
          // Host proactively pushes full state whenever a new participant joins
          if (isHost && participant.name !== participantName) {
            const snap = snapshotRef.current;
            newChannel.send({
              type: "broadcast",
              event: "state_sync",
              payload: { target: participant.name, snapshot: snap },
            });
          }
        }
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        const participant = (leftPresences[0] as unknown as { participant: Participant })?.participant;
        if (participant) {
          setParticipants((prev) => prev.filter((p) => p.name !== participant.name));
        }
      })
      .on("broadcast", { event: "votes_updated" }, (payload) => {
        const { name, vote } = payload.payload as { name: string; vote: number | null };
        setVotes((prev) => ({ ...prev, [name]: vote }));
      })
      .on("broadcast", { event: "votes_revealed" }, () => {
        setRevealed(true);
      })
      .on("broadcast", { event: "votes_reset" }, () => {
        setVotes({});
        setRevealed(false);
      })
      // issue_changed now always carries { index, issue } — store both
      .on("broadcast", { event: "issue_changed" }, (payload) => {
        const { index, issue } = payload.payload as { index: number; issue: SyncedIssue };
        setCurrentIssueIndex(index);
        setActiveIssue(issue);
        setVotes({});
        setRevealed(false);
        setTimerState((prev) => ({ ...prev, startedAt: null }));
      })
      // Participant asks host for full current state (sent right after subscribing)
      .on("broadcast", { event: "request_sync" }, (payload) => {
        if (!isHost) return;
        const { requester } = payload.payload as { requester: string };
        const snap = snapshotRef.current;
        newChannel.send({
          type: "broadcast",
          event: "state_sync",
          payload: { target: requester, snapshot: snap },
        });
      })
      // Host → specific participant: apply full snapshot
      .on("broadcast", { event: "state_sync" }, (payload) => {
        const { target, snapshot } = payload.payload as { target: string; snapshot: RoomSnapshot };
        if (target !== participantName) return; // only meant for me
        setCurrentIssueIndex(snapshot.currentIssueIndex);
        setActiveIssue(snapshot.activeIssue);
        setVotes(snapshot.votes);
        setRevealed(snapshot.revealed);
        setTimerState(snapshot.timer);
      })
      .on("broadcast", { event: "timer_updated" }, (payload) => {
        setTimerState(payload.payload as TimerState);
      })
      .on("broadcast", { event: "session_ended" }, () => {
        setParticipants([]);
        setVotes({});
        setRevealed(false);
        setSessionEnded(true);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await newChannel.track({
            participant: { name: participantName, isHost },
            online_at: new Date().toISOString(),
          });
          // Non-host participants request the current state immediately after connecting
          if (!isHost) {
            await newChannel.send({
              type: "broadcast",
              event: "request_sync",
              payload: { requester: participantName },
            });
          }
        }
      });

    channelRef.current = newChannel;
    setChannel(newChannel);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const castVote = useCallback(async (participantName: string, vote: number | null) => {
    const ch = channelRef.current;
    if (!ch || !sessionRef.current) return;

    // Update local state
    setVotes((prev) => ({ ...prev, [participantName]: vote }));
    // Broadcast only the individual vote — receivers merge it into their state
    await ch.send({ type: "broadcast", event: "votes_updated", payload: { name: participantName, vote } });
  }, []);

  const revealVotes = useCallback(async () => {
    const ch = channelRef.current;
    if (!ch || !sessionRef.current) return;
    await ch.send({ type: "broadcast", event: "votes_revealed", payload: null });
  }, []);

  const resetVotes = useCallback(async () => {
    const ch = channelRef.current;
    if (!ch || !sessionRef.current) return;
    await ch.send({ type: "broadcast", event: "votes_reset", payload: null });
    // Stop timer too
    const newTimer: TimerState = { duration: timer.duration, startedAt: null };
    await ch.send({ type: "broadcast", event: "timer_updated", payload: newTimer });
  }, [timer.duration]);

  const broadcastActiveIssue = useCallback(async (index: number, issue: SyncedIssue) => {
    const ch = channelRef.current;
    if (!ch || !sessionRef.current) return;
    await ch.send({
      type: "broadcast",
      event: "issue_changed",
      payload: { index, issue },
    });
  }, []);

  const setTimer = useCallback(async (duration: number) => {
    const ch = channelRef.current;
    if (!ch || !sessionRef.current) return;
    const newTimer: TimerState = { duration, startedAt: null };
    await ch.send({ type: "broadcast", event: "timer_updated", payload: newTimer });
  }, []);

  const startTimer = useCallback(async () => {
    const ch = channelRef.current;
    if (!ch || !sessionRef.current) return;
    const newTimer: TimerState = { duration: timer.duration, startedAt: Date.now() };
    await ch.send({ type: "broadcast", event: "timer_updated", payload: newTimer });
  }, [timer.duration]);

  const stopTimer = useCallback(async () => {
    const ch = channelRef.current;
    if (!ch || !sessionRef.current) return;
    const newTimer: TimerState = { duration: timer.duration, startedAt: null };
    await ch.send({ type: "broadcast", event: "timer_updated", payload: newTimer });
  }, [timer.duration]);

  const endSession = useCallback(async () => {
    const ch = channelRef.current;
    if (!ch || !sessionRef.current) return;
    setParticipants([]);
    setVotes({});
    setRevealed(false);
    await ch.send({ type: "broadcast", event: "session_ended", payload: null });
    supabase.removeChannel(ch);
    sessionRef.current = null;
  }, []);

  const leaveSession = useCallback(async (participantName: string) => {
    const ch = channelRef.current;
    if (!ch || !sessionRef.current) return;
    await ch.untrack();
    setVotes((prev) => {
      const updated = { ...prev };
      delete updated[participantName];
      ch.send({ type: "broadcast", event: "votes_updated", payload: updated });
      return updated;
    });
    supabase.removeChannel(ch);
    sessionRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  return (
    <RoomContext.Provider value={{
      participants, votes, revealed, sessionEnded,
      currentIssueIndex, activeIssue, timer, timerRemaining,
      joinRoom, castVote, revealVotes, resetVotes,
      endSession, leaveSession,
      broadcastActiveIssue,
      setTimer, startTimer, stopTimer,
    }}>
      {children}
    </RoomContext.Provider>
  );
}

export const useRoom = () => {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error("useRoom must be used inside RoomProvider");
  return ctx;
};