"use client";

import React, { useState, useEffect } from 'react';
import { getBoardData } from '../../../services/jira';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLayers, FiZap, FiSearch, FiLoader } from 'react-icons/fi';

export const BoardSelector = ({ onSelect }: { onSelect: (board: any) => void }) => {
  const [boards, setBoards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  // Hydration protection for Next.js
  useEffect(() => {
    setMounted(true);
    getBoardData().then((data) => {
      setBoards(data);
      setLoading(false);
    });
  }, []);

  if (!mounted) return null;

  const filtered = boards.filter(b => 
    b.name.toLowerCase().includes(query.toLowerCase())
  );

  if (loading) return (
    <div className="py-24 flex flex-col items-center justify-center gap-4 w-full">
      <FiLoader className="animate-spin text-lime-400" size={32} />
      <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Syncing Jira Boards...</p>
    </div>
  );

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Search Input - Matched to Dashboard Theme */}
      <div className="relative w-full max-w-xl">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
        <input 
          type="text"
          placeholder="FILTER BOARDS BY NAME..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-lime-400 transition-all placeholder:text-zinc-700"
        />
      </div>

      {/* 3-Column Grid - Provus Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filtered.map((board) => (
            <motion.button
              layout
              key={board.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={() => onSelect(board)}
              className="group p-8 rounded-[40px] border border-white/10 bg-white/5 text-left hover:border-lime-400 hover:bg-white/10 transition-all flex flex-col justify-between h-52 relative overflow-hidden"
            >
              <div className="flex justify-between items-start relative z-10">
                <div className={`p-3 rounded-2xl transition-colors ${board.type === 'scrum' ? 'bg-black/20 text-lime-400 group-hover:bg-lime-400 group-hover:text-black' : 'bg-amber-500/10 text-amber-400 group-hover:bg-amber-400 group-hover:text-black'}`}>
                  {board.type === 'scrum' ? <FiLayers size={24} /> : <FiZap size={24} />}
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600 group-hover:text-zinc-400 transition-colors">
                  {board.type}
                </span>
              </div>
              <h3 className="text-xl font-black italic uppercase text-white tracking-tighter leading-tight relative z-10">
                {board.name}
              </h3>
              <div className="absolute bottom-0 right-0 p-6 opacity-0 group-hover:opacity-10 transition-opacity">
                <FiLayers size={80} className="text-lime-400" />
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};