"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, KeyRound, LogIn } from "lucide-react";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/dashboard/navbar";

export default function JoinSessionPage() {
  const router = useRouter();
  const { data: session } = useSession();
  
  const [sessionId, setSessionId] = useState("");
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
    <div className="min-h-screen bg-[#f4f5f7] dark:bg-[#111214] text-[#172b4d] dark:text-[#b6c2cf] font-sans transition-colors flex flex-col">
      <Navbar 
        firstName={session?.user?.name?.split(" ")[0] || "Guest"} 
        email={session?.user?.email || ""} 
        onLogout={() => {}} 
      />

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md">
          <button 
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:text-[#8c9bab] dark:hover:text-[#b6c2cf] mb-6 transition-colors"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>

          <div className="bg-white dark:bg-[#1d2125] border border-gray-200 dark:border-[#8c9bab]/20 rounded-lg shadow-sm p-8">
            <h1 className="text-2xl font-semibold mb-2">Join a Session</h1>
            <p className="text-sm text-gray-600 dark:text-[#8c9bab] mb-8">
              Enter the room code provided by your session host to begin estimating.
            </p>

            <form onSubmit={handleJoin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 dark:text-[#8c9bab] uppercase flex items-center gap-2">
                  <KeyRound size={14} /> Room Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. A1B2C3D4"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value.toUpperCase())}
                  className="w-full h-10 px-3 bg-[#fafbfc] dark:bg-[#22272b] border border-gray-300 dark:border-[#8c9bab]/30 rounded text-sm focus:outline-none focus:border-[#0052cc] dark:focus:border-[#4c9aff] transition-colors placeholder:text-gray-400"
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 dark:text-[#8c9bab] uppercase flex items-center gap-2">
                  <User size={14} /> Your Display Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={activeUsername}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full h-10 px-3 bg-[#fafbfc] dark:bg-[#22272b] border border-gray-300 dark:border-[#8c9bab]/30 rounded text-sm focus:outline-none focus:border-[#0052cc] dark:focus:border-[#4c9aff] transition-colors placeholder:text-gray-400"
                  autoComplete="off"
                />
              </div>

              <button 
                type="submit"
                disabled={!sessionId.trim() || !activeUsername.trim()}
                className="w-full h-10 mt-2 bg-[#0052cc] hover:bg-[#0047b3] text-white rounded text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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