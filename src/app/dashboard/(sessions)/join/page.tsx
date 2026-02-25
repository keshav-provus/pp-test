"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; 
import { ArrowLeft, KeyRound, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function JoinSessionPage() {
  const [sessionCode, setSessionCode] = useState("");
  const [username, setUsername] = useState("");
  const router = useRouter(); 

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();

    if (!sessionCode.trim() || !username.trim()) return;

    router.push(
      `/dashboard/voting?sessionId=${sessionCode.trim()}&role=participant&name=${encodeURIComponent(username.trim())}`
    );
  };

  return (
    <div className="min-h-screen bg-[#060808] text-slate-100 font-sans relative flex flex-col items-center justify-center selection:bg-lime-500/30 px-6">
      
      {/* ── Ambient Background Glows ── */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-lime-500/10 blur-[120px] pointer-events-none" />

      {/* ── Back to Dashboard Button ── */}
      <div className="absolute top-8 left-8 z-20">
        <Link href="/dashboard">
          <Button variant="ghost" className="text-muted-foreground hover:text-white hover:bg-white/5 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* ── Join Card ── */}
      <div className="relative z-10 w-full max-w-md">
        <div className="relative flex flex-col rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-8 shadow-2xl overflow-hidden">
          
          {/* Subtle top highlight */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-6 shadow-inner">
            <KeyRound className="w-6 h-6" />
          </div>

          <h1 className="text-3xl font-bold tracking-tight mb-2">Join a Session</h1>
          <p className="text-muted-foreground text-sm font-light mb-8">
            Enter your name and the session code to join the room.
          </p>

          <form onSubmit={handleJoin} className="flex flex-col gap-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-xs font-semibold tracking-widest text-muted-foreground uppercase ml-1">
                Your Name
              </label>
              <Input
                id="username"
                type="text"
                placeholder="e.g. John Doe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-12 bg-black/40 border-white/10 text-base placeholder:text-white/20 focus-visible:ring-lime-400/50 focus-visible:border-lime-400 transition-all"
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="sessionCode" className="text-xs font-semibold tracking-widest text-muted-foreground uppercase ml-1">
                Session Code
              </label>
              <Input
                id="sessionCode"
                type="text"
                placeholder="e.g. PROVUS-X7B9"
                value={sessionCode}
                onChange={(e) => setSessionCode(e.target.value)}
                className="h-12 bg-black/40 border-white/10 text-lg placeholder:text-white/20 focus-visible:ring-lime-400/50 focus-visible:border-lime-400 transition-all uppercase"
                autoComplete="off"
                spellCheck="false"
              />
            </div>

            <Button 
              type="submit" 
              disabled={!sessionCode.trim() || !username.trim()}
              className="h-12 mt-4 bg-lime-400 hover:bg-lime-500 text-black font-semibold text-base rounded-xl transition-all shadow-[0_0_20px_rgba(163,230,53,0.2)] hover:shadow-[0_0_30px_rgba(163,230,53,0.3)] hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              Join Room
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </form>

        </div>
      </div>
    </div>
  );
}