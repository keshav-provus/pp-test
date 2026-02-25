"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import supabase from "@/lib/supabaseClient";
import { RealtimeChannel } from "@supabase/supabase-js";

export type Participant = {
  id?: string;
  name: string;
  isHost: boolean;
};

type RoomContextType = {
  participants: Participant[];
  votes: Record<string, number | null>;
  revealed: boolean;
  sessionEnded: boolean;
  joinRoom: (sessionId: string, participantName: string, isHost: boolean) => void;
  castVote: (participantName: string, vote: number | null) => Promise<void>;
  revealVotes: () => Promise<void>;
  resetVotes: () => Promise<void>;
  endSession: () => Promise<void>;
  leaveSession: (participantName: string) => Promise<void>;
};

const RoomContext = createContext<RoomContextType | null>(null);

export function RoomProvider({ children }: { children: React.ReactNode }) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [votes, setVotes] = useState<Record<string, number | null>>({});
  const [revealed, setRevealed] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // 🔑 VERY IMPORTANT: track joined session
  const sessionRef = useRef<string | null>(null);

  const joinRoom = (roomId: string, participantName: string, isHost: boolean) => {
    // 🛑 STOP if already joined this session
    if (sessionRef.current === roomId && channel) return;

    // Cleanup old channel
    if (channel) {
      supabase.removeChannel(channel);
    }

    sessionRef.current = roomId;

    const newChannel = supabase.channel(`poker:${roomId}`, {
      config: { broadcast: { self: true } },
    });

    // Listen for presence updates (participants list)
    newChannel.on("presence", { event: "sync" }, () => {
      const state = newChannel.presenceState();
      const participantList: Participant[] = [];
      
      Object.entries(state).forEach(([, presences]: [string, any]) => {
        presences.forEach((presence: any) => {
          if (presence.participant) {
            participantList.push(presence.participant);
          }
        });
      });
      
      setParticipants(participantList);
    })
    .on("presence", { event: "join" }, ({ newPresences }) => {
      const participant = newPresences[0]?.participant;
      if (participant) {
        setParticipants((prev) => {
          const exists = prev.some((p) => p.name === participant.name);
          if (exists) return prev;
          return [...prev, participant];
        });
      }
    })
    .on("presence", { event: "leave" }, ({ leftPresences }) => {
      const participant = leftPresences[0]?.participant;
      if (participant) {
        setParticipants((prev) => prev.filter((p) => p.name !== participant.name));
      }
    })
    .on("broadcast", { event: "votes_updated" }, (payload) => {
      setVotes(payload.payload);
    })
    .on("broadcast", { event: "votes_revealed" }, (payload) => {
      setRevealed(payload.payload);
    })
    .on("broadcast", { event: "votes_reset" }, () => {
      setVotes({});
      setRevealed(false);
    })
    .on("broadcast", { event: "session_ended" }, () => {
      setParticipants([]);
      setVotes({});
      setRevealed(false);
      setSessionEnded(true);
    })
    .subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        // Track current participant in presence
        await newChannel.track({
          participant: { name: participantName, isHost },
          online_at: new Date().toISOString(),
        });
      }
    });

    setChannel(newChannel);
  };

  const castVote = async (participantName: string, vote: number | null) => {
    if (!channel || !sessionRef.current) return;

    setVotes((prev) => ({
      ...prev,
      [participantName]: vote,
    }));

    // Broadcast updated votes
    const updatedVotes = { ...votes, [participantName]: vote };
    await channel.send({
      type: "broadcast",
      event: "votes_updated",
      payload: updatedVotes,
    });
  };

  const revealVotes = async () => {
    if (!channel || !sessionRef.current) return;

    setRevealed(true);

    // Broadcast reveal event
    await channel.send({
      type: "broadcast",
      event: "votes_revealed",
      payload: true,
    });
  };

  const resetVotes = async () => {
    if (!channel || !sessionRef.current) return;

    setVotes({});
    setRevealed(false);

    // Broadcast reset event
    await channel.send({
      type: "broadcast",
      event: "votes_reset",
      payload: null,
    });
  };

  const endSession = async () => {
    if (!channel || !sessionRef.current) return;

    // Clear local state
    setParticipants([]);
    setVotes({});
    setRevealed(false);

    // Broadcast session ended event
    await channel.send({
      type: "broadcast",
      event: "session_ended",
      payload: null,
    });

    // Cleanup channel
    supabase.removeChannel(channel);
    sessionRef.current = null;
  };

  const leaveSession = async (participantName: string) => {
    if (!channel || !sessionRef.current) return;

    // Untrack from presence (automatically removes participant from all clients)
    await channel.untrack();

    // Update votes
    setVotes((prev) => {
      const updated = { ...prev };
      delete updated[participantName];
      return updated;
    });

    // Broadcast updated votes
    const updatedVotes = { ...votes };
    delete updatedVotes[participantName];
    await channel.send({
      type: "broadcast",
      event: "votes_updated",
      payload: updatedVotes,
    });

    // Cleanup channel
    supabase.removeChannel(channel);
    sessionRef.current = null;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [channel]);

  return (
    <RoomContext.Provider
      value={{
        participants,
        votes,
        revealed,
        sessionEnded,
        joinRoom,
        castVote,
        revealVotes,
        resetVotes,
        endSession,
        leaveSession,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
}

export const useRoom = () => {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error("useRoom must be used inside RoomProvider");
  return ctx;
};