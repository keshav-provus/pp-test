"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Users, BarChart3, Calendar, History, Zap, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";

import { Navbar } from "@/components/dashboard/navbar";
import { BentoGrid, BentoCard } from "@/components/dashboard/bento-grid";
import { ActivityCalendar } from "@/components/dashboard/activity-calendar";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

type SessionIssue = {
  id: string;
  issue_key: string;
  summary: string;
  source: "custom" | "jira";
  estimate: string | null;
  votes: Record<string, number | string | null>;
};

type SessionParticipant = {
  id: string;
  name: string;
  is_host: boolean;
};

type SessionRecord = {
  id: string;
  session_code: string;
  name: string;
  host_name: string;
  host_email: string | null;
  series_key: string;
  status: string;
  created_at: string;
  ended_at: string | null;
  total_points: number;
  session_issues: SessionIssue[];
  session_participants: SessionParticipant[];
};

// ─── Animated counter ───────────────────────────────────────────────────────

function AnimatedCounter({ value }: { value: number }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-5xl font-black tabular-nums bg-gradient-to-br from-[#0052cc] to-[#6554c0] dark:from-[#4c9aff] dark:to-[#9f8fef] bg-clip-text text-transparent"
    >
      {value}
    </motion.span>
  );
}

// ─── Floating cards marquee background ──────────────────────────────────────

