"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CalendarPlus, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Generate deterministic mock activity data (no Math.random — SSR safe) ──

function hashStr(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function generateMockData() {
  const data: Record<string, number> = {};
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    // Deterministic: use hash of date string to pick a level
    const h = hashStr(key + "salt42") % 100;
    data[key] = h < 55 ? 0 : h < 75 ? 1 : h < 88 ? 2 : h < 96 ? 3 : 4;
  }
  return data;
}

const MOCK_DATA = generateMockData();

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["", "Mon", "", "Wed", "", "Fri", ""];

function getLevel(count: number): string {
  if (count === 0) return "bg-gray-100 dark:bg-[#22272b]";
  if (count === 1) return "bg-emerald-200 dark:bg-emerald-900/60";
  if (count === 2) return "bg-emerald-400 dark:bg-emerald-700";
  if (count === 3) return "bg-emerald-500 dark:bg-emerald-500";
  return "bg-emerald-600 dark:bg-emerald-400";
}

// ─── Event Modal ────────────────────────────────────────────────────────────

function EventModal({
  date,
  onClose,
}: {
  date: string;
  onClose: () => void;
}) {
  const [eventName, setEventName] = useState("");
  const [eventTime, setEventTime] = useState("10:00");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!eventName.trim()) return;
    // In a real app this would persist to DB
    setSaved(true);
    setTimeout(onClose, 1200);
  };

  const formattedDate = new Date(date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white dark:bg-[#1d2125] w-full max-w-sm rounded-2xl shadow-2xl border border-gray-200 dark:border-[#2c333a] overflow-hidden"
      >
        <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-emerald-400 to-teal-500" />

        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center">
              <CalendarPlus size={16} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#172b4d] dark:text-[#dfe1e6]">Schedule Session</h3>
              <p className="text-[11px] text-gray-400 dark:text-[#626f86]">{formattedDate}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-[#dfe1e6] hover:bg-gray-100 dark:hover:bg-[#22272b] rounded-lg transition-all">
            <X size={16} />
          </button>
        </div>

        {saved ? (
          <div className="px-5 py-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 10, stiffness: 200 }}
              className="w-12 h-12 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3"
            >
              ✓
            </motion.div>
            <p className="text-sm font-bold text-[#172b4d] dark:text-[#dfe1e6]">Session Scheduled!</p>
            <p className="text-xs text-gray-400 dark:text-[#626f86] mt-1">{eventName} at {eventTime}</p>
          </div>
        ) : (
          <div className="px-5 py-4 space-y-4">
            <div>
              <label className="text-[10px] font-bold text-gray-400 dark:text-[#626f86] uppercase tracking-wider mb-1.5 block">Session Name</label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="e.g. Sprint 43 Planning"
                className="w-full h-10 px-3 text-sm bg-gray-50 dark:bg-[#22272b] border border-gray-200 dark:border-[#2c333a] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-[#172b4d] dark:text-[#dfe1e6] placeholder:text-gray-300 dark:placeholder:text-[#626f86] transition-all"
                autoFocus
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 dark:text-[#626f86] uppercase tracking-wider mb-1.5 block flex items-center gap-1.5">
                <Clock size={10} /> Time
              </label>
              <input
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className="w-full h-10 px-3 text-sm bg-gray-50 dark:bg-[#22272b] border border-gray-200 dark:border-[#2c333a] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-[#172b4d] dark:text-[#dfe1e6] font-mono transition-all"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={!eventName.trim()}
              className="w-full h-10 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl shadow-md shadow-emerald-500/20 disabled:opacity-40 transition-all"
            >
              Schedule Session
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Activity Calendar ──────────────────────────────────────────────────────

export function ActivityCalendar({
  className,
  realData,
}: {
  className?: string;
  realData?: Record<string, number>;
}) {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Merge real data on top of mock data (real data takes priority)
  const mergedData = useMemo(() => {
    if (!realData || Object.keys(realData).length === 0) return MOCK_DATA;
    return { ...MOCK_DATA, ...realData };
  }, [realData]);

  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday
    const weeksArr: { date: string; count: number }[][] = [];
    let currentWeek: { date: string; count: number }[] = [];

    // Build 52 weeks + partial current week
    const totalDays = 52 * 7 + dayOfWeek;
    for (let i = totalDays; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      currentWeek.push({ date: key, count: mergedData[key] || 0 });
      if (currentWeek.length === 7) {
        weeksArr.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) weeksArr.push(currentWeek);

    // Compute month labels at week boundaries
    const labels: { label: string; col: number }[] = [];
    let lastMonth = -1;
    weeksArr.forEach((week, wi) => {
      const firstDay = new Date(week[0].date);
      const month = firstDay.getMonth();
      if (month !== lastMonth) {
        labels.push({ label: MONTHS[month], col: wi });
        lastMonth = month;
      }
    });

    return { weeks: weeksArr, monthLabels: labels };
  }, [mergedData]);

  const totalSessions = Object.values(mergedData).reduce((a, b) => a + b, 0);

  return (
    <div className={cn("relative", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-400 dark:text-[#626f86]">
          <span className="font-bold text-[#172b4d] dark:text-[#dfe1e6]">{totalSessions}</span> sessions in the last year
        </span>
      </div>

      {/* Grid */}
      <div className="flex gap-[3px] overflow-x-auto pb-1">
        {/* Day labels */}
        <div className="flex flex-col gap-[3px] pr-1.5 shrink-0">
          {DAYS.map((day, i) => (
            <div key={i} className="h-[13px] text-[9px] leading-[13px] text-gray-400 dark:text-[#626f86] font-medium">
              {day}
            </div>
          ))}
        </div>

        {/* Weeks */}
        <div className="flex gap-[3px] relative">
          {/* Month labels */}
          <div className="absolute -top-4 left-0 right-0 flex text-[9px] text-gray-400 dark:text-[#626f86] font-medium">
            {monthLabels.map((m, i) => (
              <span key={i} className="absolute" style={{ left: `${m.col * 16}px` }}>
                {m.label}
              </span>
            ))}
          </div>

          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day) => (
                <div key={day.date} className="relative">
                  <button
                    className={cn(
                      "w-[13px] h-[13px] rounded-[3px] transition-all duration-150 border border-transparent",
                      getLevel(day.count),
                      "hover:ring-2 hover:ring-[#0052cc]/30 dark:hover:ring-[#4c9aff]/30 hover:scale-125"
                    )}
                    onMouseEnter={() => setHoveredCell(day.date)}
                    onMouseLeave={() => setHoveredCell(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDate(day.date);
                    }}
                  />
                  {/* Tooltip */}
                  {hoveredCell === day.date && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-20 bg-[#172b4d] dark:bg-[#dfe1e6] text-white dark:text-[#172b4d] text-[10px] font-medium px-2 py-1 rounded-md whitespace-nowrap pointer-events-none shadow-lg">
                      {day.count} session{day.count !== 1 ? "s" : ""} on {new Date(day.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3 justify-end">
        <span className="text-[9px] text-gray-400 dark:text-[#626f86]">Less</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <div key={level} className={cn("w-[11px] h-[11px] rounded-[2px]", getLevel(level))} />
        ))}
        <span className="text-[9px] text-gray-400 dark:text-[#626f86]">More</span>
      </div>

      {/* Event creation popup */}
      <AnimatePresence>
        {selectedDate && (
          <EventModal
            date={selectedDate}
            onClose={() => setSelectedDate(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
