"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const CARD_VALUES = ["1", "2", "3", "5", "8", "13", "21", "?"];

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 bg-background transition-colors duration-300">
      
      {/* Background radial glow */}
      <div className="absolute inset-0 pointer-events-none mix-blend-screen dark:mix-blend-screen opacity-50 dark:opacity-100">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-primary/20 rounded-full blur-[100px]" />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-10 dark:opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-[1200px] w-full mx-auto px-6 flex flex-col lg:flex-row items-center gap-16">
        
        {/* Left: Text */}
        <div className="flex-1 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 mb-8 shadow-[0_0_15px_rgba(37,99,235,0.1)] backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.8)]" />
            <span className="text-primary text-xs font-semibold tracking-wider uppercase">
              Built for Provus Teams
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-[1.05] tracking-tight mb-6 transition-colors">
            Estimate <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400">
              Smarter,
            </span>
            <br />
            Ship Faster.
          </h1>

          <p className="text-muted-foreground text-lg md:text-xl font-light leading-relaxed max-w-xl mb-10 mx-auto lg:mx-0 transition-colors">
            Planning Poker for Provus — the fastest way for your agile team to
            collaboratively estimate stories, align on effort, and keep sprints
            on track. No guesswork. Just consensus.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
            <Link href="/login">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-6 text-base rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:-translate-y-1">
                Start a Game
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button
                variant="outline"
                className="border-glass-border text-muted-foreground hover:text-foreground hover:bg-muted bg-glass-bg backdrop-blur-sm px-8 py-6 text-base rounded-xl transition-all hover:-translate-y-1"
              >
                How It Works
              </Button>
            </Link>
          </div>
        </div>

        {/* Right: Decorative Poker Cards */}
        <div className="flex-1 flex justify-center items-center relative h-[450px] w-full max-w-[500px] perspective-[1000px]">
          {CARD_VALUES.map((value, i) => {
            const angle = (i - (CARD_VALUES.length - 1) / 2) * 12;
            const translateX = (i - (CARD_VALUES.length - 1) / 2) * 20;
            const translateZ = Math.abs(i - (CARD_VALUES.length - 1) / 2) * -15; 
            
            return (
              <div
                key={value}
                className="absolute w-[100px] h-[145px] rounded-2xl border border-glass-border bg-glass-bg backdrop-blur-xl flex flex-col items-center justify-center transition-all duration-500 hover:-translate-y-4 hover:border-primary/50 hover:bg-glass-bg/80 cursor-default shadow-xl dark:shadow-[-10px_15px_30px_rgba(0,0,0,0.5)]"
                style={{
                  transform: `rotate(${angle}deg) translateX(${translateX}px) translateZ(${translateZ}px)`,
                  zIndex: i,
                }}
              >
                <span className="text-3xl font-bold text-foreground drop-shadow-sm">
                  {value}
                </span>
                <span className="text-primary/70 text-[10px] mt-2 font-medium tracking-widest uppercase">
                  pts
                </span>
              </div>
            );
          })}
          
          {/* Glow under cards */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[300px] h-[60px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        </div>
      </div>
    </section>
  );
}