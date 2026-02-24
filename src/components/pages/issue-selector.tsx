"use client";

import React, { useState, DragEvent, useMemo, useEffect, Suspense } from "react";
import { FiPlay, FiCheckCircle, FiX, FiPlus, FiSearch, FiLoader } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { 
  updateIssueStatus, 
  createJiraIssue, 
  moveIssueToSprint, 
  moveIssueToBacklog 
} from "../../../services/jira"; 
import { useSearchParams } from 'next/navigation';
import { useTheme } from "next-themes";
import { useColor } from "@/context/ColorContext";

// --- INTERFACES ---

interface JiraIssue {
  id: string;
  key: string;
  summary: string;
  status: string;
  statusCategory: string;
  column?: string;
}

interface IssueSelectorProps {
  preFetchedIssues: JiraIssue[];
  onLaunch: (issue: JiraIssue) => void;
  onSync: () => Promise<void>;
}

interface ColumnProps {
  title: string;
  headingColor: string;
  cards: JiraIssue[];
  column: string;
  onStatusChange: (cardId: string, targetColumn: string, targetStatus: string) => void;
}

interface CardProps {
  summary: string;
  issueKey: string;
  id: string;
  status: string;
  currentColumn: string;
}

interface LaunchArenaProps {
  onLaunch: (issue: JiraIssue) => void;
  setCards: React.Dispatch<React.SetStateAction<JiraIssue[]>>;
}

interface JiraCreateModalProps {
  boardId: string;
  setCards: React.Dispatch<React.SetStateAction<JiraIssue[]>>;
  onClose: () => void;
}

// --- MAIN COMPONENTS ---

