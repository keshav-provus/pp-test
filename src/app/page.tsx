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
  Loader2 // Added for loading state feedback
} from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const handleGetStarted = () => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  };

  return (
    <div className="min-h-full bg-[#080808] text-zinc-100 selection:bg-indigo-500/30 font-sans">
      {/* Subtle Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto border-b border-zinc-800/50">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-zinc-100 rounded flex items-center justify-center">
            <LayoutDashboard className="text-black" size={16} />
          </div>
          <span className="font-semibold tracking-tight text-lg">Pointwise</span>
        </div>
        <div className="hidden md:flex gap-8 text-sm font-medium text-zinc-400">
          <a href="#" className="hover:text-zinc-100 transition-colors">Product</a>
          <a href="#" className="hover:text-zinc-100 transition-colors">Methods</a>
          <a href="#" className="hover:text-zinc-100 transition-colors">Enterprise</a>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/login')} 
            className="text-sm font-medium text-zinc-400 hover:text-zinc-100"
          >
            Sign in
          </button>
          <button 
            onClick={handleGetStarted}
            className="bg-zinc-100 text-black px-4 py-1.5 rounded-md text-sm font-semibold hover:bg-zinc-200 transition-all"
          >
            Start Free
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 pt-24 pb-32">
        <div className="text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/50 text-[13px] text-zinc-400">
            <span className="text-indigo-400 font-medium">New</span>
            <span className="w-px h-3 bg-zinc-700" />
            <span>Linear & Jira bi-directional sync</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
            Engineering estimates <br /> 
            <span className="text-zinc-500">done in minutes.</span>
          </h1>

          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            A minimalist planning poker tool for high-performance teams. 
            No logins required. No distractions. Just speed.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <button 
              onClick={handleGetStarted}
              disabled={status === 'loading'}
              className="bg-white text-black px-8 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all disabled:opacity-70"
            >
              {status === 'loading' ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>Create a Session <ArrowRight size={18} /></>
              )}
            </button>
            <button className="bg-zinc-900 border border-zinc-800 text-white px-8 py-3 rounded-lg font-semibold hover:bg-zinc-800 transition-all">
              How it works
            </button>
          </div>
        </div>

        {/* Dashboard Mockup */}
        <div className="mt-20 rounded-xl border border-zinc-800 bg-zinc-900/20 p-2 backdrop-blur-sm shadow-2xl">
          <div className="rounded-lg border border-zinc-800 bg-[#0c0c0c] overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 bg-zinc-900/30">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
              </div>
              <div className="text-[11px] text-zinc-500 font-medium tracking-widest uppercase">Room: Alpha-Squad-Estimation</div>
              <div className="w-12" />
            </div>
            <div className="p-12 flex flex-col items-center">
              <div className="w-full max-w-md space-y-6">
                <div className="h-4 w-3/4 bg-zinc-800 rounded mx-auto" />
                <div className="h-4 w-1/2 bg-zinc-800/50 rounded mx-auto" />
                <div className="grid grid-cols-4 gap-4 pt-8">
                  {[1, 2, 3, 5, 8, 13, 21, '?'].map((v) => (
                    <div key={v} className="aspect-[3/4] rounded-md border border-zinc-800 bg-zinc-900/50 flex items-center justify-center text-zinc-400 font-medium">
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
      <section className="max-w-6xl mx-auto px-6 py-24 border-t border-zinc-900">
        <div className="grid md:grid-cols-3 gap-16">
          <Feature 
            icon={<MousePointer2 size={20} />} 
            title="Point & Click" 
            desc="Intuitive interface designed for speed. Use keyboard shortcuts or your mouse to cast votes instantly." 
          />
          <Feature 
            icon={<Users size={20} />} 
            title="Team Presence" 
            desc="See live cursors and voting status. Know exactly when your team is ready to reveal results." 
          />
          <Feature 
            icon={<BarChart2 size={20} />} 
            title="Consensus Insights" 
            desc="Automatic calculation of average, median, and outliers to help guide the discussion." 
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center border-t border-zinc-900 gap-6">
        <div className="flex items-center gap-2 opacity-50 grayscale">
          <LayoutDashboard size={18} />
          <span className="font-bold text-sm tracking-tighter">Pointwise</span>
        </div>
        <p className="text-zinc-500 text-xs">© 2026 Pointwise Inc. All rights reserved.</p>
        <div className="flex gap-6 text-xs text-zinc-500 font-medium">
          <a href="#" className="hover:text-zinc-300 transition-colors">Twitter</a>
          <a href="#" className="hover:text-zinc-300 transition-colors">GitHub</a>
          <a href="#" className="hover:text-zinc-300 transition-colors">Terms</a>
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="space-y-4">
      <div className="text-zinc-100">{icon}</div>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-200">{title}</h3>
      <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}