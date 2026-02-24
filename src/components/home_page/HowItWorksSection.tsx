
"use client";

import { LayoutGrid, Users, Target } from "lucide-react";

const STEPS = [
  {
    step: "01",
    title: "Create a Game",
    description: "Start a new planning poker session in seconds. Add your user stories or import them directly — your room is ready instantly.",
    icon: LayoutGrid,
  },
  {
    step: "02",
    title: "Invite Your Team",
    description: "Share the session link with your Provus teammates. Everyone joins in real-time — no account setup needed for participants.",
    icon: Users,
  },
  {
    step: "03",
    title: "Vote & Reach Consensus",
    description: "Each member picks a card privately. Cards are revealed simultaneously, sparking focused discussion until the team lands on an estimate.",
    icon: Target,
  },
];

export default function HowItWorksSection() {
  return (
   <section id="how-it-works" className="py-16 md:py-20 relative overflow-hidden bg-background transition-colors duration-300">  
      {/* Background ambient glow */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen dark:mix-blend-screen" />

      <div className="max-w-[1200px] mx-auto px-6 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-20">
          <p className="text-primary text-xs font-semibold tracking-widest uppercase mb-3">
            How It Works
          </p>
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground tracking-tight transition-colors">
            Three steps to better estimates
          </h2>
          <p className="text-muted-foreground mt-5 text-lg max-w-xl mx-auto font-light leading-relaxed transition-colors">
            From creating a session to committing on a story point — the entire
            workflow is frictionless and built for async-friendly teams.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map((step, i) => (
            <div
              key={step.step}
              className="relative rounded-3xl border border-glass-border bg-glass-bg backdrop-blur-xl p-8 group hover:border-primary/30 transition-all duration-500 overflow-hidden shadow-sm hover:shadow-md dark:shadow-none"
            >
              {/* Step number watermark */}
              <span className="absolute -top-6 -right-2 text-8xl font-black text-foreground opacity-5 group-hover:opacity-10 transition-opacity select-none">
                {step.step}
              </span>

              {/* Connector line between cards (desktop) */}
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-px bg-border group-hover:bg-primary/30 transition-colors z-10" />
              )}

              {/* 3D Glass Icon Container */}
              <div className="relative w-14 h-14 mb-8 rounded-2xl bg-primary/10 border border-primary/20 backdrop-blur-md flex items-center justify-center shadow-sm transform transition-transform group-hover:-translate-y-2 group-hover:rotate-3">
                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl blur-md" />
                <step.icon className="h-6 w-6 text-primary relative z-10" />
              </div>

              <h3 className="text-foreground text-xl font-semibold mb-3 relative z-10">
                {step.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed font-light relative z-10">
                {step.description}
              </p>

              {/* Bottom accent glow */}
              <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}