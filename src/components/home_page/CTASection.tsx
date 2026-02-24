"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-12 relative overflow-hidden bg-background transition-colors duration-300">
      <div className="max-w-[1200px] mx-auto px-6">
        <div
          className="rounded-3xl border border-primary/20 p-12 lg:p-20 text-center relative overflow-hidden shadow-lg bg-muted/50 dark:bg-glass-bg backdrop-blur-xl"
        >
          {/* Top Edge Highlight */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
          
          {/* Ambient Inner Glow */}
          <div className="absolute inset-0 pointer-events-none mix-blend-screen">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-[100px]" />
          </div>

          <div className="relative z-10">
            <p className="text-primary text-xs font-semibold tracking-widest uppercase mb-4">
              Ready to start?
            </p>
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6 tracking-tight transition-colors">
              Run your first session
              <br />
              in under a minute.
            </h2>
            <p className="text-muted-foreground text-base font-light max-w-lg mx-auto leading-relaxed mb-10 transition-colors">
              Sign in with your Provus credentials and have your team estimating
              stories in real-time — no setup required.
            </p>

            <Link href="/login">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-10 py-6 text-base rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:-translate-y-1">
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}