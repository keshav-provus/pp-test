"use client";

import { Plus, Users, History, ChevronRight } from "lucide-react";
import { Navbar } from "@/components/dashboard/navbar";
import { GlassPanel } from "@/components/dashboard/glass-panel";
import { useRouter } from "next/navigation";


export default function DashboardPage() {
  const firstName = "Arya";
  const email = "arya@provus.ai";

  const router = useRouter()
  const handleJoinRoom = () => {
    router.push("/dashboard/join")
    console.log("Join room clicked");
  }
  
  const handleCreateSession = () => {
    router.push('/dashboard/create'); 
    console.log("Create Room Clicked");
  };
  const handleHistory = () => console.log("History clicked");
  const handleLogout = () => console.log("Logout clicked");

  return (
    <div className="min-h-screen bg-[#060808] text-slate-100 font-sans relative overflow-x-hidden selection:bg-lime-500/30">
      <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-lime-500/10 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />

      <Navbar firstName={firstName} email={email} onLogout={handleLogout} />

      <main className="relative z-10 max-w-[1200px] mx-auto px-6 py-12">
        <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
            Ready to estimate, <span className="text-lime-400">{firstName}?</span>
          </h1>
          <p className="text-muted-foreground font-light text-lg">
            Create a new session or jump back into your recent workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <GlassPanel 
            onClick={handleCreateSession}
            className="md:col-span-2 group hover:border-lime-500/30 hover:shadow-[0_0_40px_rgba(163,230,53,0.1)] cursor-pointer"
          >
            <div className="p-8 md:p-10 flex flex-col justify-between h-full min-h-[280px]">
              <div className="w-14 h-14 rounded-xl bg-lime-400 text-black flex items-center justify-center shadow-[0_0_20px_rgba(163,230,53,0.4)] group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                <Plus className="h-7 w-7" />
              </div>
              <div className="mt-auto pt-8">
                <h2 className="text-3xl font-bold tracking-tight mb-2">Create Session</h2>
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground text-sm">Start a new poker room for your sprint.</p>
                  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-lime-400 group-hover:text-black group-hover:border-lime-400 transition-all">
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          </GlassPanel>

          <div className="flex flex-col gap-6">
            <GlassPanel onClick={handleJoinRoom} title="Join" className="flex-1 group hover:border-blue-500/30 hover:bg-white/[0.04] cursor-pointer">
              <div className="p-6 flex flex-col justify-between h-full">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-1">Join Room</h3>
                  <p className="text-xs text-muted-foreground">Enter a code to jump in</p>
                </div>
              </div>
            </GlassPanel>

            <GlassPanel onClick={handleHistory} title="Archive" className="flex-1 group hover:border-pink-500/30 hover:bg-white/[0.04] cursor-pointer">
              <div className="p-6 flex flex-col justify-between h-full">
                <div className="w-10 h-10 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center mb-4">
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-1">History</h3>
                  <p className="text-xs text-muted-foreground">Review past estimations</p>
                </div>
              </div>
            </GlassPanel>
          </div>
        </div>
      </main>
    </div>
  );
}