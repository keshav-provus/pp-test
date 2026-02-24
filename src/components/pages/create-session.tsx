"use client";

import { FiPlus } from 'react-icons/fi';
import { useTheme } from "next-themes"; // Integrated theme hook
import { useColor } from "@/context/ColorContext"; // Integrated color hook

interface Props {
  onStart: () => void; // Define the function prop
}

export const CreateSessionCard = ({ onStart }: Props) => {
  const { theme } = useTheme();
  const { primaryColor } = useColor();

  return (
    /* Updated: bg-card and border-border for adaptive theming */
    <div className="group p-10 rounded-[40px] bg-card border border-border flex flex-col justify-between h-[450px] hover:border-primary/50 transition-all shadow-xl shadow-black/5">
      <div>
        {/* Updated: Icon box uses primary color on hover */}
        <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mb-8 border border-border group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-inner">
          <FiPlus size={28} />
        </div>
        <h2 className="text-4xl font-black italic uppercase tracking-tighter text-foreground mb-4">Create Room</h2>
        <p className="text-muted-foreground leading-relaxed text-sm italic font-medium">
          Start a new session to estimate Jira issues with your team in real-time.
        </p>
      </div>

      <div className="space-y-4">
        <input 
          type="text" 
          placeholder="SESSION NAME (E.G. SPRINT 42)"
          /* Updated: bg-background and focus:border-primary */
          className="w-full bg-background border border-border rounded-xl px-5 py-4 text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-primary transition-all text-foreground placeholder:text-muted-foreground/30"
        />
        {/* CRITICAL FIX: Ensure onClick calls onStart */}
        <button 
          onClick={(e) => {
            e.preventDefault();
            onStart(); 
          }}
          /* Updated: bg-primary and text-primary-foreground for consistent branding */
          className="w-full bg-primary text-primary-foreground font-black uppercase italic py-4 rounded-xl text-xs tracking-widest hover:opacity-90 hover:scale-[1.02] transition-all active:scale-95 shadow-lg shadow-primary/20"
        >
          Initialize Session
        </button>
      </div>
    </div>
  );
};