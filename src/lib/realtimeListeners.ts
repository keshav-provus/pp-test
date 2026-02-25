import { RealtimeChannel } from "@supabase/supabase-js";
import  supabase  from "./supabaseClient";
import { Participant  } from "@/context/RoomContext";

export type RoomEvents = {
  onParticipantJoin?: (payload: Participant) => void;
  onVoteCast?: (payload: { userId: string; vote: number | null }) => void;
  onRevealVotes?: () => void;
};

export function subscribeToRoom(
  roomId: string,
  callbacks: RoomEvents
): RealtimeChannel {
  const channel = supabase.channel(`room:${roomId}`);

  // user joined
  channel.on("broadcast", { event: "participant_joined" }, (payload) => {
    callbacks.onParticipantJoin?.(payload.payload);
  });

  // vote cast
  channel.on("broadcast", { event: "vote_cast" }, (payload) => {
    callbacks.onVoteCast?.(payload.payload);
  });

  // reveal votes
  channel.on("broadcast", { event: "reveal_votes" }, () => {
    callbacks.onRevealVotes?.();
  });

  channel.subscribe();

  return channel;
}

export function unsubscribeFromRoom(channel: RealtimeChannel) {
  supabase.removeChannel(channel);
}