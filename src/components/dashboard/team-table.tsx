"use client";

import { useMemo, useState } from "react";
import { FiEdit2, FiTrash2, FiMoreVertical } from "react-icons/fi";
// Ensure this package is installed: npm i react-aria-components
import type { SortDescriptor } from "react-aria-components";

// Importing from the fixed base file
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// --- TYPES TO FIX 'ANY' ERRORS ---
interface Team {
  name: string;
}

interface TeamMember {
  username: string;
  name: string;
  avatarUrl: string;
  status: string;
  role: string;
  email: string;
  teams: Team[];
}

// Dummy data to fix missing imports - replace with your actual data source if you have it
const teamMembers: { items: TeamMember[] } = {
  items: [
    { username: "jdoe", name: "John Doe", avatarUrl: "", status: "active", role: "Developer", email: "john@example.com", teams: [{ name: "Frontend" }] },
    { username: "asmith", name: "Alice Smith", avatarUrl: "", status: "inactive", role: "Designer", email: "alice@example.com", teams: [{ name: "Design" }, {name: "Marketing"}] },
  ]
};

// Inline Avatar component to fix missing import
const Avatar = ({ src, alt, size }: { src?: string, alt: string, size?: string }) => (
  <div className={`rounded-full bg-zinc-800 flex items-center justify-center text-[10px] text-white font-bold ${size === 'md' ? 'w-8 h-8' : 'w-6 h-6'}`}>
    {src ? <img src={src} alt={alt} className="rounded-full w-full h-full object-cover"/> : alt.charAt(0)}
  </div>
);

// Inline Pagination component to fix missing import
const PaginationPageMinimalCenter = ({ page, total, className }: { page: number, total: number, className?: string }) => (
  <div className={`text-[10px] text-zinc-500 font-bold uppercase tracking-widest ${className}`}>
    Page {page} of {total}
  </div>
);

export const ThemedTeamTable = () => {
    // We only need the value since we aren't mutating it in this static example
    const [sortDescriptor] = useState<SortDescriptor>({
        column: "status",
        direction: "ascending",
    });

    const sortedItems = useMemo(() => {
        return [...teamMembers.items].sort((a: TeamMember, b: TeamMember) => {
            const first = a[sortDescriptor.column as keyof TeamMember];
            const second = b[sortDescriptor.column as keyof TeamMember];

            if ((typeof first === "number" && typeof second === "number") || (typeof first === "boolean" && typeof second === "boolean")) {
                return sortDescriptor.direction === "descending" ? (second as number) - (first as number) : (first as number) - (second as number);
            }

            if (typeof first === "string" && typeof second === "string") {
                let cmp = first.localeCompare(second);
                if (sortDescriptor.direction === "descending") cmp *= -1;
                return cmp;
            }

            return 0;
        });
    }, [sortDescriptor]);

    return (
        <div className="w-full max-w-7xl mx-auto py-8 animate-in fade-in zoom-in-95 duration-500">
            {/* Glassmorphic Table Wrapper */}
            <div className="bg-white/2 border border-white/10 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl flex flex-col">
                
                {/* Themed Header Section */}
                <div className="flex flex-col md:flex-row items-center justify-between p-6 border-b border-white/10 bg-black/20 gap-4">
                    <div className="flex items-center gap-4">
                        <span className="text-white font-black uppercase tracking-tight text-xl">Team Members</span>
                        <span className="bg-lime-400/10 text-lime-400 border border-lime-400/20 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-widest uppercase">
                            {teamMembers.items.length} Users
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="p-2.5 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all">
                            <FiMoreVertical size={16} />
                        </button>
                    </div>
                </div>

                {/* Standard Shadcn Table with Theme */}
                <div className="overflow-x-auto custom-scrollbar">
                    <Table>
                        <TableHeader className="bg-white/5 sticky top-0 backdrop-blur-md z-10">
                            <TableRow className="border-white/10 hover:bg-transparent">
                                <TableHead className="text-[10px] text-zinc-500 font-black tracking-widest uppercase w-1/4">NAME</TableHead>
                                <TableHead className="text-[10px] text-zinc-500 font-black tracking-widest uppercase">STATUS</TableHead>
                                <TableHead className="text-[10px] text-zinc-500 font-black tracking-widest uppercase">ROLE</TableHead>
                                <TableHead className="text-[10px] text-zinc-500 font-black tracking-widest uppercase hidden md:table-cell">EMAIL ADDRESS</TableHead>
                                <TableHead className="text-[10px] text-zinc-500 font-black tracking-widest uppercase">TEAMS</TableHead>
                                <TableHead className="text-[10px] text-zinc-500 font-black tracking-widest uppercase text-right">ACTIONS</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {sortedItems.map((item) => (
                                <TableRow 
                                    key={item.username}
                                    className="border-white/5 hover:bg-white/5 transition-colors group"
                                >
                                    <TableCell>
                                        <div className="flex items-center gap-4 py-1">
                                            <div className="ring-2 ring-white/10 rounded-full p-0.5 group-hover:ring-lime-400/50 transition-all">
                                                <Avatar src={item.avatarUrl} alt={item.name} size="md" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-slate-100 uppercase tracking-tight">
                                                    {item.name}
                                                </span>
                                                <span className="text-[10px] font-bold text-zinc-500">
                                                    @{item.username}
                                                </span>
                                            </div>
                                        </div>
                                    </TableCell>

                                    <TableCell>
                                        <Badge 
                                            variant={item.status === "active" ? "default" : "secondary"}
                                            className={`uppercase text-[9px] font-black tracking-widest ${
                                                item.status === "active" 
                                                ? "bg-lime-400 text-black hover:bg-lime-500 shadow-[0_0_15px_rgba(163,230,53,0.2)]" 
                                                : "bg-white/10 text-zinc-400 hover:bg-white/20"
                                            }`}
                                        >
                                            {item.status === "active" ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>

                                    <TableCell className="text-xs font-semibold text-slate-300">
                                        {item.role}
                                    </TableCell>

                                    <TableCell className="text-xs font-medium text-zinc-400 hidden md:table-cell">
                                        {item.email}
                                    </TableCell>

                                    <TableCell>
                                        <div className="flex flex-wrap gap-1.5">
                                            {item.teams.slice(0, 3).map((team) => (
                                                <Badge 
                                                    key={team.name} 
                                                    variant="outline"
                                                    className="bg-black/40 border-white/10 text-zinc-300 text-[9px] font-bold uppercase tracking-wider hover:border-lime-400/50 transition-colors"
                                                >
                                                    {team.name}
                                                </Badge>
                                            ))}
                                            {item.teams.length > 3 && (
                                                <Badge 
                                                    variant="secondary"
                                                    className="bg-white/5 text-zinc-500 text-[9px] font-black"
                                                >
                                                    +{item.teams.length - 3}
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>

                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 text-zinc-500 hover:text-lime-400 bg-white/5 hover:bg-white/10 rounded-lg transition-all">
                                                <FiEdit2 size={14} />
                                            </button>
                                            <button className="p-2 text-zinc-500 hover:text-red-400 bg-white/5 hover:bg-white/10 rounded-lg transition-all">
                                                <FiTrash2 size={14} />
                                            </button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <div className="border-t border-white/10 bg-black/20 p-4 flex justify-center">
                    <PaginationPageMinimalCenter page={1} total={10} />
                </div>
            </div>
        </div>
    );
};