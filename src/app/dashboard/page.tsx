"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, Users, History, LogOut, LayoutDashboard } from "lucide-react";
import { useEffect } from "react";

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();

  
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]">
      
      {/* --- NAVIGATION BAR --- */}
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-lime-400 rounded-lg rotate-12 flex items-center justify-center">
              <span className="text-black font-black text-xl leading-none">P</span>
            </div>
            <span className="font-black italic tracking-tighter text-xl uppercase">Provus Poker</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-xs font-bold text-lime-400 uppercase tracking-tighter">Authorized</span>
              <span className="text-sm text-zinc-400">{session?.user?.email}</span>
            </div>
            <button 
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* --- WELCOME SECTION --- */}
        <header className="mb-12">
          <h1 className="text-5xl font-black italic uppercase tracking-tighter mb-2">
            Welcome back, <span className="text-lime-400">{session?.user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-zinc-500 max-w-lg">
            Ready to estimate some tickets? Create a new session or join an existing room to get started.
          </p>
        </header>

        {/* --- ACTION GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          
          {/* Create Room Card */}
          <button className="group relative bg-lime-400 p-8 rounded-3xl flex flex-col justify-between items-start text-black overflow-hidden hover:scale-[1.02] transition-transform duration-300">
            <Plus className="w-10 h-10 mb-8" />
            <div>
              <h2 className="text-2xl font-black uppercase italic leading-none">Create<br/>Session</h2>
              <p className="text-black/60 text-sm mt-2 font-medium italic">Start a new poker room</p>
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform">
                <LayoutDashboard className="w-32 h-32" />
            </div>
          </button>

          {/* Join Room Card */}
          <div className="bg-zinc-900 border border-white/10 p-8 rounded-3xl flex flex-col justify-between hover:bg-zinc-800/50 transition-colors group cursor-pointer">
            <Users className="w-10 h-10 text-lime-400 mb-8 group-hover:animate-bounce" />
            <div>
              <h2 className="text-2xl font-black uppercase italic leading-none">Join Room</h2>
              <p className="text-zinc-500 text-sm mt-2 italic">Enter a room code</p>
            </div>
          </div>

          {/* History Card */}
          <div className="bg-zinc-900 border border-white/10 p-8 rounded-3xl flex flex-col justify-between hover:bg-zinc-800/50 transition-colors group cursor-pointer">
            <History className="w-10 h-10 text-zinc-500 mb-8" />
            <div>
              <h2 className="text-2xl font-black uppercase italic leading-none">History</h2>
              <p className="text-zinc-500 text-sm mt-2 italic">Past estimations</p>
            </div>
          </div>

        </div>

        {/* --- RECENT ACTIVITY TABLE --- */}
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black italic uppercase tracking-widest text-zinc-400">Recent Sessions</h3>
            <span className="text-xs bg-lime-400/10 text-lime-400 px-3 py-1 rounded-full border border-lime-400/20 font-bold uppercase tracking-tighter">Live Status</span>
          </div>
          
          <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-2xl">
             <p className="text-zinc-600 italic">No active sessions found. Start one above!</p>
          </div>
        </div>
      </main>
    </div>
  );
}