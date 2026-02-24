"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FiHash, FiArrowRight } from "react-icons/fi";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useColor } from "@/context/ColorContext";

export const JoinSession = () => {
  const [sessionId, setSessionId] = useState("");
  const router = useRouter();
  const { theme } = useTheme();
  const { primaryColor } = useColor();

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
      {/* Updated: bg-card and border-border for theme adaptability */}
      <div className="bg-card border border-border rounded-[40px] p-8 shadow-2xl">
        <div className="flex items-center gap-4 mb-8">
          {/* Updated: Icon box background and border now follow the primary color */}
          <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20">
            <FiHash className="text-primary" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase italic text-foreground leading-none tracking-tighter">JOIN SESSION</h2>
            <p className="text-[9px] text-muted-foreground font-bold uppercase mt-2 tracking-widest">Enter Session ID to start</p>
          </div>
        </div>

        <form onSubmit={handleJoin} className="space-y-6">
          <input
            type="text"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            placeholder="E.G. X7A9B2"
            /* Updated: bg-background and focus:border-primary */
            className="w-full bg-background border border-border rounded-2xl px-6 py-5 font-black text-foreground focus:outline-none focus:border-primary transition-all uppercase placeholder:text-muted-foreground/30"
            required autoComplete="off"
          />
          <button 
            type="submit" 
            /* Updated: bg-primary and text-primary-foreground for brand consistency */
            className="w-full bg-primary text-primary-foreground py-5 rounded-2xl text-[10px] font-black uppercase flex justify-center items-center gap-3 hover:opacity-90 hover:scale-[1.02] transition-all active:scale-95 shadow-lg shadow-primary/20"
          >
            ENTER ARENA <FiArrowRight />
          </button>
        </form>
      </div>
    </motion.div>
  );
};