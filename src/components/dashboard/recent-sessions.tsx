import { Clock, Circle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { GlassPanel } from "./glass-panel";

const RECENT = [
  { name: "Sprint 42 Planning", date: "Today, 2:30 PM", votes: 8, status: "live", pts: "—" },
  { name: "Backend Refactor", date: "Yesterday, 11 AM", votes: 6, status: "done", pts: "13" },
  { name: "Auth Flow Redesign", date: "Mon, 9:00 AM", votes: 9, status: "done", pts: "8" },
  { name: "Dashboard MVP", date: "Fri, 3:45 PM", votes: 7, status: "done", pts: "21" },
  { name: "Supabase Migration", date: "Thu, 1:00 PM", votes: 5, status: "done", pts: "5" },
];

export function RecentSessions() {
  return (
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
  );
}