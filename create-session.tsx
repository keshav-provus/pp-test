"use client";

import { FiPlus } from 'react-icons/fi';

interface Props {
  onStart: () => void; // Define the function prop
}

export const CreateSessionCard = ({ onStart }: Props) => {
  return (
    <div className="group p-10 rounded-[40px] bg-zinc-900/20 border border-zinc-800 flex flex-col justify-between h-[450px] hover:border-zinc-600 transition-all">
      <div>
        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-8 border border-white/10 group-hover:bg-indigo-500 group-hover:text-white transition-all">
          <FiPlus size={28} />
        </div>
        <h2 className="text-3xl font-bold mb-4 italic uppercase">Create Room</h2>
        <p className="text-zinc-500 leading-relaxed text-sm">
          Start a new session to estimate Jira issues with your team in real-time.
        </p>
      </div>

      <div className="space-y-4">
        <input 
          type="text" 
          placeholder="Session Name (e.g. Sprint 42)"
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-5 py-4 text-sm focus:outline-none focus:border-indigo-500 transition-all"
        />
        {/* CRITICAL FIX: Ensure onClick calls onStart */}
        <button 
          onClick={(e) => {
            e.preventDefault();
            onStart(); 
          }}
          className="w-full bg-white text-black font-black uppercase italic py-4 rounded-xl text-xs tracking-widest hover:bg-indigo-400 hover:text-white transition-all active:scale-95"
        >
          Initialize Session
        </button>
      </div>
    </div>
  );
};