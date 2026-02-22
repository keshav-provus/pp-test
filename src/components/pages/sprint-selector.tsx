"use client";

import React, { useState, useEffect } from 'react';
import { getSprints } from '../../services/jira';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiCalendar, FiChevronRight, FiLoader } from 'react-icons/fi';

export const SprintSelector = ({ boardId, onSelect }: { boardId: string, onSelect: (sprint: any) => void }) => {
  const [sprints, setSprints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

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
      <FiLoader className="animate-spin text-indigo-500" size={32} />
      <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Loading Sprints...</p>
    </div>
  );

  return (
    <div className="w-full space-y-8">
      {/* Search Input */}
      <div className="relative w-full max-w-xl">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
        <input 
          type="text"
          placeholder="Filter sprints..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-neutral-900/50 border border-neutral-800 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-indigo-500 transition-all"
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
              className="group p-6 rounded-3xl border border-neutral-800 bg-[#121212] hover:border-indigo-500 transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <FiCalendar size={20} />
                </div>
                <div className="text-left">
                  <h4 className="text-base font-bold text-neutral-200 group-hover:text-white transition-colors">{sprint.name}</h4>
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">{sprint.state}</span>
                </div>
              </div>
              <FiChevronRight className="text-zinc-800 group-hover:text-indigo-500 transition-colors" size={24} />
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};