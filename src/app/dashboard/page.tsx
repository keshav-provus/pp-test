
"use client";

import { useSession, signOut } from "next-auth/react";
import { Plus, Users, History, LogOut, Clock, ChevronRight, Circle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Static data ──────────────────────────────────────────────────────────────
const RECENT = [
  { name: "Sprint 42 Planning",  date: "Today, 2:30 PM",   votes: 8, status: "live",     pts: "—"   },
  { name: "Backend Refactor",    date: "Yesterday, 11 AM", votes: 6, status: "done",     pts: "13"  },
  { name: "Auth Flow Redesign",  date: "Mon, 9:00 AM",     votes: 9, status: "done",     pts: "8"   },
  { name: "Dashboard MVP",       date: "Fri, 3:45 PM",     votes: 7, status: "done",     pts: "21"  },
  { name: "Supabase Migration",  date: "Thu, 1:00 PM",     votes: 5, status: "done",     pts: "5"   },
];

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
function TrafficLights({ title }: { title?: string }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3 border-b border-white/5 bg-black/20">
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-full bg-red-500/80" />
        <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
        <span className="w-3 h-3 rounded-full bg-green-500/80" />
      </div>
      {title && <span className="text-[11px] font-medium tracking-widest text-muted-foreground uppercase">{title}</span>}
    </div>
  );
}

function GlassPanel({ children, className, title }: { children: React.ReactNode; className?: string; title?: string; }) {
  return (
    <div className={cn(
      "relative flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl overflow-hidden transition-all duration-300",
      className
    )}>
      {/* Subtle top highlight */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      {title && <TrafficLights title={title} />}
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}
import { useRouter } from "next/navigation";
import { Plus, Users, History, LogOut, LayoutDashboard, ShieldAlert } from "lucide-react";
import Link from "next/link"; // Use Link for faster navigation

// ─── Main component ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";
  const email     = session?.user?.email ?? "";

  // Explicitly check if the user is an admin
  const isAdmin = session?.user?.role === "admin";

  return (
    <div className="min-h-screen bg-[#060808] text-slate-100 font-sans relative overflow-x-hidden selection:bg-lime-500/30">
      
      {/* ── Ambient Background Glows ── */}
      <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-lime-500/10 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-2xl">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-lime-400 flex items-center justify-center shadow-[0_0_15px_rgba(163,230,53,0.3)]">
              <span className="font-bold text-black text-sm">P</span>
            </div>
            <span className="font-semibold tracking-tight text-lg">
              Provus<span className="text-lime-400">Poker</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 pl-4 pr-1 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
              <div className="flex flex-col text-right leading-tight">
                <span className="text-sm font-medium">{firstName}</span>
                <span className="text-[10px] text-muted-foreground">{email.split("@")[1]}</span>
              </div>
              <Avatar className="h-8 w-8 border border-white/20">
                <AvatarFallback className="bg-gradient-to-br from-lime-400 to-lime-600 text-black font-bold">
                  {firstName.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors" onClick={() => signOut({ callbackUrl: "/login" })}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Main Content ── */}
      <main className="relative z-10 max-w-[1200px] mx-auto px-6 py-12">
        
        {/* Header */}
        <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
            Ready to estimate, <span className="text-lime-400">{firstName}?</span>
          </h1>
          <p className="text-muted-foreground font-light text-lg">
            Create a new session or jump back into your recent workflow.
          </p>
        </div>

        {/* Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Primary Action: Create Session */}
          <GlassPanel className="md:col-span-2 group hover:border-lime-500/30 hover:shadow-[0_0_40px_rgba(163,230,53,0.1)] cursor-pointer">
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

          {/* Secondary Actions: Stacked */}
          <div className="flex flex-col gap-6">
            <GlassPanel className="flex-1 group hover:border-blue-500/30 hover:bg-white/[0.04] cursor-pointer" title="Join">
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

            <GlassPanel className="flex-1 group hover:border-pink-500/30 hover:bg-white/[0.04] cursor-pointer" title="Archive">
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

        {/* Recent Sessions Table */}
        <GlassPanel title="Recent Sessions" className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-both">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-black/20 hover:bg-black/20">
                <TableRow className="border-white/5">
                  <TableHead className="text-xs tracking-widest uppercase text-muted-foreground h-12">Session Name</TableHead>
                  <TableHead className="text-xs tracking-widest uppercase text-muted-foreground h-12">Date</TableHead>
                  <TableHead className="text-xs tracking-widest uppercase text-muted-foreground text-center h-12">Votes</TableHead>
                  <TableHead className="text-xs tracking-widest uppercase text-muted-foreground h-12">Result</TableHead>
                  <TableHead className="text-xs tracking-widest uppercase text-muted-foreground h-12">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {RECENT.map((row, i) => (
                  <TableRow key={i} className="border-white/5 hover:bg-white/5 cursor-pointer transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-1.5 h-1.5 rounded-full", row.status === "live" ? "bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.8)]" : "bg-white/20")} />
                        {row.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {row.date}
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">{row.votes}</TableCell>
                    <TableCell className="font-semibold text-slate-200">
                      {row.pts === "—" ? <span className="text-white/20">—</span> : `${row.pts} pts`}
                    </TableCell>
                    <TableCell>
                      {row.status === "live" ? (
                        <Badge variant="outline" className="border-lime-500/30 text-lime-400 bg-lime-400/10 gap-1.5 py-0.5 animate-pulse">
                          <Circle className="h-2 w-2 fill-current" /> Live
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-white/10 text-muted-foreground bg-white/5 gap-1.5 py-0.5">
                          Done
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </GlassPanel>

      </main>
    </div>
  );
}