const IssueSelectorContent = ({ 
  preFetchedIssues, 
  onLaunch,
  onSync 
}: IssueSelectorProps) => {
  const [cards, setCards] = useState<JiraIssue[]>(preFetchedIssues);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDoneOver, setIsDoneOver] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  const searchParams = useSearchParams();
  const boardId = searchParams.get('boardId');
  const sprintId = searchParams.get('sprintId');

  useEffect(() => {
    setCards(preFetchedIssues);
  }, [preFetchedIssues]); 

  const filteredCards = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return query ? cards.filter(c => 
      c.key.toLowerCase().includes(query) || 
      c.summary.toLowerCase().includes(query)
    ) : cards;
  }, [cards, searchQuery]); 

  const handleStatusChange = async (cardId: string, targetColumn: string, targetStatus: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card || card.column === targetColumn) return; 

    const sourceColumn = card.column;
    const sourceStatus = card.status;

    setCards(pv => pv.map(c => c.id === cardId ? { ...c, column: targetColumn, status: targetStatus } : c));
    const toastId = toast.loading(`Syncing ${card.key}...`);

    try {
      if (sourceColumn === 'backlog' && targetColumn !== 'backlog') {
        if (!sprintId) throw new Error("No active sprint ID found");
        await moveIssueToSprint(card.key, sprintId); 
      } 
      else if (sourceColumn !== 'backlog' && targetColumn === 'backlog') {
        await moveIssueToBacklog(card.key); 
      } else {
        await updateIssueStatus(card.key, targetStatus); 
      }
      toast.success(`${card.key} synced`, { id: toastId });
    } catch (err: unknown) {
      setCards(pv => pv.map(c => c.id === cardId ? { ...c, column: sourceColumn, status: sourceStatus } : c));
      toast.error(err instanceof Error ? err.message : `Jira sync failed`, { id: toastId });
    }
  };

  const doneIssues = cards.filter(c => c.column === 'done');

  return (
    <div className="h-full w-full flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center px-2 shrink-0">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-full max-w-2xl group">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH BY KEY OR NAME..."
              className="w-full bg-card border border-border rounded-2xl py-4 pl-12 pr-4 text-[10px] font-black tracking-widest text-foreground focus:outline-none focus:border-primary transition-all uppercase placeholder:text-muted-foreground/30"
            />
          </div>
          <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 px-6 py-4 bg-primary/10 border border-primary/20 rounded-2xl text-[10px] font-black uppercase text-primary hover:bg-primary hover:text-primary-foreground transition-all shrink-0">
            <FiPlus /> CREATE ISSUE
          </button>
        </div>

        <div className="flex items-center gap-4 relative ml-4 shrink-0">
          <div 
            onDrop={(e) => { 
              const id = e.dataTransfer.getData("cardId"); 
              setIsDoneOver(false); 
              if (id) handleStatusChange(id, 'done', 'Done'); 
            }}
            onDragOver={(e) => { e.preventDefault(); setIsDoneOver(true); }}
            onDragLeave={() => setIsDoneOver(false)}
            className={`flex items-center gap-4 px-6 py-4 rounded-2xl border transition-all cursor-pointer ${isDoneOver ? "bg-emerald-500/20 border-emerald-500" : "bg-card border-border"}`}
          >
            <FiCheckCircle className="text-emerald-500" size={18} />
            <span className="text-[11px] font-black text-foreground italic uppercase">DONE</span>
            <span className="bg-muted px-3 py-1 rounded-lg text-[11px] font-bold text-muted-foreground">{doneIssues.length}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 h-full w-full gap-6 px-2 pb-2">
          <Column title="BACKLOG" column="backlog" headingColor="text-muted-foreground" cards={filteredCards} onStatusChange={handleStatusChange} />
          <Column title="TODO" column="todo" headingColor="text-primary" cards={filteredCards} onStatusChange={handleStatusChange} />
          <Column title="IN PROGRESS" column="doing" headingColor="text-sky-400" cards={filteredCards} onStatusChange={handleStatusChange} />
          <LaunchArena onLaunch={onLaunch} setCards={setCards} />
        </div>
      </div>

      <AnimatePresence>
        {isAdding && boardId && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAdding(false)} className="absolute inset-0 bg-background/80 backdrop-blur-md" />
            <JiraCreateModal boardId={boardId} setCards={setCards} onClose={() => setIsAdding(false)} />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const IssueSelector = (props: IssueSelectorProps) => (
  <Suspense fallback={<div className="h-full w-full bg-card animate-pulse rounded-3xl" />}>
    <IssueSelectorContent {...props} />
  </Suspense>
);

// --- SUB-COMPONENTS ---

const Column = ({ title, headingColor, cards, column, onStatusChange }: ColumnProps) => {
  const [active, setActive] = useState(false);
  const filtered = cards.filter((c: JiraIssue) => c.column === column);

  const getJiraStatusName = (col: string) => {
    switch (col) {
      case 'todo': return 'To Do';
      case 'doing': return 'In Progress';
      default: return 'To Do';
    }
  }; 

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="mb-4 flex items-center justify-between px-2">
        <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] italic ${headingColor}`}>{title}</h3>
        <span className="text-muted-foreground bg-muted px-2 py-0.5 rounded-lg text-[10px] font-bold">{filtered.length}</span>
      </div>
      <div
        onDrop={(e: DragEvent) => { 
          const id = e.dataTransfer.getData("cardId"); 
          setActive(false); 
          if (id) onStatusChange(id, column, getJiraStatusName(column)); 
        }}
        onDragOver={(e: DragEvent) => { e.preventDefault(); setActive(true); }}
        onDragLeave={() => setActive(false)}
        className={`flex-1 w-full transition-all duration-300 rounded-[32px] border-2 border-dashed overflow-hidden
          ${active ? "bg-primary/5 border-primary scale-[1.01]" : "bg-card border-transparent"}`}
      >
        <div className="p-2 h-full overflow-y-auto custom-scrollbar">
          <AnimatePresence>
            {filtered.map((c: JiraIssue) => (
              <Card key={c.id} id={c.id} issueKey={c.key} summary={c.summary} status={c.status} currentColumn={column} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const Card = ({ summary, issueKey, id, status, currentColumn }: CardProps) => {
  return (
    <div
      draggable={true}
      onDragStart={(e: DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData("cardId", id.toString());
        e.dataTransfer.effectAllowed = "move";
        if (e.currentTarget) (e.currentTarget as HTMLElement).style.opacity = "0.5";
      }}
      onDragEnd={(e: DragEvent<HTMLDivElement>) => {
        (e.currentTarget as HTMLElement).style.opacity = "1";
      }}
      className="cursor-grab rounded-2xl border border-border bg-background p-4 mb-3 active:cursor-grabbing hover:border-primary/50 transition-all relative group shadow-sm"
    >
      <div className="w-full h-full pointer-events-none">
        <div className="flex justify-between items-start mb-2">
          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{issueKey}</span>
          {currentColumn === 'backlog' && status && (
            <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-md border border-border bg-muted tracking-tighter text-muted-foreground">
              {status}
            </span>
          )}
        </div>
        <p className="text-xs text-foreground font-semibold leading-relaxed line-clamp-2">{summary}</p>
      </div>
    </div>
  );
};

const LaunchArena = ({ onLaunch, setCards }: LaunchArenaProps) => {
  const [active, setActive] = useState(false);
  return (
    <div className="flex flex-col h-full min-h-0">
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] italic text-primary mb-4 px-2">LAUNCH ARENA</h3>
      <div 
        onDrop={(e: DragEvent) => { 
          const id = e.dataTransfer.getData("cardId"); 
          setActive(false); 
          if (id) {
            setCards((pv: JiraIssue[]) => { 
              const card = pv.find(c => c.id === id); 
              if (card) onLaunch(card); 
              return pv.filter(c => c.id !== id); 
            }); 
          }
        }} 
        onDragOver={(e: DragEvent) => { e.preventDefault(); setActive(true); }} 
        onDragLeave={() => setActive(false)} 
        className={`flex-1 w-full rounded-[40px] border-2 border-dashed grid place-content-center transition-all duration-500
          ${active ? "bg-primary/10 border-primary shadow-[0_0_40px_rgba(var(--primary),0.1)] scale-[1.02]" : "bg-card border-border"}`}
      >
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <div className={`p-6 rounded-full transition-all duration-500 ${active ? "bg-primary text-primary-foreground shadow-lg" : "bg-muted text-muted-foreground"}`}>
            <FiPlay size={30} className={active ? "animate-pulse" : ""} />
          </div>
          <p className={`text-[10px] font-black uppercase italic tracking-widest ${active ? "text-primary" : "text-muted-foreground"}`}>
            {active ? "READY TO LAUNCH" : "DRAG ISSUE HERE"}
          </p>
        </div>
      </div>
    </div>
  );
};

const JiraCreateModal = ({ boardId, setCards, onClose }: JiraCreateModalProps) => {
  const [formData, setFormData] = useState({ summary: "", type: "Task" });
  const searchParams = useSearchParams();
  const sprintId = searchParams.get('sprintId');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.summary.trim()) return;

    const toastId = toast.loading(`Creating ${formData.type}...`);
    try {
      const jiraIssue = await createJiraIssue(formData.summary, boardId, formData.type, sprintId);
      await updateIssueStatus(jiraIssue.key, "To Do");
      
      const newIssue: JiraIssue = { 
        id: jiraIssue.id, key: jiraIssue.key, summary: formData.summary, 
        column: 'todo', status: 'To Do', statusCategory: 'To Do'
      };

      setCards((pv: JiraIssue[]) => [...pv, newIssue]);
      toast.success(`${jiraIssue.key} created in TODO`, { id: toastId });
      onClose();
    } catch (err) {
      toast.error("Jira sync failed", { id: toastId });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 20 }} 
      animate={{ opacity: 1, scale: 1, y: 0 }} 
      className="relative w-full max-w-xl bg-card border border-border rounded-[40px] p-10 shadow-2xl"
    >
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-foreground leading-none">CREATE ISSUE</h2>
          <p className="text-[9px] text-primary font-bold uppercase tracking-widest mt-2">
            Target: {sprintId ? `Sprint ${sprintId}` : "Backlog"}
          </p>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><FiX size={20}/></button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="flex bg-muted p-1.5 rounded-2xl gap-2 border border-border">
          {["Task", "Bug", "Story"].map(t => (
            <button 
              key={t} type="button" 
              onClick={() => setFormData({...formData, type: t})} 
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${
                formData.type === t ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <input 
          autoFocus required 
          value={formData.summary} 
          onChange={(e) => setFormData({...formData, summary: e.target.value})} 
          className="w-full bg-background border border-border rounded-2xl px-6 py-5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/30" 
          placeholder="ISSUE SUMMARY" 
        />

        <div className="flex justify-end gap-4 pt-4 border-t border-border">
          <button type="button" onClick={onClose} className="text-[10px] font-black uppercase text-muted-foreground tracking-widest hover:text-foreground">CANCEL</button>
          <button type="submit" className="px-10 py-4 bg-primary text-primary-foreground rounded-2xl text-[10px] font-black uppercase hover:opacity-90 transition-all">CREATE</button>
        </div>
      </form>
    </motion.div>
  );
};