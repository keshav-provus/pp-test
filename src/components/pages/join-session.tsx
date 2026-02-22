"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FiHash, FiArrowRight } from "react-icons/fi";
import { toast } from "sonner";
import { motion } from "framer-motion";

export const JoinSession = () => {
  const [sessionId, setSessionId] = useState("");
  const router = useRouter();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = sessionId.trim().toUpperCase();
    
    if (!cleanId) return toast.error("Enter a valid ID");
    
    toast.loading("Joining Arena...");
    // Redirects participant to arena (without host=true)
    router.push(`/poker/${cleanId}`);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto">
      <div className="bg-[#0f0f0f] border border-white/10 rounded-[40px] p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 bg-lime-400/10 rounded-2xl border border-lime-400/20">
            <FiHash className="text-lime-400" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase italic text-white leading-none">JOIN SESSION</h2>
            <p className="text-[9px] text-zinc-500 font-bold uppercase mt-2">Enter Session ID to start</p>
          </div>
        </div>

        <form onSubmit={handleJoin} className="space-y-6">
          <input
            type="text"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            placeholder="E.G. X7A9B2"
            className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 font-bold text-white focus:outline-none focus:border-lime-400 transition-all uppercase"
            required autoComplete="off"
          />
          <button type="submit" className="w-full bg-lime-400 text-black py-5 rounded-2xl text-[10px] font-black uppercase flex justify-center items-center gap-3 hover:bg-white transition-colors">
            ENTER ARENA <FiArrowRight />
          </button>
        </form>
      </div>
    </motion.div>
  );
};