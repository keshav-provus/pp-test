"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Users, History, LogOut, ChevronLeft, RefreshCw } from "lucide-react";
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
      if (val) newParams.set(key, val);
      else newParams.delete(key);
    });
    // Use an absolute path for the router to ensure stable navigation
    router.push(`/dashboard?${newParams.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] flex flex-col">
      <Toaster theme="dark" position="bottom-right" />
      
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
        {step === 'setup' && (
          <div className="max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="mb-12">
              <h1 className="text-5xl font-black italic uppercase tracking-tighter mb-2">
                Welcome back, <span className="text-lime-400">{session?.user?.name?.split(' ')[0]}</span>
              </h1>
              <p className="text-zinc-500 max-w-lg italic">Ready to estimate? Start a session below.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
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

              <div className="bg-zinc-900 border border-white/10 p-8 rounded-[40px] flex flex-col justify-between h-64 group cursor-pointer hover:bg-zinc-800/50 transition-colors">
                <Users className="w-10 h-10 text-lime-400 mb-8 group-hover:animate-bounce" />
                <h2 className="text-3xl font-black uppercase italic leading-none text-white">Join Room</h2>
              </div>

              <div className="bg-zinc-900 border border-white/10 p-8 rounded-[40px] flex flex-col justify-between h-64 group cursor-pointer hover:bg-zinc-800/50 transition-colors">
                <History className="w-10 h-10 text-zinc-500 mb-8" />
                <h2 className="text-3xl font-black uppercase italic leading-none text-white">History</h2>
              </div>
            </div>
          </div>
        )}

        {step === 'board' && (
          <div className="max-w-7xl mx-auto w-full animate-in fade-in duration-500">
            <h2 className="text-4xl font-black italic uppercase mb-8 tracking-tighter">Select Board</h2>
            <BoardSelector onSelect={(b: any) => updateURL({ step: b.type === 'scrum' ? 'sprint' : 'launch', boardId: b.id })} />
          </div>
        )}

        {step === 'sprint' && (
          <div className="max-w-7xl mx-auto w-full animate-in fade-in duration-500">
            <h2 className="text-4xl font-black italic uppercase mb-8 tracking-tighter">Select Sprint</h2>
            <SprintSelector boardId={boardId!} onSelect={(s: any) => updateURL({ step: 'launch', sprintId: s.id })} />
          </div>
        )}

        {step === 'launch' && (
          <div className="w-full flex-1 flex flex-col min-h-0 animate-in fade-in duration-500">
            <div className="flex justify-between items-end mb-6 shrink-0 px-2">
              <h2 className="text-4xl font-black italic uppercase tracking-tighter">Arena</h2>
              <button onClick={refreshJiraData} className="flex items-center gap-2 px-6 py-3 bg-zinc-900 border border-white/10 rounded-2xl text-[10px] font-black uppercase hover:border-lime-400 transition-all">
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Sync
              </button>
            </div>
            <div className="flex-1 min-h-0">
               <IssueSelector preFetchedIssues={issues} onSync={refreshJiraData} onLaunch={(issue: any) => router.push(`/poker/${issue.key}`)} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Wrap the content in a Suspense boundary to fix useSearchParams issues
export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <RefreshCw className="animate-spin text-lime-400" size={32} />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}