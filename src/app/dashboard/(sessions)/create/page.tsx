"use client";

import { FileEdit, Share2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/dashboard/navbar";
import { ActionCard } from "@/components/dashboard/action-card";
import { nanoid } from "nanoid";


export default function CreateSessionPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");

  const handleCreateSession = () => {
    if (!username.trim()) return;
    const sessionId = nanoid(8).toUpperCase();
    router.push(`/dashboard/voting?sessionId=${sessionId}&role=host&name=${encodeURIComponent(username.trim())}`);
  };

  return (
    <div className="min-h-screen bg-[#060808] text-slate-100 font-sans relative overflow-x-hidden">
      {/* Background Glows */}
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-lime-500/5 blur-[120px] pointer-events-none" />
      
      <Navbar firstName="Arya" email="arya@provus.ai" onLogout={() => {}} />

      <main className="relative z-10 max-w-[1000px] mx-auto px-6 py-20">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          className="mb-8 text-muted-foreground hover:text-white -ml-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-3">Create New Session</h1>
          <p className="text-muted-foreground text-lg font-light">
            Enter your name and choose how to import your stories for estimation.
          </p>
        </div>

        {/* Username Input */}
        <div className="max-w-md mb-12">
          <div className="space-y-2">
            <label htmlFor="username" className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              Your Name
            </label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-12 bg-black/40 border-white/10 text-base placeholder:text-white/20 focus-visible:ring-lime-400/50 focus-visible:border-lime-400 transition-all"
              autoComplete="off"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
          
          <ActionCard 
  title="Custom stories"
  description="Create stories one by one. Perfect for quick ad-hoc sessions."
  icon={FileEdit}
  colorClassName="bg-lime-400 text-black shadow-[0_0_25px_rgba(163,230,53,0.3)]"
  onClick={handleCreateSession}
/>

          <ActionCard 
            title="Jira Board"
            description="Sync issues directly from your Jira backlog or active sprints."
            icon={Share2}
            colorClassName="bg-blue-500 text-white shadow-[0_0_25px_rgba(59,130,246,0.3)]"
            onClick={() => console.log("Navigate to Jira OAuth flow")}
          />

        </div>

        {/* Subtle footer tip */}
        <p className="mt-12 text-center text-sm text-muted-foreground/50 italic">
          Pro-tip: You can add more stories manually even after importing from Jira.
        </p>
      </main>
    </div>
  );
}