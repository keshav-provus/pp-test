import { Clock, Circle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const RECENT = [
  { name: "Sprint 42 Planning", date: "Today, 2:30 PM", votes: 8, status: "live", pts: "—" },
  { name: "Backend Refactor", date: "Yesterday, 11 AM", votes: 6, status: "done", pts: "13" },
  { name: "Auth Flow Redesign", date: "Mon, 9:00 AM", votes: 9, status: "done", pts: "8" },
  { name: "Dashboard MVP", date: "Fri, 3:45 PM", votes: 7, status: "done", pts: "21" },
  { name: "Supabase Migration", date: "Thu, 1:00 PM", votes: 5, status: "done", pts: "5" },
];

export function RecentSessions() {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-gray-100 dark:border-[#2c333a] hover:bg-transparent">
            <TableHead className="text-[10px] tracking-widest uppercase text-gray-400 dark:text-[#626f86] font-bold h-10">Session Name</TableHead>
            <TableHead className="text-[10px] tracking-widest uppercase text-gray-400 dark:text-[#626f86] font-bold h-10">Date</TableHead>
            <TableHead className="text-[10px] tracking-widest uppercase text-gray-400 dark:text-[#626f86] font-bold text-center h-10">Votes</TableHead>
            <TableHead className="text-[10px] tracking-widest uppercase text-gray-400 dark:text-[#626f86] font-bold h-10">Result</TableHead>
            <TableHead className="text-[10px] tracking-widest uppercase text-gray-400 dark:text-[#626f86] font-bold h-10">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {RECENT.map((row, i) => (
            <TableRow key={i} className="border-gray-100 dark:border-[#2c333a] hover:bg-gray-50 dark:hover:bg-[#22272b]/50 cursor-pointer transition-colors">
              <TableCell className="font-medium text-[#172b4d] dark:text-[#dfe1e6]">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full shrink-0",
                    row.status === "live"
                      ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]"
                      : "bg-gray-300 dark:bg-[#2c333a]"
                  )} />
                  <span className="text-sm">{row.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-gray-500 dark:text-[#8c9bab] text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-gray-400 dark:text-[#626f86]" />
                  {row.date}
                </div>
              </TableCell>
              <TableCell className="text-center text-gray-500 dark:text-[#8c9bab] text-sm tabular-nums">{row.votes}</TableCell>
              <TableCell className="font-semibold text-sm text-[#172b4d] dark:text-[#dfe1e6]">
                {row.pts === "—" 
                  ? <span className="text-gray-300 dark:text-[#2c333a]">—</span> 
                  : <span className="text-[#006644] dark:text-[#57d9a3]">{row.pts} pts</span>
                }
              </TableCell>
              <TableCell>
                {row.status === "live" ? (
                  <Badge variant="outline" className="border-emerald-200 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 gap-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                    <Circle className="h-1.5 w-1.5 fill-current animate-pulse" /> Live
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-gray-200 dark:border-[#2c333a] text-gray-500 dark:text-[#8c9bab] bg-gray-50 dark:bg-[#22272b] gap-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                    Done
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}