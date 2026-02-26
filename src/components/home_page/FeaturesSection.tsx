
"use client";

import { Eye, BarChart3, Zap, RefreshCw, MessageSquare, Shield } from "lucide-react";

const FEATURES = [
  { icon: Eye, title: "Simultaneous Card Reveal", description: "All votes are hidden until everyone has picked. Cards flip at the same time to eliminate anchoring bias and groupthink." },
  { icon: BarChart3, title: "Instant Visual Results", description: "See the vote distribution at a glance. Outliers are highlighted automatically to guide where discussion is needed most." },
  { icon: Zap, title: "Real-Time Collaboration", description: "Live presence indicators show who has voted and who is still deciding — keeping sessions tight and momentum high." },
  { icon: RefreshCw, title: "Re-vote Anytime", description: "Disagreement? No problem. Facilitate a re-vote after discussion with a single click until consensus is reached." },
  { icon: MessageSquare, title: "Issue Management", description: "Queue up multiple stories within a single session. Move through your backlog efficiently without switching tools." },
  { icon: Shield, title: "Private & Secure", description: "Built exclusively for Provus. Protected behind your company's authentication — your backlog stays internal." },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-16 relative overflow-hidden bg-background transition-colors duration-300">
      
      {/* Background ambient glow */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />

      <div className="max-w-[1200px] mx-auto px-6 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-20">
          <p className="text-primary text-xs font-semibold tracking-widest uppercase mb-3">
            Features
          </p>
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-6 transition-colors">
            Everything you need to
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400 italic">
              estimate with confidence.
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto font-light leading-relaxed transition-colors">
            Planning Poker is a proven agile estimation technique. Our
            implementation brings it fully to your browser — fast, focused, and
            friction-free.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group relative rounded-3xl border border-glass-border bg-glass-bg backdrop-blur-xl p-8 hover:border-primary/30 transition-all duration-500 overflow-hidden cursor-default hover:-translate-y-1 shadow-sm hover:shadow-md dark:shadow-none"
              >
                {/* Internal Glow on Hover */}
                <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl bg-primary/10 transition-all duration-500 group-hover:scale-150 group-hover:bg-primary/20 opacity-0 group-hover:opacity-100" />

                <div className="relative w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors shadow-sm">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                
                <h3 className="text-foreground font-semibold text-lg mb-3 relative z-10">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed font-light relative z-10">
                  {feature.description}
                </p>

                {/* Bottom accent line */}
                <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            );
          })}
        </div>

        {/* What is planning poker explainer */}
        <div className="mt-20 rounded-3xl border border-primary/20 p-8 lg:p-14 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-12 bg-muted/50 dark:bg-glass-bg shadow-lg">
          
          {/* Background Ambient Blur */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/15 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl">
            <p className="text-primary text-xs font-semibold tracking-widest uppercase mb-4">
              What is Planning Poker?
            </p>
            <h3 className="text-foreground text-3xl lg:text-4xl font-bold mb-6 leading-tight tracking-tight">
              A Fibonacci-based estimation game that builds team alignment
            </h3>
            <p className="text-muted-foreground text-base font-light leading-relaxed mb-4">
              Planning Poker (also known as Scrum Poker) is a consensus-based
              estimation technique used by agile teams. Each team member holds a
              set of cards numbered in a Fibonacci-like sequence — 1, 2, 3, 5,
              8, 13, 21. When estimating a story, everyone picks a card
              privately and reveals simultaneously.
            </p>
            <p className="text-muted-foreground text-base font-light leading-relaxed">
              The deliberate reveal eliminates anchoring, where an early opinion
              skews everyone else. Large spreads in votes spark the most
              valuable discussions, surfacing hidden complexity before a sprint
              begins. It&apos;s fast, fair, and remarkably effective at
              reducing estimation errors.
            </p>
          </div>

          {/* Abstract Glass Visual for the Explainer Box */}
          <div className="relative hidden lg:flex items-center justify-center w-[300px] h-[300px] perspective-[800px] flex-shrink-0">
            {/* Base Glass Plate */}
            <div className="absolute w-48 h-48 rounded-2xl bg-glass-bg border border-glass-border backdrop-blur-md shadow-2xl flex items-center justify-center" style={{ transform: 'rotateX(45deg) rotateZ(-15deg)' }}>
              <div className="w-full h-full border border-primary/20 rounded-2xl m-2" />
            </div>
            {/* Floating Fibonacci Cards */}
            {[5, 8, 13].map((num, idx) => (
              <div 
                key={num}
                className="absolute w-16 h-24 rounded-lg bg-background/80 border border-primary/30 backdrop-blur-xl flex items-center justify-center shadow-lg"
                style={{ 
                  transform: `translateZ(${(idx + 1) * 30}px) translateX(${idx * 25 - 20}px) translateY(${idx * -20 + 10}px)`,
                }}
              >
                <span className="text-xl font-bold text-foreground shadow-sm">{num}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}