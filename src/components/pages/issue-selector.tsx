"use client";

import React, { useState, DragEvent, useMemo, useEffect } from "react";
import { FiPlay, FiCheckCircle, FiChevronDown, FiRefreshCw, FiX, FiPlus, FiSearch } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { 
  updateIssueStatus, 
  createJiraIssue, 
  moveIssueToSprint, 
  moveIssueToBacklog 
} from "../../services/jira";
import { useSearchParams } from 'next/navigation';

export const IssueSelector = ({ 
  preFetchedIssues, 
  onLaunch,
  onSync 
}: { 
  preFetchedIssues: any[], 
  onLaunch: (issue: any) => void,
  onSync: () => Promise<void> 
}) => {
  const [cards, setCards] = useState(preFetchedIssues);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDoneOver, setIsDoneOver] = useState(false);
  const [showDoneModal, setShowDoneModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  const searchParams = useSearchParams();
  const boardId = searchParams.get('boardId');
  const sprintId = searchParams.get('sprintId');

  // Sync local state when parent data refreshes
  useEffect(() => {
    setCards(preFetchedIssues);
  }, [preFetchedIssues]);

  const filteredCards = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return cards;

    return cards.filter(card => 
      card.key.toLowerCase().startsWith(query) || 
      card.summary.toLowerCase().startsWith(query)
    );
  }, [cards, searchQuery]);

  const handleSync = async () => {
    const toastId = toast.loading("Syncing with Jira...");
    try {
      await onSync();
      toast.success("Board updated", { id: toastId });
    } catch (err) {
      toast.error("Sync failed", { id: toastId });
    }
  };

  const handleStatusChange = async (cardId: string, targetColumn: string, targetStatus: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

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
        // Only call updateIssueStatus for intra-sprint moves
        await updateIssueStatus(card.key, targetStatus);
      }
      
      toast.success(`${card.key} synced`, { id: toastId });
    } catch (err: any) {
      setCards(pv => pv.map(c => c.id === cardId ? { ...c, column: sourceColumn, status: sourceStatus } : c));
      toast.error(err.message || `Jira sync failed`, { id: toastId });
    }
  };

  const doneIssues = cards.filter(c => c.column === 'done');

  return (
    <div className="h-full w-full flex flex-col gap-4">
      <div className="flex justify-between items-center px-4 mb-2">
        <div className="flex items-center gap-4">
          <div className="relative w-[400px] group">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH BY KEY OR NAME..."
              className="w-full bg-[#121212] border border-neutral-800 rounded-2xl py-3 pl-12 pr-4 text-[10px] font-black tracking-widest text-white focus:outline-none focus:border-indigo-500 transition-all uppercase"
            />
          </div>
          
          <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 px-6 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-[10px] font-black uppercase text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all">
            <FiPlus /> CREATE ISSUE
          </button>
        </div>

        <div className="flex items-center gap-4 relative">
          <div 
            onDrop={(e) => { const id = e.dataTransfer.getData("cardId"); setIsDoneOver(false); handleStatusChange(id, 'done', 'Done'); }}
            onDragOver={(e) => { e.preventDefault(); setIsDoneOver(true); }}
            onDragLeave={() => setIsDoneOver(false)}
            onClick={() => setShowDoneModal(true)}
            className={`flex items-center gap-4 px-6 py-3 rounded-2xl border transition-all cursor-pointer ${isDoneOver ? "bg-emerald-500/20 border-emerald-500" : "bg-[#121212] border-neutral-800"}`}
          >
            <FiCheckCircle className="text-emerald-500" size={18} />
            <span className="text-[11px] font-black text-white">DONE</span>
            <span className="bg-[#1a1a1a] px-3 py-1 rounded-lg text-[11px] font-bold text-neutral-400">{doneIssues.length}</span>
            <FiChevronDown className="text-neutral-600" />
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="grid grid-cols-4 h-full w-full gap-6 p-4">
          <Column title="BACKLOG" column="backlog" headingColor="text-neutral-500" cards={filteredCards} onStatusChange={handleStatusChange} />
          <Column title="TODO" column="todo" headingColor="text-yellow-400" cards={filteredCards} onStatusChange={handleStatusChange} />
          <Column title="IN PROGRESS" column="doing" headingColor="text-blue-400" cards={filteredCards} onStatusChange={handleStatusChange} />
          <LaunchArena onLaunch={onLaunch} setCards={setCards} />
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAdding(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <JiraCreateModal boardId={boardId} setCards={setCards} onClose={() => setIsAdding(false)} />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Column, Card, LaunchArena, and JiraCreateModal remain as defined in previous working steps.

/* SUB-COMPONENTS */

const Column = ({ title, headingColor, cards, column, onStatusChange }: any) => {
  const [active, setActive] = useState(false);
  const filtered = cards.filter((c: any) => c.column === column);

  return (
    <div className="flex flex-col h-full min-w-0">
      <div className="mb-4 flex items-center justify-between px-2">
        <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] ${headingColor}`}>{title}</h3>
        <span className="text-neutral-600 bg-neutral-900/50 px-2 py-0.5 rounded-lg text-[10px] font-bold">{filtered.length}</span>
      </div>
      <div
        onDrop={(e: DragEvent) => { const id = e.dataTransfer.getData("cardId"); setActive(false); onStatusChange(id, column, title); }}
        onDragOver={(e: DragEvent) => { e.preventDefault(); setActive(true); }}
        onDragLeave={() => setActive(false)}
        className={`flex-1 w-full min-h-[200px] transition-all duration-300 rounded-[32px] border-2 border-dashed overflow-hidden
          ${active ? "bg-indigo-500/5 border-indigo-500/50 scale-[1.01]" : "bg-transparent border-transparent"}`}
      >
        <div className="p-1 h-full overflow-y-auto custom-scrollbar">
          <AnimatePresence>
            {filtered.map((c: any) => (
              <Card key={c.id} id={c.id} issueKey={c.key} summary={c.summary} status={c.status} currentColumn={column} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const Card = ({ summary, issueKey, id, status, currentColumn }: any) => {
  const getStatusColor = (s: string) => {
    switch (s?.toLowerCase()) {
      case 'done': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'in progress': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      default: return 'text-neutral-400 bg-neutral-800/50 border-neutral-700/50';
    }
  };

  return (
    <motion.div 
      layout 
      layoutId={id} 
      className="cursor-grab rounded-2xl border border-neutral-800 bg-[#121212]/50 p-4 mb-3 active:cursor-grabbing hover:border-neutral-600 hover:bg-[#121212] transition-all relative group"
    >
      <div draggable="true" onDragStart={(e: React.DragEvent<HTMLDivElement>) => e.dataTransfer.setData("cardId", id)} className="w-full h-full">
        <div className="flex justify-between items-start mb-2">
          <span className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest">{issueKey}</span>
          {currentColumn === 'backlog' && status && (
            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md border tracking-tighter transition-colors ${getStatusColor(status)}`}>
              {status}
            </span>
          )}
        </div>
        <p className="text-xs text-neutral-100 font-semibold leading-relaxed line-clamp-2">{summary}</p>
      </div>
    </motion.div>
  );
};

