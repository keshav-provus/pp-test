"use client";

import React, { useState, useEffect } from 'react';
import { getSprints } from '../../../services/jira';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiCalendar, FiChevronRight, FiLoader } from 'react-icons/fi';
import { useTheme } from "next-themes";
import { useColor } from "@/context/ColorContext";

type Sprint = {
  id: string;
  name: string;
  state: string;
};

export const SprintSelector = ({ boardId, onSelect }: { boardId: string, onSelect: (sprint: Sprint) => void }) => {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const { theme } = useTheme();
  const { primaryColor } = useColor();

  useEffect(() => {
    getSprints(boardId).then((data) => {
      setSprints(data);
      setLoading(false);
    });
  }, [boardId]);

  const filtered = sprints.filter(s => 
    s.name.toLowerCase().includes(query.toLowerCase())
  );

  if (loading) return (
    <div className="py-24 flex flex-col items-center justify-center gap-4 w-full">
      {/* Updated: Loader uses primary brand color */}
      <FiLoader className="animate-spin text-primary" size={32} />
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Loading Sprints...</p>
    </div>
  );

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Search Input - Adaptive Theme */}
      <div className="relative w-full max-w-xl">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input 
          type="text"
          placeholder="FILTER SPRINTS BY NAME..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          /* Updated: Semantic background and focus border */
          className="w-full bg-card border border-border rounded-2xl py-4 pl-12 pr-4 text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-primary transition-all placeholder:text-muted-foreground/30 text-foreground"
        />
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((sprint) => (
            <motion.button
              layout
              key={sprint.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={() => onSelect(sprint)}
              /* Updated: bg-card and hover primary border */
              className="group p-6 rounded-3xl border border-border bg-card hover:border-primary hover:bg-muted/50 transition-all flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-5">
                {/* Sprint State Indicator */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  sprint.state === 'active' 
                    ? 'bg-emerald-500/10 text-emerald-500' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  <FiCalendar size={20} />
                </div>
                <div className="text-left">
                  <h4 className="text-base font-black italic uppercase tracking-tight text-foreground group-hover:text-primary transition-colors">
                    {sprint.name}
                  </h4>
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                    {sprint.state}
                  </span>
                </div>
              </div>
              <FiChevronRight className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" size={24} />
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};