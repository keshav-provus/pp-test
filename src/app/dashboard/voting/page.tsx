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
import { Navbar } from "@/components/dashboard/navbar";

// 1. Internal component that uses useSearchParams()
function PokerSessionContent() {
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
    leaveSession,
  } = useRoom();

  const [myVote, setMyVote] = useState<number | null>(null);
  const participantNameRef = useRef<string>("");

  const isHost = role === "host";

  useEffect(() => {
    if (!sessionId || !role) return;

    const name = searchParams.get("name");
    if (!name) return;

    participantNameRef.current = decodeURIComponent(name);
    joinRoom(sessionId, participantNameRef.current, isHost);
  }, [sessionId, role, isHost, searchParams, joinRoom]);

  useEffect(() => {
    if (sessionEnded && !isHost) {
      router.push("/dashboard");
    }
  }, [sessionEnded, isHost, router]);

  const cardValues = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89];

  const stats = useMemo(() => {
    const allVotes = Object.values(votes).filter(
      (v): v is number => v !== null,
    );
    if (allVotes.length === 0) return { avg: "-" };
    const sum = allVotes.reduce((a, b) => a + b, 0);
    return { avg: (sum / allVotes.length).toFixed(0) };
  }, [votes]);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-fuchsia-600/10 rounded-full blur-[120px]"></div>

      <Navbar firstName="Arya" email="arya@provus.ai" onLogout={() => {}} />

      <main className="max-w-7xl mx-auto pt-12 pb-24 px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10">
          <div>
            <div className="mb-12 bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                    Session Code
                  </p>
                  <p className="text-2xl font-bold text-slate-200 font-mono">
                    {sessionId}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (sessionId) {
                      navigator.clipboard.writeText(sessionId);
                      alert("Session code copied!");
                    }
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition flex items-center gap-2"
                >
                  <FiDownload size={18} /> Copy
                </button>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-8 mb-12">
              {participants.map((player, index) => {
                const currentVote = votes[player.name] ?? null;
                const hasVoted = currentVote !== null;
                return (
                  <div key={index} className="flex flex-col items-center">
                    <div className="bg-white/5 border border-white/10 px-4 py-1.5 rounded-xl mb-3 min-w-[110px] text-center flex items-center gap-2">
                      <span className="text-xs font-bold">{player.name}</span>
                      {player.isHost && (
                        <span className="text-[8px] bg-indigo-500 text-white px-1 rounded-sm uppercase font-black">
                          Host
                        </span>
                      )}
                    </div>
                    <div
                      className={`w-16 h-22 rounded-xl flex items-center justify-center text-3xl border ${hasVoted ? "border-indigo-400/50 bg-indigo-500/10" : "border-white/5 bg-white/5"}`}
                    >
                      {revealed ? (
                        <span className="font-black text-indigo-300">
                          {currentVote ?? "?"}
                        </span>
                      ) : (
                        <span
                          className={hasVoted ? "animate-bounce" : "opacity-40"}
                        >
                          {hasVoted ? "✅" : "🤔"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-center gap-10 mb-16">
              <button
                onClick={() =>
                  isHost && (revealed ? resetVotes() : revealVotes())
                }
                disabled={!isHost}
                className="text-emerald-400 hover:text-emerald-300 transition"
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
                onClick={() =>
                  isHost
                    ? endSession().then(() => router.push("/dashboard"))
                    : leaveSession(participantNameRef.current).then(() =>
                        router.push("/dashboard"),
                      )
                }
                className="text-orange-400 hover:text-orange-300 transition"
              >
                <FiLogOut size={28} />
              </button>
            </div>

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
                    className={`w-16 h-24 rounded-xl font-black text-slate-900 bg-white transition-all ${myVote === v ? "ring-[6px] ring-indigo-500/40 -translate-y-4 scale-110" : "hover:-translate-y-2"}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-fit">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">
                Participants ({participants.length})
              </h3>
              <div className="flex flex-col gap-3">
                {participants.map((player, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-white/5 px-4 py-2 rounded-xl"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${votes[player.name] != null ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`}
                      ></div>
                      <span className="text-sm">{player.name}</span>
                    </div>
                    {revealed && (
                      <span className="text-sm font-bold text-indigo-300">
                        {votes[player.name]}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {revealed && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-fit">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
                  Summary
                </h3>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Average:</span>
                  <span className="text-lg font-bold text-indigo-300">
                    {stats.avg}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// 2. Main Page Export wrapped in Suspense
export default function PokerSession() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white">
          <FiRefreshCw className="animate-spin mr-2" /> Loading Session...
        </div>
      }
    >
      <PokerSessionContent />
    </Suspense>
  );
}
