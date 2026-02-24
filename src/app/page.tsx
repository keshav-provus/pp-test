"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  Users, 
  Zap, 
  MousePointer2, 
  BarChart2, 
  LayoutDashboard,
  ArrowRight,
  Loader2 
} from 'lucide-react';
import { useTheme } from "next-themes";
import { useColor } from "@/context/ColorContext";

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { theme } = useTheme();

  const handleGetStarted = () => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  };

  return (
    /* Updated: Swapped bg-[#080808] for bg-background and indigo-500 for primary */
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-sans transition-colors duration-500">
      
      {/* Updated: Swapped hardcoded hex for var(--border) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto border-b border-border">
        <div className="flex items-center gap-2.5">
          {/* Updated: Swapped bg-zinc-100 for bg-primary */}
          <div className="w-8 h-8 bg-primary rounded-lg rotate-3 flex items-center justify-center shadow-lg shadow-primary/20">
            <LayoutDashboard className="text-primary-foreground" size={18} />
          </div>
          <span className="font-black italic tracking-tighter text-xl uppercase">Pointwise</span>
        </div>
        
        <div className="hidden md:flex gap-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          <a href="#" className="hover:text-primary transition-colors">Product</a>
          <a href="#" className="hover:text-primary transition-colors">Methods</a>
          <a href="#" className="hover:text-primary transition-colors">Enterprise</a>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/login')} 
            className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign in
          </button>
          {/* Updated: Using bg-primary */}
          <button 
            onClick={handleGetStarted}
            className="bg-primary text-primary-foreground px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/10"
          >
            Start Free
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 pt-24 pb-32">
        <div className="text-center space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            <span className="text-primary">New</span>
            <span className="w-px h-3 bg-border" />
            <span>Linear & Jira bi-directional sync</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter leading-[0.85] uppercase">
            Engineering estimates <br /> 
            <span className="text-muted-foreground opacity-40">done in minutes.</span>
          </h1>

          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed italic font-medium">
            A minimalist planning poker tool for high-performance teams. 
            No logins required. No distractions. Just speed.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <button 
              onClick={handleGetStarted}
              disabled={status === 'loading'}
              className="bg-primary text-primary-foreground px-10 py-5 rounded-2xl font-black uppercase italic text-sm flex items-center justify-center gap-3 hover:scale-105 transition-all disabled:opacity-70 shadow-2xl shadow-primary/20"
            >
              {status === 'loading' ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>Create a Session <ArrowRight size={20} /></>
              )}
            </button>
            <button className="bg-card border-2 border-border text-foreground px-10 py-5 rounded-2xl font-black uppercase italic text-sm hover:bg-muted/50 transition-all">
              How it works
            </button>
          </div>
        </div>

        {/* Dashboard Mockup - Theme Aware */}
        <div className="mt-20 rounded-[40px] border border-border bg-card/20 p-3 backdrop-blur-sm shadow-2xl">
          <div className="rounded-[30px] border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/30">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-border" />
                <div className="w-2.5 h-2.5 rounded-full bg-border" />
                <div className="w-2.5 h-2.5 rounded-full bg-border" />
              </div>
              <div className="text-[10px] text-muted-foreground font-black tracking-widest uppercase">Room: Alpha-Squad-Estimation</div>
              <div className="w-12" />
            </div>
            <div className="p-16 flex flex-col items-center">
              <div className="w-full max-w-md space-y-6">
                <div className="h-4 w-3/4 bg-muted rounded-full mx-auto" />
                <div className="h-4 w-1/2 bg-muted/50 rounded-full mx-auto" />
                <div className="grid grid-cols-4 gap-4 pt-10">
                  {[1, 2, 3, 5, 8, 13, 21, '?'].map((v) => (
                    <div key={v} className="aspect-[3/4] rounded-xl border border-border bg-muted/20 flex items-center justify-center text-muted-foreground font-black text-xl italic">
                      {v}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Feature Grid */}
      <section className="max-w-6xl mx-auto px-6 py-24 border-t border-border">
        <div className="grid md:grid-cols-3 gap-16">
          <Feature 
            icon={<MousePointer2 size={24} className="text-primary" />} 
            title="Point & Click" 
            desc="Intuitive interface designed for speed. Use keyboard shortcuts or your mouse to cast votes instantly." 
          />
          <Feature 
            icon={<Users size={24} className="text-primary" />} 
            title="Team Presence" 
            desc="See live cursors and voting status. Know exactly when your team is ready to reveal results." 
          />
          <Feature 
            icon={<BarChart2 size={24} className="text-primary" />} 
            title="Consensus Insights" 
            desc="Automatic calculation of average, median, and outliers to help guide the discussion." 
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center border-t border-border gap-6">
        <div className="flex items-center gap-2 opacity-50">
          <LayoutDashboard size={18} />
          <span className="font-black text-sm tracking-tighter uppercase italic">Pointwise</span>
        </div>
        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">© 2026 Pointwise Inc. All rights reserved.</p>
        <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          <a href="#" className="hover:text-primary transition-colors">Twitter</a>
          <a href="#" className="hover:text-primary transition-colors">GitHub</a>
          <a href="#" className="hover:text-primary transition-colors">Terms</a>
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="space-y-4 group">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="text-[11px] font-black uppercase tracking-widest text-foreground italic">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed italic font-medium">{desc}</p>
    </div>
  );
}