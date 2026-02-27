"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, User, KeyRound, LogIn, Sparkles } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { Navbar } from "@/components/dashboard/navbar";

export default function JoinSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  // Pre-fill session code from invite link ?code= param
  const [sessionId, setSessionId] = useState(searchParams.get("code")?.toUpperCase() || "");
  const [customName, setCustomName] = useState<string | null>(null);

  const activeUsername = customName !== null ? customName : (session?.user?.name || "");

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId.trim() || !activeUsername.trim()) return;

    router.push(
      `/dashboard/voting?sessionId=${sessionId.trim().toUpperCase()}&role=participant&name=${encodeURIComponent(
        activeUsername.trim()
      )}`
    );
  };

  return (
    <div className="min-h-screen page-bg text-[#172b4d] dark:text-[#b6c2cf] font-sans transition-colors flex flex-col">
      <Navbar 
        firstName={session?.user?.name?.split(" ")[0] || "Guest"} 
        email={session?.user?.email || ""} 
        onLogout={() => signOut({ callbackUrl: "/login" })} 
      />

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md animate-fade-in-up">
          <button 
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-sm text-[#888] hover:text-[#111] dark:text-[#666] dark:hover:text-[#ededed] mb-6 transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> Back to Dashboard
          </button>

          <div className="relative bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] rounded-2xl shadow-sm p-8 overflow-hidden">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#222] text-[#111] dark:text-[#ededed] border border-gray-200 dark:border-[#333] flex items-center justify-center">
                <Sparkles size={20} />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-[#111] dark:text-[#ededed]">Join a Session</h1>
              </div>
            </div>
            <p className="text-sm text-[#666] dark:text-[#a1a1aa] mb-8">
              Enter the room code provided by your session host.
            </p>

            <form onSubmit={handleJoin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-[#888] dark:text-[#666] uppercase tracking-wider flex items-center gap-2">
                  <KeyRound size={12} /> Room Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. A1B2C3D4"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value.toUpperCase())}
                  className="w-full h-12 px-4 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-xl text-base font-mono font-semibold tracking-[0.25em] text-center uppercase text-[#111] dark:text-[#ededed] focus:outline-none focus:ring-1 focus:ring-[#111] dark:focus:ring-white focus:border-[#111] dark:focus:border-white placeholder:text-gray-400 dark:placeholder:text-[#666] placeholder:tracking-normal placeholder:font-normal transition-all"
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-[#888] dark:text-[#666] uppercase tracking-wider flex items-center gap-2">
                  <User size={12} /> Display Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={activeUsername}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full h-11 px-4 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-xl text-sm text-[#111] dark:text-[#ededed] focus:outline-none focus:ring-1 focus:ring-[#111] dark:focus:ring-white focus:border-[#111] dark:focus:border-white placeholder:text-gray-400 dark:placeholder:text-[#666] transition-all"
                  autoComplete="off"
                />
              </div>

              <button 
                type="submit"
                disabled={!sessionId.trim() || !activeUsername.trim()}
                className="w-full h-12 mt-3 bg-[#111] dark:bg-white text-white dark:text-[#111] hover:bg-[#333] dark:hover:bg-[#e5e5e5] rounded-xl text-sm font-medium flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                Join Room <LogIn size={16} />
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}