const LaunchArena = ({ onLaunch, setCards }: any) => {
  const [active, setActive] = useState(false);
  return (
    <div className="flex flex-col h-full min-w-0">
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-4 px-2">LAUNCH ARENA</h3>
      <div 
        onDrop={(e: DragEvent) => { 
          const id = e.dataTransfer.getData("cardId"); 
          setCards((pv: any[]) => { 
            const card = pv.find(c => c.id === id); 
            if (card) onLaunch(card); 
            return pv.filter(c => c.id !== id); 
          }); 
          setActive(false); 
        }} 
        onDragOver={(e: DragEvent) => { e.preventDefault(); setActive(true); }} 
        onDragLeave={() => setActive(false)} 
        className={`flex-1 w-full rounded-[40px] border-2 border-dashed grid place-content-center transition-all duration-500
          ${active ? "bg-indigo-500/10 border-indigo-500 shadow-[0_0_40px_rgba(99,102,241,0.1)] scale-[1.02]" : "bg-[#121212]/20 border-neutral-800"}`}
      >
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <div className={`p-5 rounded-full transition-all duration-500 ${active ? "bg-indigo-500 text-white shadow-lg" : "bg-[#1a1a1a] text-neutral-800"}`}>
            <FiPlay size={30} className={active ? "animate-pulse" : ""} />
          </div>
          <p className={`text-[9px] font-black uppercase tracking-widest ${active ? "text-indigo-400" : "text-neutral-700"}`}>
            {active ? "READY" : "DRAG HERE"}
          </p>
        </div>
      </div>
    </div>
  );
};

const JiraCreateModal = ({ boardId, setCards, onClose }: any) => {
  const [formData, setFormData] = useState({ summary: "", type: "Task" });
  const searchParams = useSearchParams();
  const sprintId = searchParams.get('sprintId');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.summary.trim()) return;

    const toastId = toast.loading(`Creating ${formData.type} in Sprint...`);
    try {
      const jiraIssue = await createJiraIssue(formData.summary, boardId, formData.type, sprintId);
      await updateIssueStatus(jiraIssue.key, "To Do");
      const newIssue = { id: jiraIssue.id, key: jiraIssue.key, summary: formData.summary, column: 'todo', status: 'To Do' };
      setCards((pv: any) => [...pv, newIssue]);
      toast.success(`${jiraIssue.key} created in Sprint & set to TODO`, { id: toastId });
      onClose();
    } catch (err) {
      toast.error("Jira sync failed", { id: toastId });
    }
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative w-full max-w-xl bg-[#0f0f0f] border border-neutral-800 rounded-[40px] p-10 shadow-2xl">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">CREATE ISSUE</h2>
          <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest mt-1">Targeting Sprint: {sprintId || "Backlog"}</p>
        </div>
        <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors"><FiX size={20}/></button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="flex bg-[#1a1a1a] p-1.5 rounded-2xl gap-2">
          {["Task", "Bug", "Story"].map(t => (
            <button key={t} type="button" onClick={() => setFormData({...formData, type: t})} 
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${formData.type === t ? "bg-indigo-600 text-white shadow-lg" : "text-neutral-600 hover:text-neutral-400"}`}>
              {t}
            </button>
          ))}
        </div>
        <input autoFocus required value={formData.summary} onChange={(e) => setFormData({...formData, summary: e.target.value})} 
          className="w-full bg-[#1a1a1a] border border-neutral-800 rounded-2xl px-6 py-5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="ISSUE SUMMARY" />
        <div className="flex justify-end gap-4 pt-4 border-t border-neutral-800/50">
          <button type="button" onClick={onClose} className="text-[10px] font-black uppercase text-neutral-600 tracking-widest">CANCEL</button>
          <button type="submit" className="px-10 py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase hover:bg-neutral-200 transition-all">CREATE IN TODO</button>
        </div>
      </form>
    </motion.div>
  );
};