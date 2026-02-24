"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Users,
  History,
  LogOut,
  ChevronLeft,
  RefreshCw,
} from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { toast, Toaster } from "sonner";

import { BoardSelector } from "@/components/pages/board-selector";
import { SprintSelector } from "@/components/pages/sprint-selector";
import { IssueSelector } from "@/components/pages/issue-selector";
import { JoinSession } from "@/components/pages/join-session";
import { getIssuesBySprint, getBoardBacklog } from "../../../services/jira";
import { useTheme } from "next-themes";
import { useColor } from "@/context/ColorContext";

interface JiraIssue {
  id: string;
  key: string;
  summary: string;
  status: string;
  statusCategory: string;
  column?: string;
}

interface Board {
  id: string;
  name: string;
  type: string;
}

interface Sprint {
  id: string;
  name: string;
}

function DashboardContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();

  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [loading, setLoading] = useState(false);

  const step = searchParams.get("step") || "setup";
  const boardId = searchParams.get("boardId");
  const sprintId = searchParams.get("sprintId");
  const sessionId = searchParams.get("sessionId");

  const refreshJiraData = async () => {
    if (step !== "launch") return;

    setLoading(true);
    const toastId = toast.loading("Syncing Jira data...");
    try {
      let freshIssues: JiraIssue[] = [];
      if (sprintId && boardId) {
        const [sData, bData] = await Promise.all([
          getIssuesBySprint(sprintId),
          getBoardBacklog(boardId),
        ]);

        freshIssues = [
          ...sData.map((i: JiraIssue) => ({
            ...i,
            column: i.statusCategory === "In Progress" ? "doing" : "todo",
          })),
          ...bData.map((i: JiraIssue) => ({
            ...i,
            column: "backlog",
          })),
        ];
      }
      setIssues(freshIssues);
      toast.success("Board synced", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Sync failed", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step === "launch" && (boardId || sprintId)) {
      refreshJiraData();
    }
  }, [step, boardId, sprintId]);

  const handleStartCreation = () => {
    const newSessionId = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();
    updateURL({ step: "board", sessionId: newSessionId });
  };

  const updateURL = (params: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([key, val]) => {
      if (val) newParams.set(key, val);
      else newParams.delete(key);
    });
    router.push(`/dashboard?${newParams.toString()}`);
  };

  return (
    /* FIXED: Changed bg-[#0a0a0a] to bg-background and text-white to text-foreground */
    <div className="min-h-screen bg-background text-foreground transition-colors duration-500 flex flex-col relative overflow-hidden">
      
      {/* FIXED: Background grid now uses the theme-aware border variable */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:40px_40px] opacity-[0.05] pointer-events-none" />

      <Toaster theme={theme === 'dark' ? 'dark' : 'light'} position="bottom-right" />

      {/* FIXED: Changed bg-black/20 to bg-card/50 and border-white/10 to border-border */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50 w-full shrink-0">
        <div className="px-6 h-16 flex items-center justify-between w-full">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => router.push("/dashboard")}
          >
            {/* FIXED: Changed bg-lime-400 to bg-primary */}
            <div className="w-8 h-8 bg-primary rounded-lg rotate-12 flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-primary-foreground font-black text-xl leading-none">
                P
              </span>
            </div>
            <span className="font-black italic tracking-tighter text-xl uppercase">
              Provus Poker
            </span>
          </div>
          {step !== "setup" && (
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-xs font-black uppercase tracking-widest"
            >
              <ChevronLeft size={16} /> Back
            </button>
          )}
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden md:block">
              {session?.user?.email}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="p-2 hover:text-destructive transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 w-full flex-1 flex flex-col min-h-0 px-6 py-12 overflow-y-auto">
        {step === "setup" && (
          <div className="max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="mb-12">
              <h1 className="text-5xl font-black italic uppercase tracking-tighter mb-2">
                Welcome back,{" "}
                {/* FIXED: Changed text-lime-400 to text-primary */}
                <span className="text-primary">
                  {session?.user?.name?.split(" ")[0]}
                </span>
              </h1>
              <p className="text-muted-foreground max-w-lg italic font-medium">
                Ready to estimate? Start a session below.
              </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {/* FIXED: Card uses bg-primary and primary-foreground for text */}
              <button
                onClick={handleStartCreation}
                className="group relative bg-primary p-8 rounded-[40px] flex flex-col justify-between items-start text-primary-foreground h-64 hover:scale-[1.02] transition-all duration-300 shadow-2xl shadow-primary/20"
              >
                <Plus size={40} className="mb-8" />
                <div>
                  <h2 className="text-3xl font-black uppercase italic leading-none">
                    Create
                    <br />
                    Session
                  </h2>
                  <p className="text-primary-foreground/70 text-sm mt-2 font-black uppercase italic">
                    Start a new poker room
                  </p>
                </div>
              </button>

              {/* FIXED: Using bg-card and border-border */}
              <div
                onClick={() => updateURL({ step: "join" })}
                className="bg-card border border-border p-8 rounded-[40px] flex flex-col justify-between h-64 group cursor-pointer hover:bg-muted/50 transition-colors shadow-sm"
              >
                <Users className="w-10 h-10 text-primary mb-8 group-hover:animate-bounce" />
                <h2 className="text-3xl font-black uppercase italic leading-none text-foreground">
                  Join Room
                </h2>
              </div>

              <div className="bg-card border border-border p-8 rounded-[40px] flex flex-col justify-between h-64 group cursor-pointer hover:bg-muted/50 transition-colors shadow-sm">
                <History className="w-10 h-10 text-muted-foreground mb-8" />
                <h2 className="text-3xl font-black uppercase italic leading-none text-foreground opacity-50">
                  History
                </h2>
              </div>
            </div>
          </div>
        )}

        {step === "join" && (
          <div className="max-w-7xl mx-auto w-full animate-in fade-in duration-500">
            <JoinSession />
          </div>
        )}

        {step === "board" && (
          <div className="max-w-7xl mx-auto w-full animate-in fade-in duration-500">
            <h2 className="text-4xl font-black italic uppercase mb-8 tracking-tighter">
              Select Board
            </h2>
            <BoardSelector
              onSelect={(b: Board) =>
                updateURL({
                  step: b.type === "scrum" ? "sprint" : "launch",
                  boardId: b.id,
                })
              }
            />
          </div>
        )}

        {step === "sprint" && boardId && (
          <div className="max-w-7xl mx-auto w-full animate-in fade-in duration-500">
            <h2 className="text-4xl font-black italic uppercase mb-8 tracking-tighter">
              Select Sprint
            </h2>
            <SprintSelector
              boardId={boardId}
              onSelect={(s: Sprint) =>
                updateURL({ step: "launch", sprintId: s.id })
              }
            />
          </div>
        )}

        {step === "launch" && (
          <div className="w-full flex-1 flex flex-col min-h-0 animate-in fade-in duration-500">
            <div className="flex justify-between items-end mb-6 shrink-0 px-2">
              <div className="flex items-center gap-4">
                <h2 className="text-4xl font-black italic uppercase tracking-tighter">
                  Arena
                </h2>
                {sessionId && (
                  <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-black rounded-lg border border-primary/20 uppercase tracking-widest italic">
                    ID: {sessionId}
                  </span>
                )}
              </div>
              <button
                onClick={refreshJiraData}
                className="flex items-center gap-2 px-6 py-3 bg-card border border-border rounded-2xl text-[10px] font-black uppercase hover:border-primary transition-all shadow-sm"
              >
                <RefreshCw
                  size={14}
                  className={loading ? "animate-spin" : ""}
                />{" "}
                Sync
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <IssueSelector
                preFetchedIssues={issues}
                onSync={refreshJiraData}
                onLaunch={(issue: JiraIssue) => {
                  if (!sessionId) {
                    toast.error(
                      "Session ID missing. Please recreate the session.",
                    );
                    return;
                  }
                  sessionStorage.setItem(`poker_issue_${sessionId}`, JSON.stringify(issue));
                  router.push(`/poker/${sessionId}?host=true`);
                }}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <RefreshCw className="animate-spin text-primary" size={32} />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}