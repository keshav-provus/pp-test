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
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#0052cc] dark:text-[#8c9bab] dark:hover:text-[#4c9aff] mb-6 transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> Back to Dashboard
          </button>

          <div className="relative bg-white dark:bg-[#1d2125] border border-gray-200 dark:border-[#2c333a] rounded-2xl shadow-xl shadow-black/[0.04] dark:shadow-black/20 p-8 overflow-hidden">
            {/* Top accent */}
            <div className="absolute top-0 inset-x-0 h-[3px] rounded-t-2xl bg-gradient-to-r from-[#6554c0] to-[#0052cc]" />

            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#eae6ff] to-[#e0dbff] dark:from-[#6554c0]/20 dark:to-[#6554c0]/10 text-[#6554c0] dark:text-[#9f8fef] flex items-center justify-center">
                <Sparkles size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#172b4d] dark:text-[#dfe1e6]">Join a Session</h1>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-[#8c9bab] mb-8">
              Enter the room code provided by your session host.
            </p>

            <form onSubmit={handleJoin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-500 dark:text-[#8c9bab] uppercase tracking-wider flex items-center gap-2">
                  <KeyRound size={12} /> Room Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. A1B2C3D4"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value.toUpperCase())}
                  className="w-full h-12 px-4 bg-[#fafbfc] dark:bg-[#22272b] border border-gray-200 dark:border-[#2c333a] rounded-xl text-base font-mono font-bold tracking-[0.25em] text-center uppercase text-[#172b4d] dark:text-[#dfe1e6] input-enterprise focus:outline-none placeholder:text-gray-300 dark:placeholder:text-[#626f86] placeholder:tracking-normal placeholder:font-normal"
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-500 dark:text-[#8c9bab] uppercase tracking-wider flex items-center gap-2">
                  <User size={12} /> Display Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={activeUsername}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full h-11 px-4 bg-[#fafbfc] dark:bg-[#22272b] border border-gray-200 dark:border-[#2c333a] rounded-xl text-sm text-[#172b4d] dark:text-[#dfe1e6] input-enterprise focus:outline-none placeholder:text-gray-300 dark:placeholder:text-[#626f86]"
                  autoComplete="off"
                />
              </div>

              <button 
                type="submit"
                disabled={!sessionId.trim() || !activeUsername.trim()}
                className="w-full h-12 mt-3 bg-gradient-to-r from-[#0052cc] to-[#2684ff] hover:from-[#0047b3] hover:to-[#0052cc] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-[#0052cc]/20 hover:shadow-lg hover:shadow-[#0052cc]/25"
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