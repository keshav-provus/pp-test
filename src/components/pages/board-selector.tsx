"use client";

import React, { useState, useEffect } from 'react';
import { getBoardData } from '../../services/jira';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLayers, FiZap, FiSearch, FiLoader } from 'react-icons/fi';

export const BoardSelector = ({ onSelect }: { onSelect: (board: any) => void }) => {
  const [boards, setBoards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    getBoardData().then((data) => {
      setBoards(data);
      setLoading(false);
    });
  }, []);

  const filtered = boards.filter(b => 
    b.name.toLowerCase().includes(query.toLowerCase())
  );

  if (loading) return (
    <div className="py-24 flex flex-col items-center justify-center gap-4 w-full">
      <FiLoader className="animate-spin text-indigo-500" size={32} />
      <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Syncing Jira Boards...</p>
    </div>
  );

  return (
    <div className="w-full space-y-8">
      {/* Search Input */}
      <div className="relative w-full max-w-xl">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
        <input 
          type="text"
          placeholder="Filter boards by name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-neutral-900/50 border border-neutral-800 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-indigo-500 transition-all placeholder:text-zinc-700"
        />
      </div>

      {/* 3-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filtered.map((board) => (
            <motion.button
              layout
              key={board.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={() => onSelect(board)}
              className="group p-8 rounded-[32px] border border-neutral-800 bg-[#121212] text-left hover:border-indigo-500 transition-all flex flex-col justify-between h-52 relative overflow-hidden"
            >
              <div className="flex justify-between items-start relative z-10">
                <div className={`p-3 rounded-2xl ${board.type === 'scrum' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-amber-500/10 text-amber-400'}`}>
                  {board.type === 'scrum' ? <FiLayers size={24} /> : <FiZap size={24} />}
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-neutral-600 group-hover:text-neutral-400 transition-colors">
                  {board.type}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight leading-tight relative z-10">{board.name}</h3>
              <div className="absolute bottom-0 right-0 p-6 opacity-0 group-hover:opacity-10 transition-opacity">
                <FiLayers size={80} />
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
    
  );
};