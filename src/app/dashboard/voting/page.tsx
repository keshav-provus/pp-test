"use client";

import React, { useState, useMemo, useEffect, useRef, Suspense } from "react";
import {
  FiEye,
  FiLogOut,
  FiDownload,
  FiGithub,
  FiSun,
  FiLock,
  FiRefreshCw,
} from "react-icons/fi";
import { useRouter, useSearchParams } from "next/navigation";
import { useRoom } from "@/context/RoomContext";

function VotingSessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sessionId = searchParams.get("sessionId");
  const role = searchParams.get("role");

  const {
    participants,
    votes,
    revealed,
    sessionEnded,
    joinRoom,
    castVote,
    revealVotes,
    resetVotes,
    endSession,
    leaveSession
  } = useRoom();

  const [myVote, setMyVote] = useState<number | null>(null);
  const participantNameRef = useRef<string>("");

  const isHost = role === "host";

  // Initialize participant name and join room
  useEffect(() => {
    if (!sessionId || !role) return;

    const name = searchParams.get("name");
    if (!name) return;

    participantNameRef.current = decodeURIComponent(name);
    joinRoom(sessionId, participantNameRef.current, isHost);
  }, [sessionId, role, isHost, searchParams, joinRoom]);

  // Redirect participants when host ends the session
  useEffect(() => {
    if (sessionEnded && !isHost) {
      router.push("/dashboard");
    }
  }, [sessionEnded, isHost, router]);

  const cardValues = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89];

  const stats = useMemo(() => {
    const allVotes = Object.values(votes).filter(
      (v): v is number => v !== null
    );
    if (allVotes.length === 0) return { avg: "-" };
    const sum = allVotes.reduce((a, b) => a + b, 0);
    return { avg: (sum / allVotes.length).toFixed(0) };
  }, [votes]);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-fuchsia-600/10 rounded-full blur-[120px]"></div>

      {/* HEADER */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-2 font-bold text-xl">
          Planning Poker
        </div>

        <div className="flex items-center gap-6">
          {/* ROLE BADGE */}
          <div
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${isHost
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              }`}
          >
            {isHost ? "Host" : "Participant"}
          </div>

          <FiGithub className="text-xl text-slate-400 hover:text-white cursor-pointer" />
          <FiSun className="text-xl text-orange-300 hover:rotate-45 transition cursor-pointer" />
        </div>
      </nav>

      {/* MAIN */}
      <main className="max-w-7xl mx-auto pt-12 pb-24 px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10">

          {/* LEFT SIDE - MAIN CONTENT */}
          <div>
            {/* SESSION ID COPY FIELD */}
            <div className="mb-12 bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                    Session Code
                  </p>
                  <p className="text-2xl font-bold text-slate-200 font-mono">{sessionId}</p>
                </div>
                <button
                  onClick={() => {
                    if (sessionId) {
                      navigator.clipboard.writeText(sessionId);
                      alert("Session code copied!");
                    }
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition flex items-center gap-2"
                  title="Copy session code"
                >
                  <FiDownload size={18} />
                  Copy
                </button>
              </div>
            </div>

            {/* PARTICIPANTS CARDS */}
            <div className="flex flex-wrap justify-center gap-8 mb-12">
              {participants.map((player, index) => {
                const currentVote = votes[player.name] ?? null;
                const hasVoted = currentVote !== null;

                return (
                  <div key={index} className="flex flex-col items-center">
                    <div className="bg-white/5 border border-white/10 px-4 py-1.5 rounded-xl mb-3 min-w-[110px] text-center flex items-center gap-2">
                      <span className="text-xs font-bold">
                        {player.name}
                      </span>
                      {player.isHost && (
                        <span className="text-[8px] bg-indigo-500 text-white px-1 rounded-sm uppercase font-black">
                          Host
                        </span>
                      )}
                    </div>

                    <div
                      className={`w-16 h-22 rounded-xl flex items-center justify-center text-3xl border ${hasVoted
                          ? "border-indigo-400/50 bg-indigo-500/10"
                          : "border-white/5 bg-white/5"
                        }`}
                    >
                      {revealed ? (
                        <span className="font-black text-indigo-300">
                          {currentVote ?? "?"}
                        </span>
                      ) : (
                        <span className={hasVoted ? "animate-bounce" : "opacity-40"}>
                          {hasVoted ? "✅" : "🤔"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CONTROLS */}
            <div className="flex justify-center gap-10 mb-16">
              <button
                onClick={() => {
                  if (isHost) {
                    if (revealed) {
                      resetVotes();
                    } else {
                      revealVotes();
                    }
                  }
                }}
                disabled={!isHost}
                className="text-emerald-400 hover:text-emerald-300 transition"
                title={isHost ? (revealed ? "Reset Votes" : "Reveal Votes") : "Host only"}
              >
                {isHost ? (
                  revealed ? (
                    <FiRefreshCw size={28} />
                  ) : (
                    <FiEye size={28} />
                  )
                ) : (
                  <FiLock size={28} />
                )}
              </button>

              <button
                onClick={() => {
                  if (isHost) {
                    endSession().then(() => router.push("/dashboard"));
                  } else {
                    leaveSession(participantNameRef.current).then(() => router.push("/dashboard"));
                  }
                }}
                className="text-orange-400 hover:text-orange-300 transition"
                title={isHost ? "End Session" : "Leave Session"}
              >
                <FiLogOut size={28} />
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Invite link copied!");
                }}
                className="text-indigo-400 hover:text-indigo-300 transition"
              >
                <FiDownload size={28} />
              </button>
            </div>

            {/* VOTING CARDS */}
            <div className="text-center">
              <p className="text-[10px] font-black uppercase text-slate-500 mb-8 tracking-[0.4em]">
                Select your estimate
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                {cardValues.map((v) => (
                  <button
                    key={v}
                    disabled={revealed}
                    onClick={async () => {
                      setMyVote(v);
                      await castVote(participantNameRef.current, v);
                    }}
                    className={`w-16 h-24 rounded-xl font-black text-slate-900 bg-white ${myVote === v
                        ? "ring-[6px] ring-indigo-500/40 -translate-y-4 scale-110"
                        : ""
                      }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT SIDE - PARTICIPANTS LIST & STATS */}
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-fit">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">
                Participants ({participants.length})
              </h3>

              <div className="flex flex-col gap-3">
                {participants.map((player, index) => {
                  const hasVoted = votes[player.name] !== undefined && votes[player.name] !== null;
                  const playerVote = votes[player.name];

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-white/5 px-4 py-2 rounded-xl hover:bg-white/10 transition"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${hasVoted ? "bg-emerald-400 animate-pulse" : "bg-slate-600"
                            }`}
                        ></div>
                        <span className="text-sm">{player.name}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {revealed && hasVoted && (
                          <span className="text-sm font-bold text-indigo-300">
                            {playerVote}
                          </span>
                        )}
                        {hasVoted && !revealed && (
                          <span className="text-xs text-slate-500">✓</span>
                        )}
                        {player.isHost && (
                          <span className="text-[9px] px-2 py-0.5 bg-indigo-500 text-white rounded-full font-bold uppercase">
                            Host
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {revealed && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-fit">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
                  Summary
                </h3>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Average:</span>
                    <span className="text-lg font-bold text-indigo-300">
                      {stats.avg}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Voted:</span>
                    <span className="text-lg font-bold text-emerald-300">
                      {Object.values(votes).filter((v) => v !== null).length} / {participants.length}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PokerSession() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#020617] flex items-center justify-center text-slate-400">
        Loading session details...
      </div>
    }>
      <VotingSessionContent />
    </Suspense>
  );
}