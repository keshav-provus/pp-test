"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Users, BarChart3, Calendar, History, Zap, X, ChevronDown, Clock, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";

import { AppDock } from "@/components/dashboard/app-dock";
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
      className="text-5xl font-black tabular-nums bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent"
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
              "bg-card border-border",
              "transform-gpu blur-[0.5px] group-hover:blur-none transition-all duration-500"
            )}
          >
            <div className="w-4 h-4 rounded bg-primary opacity-20" />
            <div className="space-y-1">
              <div className="h-1 w-full bg-border rounded" />
              <div className="h-1 w-3/4 bg-border/50 rounded" />
            </div>
            <span className="text-[8px] font-bold text-muted-foreground uppercase">{card}</span>
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
        className="relative bg-card w-full max-w-lg max-h-[70vh] rounded-2xl shadow-xl border border-border overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
              <BarChart3 size={16} />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">Estimated Issues</h3>
              <p className="text-[11px] text-muted-foreground">{issues.length} issues across all sessions</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-all">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {issues.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No issues estimated yet. Complete a session to see data here.
            </div>
          ) : (
            issues.map((issue, i) => (
              <motion.div
                key={`${issue.key}-${i}`}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary transition-colors group"
              >
                <span className="text-[11px] font-mono font-medium text-foreground bg-secondary px-2 py-0.5 rounded-md border border-border shrink-0">
                  {issue.key}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{issue.summary}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {issue.session} · {issue.date}
                    <span className={cn(
                      "ml-1.5 px-1.5 py-0 rounded text-[9px] font-medium uppercase border",
                      issue.source === "jira"
                        ? "bg-primary/10 text-primary border-primary/20"
                        : "bg-transparent text-muted-foreground border-transparent"
                    )}>
                      {issue.source}
                    </span>
                  </p>
                </div>
                {issue.points && issue.points !== "—" && (
                  <span className="text-sm font-semibold text-foreground bg-secondary px-2 py-0.5 rounded-md border border-border shrink-0">
                    {issue.points} pts
                  </span>
                )}
              </motion.div>
            ))
          )}
        </div>

        <div className="px-5 py-3 border-t border-border text-center">
          <span className="text-xs text-muted-foreground">
            Total: <span className="font-semibold text-foreground">{totalPoints} story points</span>
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
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-card border border-border"
          >
            <div className={cn(
              "w-1.5 h-1.5 rounded-full shrink-0",
              s.status === "live"
                ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]"
                : "bg-muted-foreground/30"
            )} />
            <span className="text-[11px] font-medium text-foreground truncate flex-1">{s.name}</span>
            <span className="text-[9px] text-muted-foreground shrink-0 font-mono">{s.date}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Sessions detail modal ──────────────────────────────────────────────────

function SessionsModal({
  sessions,
  onClose,
}: {
  sessions: SessionRecord[];
  onClose: () => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
        className="relative bg-card w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-xl border border-border overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
              <History size={16} />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">Recent Sessions</h3>
              <p className="text-[11px] text-muted-foreground">{sessions.length} sessions completed</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-all">
            <X size={16} />
          </button>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {sessions.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No sessions yet. Complete a planning poker session to see it here.
            </div>
          ) : (
            sessions.map((s, i) => {
              const isExpanded = expandedId === s.id;
              const issueCount = s.session_issues?.length || 0;
              const participantCount = s.session_participants?.length || 0;
              const dateStr = formatRelativeDate(s.created_at);
              const timeStr = new Date(s.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="mb-1"
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : s.id)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-secondary transition-colors text-left group"
                  >
                    <div className={cn(
                      "w-2 h-2 rounded-full shrink-0",
                      s.status === "live"
                        ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]"
                        : "bg-muted-foreground/30"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Clock size={10} />
                          {dateStr}, {timeStr}
                        </span>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <User size={10} />
                          {s.host_name}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-semibold text-foreground">{s.total_points} pts</span>
                        <p className="text-[10px] text-muted-foreground">{issueCount} issues · {participantCount} people</p>
                      </div>
                      <ChevronDown
                        size={14}
                        className={cn(
                          "text-muted-foreground transition-transform duration-200",
                          isExpanded && "rotate-180"
                        )}
                      />
                    </div>
                  </button>

                  {/* Expanded issue list */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="pl-8 pr-3 pb-2 space-y-1">
                          {(s.session_issues || []).length === 0 ? (
                            <p className="text-xs text-muted-foreground italic py-2">No issues recorded.</p>
                          ) : (
                            (s.session_issues || []).map((issue, j) => (
                              <div
                                key={issue.id || j}
                                className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-secondary/50 border border-border/50"
                              >
                                <span className="text-[10px] font-mono font-medium text-foreground bg-card px-1.5 py-0.5 rounded border border-border shrink-0">
                                  {issue.issue_key}
                                </span>
                                <span className="text-xs text-foreground truncate flex-1">{issue.summary}</span>
                                <span className={cn(
                                  "text-[9px] font-medium uppercase px-1.5 py-0.5 rounded border shrink-0",
                                  issue.source === "jira"
                                    ? "bg-primary/10 text-primary border-primary/20"
                                    : "bg-transparent text-muted-foreground border-border"
                                )}>
                                  {issue.source}
                                </span>
                                {issue.estimate && issue.estimate !== "—" ? (
                                  <span className="text-xs font-semibold text-foreground bg-card px-2 py-0.5 rounded border border-border shrink-0">
                                    {issue.estimate} pts
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted-foreground shrink-0">—</span>
                                )}
                              </div>
                            ))
                          )}
                          {/* Participants */}
                          {(s.session_participants || []).length > 0 && (
                            <div className="flex items-center gap-1 pt-1">
                              <span className="text-[10px] text-muted-foreground">Participants:</span>
                              {(s.session_participants || []).map((p, k) => (
                                <span
                                  key={k}
                                  className={cn(
                                    "text-[10px] px-1.5 py-0.5 rounded-md border",
                                    p.is_host
                                      ? "bg-primary/10 text-primary border-primary/20 font-medium"
                                      : "bg-secondary text-muted-foreground border-border"
                                  )}
                                >
                                  {p.name}{p.is_host ? " (host)" : ""}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border text-center">
          <span className="text-xs text-muted-foreground">
            Total: <span className="font-semibold text-foreground">
              {sessions.reduce((s, r) => s + (r.total_points || 0), 0)} story points
            </span>
            {" across "}
            <span className="font-semibold text-foreground">
              {sessions.reduce((s, r) => s + (r.session_issues?.length || 0), 0)} issues
            </span>
          </span>
        </div>
      </motion.div>
    </motion.div>
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
  const { data: session, status: authStatus } = useSession();
  const [showIssuesModal, setShowIssuesModal] = useState(false);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace("/login");
    }
  }, [authStatus, router]);

  const firstName = session?.user?.name?.split(" ")[0] || "";
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

  // Show loading while auth is being determined
  if (authStatus === "loading" || authStatus === "unauthenticated") {
    return (
      <div className="min-h-screen page-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen page-bg text-foreground font-sans transition-colors">
      <AppDock onLogout={() => signOut({ callbackUrl: "/login" })} />

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} className="text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">Dashboard</span>
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-1">
            {greeting}, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground">
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
                <div className="absolute w-32 h-32 rounded-full border border-border" />
                <div className="absolute w-48 h-48 rounded-full border border-border/50" />
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
            cta="View all sessions"
            onClick={() => setShowSessionsModal(true)}
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

      {/* Sessions detail modal */}
      <AnimatePresence>
        {showSessionsModal && (
          <SessionsModal
            sessions={sessions}
            onClose={() => setShowSessionsModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}