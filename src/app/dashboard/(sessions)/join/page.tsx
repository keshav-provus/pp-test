"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, User, KeyRound, LogIn, Sparkles } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { Suspense } from "react";
import { AppDock } from "@/components/dashboard/app-dock";

function JoinSessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: authStatus } = useSession();

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace("/login");
    }
  }, [authStatus, router]);

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
    <div className="min-h-screen page-bg text-foreground font-sans transition-colors flex flex-col">
      <AppDock onLogout={() => signOut({ callbackUrl: "/login" })} />

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md animate-fade-in-up">
          <button 
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> Back to Dashboard
          </button>

          <div className="relative bg-card border border-border rounded-2xl shadow-sm p-8 overflow-hidden">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-secondary text-foreground border border-border flex items-center justify-center">
                <Sparkles size={20} />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Join a Session</h1>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-8">
              Enter the room code provided by your session host.
            </p>

            <form onSubmit={handleJoin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <KeyRound size={12} /> Room Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. A1B2C3D4"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value.toUpperCase())}
                  className="w-full h-12 px-4 bg-card border border-border rounded-xl text-base font-mono font-semibold tracking-[0.25em] text-center uppercase text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground placeholder:tracking-normal placeholder:font-normal transition-all"
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <User size={12} /> Display Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={activeUsername}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full h-11 px-4 bg-card border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground transition-all"
                  autoComplete="off"
                />
              </div>

              <button 
                type="submit"
                disabled={!sessionId.trim() || !activeUsername.trim()}
                className="w-full h-12 mt-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-medium flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
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

export default function JoinSessionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen page-bg text-foreground font-sans transition-colors flex flex-col items-center justify-center">
        Loading...
      </div>
    }>
      <JoinSessionContent />
    </Suspense>
  );
}