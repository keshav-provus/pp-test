"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Spade } from "lucide-react";
import { ThemeToggle } from "../ui/theme-toggle";


export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-glass-border backdrop-blur-xl bg-background/70 transition-colors duration-300">
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center group-hover:bg-primary/30 transition-colors shadow-[0_0_15px_rgba(37,99,235,0.15)]">
            <Spade className="w-4 h-4 text-primary" />
          </div>
          <span className="text-foreground font-semibold text-lg tracking-tight">
            Provus<span className="text-primary">Poker</span>
          </span>
        </Link>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="#how-it-works"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            How It Works
          </Link>
          <Link
            href="#features"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Features
          </Link>
          <Link
            href="#about"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            About
          </Link>
        </nav>

        {/* Right Side: Theme Toggle & Login */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="/login">
            <Button
              variant="outline"
              className="border-primary/40 text-primary hover:bg-primary/10 hover:border-primary bg-transparent text-sm font-medium transition-all duration-300 hover:text-foreground hover:shadow-[0_0_20px_rgba(37,99,235,0.2)]"
            >
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}