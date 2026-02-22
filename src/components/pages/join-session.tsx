"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FiHash, FiArrowRight } from "react-icons/fi";
import { toast } from "sonner";
import { motion } from "framer-motion";

export const JoinSession = () => {
  const [sessionId, setSessionId] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const router = useRouter();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanId = sessionId.trim().toUpperCase();
    
    if (!cleanId) {
      toast.error("Please enter a valid Session ID");
      return;
    }

    setIsJoining(true);
    toast.loading(`Joining session ${cleanId}...`);

    // Redirects to the dynamic poker route
    router.push(`/poker/${cleanId}`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="bg-[#0f0f0f] border border-white/10 rounded-[40px] p-8 shadow-2xl relative overflow-hidden group">
        {/* Background glow effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-lime-400/5 rounded-full blur-[80px] group-hover:bg-lime-400/10 transition-all duration-700" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-lime-400/10 rounded-2xl border border-lime-400/20">
              <FiHash className="text-lime-400" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white leading-none">
                JOIN SESSION
              </h2>
              <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-2">
                Enter an Issue Key to start voting
              </p>
            </div>
          </div>

          <form onSubmit={handleJoin} className="space-y-6">
            <div className="relative group/input">
              <input
                type="text"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                placeholder="E.G. PP-25"
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 text-sm font-bold text-white placeholder:text-zinc-800 focus:outline-none focus:border-lime-400 transition-all uppercase tracking-widest"
                required
                autoComplete="off"
              />
            </div>

            <button
              type="submit"
              disabled={isJoining}
              className="w-full group/btn relative flex items-center justify-center gap-3 bg-lime-400 hover:bg-white text-black py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 disabled:opacity-50"
            >
              {isJoining ? (
                <span className="animate-pulse">CONNECTING...</span>
              ) : (
                <>
                  ENTER ARENA
                  <FiArrowRight className="group-hover/btn:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5">
            <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-[0.2em] text-center leading-relaxed">
              Real-time synchronization powered by <br /> 
              <span className="text-zinc-400">Supabase Presence & Broadcast</span>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};