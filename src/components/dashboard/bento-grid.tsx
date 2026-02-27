"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── BentoGrid ──────────────────────────────────────────────────────────────

export function BentoGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid w-full auto-rows-[18rem] grid-cols-3 gap-4",
        className
      )}
    >
      {children}
    </div>
  );
}

// ─── BentoCard ──────────────────────────────────────────────────────────────

export function BentoCard({
  name,
  className,
  background,
  Icon,
  description,
  cta,
  onClick,
  index = 0,
}: {
  name: string;
  className?: string;
  background?: React.ReactNode;
  Icon?: React.ElementType;
  description: string;
  cta?: string;
  onClick?: () => void;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.08,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      onClick={onClick}
      className={cn(
        "group relative col-span-3 flex flex-col justify-between overflow-hidden rounded-2xl",
        // Light / Dark card surface
        "bg-card",
        "border border-border",
        // Shadow
        "shadow-sm hover:shadow-md",
        // Transitions
        "transition-all duration-200",
        onClick && "cursor-pointer active:scale-[0.98]",
        className
      )}
    >
      {/* Background render slot */}
      <div className="absolute inset-0 overflow-hidden">{background}</div>

      {/* Top gradient overlay for readability */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-card via-card/80 to-transparent z-[1]" />

      {/* Content */}
      <div className="relative z-[2] flex flex-col justify-end h-full p-5 gap-1.5">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-secondary border border-transparent flex items-center justify-center mb-1 group-hover:scale-105 transition-transform duration-300">
            <Icon className="w-5 h-5 text-foreground" />
          </div>
        )}
        <h3 className="text-base font-semibold text-foreground group-hover:text-muted-foreground transition-colors">
          {name}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px]">
          {description}
        </p>
        {cta && (
          <div className="flex items-center gap-1.5 text-sm w-fit font-medium text-primary border-b border-transparent group-hover:border-primary mt-2 opacity-0 group-hover:opacity-100 translate-x-0 group-hover:translate-x-1 transition-all duration-300">
            {cta}
            <ArrowRight size={14} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
