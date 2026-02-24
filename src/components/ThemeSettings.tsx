"use client";

import { useEffect, useState, useRef } from "react";
import { Settings, Sun, Moon, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { useColor } from "@/context/ColorContext";

const BRAND_COLORS = [
  "#84cc16", // lime
  "#0ea5e9", // blue
  "#a855f7", // purple
  "#ef4444", // red
  "#f59e0b", // orange
];

export default function ThemeSettings() {
  const [open, setOpen] = useState(false);
  const [isDark, setIsDark] = useState<boolean>(true);
  const { primaryColor, setPrimaryColor } = useColor();

  // Load theme preference on mount
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme) {
      setIsDark(storedTheme === "dark");
    } else {
      // Default to dark if no preference exists
      setIsDark(true);
    }
  }, []);

  // Apply theme class to <html>
  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add("dark");
      html.classList.remove("light");
    } else {
      html.classList.add("light");
      html.classList.remove("dark");
    }
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  // Close panel when clicking outside
  const panelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      {/* Settings Toggle Button */}
      <button
        aria-label="Settings"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "p-4 rounded-full bg-card border border-border shadow-2xl transition-all duration-500 hover:rotate-90 group",
          open ? "scale-90" : "scale-100"
        )}
      >
        <Settings className="w-6 h-6 text-foreground group-hover:text-primary transition-colors" />
      </button>

      {/* Settings Panel */}
      {open && (
        <div
          ref={panelRef}
          className="absolute bottom-20 right-0 w-64 p-6 bg-card border border-border rounded-[32px] shadow-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 backdrop-blur-xl"
        >
          {/* Appearance Section */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground italic">
              Appearance
            </h4>
            <div className="flex p-1 bg-muted rounded-2xl border border-border">
              <button
                onClick={() => setIsDark(false)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase transition-all",
                  !isDark ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Sun size={14} /> Light
              </button>
              <button
                onClick={() => setIsDark(true)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase transition-all",
                  isDark ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Moon size={14} /> Dark
              </button>
            </div>
          </div>

          {/* Brand Color Section */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground italic">
              Brand Accent
            </h4>
            <div className="grid grid-cols-5 gap-3">
              {BRAND_COLORS.map((col) => (
                <button
                  key={col}
                  style={{ backgroundColor: col }}
                  onClick={() => setPrimaryColor(col)}
                  className={cn(
                    "w-8 h-8 rounded-full border-4 transition-all hover:scale-110 active:scale-90 shadow-lg",
                    primaryColor === col ? "border-foreground scale-110" : "border-transparent"
                  )}
                />
              ))}
            </div>
            {/* Custom Color Picker */}
            <label className="flex items-center gap-3 p-3 bg-muted rounded-2xl border border-border cursor-pointer group hover:border-primary transition-colors">
              <div 
                className="w-5 h-5 rounded-md border border-border shadow-sm"
                style={{ backgroundColor: primaryColor }}
              />
              <span className="text-[10px] font-black uppercase text-muted-foreground group-hover:text-foreground transition-colors">Custom Hex</span>
              <input 
                type="color" 
                className="sr-only"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
              />
              <Palette size={14} className="ml-auto text-muted-foreground" />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

export { ThemeSettings }; // If you use this, keep the curly braces in layout.tsx