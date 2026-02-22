// src/app/dashboard/page.tsx
"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Users, History, LogOut, LayoutDashboard, ChevronLeft, RefreshCw } from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { toast, Toaster } from "sonner";

import { BoardSelector } from "@/components/pages/board-selector";
import { SprintSelector } from "@/components/pages/sprint-selector";
import { IssueSelector } from "@/components/pages/issue-selector";
import { getIssuesBySprint, getBoardBacklog } from "../../../services/jira";

function DashboardContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const step = searchParams.get('step') || 'setup';
  const boardId = searchParams.get('boardId');
  const sprintId = searchParams.get('sprintId');

  const refreshJiraData = async () => {
    setLoading(true);
    const toastId = toast.loading("Syncing Jira data...");
    try {
      let freshIssues = [];
      if (sprintId) {
        const [sData, bData] = await Promise.all([
          getIssuesBySprint(sprintId),
          getBoardBacklog(boardId!)
        ]);
        freshIssues = [
          ...sData.map((i: any) => ({ ...i, column: i.statusCategory === "In Progress" ? "doing" : "todo" })),
          ...bData.map((i: any) => ({ ...i, column: 'backlog' }))
        ];
      }
      setIssues(freshIssues);
      toast.success("Board synced", { id: toastId });
    } catch (err) {
      toast.error("Sync failed", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step === 'launch' && (boardId || sprintId)) refreshJiraData();
  }, [step, boardId, sprintId]);

  const updateURL = (params: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([key, val]) => {
      val ? newParams.set(key, val) : newParams.delete(key);
    });
    router.push(`?${newParams.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] flex flex-col">
      <Toaster theme="dark" position="bottom-right" />
      
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-50 w-full shrink-0">
        <div className="px-6 h-16 flex items-center justify-between w-full">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/dashboard')}>
            <div className="w-8 h-8 bg-lime-400 rounded-lg rotate-12 flex items-center justify-center">
              <span className="text-black font-black text-xl leading-none">P</span>
            </div>
            <span className="font-black italic tracking-tighter text-xl uppercase">Provus Poker</span>
          </div>
          {step !== 'setup' && (
            <button onClick={() => router.back()} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-xs font-black uppercase tracking-widest">
              <ChevronLeft size={16} /> Back
            </button>
          )}
          <div className="flex items-center gap-4">
             <span className="text-sm text-zinc-400 hidden md:block">{session?.user?.email}</span>
            <button onClick={() => signOut({ callbackUrl: "/" })} className="p-2 hover:text-red-500 transition-colors"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
      </nav>

      <main className="w-full flex-1 flex flex-col min-h-0 px-6 py-12 overflow-y-auto">
        {/* STEP: SETUP - Welcome & Action Cards */}
        {step === 'setup' && (
          <div className="max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="mb-12">
              <h1 className="text-5xl font-black italic uppercase tracking-tighter mb-2">
                Welcome back, <span className="text-lime-400">{session?.user?.name?.split(' ')[0]}</span>
              </h1>
              <p className="text-zinc-500 max-w-lg italic">
                Ready to estimate some tickets? Create a new session or join an existing room to get started.
              </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {/* Create Room Card */}
              <button 
                onClick={() => updateURL({ step: 'board' })}
                className="group relative bg-lime-400 p-8 rounded-[40px] flex flex-col justify-between items-start text-black h-64 hover:scale-[1.02] transition-transform duration-300 shadow-2xl shadow-lime-400/10"
              >
                <Plus size={40} className="mb-8" />
                <div>
                  <h2 className="text-3xl font-black uppercase italic leading-none">Create<br/>Session</h2>
                  <p className="text-black/60 text-sm mt-2 font-medium italic">Start a new poker room</p>
                </div>
              </button>

              {/* Join Room Card */}
              <div className="bg-zinc-900 border border-white/10 p-8 rounded-[40px] flex flex-col justify-between hover:bg-zinc-800/50 transition-colors h-64 group cursor-pointer">
                <Users className="w-10 h-10 text-lime-400 mb-8 group-hover:animate-bounce" />
                <div>
                  <h2 className="text-3xl font-black uppercase italic leading-none text-white">Join Room</h2>
                  <p className="text-zinc-500 text-sm mt-2 italic">Enter a room code</p>
                </div>
              </div>

              {/* History Card */}
              <div className="bg-zinc-900 border border-white/10 p-8 rounded-[40px] flex flex-col justify-between hover:bg-zinc-800/50 transition-colors h-64 group cursor-pointer">
                <History className="w-10 h-10 text-zinc-500 mb-8" />
                <div>
                  <h2 className="text-3xl font-black uppercase italic leading-none text-white">History</h2>
                  <p className="text-zinc-500 text-sm mt-2 italic">Past estimations</p>
                </div>
              </div>
            </div>

            {/* Recent Activity Section */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-[40px] p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black italic uppercase tracking-widest text-zinc-400">Recent Sessions</h3>
                <span className="text-xs bg-lime-400/10 text-lime-400 px-3 py-1 rounded-full border border-lime-400/20 font-bold uppercase tracking-tighter">Live Status</span>
              </div>
              <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-[32px]">
                 <p className="text-zinc-600 italic">No active sessions found. Start one above!</p>
              </div>
            </div>
          </div>
        )}

        {/* Other steps (board, sprint, launch) remain the same */}
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><RefreshCw className="animate-spin text-lime-400" size={32} /></div>}>
      <DashboardContent />
    </Suspense>
  );
}