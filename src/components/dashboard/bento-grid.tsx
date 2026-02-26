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
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={onClick}
      className={cn(
        "group relative col-span-3 flex flex-col justify-between overflow-hidden rounded-2xl",
        // Light / Dark card surface
        "bg-white dark:bg-[#1d2125]",
        "border border-gray-200 dark:border-[#2c333a]",
        // Shadow
        "shadow-sm hover:shadow-xl hover:shadow-black/[0.06] dark:hover:shadow-black/30",
        // Transitions
        "transition-shadow duration-300",
        onClick && "cursor-pointer",
        className
      )}
    >
      {/* Background render slot */}
      <div className="absolute inset-0 overflow-hidden">{background}</div>

      {/* Top gradient overlay for readability */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-[#1d2125] dark:via-[#1d2125]/80 dark:to-transparent z-[1]" />

      {/* Content */}
      <div className="relative z-[2] flex flex-col justify-end h-full p-5 gap-1.5">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#e9f2ff] to-[#deebff] dark:from-[#0052cc]/20 dark:to-[#0052cc]/10 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform duration-300">
            <Icon className="w-5 h-5 text-[#0052cc] dark:text-[#4c9aff]" />
          </div>
        )}
        <h3 className="text-base font-bold text-[#172b4d] dark:text-[#dfe1e6] group-hover:text-[#0052cc] dark:group-hover:text-[#4c9aff] transition-colors">
          {name}
        </h3>
        <p className="text-sm text-gray-500 dark:text-[#8c9bab] leading-relaxed max-w-[280px]">
          {description}
        </p>
        {cta && (
          <div className="flex items-center gap-1.5 text-sm font-semibold text-[#0052cc] dark:text-[#4c9aff] mt-1 opacity-0 group-hover:opacity-100 translate-x-0 group-hover:translate-x-1 transition-all duration-300">
            {cta}
            <ArrowRight size={14} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