function FloatingCards() {
  const cards = ["Create", "Estimate", "Review", "Ship", "Plan"];
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      <div className="flex gap-3 animate-marquee">
        {[...cards, ...cards].map((card, i) => (
          <div
            key={i}
            className={cn(
              "w-20 h-28 rounded-xl border p-2.5 flex flex-col justify-between shrink-0",
              "bg-white/50 dark:bg-[#22272b]/50 border-gray-200/50 dark:border-[#2c333a]/50",
              "transform-gpu blur-[0.5px] group-hover:blur-none transition-all duration-500"
            )}
          >
            <div className="w-4 h-4 rounded bg-gradient-to-br from-[#0052cc]/20 to-[#6554c0]/20 dark:from-[#4c9aff]/20 dark:to-[#9f8fef]/20" />
            <div className="space-y-1">
              <div className="h-1 w-full bg-gray-200/60 dark:bg-[#2c333a]/60 rounded" />
              <div className="h-1 w-3/4 bg-gray-200/40 dark:bg-[#2c333a]/40 rounded" />
            </div>
            <span className="text-[8px] font-bold text-gray-400 dark:text-[#626f86] uppercase">{card}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Pulsing code digits background ─────────────────────────────────────────

function PulsingCode() {
  const chars = "ABCDE12345FGHIJ".split("");
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      <div className="flex gap-2.5">
        {chars.slice(0, 6).map((char, i) => (
          <motion.span
            key={i}
            className="text-3xl font-mono font-bold text-gray-200/60 dark:text-[#2c333a]/80 select-none"
            animate={{
              opacity: [0.3, 0.7, 0.3],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut",
            }}
          >
            {char}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

// ─── Issues list modal ──────────────────────────────────────────────────────

function IssuesModal({
  issues,
  onClose,
}: {
  issues: { key: string; summary: string; points: string; session: string; date: string; source: string }[];
  onClose: () => void;
}) {
  const totalPoints = issues.reduce((s, i) => s + (parseFloat(i.points) || 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white dark:bg-[#1d2125] w-full max-w-lg max-h-[70vh] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#2c333a] overflow-hidden flex flex-col"
      >
        <div className="absolute top-0 inset-x-0 h-[3px] brand-gradient" />

        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 dark:border-[#2c333a]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0052cc] to-[#6554c0] text-white flex items-center justify-center">
              <BarChart3 size={16} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#172b4d] dark:text-[#dfe1e6]">Estimated Issues</h3>
              <p className="text-[11px] text-gray-400 dark:text-[#626f86]">{issues.length} issues across all sessions</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-[#dfe1e6] hover:bg-gray-100 dark:hover:bg-[#22272b] rounded-lg transition-all">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {issues.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400 dark:text-[#626f86]">
              No issues estimated yet. Complete a session to see data here.
            </div>
          ) : (
            issues.map((issue, i) => (
              <motion.div
                key={`${issue.key}-${i}`}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-[#22272b]/50 transition-colors group"
              >
                <span className="text-[11px] font-mono font-bold text-[#0052cc] dark:text-[#4c9aff] bg-[#e9f2ff] dark:bg-[#0052cc]/10 px-2 py-0.5 rounded-md border border-[#cce0ff] dark:border-[#0052cc]/20 shrink-0">
                  {issue.key}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#172b4d] dark:text-[#dfe1e6] truncate">{issue.summary}</p>
                  <p className="text-[10px] text-gray-400 dark:text-[#626f86]">
                    {issue.session} · {issue.date}
                    <span className={cn(
                      "ml-1.5 px-1.5 py-0 rounded text-[9px] font-bold uppercase",
                      issue.source === "jira"
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                        : "bg-gray-100 dark:bg-[#22272b] text-gray-500 dark:text-[#8c9bab]"
                    )}>
                      {issue.source}
                    </span>
                  </p>
                </div>
                {issue.points && issue.points !== "—" && (
                  <span className="text-sm font-bold text-[#006644] dark:text-[#57d9a3] bg-[#e3fcef] dark:bg-[#006644]/20 px-2 py-0.5 rounded-md border border-[#006644]/10 dark:border-[#57d9a3]/10 shrink-0">
                    {issue.points} pts
                  </span>
                )}
              </motion.div>
            ))
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-100 dark:border-[#2c333a] text-center">
          <span className="text-xs text-gray-400 dark:text-[#626f86]">
            Total: <span className="font-bold text-[#172b4d] dark:text-[#dfe1e6]">{totalPoints} story points</span>
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Recent sessions scrolling list background ──────────────────────────────

function RecentSessionsBackground({ sessions }: { sessions: { name: string; date: string; status: string }[] }) {
  const display = sessions.length > 0 ? sessions.slice(0, 5) : [
    { name: "No sessions yet", date: "—", status: "done" },
  ];

  return (
    <div className="absolute inset-0 px-4 pt-8 overflow-hidden">
      <div className="space-y-1.5 [mask-image:linear-gradient(to_top,transparent_20%,#000_100%)]">
        {display.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-gray-50/80 dark:bg-[#22272b]/40 border border-gray-100 dark:border-[#2c333a]/60"
          >
            <div className={cn(
              "w-1.5 h-1.5 rounded-full shrink-0",
              s.status === "live"
                ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]"
                : "bg-gray-300 dark:bg-[#626f86]"
            )} />
            <span className="text-[11px] font-medium text-[#172b4d] dark:text-[#dfe1e6] truncate flex-1">{s.name}</span>
            <span className="text-[9px] text-gray-400 dark:text-[#626f86] shrink-0 font-mono">{s.date}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Format date helper ─────────────────────────────────────────────────────

function formatRelativeDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return d.toLocaleDateString("en-US", { weekday: "short" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Main dashboard page ────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [showIssuesModal, setShowIssuesModal] = useState(false);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const firstName = session?.user?.name?.split(" ")[0] || "Guest";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Fetch session history from API
  useEffect(() => {
    async function fetchSessions() {
      try {
        const res = await fetch("/api/sessions?limit=50");
        if (res.ok) {
          const data = await res.json();
          setSessions(data.sessions || []);
        }
      } catch (err) {
        console.error("Failed to fetch sessions:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSessions();
  }, []);

  // ── Derived data from real sessions ──────────────────────────────────────

  const allIssues = useMemo(() => {
    return sessions.flatMap((s) =>
      (s.session_issues || []).map((issue) => ({
        key: issue.issue_key,
        summary: issue.summary,
        points: issue.estimate || "—",
        session: s.name,
        date: formatRelativeDate(s.created_at),
        source: issue.source,
      }))
    );
  }, [sessions]);

  const totalIssues = allIssues.length;
  const totalPoints = allIssues.reduce((s, i) => s + (parseFloat(i.points) || 0), 0);

  const recentSessionsList = useMemo(() => {
    return sessions.slice(0, 5).map((s) => ({
      name: s.name,
      date: formatRelativeDate(s.created_at),
      status: s.status === "live" ? "live" : "done",
    }));
  }, [sessions]);

  // Activity data for calendar — count sessions per day
  const activityData = useMemo(() => {
    const counts: Record<string, number> = {};
    sessions.forEach((s) => {
      const day = s.created_at.split("T")[0];
      counts[day] = (counts[day] || 0) + 1;
    });
    return counts;
  }, [sessions]);

  return (
    <div className="min-h-screen page-bg text-[#172b4d] dark:text-[#b6c2cf] font-sans transition-colors">
      <Navbar 
        firstName={firstName} 
        email={session?.user?.email || ""} 
        onLogout={() => signOut({ callbackUrl: "/login" })} 
      />

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} className="text-[#0052cc] dark:text-[#4c9aff]" />
            <span className="text-xs font-bold text-[#0052cc] dark:text-[#4c9aff] uppercase tracking-widest">Dashboard</span>
          </div>
          <h1 className="text-2xl font-bold text-[#172b4d] dark:text-[#dfe1e6] mb-1">
            {greeting}, {firstName}
          </h1>
          <p className="text-sm text-gray-500 dark:text-[#8c9bab]">
            {loading ? "Loading your data…" : `${sessions.length} sessions · ${totalIssues} issues · ${totalPoints} story points`}
          </p>
        </motion.header>

        {/* Bento Grid */}
        <BentoGrid className="mb-8">
          {/* ── Create Session ──────────────────────────────────── */}
          <BentoCard
            index={0}
            name="Create Session"
            description="Start a new estimation round with custom stories or Jira integration."
            Icon={Plus}
            cta="Get started"
            onClick={() => router.push("/dashboard/create")}
            className="col-span-3 lg:col-span-1"
            background={<FloatingCards />}
          />

          {/* ── Join Session ────────────────────────────────────── */}
          <BentoCard
            index={1}
            name="Join Session"
            description="Enter a room code to connect with your team's active session."
            cta="Join now"
            onClick={() => router.push("/dashboard/join")}
            className="col-span-3 lg:col-span-1"
            background={<PulsingCode />}
            Icon={Users}
          />

          {/* ── Issues Estimated ────────────────────────────────── */}
          <BentoCard
            index={2}
            name="Issues Estimated"
            description={`${totalPoints} total story points across ${sessions.length} sessions.`}
            cta="View all issues"
            onClick={() => setShowIssuesModal(true)}
            className="col-span-3 lg:col-span-1"
            Icon={BarChart3}
            background={
              <div className="absolute inset-0 flex items-center justify-center">
                <AnimatedCounter value={totalIssues} />
                <div className="absolute w-32 h-32 rounded-full border border-[#0052cc]/5 dark:border-[#4c9aff]/5" />
                <div className="absolute w-48 h-48 rounded-full border border-[#0052cc]/[0.03] dark:border-[#4c9aff]/[0.03]" />
              </div>
            }
          />

          {/* ── Activity Calendar ───────────────────────────────── */}
          <BentoCard
            index={3}
            name="Activity"
            description="Your estimation activity over the past year. Click a date to schedule."
            Icon={Calendar}
            className="col-span-3 lg:col-span-2 min-h-[20rem]"
            background={
              <div className="absolute inset-x-0 top-4 px-5 pt-1">
                <ActivityCalendar realData={activityData} />
              </div>
            }
          />

          {/* ── Recent Sessions ──────────────────────────────────── */}
          <BentoCard
            index={4}
            name="Recent Sessions"
            description={loading ? "Loading…" : `${sessions.length} sessions completed`}
            Icon={History}
            className="col-span-3 lg:col-span-1"
            background={<RecentSessionsBackground sessions={recentSessionsList} />}
          />
        </BentoGrid>
      </main>

      {/* Issues popup modal */}
      <AnimatePresence>
        {showIssuesModal && (
          <IssuesModal
            issues={allIssues}
            onClose={() => setShowIssuesModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}