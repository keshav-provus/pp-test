"use client";

import React, { useState, useMemo, useEffect, useRef, Suspense, useCallback } from "react";
import {
  ExternalLink, ChevronDown,
  RotateCcw, Users, Plus, Check, FileText,
  LogOut, Loader2, X, Share2, FileEdit, Copy, Link2,
  Timer, Play, Square, AlertTriangle, Eye, EyeOff, Crown,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

import { useRoom } from "@/context/RoomContext";
import {
  type JiraIssue,
  type JiraIssueDetails,
  getIssueDetails,
  updateStoryPoints,
} from "@/services/jira";
import { JiraMultiSelector } from "@/components/jira/selector";

// ─── helpers ────────────────────────────────────────────────────────────────

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function copyText(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

// ─── Timer bar component ─────────────────────────────────────────────────────

function TimerBar({
  remaining,
  duration,
  isHost,
  timerRunning,
  onStart,
  onStop,
  onReset,
  onSetDuration,
}: {
  remaining: number;
  duration: number;
  isHost: boolean;
  timerRunning: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onSetDuration: (d: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draftMins, setDraftMins] = useState(String(Math.floor(duration / 60)));
  const [draftSecs, setDraftSecs] = useState(String(duration % 60));

  const pct = duration > 0 ? (remaining / duration) * 100 : 0;
  const urgent = remaining > 0 && remaining <= 10;
  const expired = duration > 0 && remaining === 0 && timerRunning;

  if (!isHost && duration === 0) return null;

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all ${
      expired
        ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
        : urgent
        ? "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-700"
        : "bg-[#f8f9fa] dark:bg-[#22272b] border-gray-200 dark:border-[#2c333a]"
    }`}>
      <Timer size={15} className={urgent ? "text-orange-500" : "text-gray-500 dark:text-[#8c9bab]"} />

      {/* Duration editor (host only, when not running) */}
      {isHost && !timerRunning && editing ? (
        <div className="flex items-center gap-1">
          <input
            type="number" min={0} max={59}
            value={draftMins}
            onChange={e => setDraftMins(e.target.value)}
            className="w-10 text-center text-sm font-mono bg-white dark:bg-[#1d2125] border border-gray-300 dark:border-[#2c333a] rounded px-1 py-0.5 focus:outline-none focus:border-[#0052cc]"
          />
          <span className="text-gray-500 font-mono">:</span>
          <input
            type="number" min={0} max={59}
            value={draftSecs}
            onChange={e => setDraftSecs(e.target.value)}
            className="w-10 text-center text-sm font-mono bg-white dark:bg-[#1d2125] border border-gray-300 dark:border-[#2c333a] rounded px-1 py-0.5 focus:outline-none focus:border-[#0052cc]"
          />
          <button
            onClick={() => {
              const d = (parseInt(draftMins) || 0) * 60 + (parseInt(draftSecs) || 0);
              onSetDuration(d);
              setEditing(false);
            }}
            className="text-xs bg-[#0052cc] text-white px-2 py-0.5 rounded hover:bg-[#0047b3] transition-colors ml-1"
          >Set</button>
          <button onClick={() => setEditing(false)} className="text-xs text-gray-500 px-1">✕</button>
        </div>
      ) : (
        <button
          onClick={() => isHost && !timerRunning && setEditing(true)}
          className={`font-mono text-sm font-bold tabular-nums min-w-[3rem] ${
            urgent ? "text-orange-600 dark:text-orange-400" :
            expired ? "text-red-600 dark:text-red-400" :
            "text-[#172b4d] dark:text-[#b6c2cf]"
          } ${isHost && !timerRunning ? "cursor-pointer hover:underline" : "cursor-default"}`}
          title={isHost && !timerRunning ? "Click to edit timer" : undefined}
        >
          {timerRunning || (!timerRunning && duration > 0 && remaining < duration)
            ? fmtTime(remaining)
            : fmtTime(duration)}
        </button>
      )}

      {/* Progress bar */}
      {duration > 0 && (
        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-[#2c333a] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              urgent ? "bg-orange-500" : expired ? "bg-red-500" : "bg-[#0052cc] dark:bg-[#4c9aff]"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {expired && (
        <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wide animate-pulse">
          Time&apos;s up!
        </span>
      )}

      {/* Controls (host only) */}
      {isHost && (
        <div className="flex items-center gap-1 ml-auto shrink-0">
          {!timerRunning ? (
            <button
              onClick={onStart}
              disabled={duration === 0}
              className="flex items-center gap-1 text-xs text-white bg-[#0052cc] hover:bg-[#0047b3] disabled:opacity-40 px-3 py-1.5 rounded-lg transition-colors font-bold"
            >
              <Play size={11} className="fill-current" /> Start
            </button>
          ) : (
            <button
              onClick={onStop}
              className="flex items-center gap-1 text-xs text-white bg-orange-500 hover:bg-orange-600 px-3 py-1.5 rounded-lg transition-colors font-bold"
            >
              <Square size={11} className="fill-current" /> Stop
            </button>
          )}
          <button
            onClick={onReset}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-[#dfe1e6] hover:bg-gray-200 dark:hover:bg-[#2c333a] rounded-lg transition-all"
            title="Reset timer"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Copy toast ──────────────────────────────────────────────────────────────

function CopyToast({ show }: { show: boolean }) {
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 bg-gradient-to-r from-[#172b4d] to-[#1e3a5f] dark:from-[#dfe1e6] dark:to-[#b6c2cf] text-white dark:text-[#172b4d] px-5 py-3 rounded-xl shadow-2xl text-sm font-bold transition-all duration-300 ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"}`}>
      <Check size={15} /> Copied to clipboard
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

function PokerSessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: authStatus } = useSession();

  const sessionId = searchParams.get("sessionId") ?? "";
  const role = searchParams.get("role");
  const isHost = role === "host";

  const {
    participants, votes, revealed, sessionEnded,
    currentIssueIndex, activeIssue,
    timer, timerRemaining,
    joinRoom, castVote, revealVotes, resetVotes,
    endSession, leaveSession,
    broadcastActiveIssue,
    setTimer, startTimer, stopTimer,
  } = useRoom();

  const [isMounted, setIsMounted] = useState(false);
  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [myVote, setMyVote] = useState<number | string | null>(null);
  const [finalEstimate, setFinalEstimate] = useState("");
  const [estimates, setEstimates] = useState<Record<string, string>>({});
  const [activeIssueDetails, setActiveIssueDetails] = useState<JiraIssueDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // UX state
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [modalMode, setModalMode] = useState<"menu" | "jira">("menu");
  const [customStorySummary, setCustomStoryName] = useState("");
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [copiedSessionId, setCopiedSessionId] = useState(false);
  const [showTimerPanel, setShowTimerPanel] = useState(false);

  // Track if timer already auto-revealed (prevent double trigger)
  const autoRevealedRef = useRef(false);

  const participantName = searchParams.get("name")
    ? decodeURIComponent(searchParams.get("name") as string)
    : session?.user?.name || "Anonymous";

  const timerRunning = timer.startedAt !== null;
  const allVoted = participants.length > 0 && participants.every(p => votes[p.name] !== undefined && votes[p.name] !== null);
  const canReveal = isHost && (timerRunning ? timerRemaining === 0 : allVoted);

  // ── Mount ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    setIsMounted(true);
    // Only the host needs the local issues array; participants render from context activeIssue
    if (isHost && typeof window !== "undefined") {
      const saved = sessionStorage.getItem("pending_jira_issues");
      if (saved) setIssues(JSON.parse(saved));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isMounted && sessionId && role && authStatus !== "loading") {
      joinRoom(sessionId, participantName, isHost);
    }
  }, [isMounted, sessionId, role, authStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  // When host has both joined the channel AND has issues loaded, broadcast issue 0
  // so any participants already in the room receive the initial active issue
  const didInitBroadcast = useRef(false);
  useEffect(() => {
    if (!isHost || !isMounted || issues.length === 0 || didInitBroadcast.current) return;
    didInitBroadcast.current = true;
    const first = issues[0];
    // Small delay to ensure channel subscription is ready
    const t = setTimeout(() => {
      broadcastActiveIssue(0, {
        id: first.id, key: first.key,
        summary: first.summary, status: first.status,
        statusCategory: first.statusCategory,
      });
    }, 600);
    return () => clearTimeout(t);
  }, [isHost, isMounted, issues]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (sessionEnded && !isHost) router.push("/dashboard");
  }, [sessionEnded, isHost, router]);

  // ── Reset local vote when issue changes ──────────────────────────────────
  useEffect(() => {
    setMyVote(null);
    autoRevealedRef.current = false;
    // For host: restore any saved estimate for this issue
    if (isHost && activeIssue) {
      setFinalEstimate(estimates[activeIssue.id] || "");
    } else {
      setFinalEstimate("");
    }
  }, [currentIssueIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Reset local vote when host triggers revote (votes_reset) ────────────
  useEffect(() => {
    if (!revealed && Object.keys(votes).length === 0) {
      setMyVote(null);
      autoRevealedRef.current = false;
    }
  }, [revealed, votes]);

  // ── Auto-reveal when timer hits 0 ────────────────────────────────────────
  useEffect(() => {
    if (
      timerRunning &&
      timerRemaining === 0 &&
      !revealed &&
      !autoRevealedRef.current
    ) {
      autoRevealedRef.current = true;
      revealVotes();
    }
  }, [timerRemaining, timerRunning, revealed, revealVotes]);

  // ── Fetch Jira details whenever the context activeIssue changes ──────────
  // activeIssue comes from context (broadcast by host) — same for ALL clients

  useEffect(() => {
    if (!activeIssue) { setActiveIssueDetails(null); return; }
    if (activeIssue.id.startsWith("custom-")) { setActiveIssueDetails(null); return; }

    let cancelled = false;
    setIsLoadingDetails(true);
    setActiveIssueDetails(null);

    const doFetch = async () => {
      try {
        const details = await getIssueDetails(activeIssue.key);
        if (!cancelled) setActiveIssueDetails(details);
      } catch {
        if (!cancelled) setActiveIssueDetails(null);
      } finally {
        if (!cancelled) setIsLoadingDetails(false);
      }
    };
    doFetch();
    return () => { cancelled = true; };
  }, [activeIssue?.key]);

  // ── Grouped vote results ──────────────────────────────────────────────────
  const groupedVotes = useMemo(() => {
    const groups: Record<number, typeof participants> = {};
    Object.entries(votes).forEach(([name, vote]) => {
      if (vote === null) return;
      if (!groups[vote]) groups[vote] = [];
      const p = participants.find(p => p.name === name);
      if (p) groups[vote].push(p);
    });
    return groups;
  }, [votes, participants]);

  const currentAverage = useMemo(() => {
    const active = Object.values(votes).filter((v): v is number => v !== null);
    if (!active.length) return "";
    return parseFloat((active.reduce((a, b) => a + b, 0) / active.length).toFixed(1)).toString();
  }, [votes]);

  const currentMin = useMemo(() => {
    const active = Object.values(votes).filter((v): v is number => v !== null);
    if (!active.length) return "";
    return Math.min(...active).toString();
  }, [votes]);

  const currentMax = useMemo(() => {
    const active = Object.values(votes).filter((v): v is number => v !== null);
    if (!active.length) return "";
    return Math.max(...active).toString();
  }, [votes]);

  const votedCount = participants.filter(p => votes[p.name] !== undefined && votes[p.name] !== null).length;
  const totalParticipants = participants.length;
  // isLastIssue only meaningful for host (they own the issues array)
  const isLastIssue = isHost && issues.length > 0 && currentIssueIndex === issues.length - 1;
  const estimatedIssuesCount = Object.keys(estimates).length;
  const totalStoryPoints = Object.values(estimates).reduce((s, v) => s + (parseFloat(v) || 0), 0);

  // ── Copy helpers ──────────────────────────────────────────────────────────
  const triggerCopyToast = useCallback(() => {
    setShowCopyToast(true);
    setTimeout(() => setShowCopyToast(false), 2000);
  }, []);

  const handleCopySessionId = useCallback(() => {
    copyText(sessionId);
    setCopiedSessionId(true);
    triggerCopyToast();
    setTimeout(() => setCopiedSessionId(false), 2000);
  }, [sessionId, triggerCopyToast]);

  const handleCopyInviteLink = useCallback(() => {
    const url = `${window.location.origin}/dashboard/join?code=${sessionId}`;
    copyText(url);
    triggerCopyToast();
  }, [sessionId, triggerCopyToast]);

  // ── Voting & navigation ───────────────────────────────────────────────────
  const handleSaveAndNext = async () => {
    if (!isHost || !activeIssue || isSaving) return;
    const est = finalEstimate.trim() || currentAverage;
    if (est) {
      setIsSaving(true);
      try {
        if (!activeIssue.id.startsWith("custom-")) {
          const pts = parseFloat(est);
          if (!isNaN(pts)) await updateStoryPoints(activeIssue.key, pts);
        }
        setEstimates(prev => ({ ...prev, [activeIssue.id]: est }));
      } catch {
        alert("Warning: Failed to sync estimate with Jira. Continuing locally.");
      } finally {
        setIsSaving(false);
      }
    }

    if (!isLastIssue) {
      const nextIdx = currentIssueIndex + 1;
      const next = issues[nextIdx];
      await broadcastActiveIssue(nextIdx, {
        id: next.id, key: next.key,
        summary: next.summary, status: next.status,
        statusCategory: next.statusCategory,
      });
    } else {
      setShowCompletionModal(true);
    }
  };

  const jumpToIssue = async (idx: number) => {
    if (!isHost || isSaving) return;
    const issue = issues[idx];
    setFinalEstimate(estimates[issue.id] || "");
    await broadcastActiveIssue(idx, {
      id: issue.id, key: issue.key,
      summary: issue.summary, status: issue.status,
      statusCategory: issue.statusCategory,
    });
  };

  const handleAppendCustomIssue = async () => {
    if (!customStorySummary.trim()) return;
    const newIssue: JiraIssue = {
      id: `custom-${Date.now()}`,
      key: `C${String(issues.length + 1).padStart(3, "0")}`,
      summary: customStorySummary.trim(),
      status: "Custom Story",
      statusCategory: "To Do",
    };
    const updated = [...issues, newIssue];
    setIssues(updated);
    sessionStorage.setItem("pending_jira_issues", JSON.stringify(updated));
    setCustomStoryName("");
    setShowCompletionModal(false);
    await broadcastActiveIssue(issues.length, {
      id: newIssue.id, key: newIssue.key,
      summary: newIssue.summary, status: newIssue.status,
      statusCategory: newIssue.statusCategory,
    });
  };

  const handleAppendJiraIssues = async (newIssues: JiraIssue[]) => {
    if (!newIssues.length) return;
    const updated = [...issues, ...newIssues];
    setIssues(updated);
    sessionStorage.setItem("pending_jira_issues", JSON.stringify(updated));
    setShowCompletionModal(false);
    const first = newIssues[0];
    await broadcastActiveIssue(issues.length, {
      id: first.id, key: first.key,
      summary: first.summary, status: first.status,
      statusCategory: first.statusCategory,
    });
  };

  const handleQuickAddIssue = () => {
    const summary = window.prompt("Enter the summary for the new issue:");
    if (!summary?.trim()) return;
    const newIssue: JiraIssue = {
      id: `custom-${Date.now()}`,
      key: `C${String(issues.length + 1).padStart(3, "0")}`,
      summary: summary.trim(),
      status: "Custom Story",
      statusCategory: "To Do",
    };
    const updated = [...issues, newIssue];
    setIssues(updated);
    sessionStorage.setItem("pending_jira_issues", JSON.stringify(updated));
  };

  const handleEndOrLeave = async () => {
    if (isHost) {
      if (!confirm("End this session for everyone?")) return;

      // ── Persist session history to DB ─────────────────────────────────
      try {
        const config = (() => {
          try {
            const raw = sessionStorage.getItem("session_config");
            return raw ? JSON.parse(raw) : {};
          } catch { return {}; }
        })();

        const issuePayload = issues.map((issue) => ({
          key: issue.key,
          summary: issue.summary,
          source: issue.id.startsWith("custom-") ? "custom" : "jira",
          estimate: estimates[issue.id] || null,
          votes: votes, // final votes state
        }));

        await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionCode: sessionId,
            name: config.sessionName || "Untitled Session",
            hostName: participantName,
            hostEmail: session?.user?.email || null,
            seriesKey: config.seriesKey || "fibonacci",
            issues: issuePayload,
            participants: participants.map((p) => ({
              name: p.name,
              isHost: p.isHost,
            })),
          }),
        });
      } catch (err) {
        console.error("Failed to save session history:", err);
        // Non-blocking — still end the session even if save fails
      }

      await endSession();
    } else {
      await leaveSession(participantName);
    }
    router.push("/dashboard");
  };

  const openJiraIssue = () => {
    if (!activeIssue || activeIssue.id.startsWith("custom-")) return;
    window.open(`https://provusinc.atlassian.net/browse/${activeIssue.key}`, "_blank", "noopener,noreferrer");
  };

  const renderAvatar = (name: string, size: "sm" | "md" = "md") => {
    const initials = name ? name.substring(0, 2).toUpperCase() : "?";
    const sz = size === "md" ? "w-8 h-8 text-xs" : "w-6 h-6 text-[10px]";
    return (
      <div className={`${sz} rounded-lg bg-gradient-to-br from-[#0052cc] to-[#6554c0] dark:from-[#4c9aff] dark:to-[#9f8fef] text-white flex items-center justify-center font-bold shadow-sm border-2 border-white dark:border-[#1d2125] shrink-0`}>
        {initials}
      </div>
    );
  };

  // Read card series from session config (set by create page) — must be before early return
  const cardValues: (number | string)[] = useMemo(() => {
    if (typeof window === "undefined") return [0, 1, 2, 3, 5, 8, 13, 21, 34];
    try {
      const raw = sessionStorage.getItem("session_config");
      if (raw) {
        const config = JSON.parse(raw);
        if (Array.isArray(config.seriesValues) && config.seriesValues.length > 0) {
          return config.seriesValues;
        }
      }
    } catch {}
    return [0, 1, 2, 3, 5, 8, 13, 21, 34]; // default Fibonacci
  }, []);

  const sessionDisplayName = useMemo(() => {
    if (typeof window === "undefined") return "";
    try {
      const raw = sessionStorage.getItem("session_config");
      if (raw) return JSON.parse(raw).sessionName || "";
    } catch {}
    return "";
  }, []);

  const seriesLabel = useMemo(() => {
    if (typeof window === "undefined") return "fibonacci";
    try {
      const raw = sessionStorage.getItem("session_config");
      if (raw) return JSON.parse(raw).seriesKey || "fibonacci";
    } catch {}
    return "fibonacci";
  }, []);

  if (!isMounted) return (
    <div className="min-h-screen bg-[#f4f5f7] dark:bg-[#111214] flex items-center justify-center text-gray-500">
      <Loader2 size={20} className="animate-spin mr-2" /> Loading session…
    </div>
  );

  return (
    <div className="min-h-screen page-bg font-sans text-[#172b4d] dark:text-[#b6c2cf] flex justify-center py-6 px-4 transition-colors">
      <CopyToast show={showCopyToast} />

      {/* ── COMPLETION MODAL ─────────────────────────────────────────────── */}
      {showCompletionModal && isHost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1d2125] rounded-xl shadow-2xl w-full max-w-4xl border border-gray-200 dark:border-[#2c333a] overflow-hidden flex flex-col max-h-[90vh]">
            {modalMode === "menu" ? (
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">Backlog Completed! 🎉</h2>
                    <p className="text-gray-500 dark:text-[#8c9bab] mt-1">All issues in this backlog have been estimated.</p>
                  </div>
                  <button onClick={() => setShowCompletionModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-[#22272b] rounded-md transition-colors">
                    <X size={20} className="text-gray-500" />
                  </button>
                </div>

                {/* Summary */}
                <div className="flex gap-4 mb-6 p-4 bg-gray-50 dark:bg-[#22272b] rounded-lg border border-gray-200 dark:border-[#2c333a]">
                  <div className="text-center px-4 border-r border-gray-200 dark:border-[#2c333a]">
                    <div className="text-2xl font-bold text-[#0052cc] dark:text-[#4c9aff]">{estimatedIssuesCount}</div>
                    <div className="text-xs text-gray-500 dark:text-[#8c9bab] mt-0.5">Issues Estimated</div>
                  </div>
                  <div className="text-center px-4">
                    <div className="text-2xl font-bold text-[#006644] dark:text-[#57d9a3]">{totalStoryPoints}</div>
                    <div className="text-xs text-gray-500 dark:text-[#8c9bab] mt-0.5">Total Story Points</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="border border-gray-200 dark:border-[#2c333a] rounded-lg p-5 flex flex-col">
                    <div className="w-10 h-10 rounded bg-[#e9f2ff] dark:bg-[#0052cc]/20 text-[#0052cc] dark:text-[#4c9aff] flex items-center justify-center mb-3"><Share2 size={20} /></div>
                    <h3 className="font-semibold text-lg mb-1">Import from Jira</h3>
                    <p className="text-sm text-gray-500 dark:text-[#8c9bab] mb-4 flex-1">Pull in more active sprints or backlog items.</p>
                    <button onClick={() => setModalMode("jira")} className="w-full bg-white dark:bg-[#1d2125] border border-gray-300 dark:border-[#8c9bab]/30 hover:bg-gray-50 dark:hover:bg-[#2c333a] font-medium py-2 rounded transition-colors text-sm">
                      Open Selector
                    </button>
                  </div>
                  <div className="border border-gray-200 dark:border-[#2c333a] rounded-lg p-5 flex flex-col">
                    <div className="w-10 h-10 rounded bg-[#eae6ff] dark:bg-[#6554c0]/20 text-[#6554c0] dark:text-[#9f8fef] flex items-center justify-center mb-3"><FileEdit size={20} /></div>
                    <h3 className="font-semibold text-lg mb-1">Add Custom Story</h3>
                    <p className="text-sm text-gray-500 dark:text-[#8c9bab] mb-4 flex-1">Write a new task or discussion item.</p>
                    <div className="flex gap-2">
                      <input
                        type="text" value={customStorySummary}
                        onChange={e => setCustomStoryName(e.target.value)}
                        placeholder="What needs to be done?"
                        onKeyDown={e => e.key === "Enter" && handleAppendCustomIssue()}
                        className="flex-1 h-9 px-3 bg-white dark:bg-[#1d2125] border border-gray-300 dark:border-[#8c9bab]/30 rounded text-sm focus:outline-none focus:border-[#6554c0] transition-colors"
                      />
                      <button onClick={handleAppendCustomIssue} disabled={!customStorySummary.trim()} className="bg-[#6554c0] hover:bg-[#5243aa] text-white px-3 h-9 rounded text-sm font-medium disabled:opacity-50 transition-colors">Add</button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end border-t border-gray-200 dark:border-[#2c333a] pt-4">
                  <button onClick={handleEndOrLeave} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-medium flex items-center gap-2 transition-colors text-sm">
                    <LogOut size={16} /> End Session For All
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full bg-[#f4f5f7] dark:bg-[#111214]">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#2c333a] bg-white dark:bg-[#1d2125]">
                  <h2 className="font-semibold text-lg">Select Issues to Append</h2>
                  <button onClick={() => setModalMode("menu")} className="text-gray-500 hover:text-gray-800 dark:hover:text-white text-sm font-medium transition-colors">Cancel</button>
                </div>
                <div className="p-4 flex-1 overflow-hidden">
                  <JiraMultiSelector onFinalSelection={handleAppendJiraIssues} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MAIN CARD ────────────────────────────────────────────────────── */}
      <div className="relative bg-white dark:bg-[#1d2125] w-full max-w-[1400px] rounded-2xl shadow-xl shadow-black/[0.04] dark:shadow-black/20 border border-gray-200 dark:border-[#2c333a] flex flex-col min-h-[90vh] overflow-hidden">
        {/* Top accent */}
        <div className="absolute top-0 inset-x-0 h-[2px] brand-gradient" />

        {/* TOP HEADER */}
        <header className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-[#2c333a] gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm min-w-0">
            <div className="w-7 h-7 bg-gradient-to-br from-[#0052cc] to-[#2684ff] rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm">
              <FileText size={13} />
            </div>
            <span className="text-gray-400 dark:text-[#626f86] hidden sm:inline text-xs font-medium">Poker /</span>
            {sessionDisplayName && (
              <span className="text-xs font-semibold text-[#172b4d] dark:text-[#dfe1e6] hidden sm:inline">{sessionDisplayName} /</span>
            )}
            {/* Tap session ID to copy */}
            <button
              onClick={handleCopySessionId}
              title="Click to copy session ID"
              className="flex items-center gap-1.5 font-mono font-bold text-sm text-[#172b4d] dark:text-[#dfe1e6] hover:text-[#0052cc] dark:hover:text-[#4c9aff] hover:bg-[#e9f2ff] dark:hover:bg-[#0052cc]/10 px-2.5 py-1 rounded-lg transition-all group tracking-wide"
            >
              {sessionId}
              {copiedSessionId
                ? <Check size={13} className="text-green-500" />
                : <Copy size={13} className="opacity-40 group-hover:opacity-100 transition-opacity" />
              }
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Copy invite link */}
            <button
              onClick={handleCopyInviteLink}
              className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-[#9fadbc] hover:text-[#0052cc] dark:hover:text-[#4c9aff] bg-gray-50 dark:bg-[#22272b] hover:bg-[#e9f2ff] dark:hover:bg-[#0052cc]/10 border border-gray-200 dark:border-[#2c333a] px-3.5 py-1.5 rounded-lg transition-all font-bold text-xs"
            >
              <Link2 size={14} /> <span className="hidden sm:inline">Copy Invite Link</span>
            </button>

            {/* Timer toggle (host only) */}
            {isHost && (
              <button
                onClick={() => setShowTimerPanel(v => !v)}
                className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded border transition-all font-medium ${
                  showTimerPanel
                    ? "bg-[#0052cc] text-white border-[#0052cc]"
                    : "text-gray-600 dark:text-[#9fadbc] bg-gray-50 dark:bg-[#22272b] border-gray-200 dark:border-[#2c333a] hover:border-[#0052cc] dark:hover:border-[#4c9aff]"
                }`}
              >
                <Timer size={14} /> <span className="hidden sm:inline">Timer</span>
              </button>
            )}

            <button
              onClick={handleEndOrLeave}
              className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800/50 px-3.5 py-1.5 rounded-lg transition-colors font-bold"
            >
              <LogOut size={14} /> <span className="hidden sm:inline">{isHost ? "End" : "Leave"}</span>
            </button>
            {seriesLabel && (
              <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-gray-100 dark:bg-[#22272b] border border-gray-200 dark:border-[#2c333a] text-gray-500 dark:text-[#626f86] uppercase tracking-wider hidden sm:inline-flex">
                {seriesLabel.replace(/_/g, " ")}
              </span>
            )}
          </div>
        </header>

        {/* CONTENT + SIDEBAR */}
        <div className="flex flex-1 overflow-hidden">
          {/* MAIN */}
          <div className="flex-1 flex flex-col overflow-y-auto p-6 gap-5">

            {/* Timer panel */}
            {(showTimerPanel || timer.duration > 0) && (
              <TimerBar
                remaining={timerRemaining}
                duration={timer.duration}
                isHost={isHost}
                timerRunning={timerRunning}
                onStart={startTimer}
                onStop={stopTimer}
                onReset={() => stopTimer().then(() => setTimer(timer.duration))}
                onSetDuration={setTimer}
              />
            )}

            {/* Active issue banner */}
            {activeIssue ? (
              <div className="bg-gradient-to-r from-[#e9f2ff] to-[#f0f6ff] dark:from-[#0052cc]/10 dark:to-[#0052cc]/5 border border-[#cce0ff] dark:border-[#0052cc]/20 rounded-xl px-5 py-3.5 flex items-center justify-between gap-3 flex-wrap animate-fade-in-up">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="bg-green-500 w-4 h-4 rounded-sm flex items-center justify-center shrink-0">
                    <Check size={10} className="text-white" />
                  </div>
                  <button
                    onClick={openJiraIssue}
                    className={`text-[#0052cc] dark:text-[#4c9aff] font-semibold shrink-0 ${!activeIssue.id.startsWith("custom-") ? "hover:underline cursor-pointer" : "cursor-default"}`}
                  >
                    {activeIssue.key}
                  </button>
                  <span className="font-medium text-[#172b4d] dark:text-[#b6c2cf] truncate">
                    {activeIssue.summary}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 text-sm">
                  <span className="bg-white dark:bg-[#1d2125] border border-gray-200 dark:border-[#2c333a] text-gray-600 dark:text-[#9fadbc] text-xs font-semibold px-2 py-0.5 rounded uppercase">
                    {activeIssue.statusCategory || "OPEN"}
                  </span>
                  {!activeIssue.id.startsWith("custom-") && (
                    <button
                      onClick={openJiraIssue}
                      className="flex items-center gap-1 text-gray-600 dark:text-[#b6c2cf] bg-white dark:bg-[#1d2125] border border-gray-300 dark:border-[#8c9bab]/30 px-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-[#22272b] font-medium transition-colors text-xs"
                    >
                      <ExternalLink size={12} /> Open in Jira
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-[#22272b] border border-gray-200 dark:border-[#2c333a] rounded-xl px-4 py-6 text-center text-gray-400 dark:text-[#626f86] text-sm">
                {issues.length === 0 ? "No issues loaded for this session." : "Waiting for host to select an issue…"}
              </div>
            )}

            {/* Issue details grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Description */}
              <div className="lg:col-span-2 border border-gray-200 dark:border-[#2c333a] rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-[#2c333a] bg-gray-50/80 dark:bg-[#22272b]/50">
                  <h3 className="font-bold text-xs text-gray-500 dark:text-[#626f86] uppercase tracking-wider">Description</h3>
                  <ChevronDown size={15} className="text-gray-400" />
                </div>
                <div className="p-4 text-sm text-gray-700 dark:text-[#9fadbc] min-h-24">
                  {isLoadingDetails ? (
                    <div className="flex items-center gap-2 text-gray-400">
                      <Loader2 size={14} className="animate-spin" /> Fetching from Jira…
                    </div>
                  ) : activeIssue?.id.startsWith("custom-") ? (
                    <div className="space-y-2">
                      <p className="font-medium text-[#172b4d] dark:text-[#b6c2cf]">{activeIssue.summary}</p>
                      <p className="text-gray-400 dark:text-[#8c9bab] italic text-xs">Custom story — no Jira description available.</p>
                    </div>
                  ) : activeIssueDetails?.description ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{activeIssueDetails.description}</p>
                  ) : (
                    <p className="text-gray-400 dark:text-[#8c9bab] italic">No description provided for this issue.</p>
                  )}
                </div>
              </div>

              {/* Details sidebar */}
              <div className="border border-gray-200 dark:border-[#2c333a] rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-[#2c333a] bg-gray-50/80 dark:bg-[#22272b]/50">
                  <h3 className="font-bold text-xs text-gray-500 dark:text-[#626f86] uppercase tracking-wider">Details</h3>
                  <ChevronDown size={15} className="text-gray-400" />
                </div>
                <div className="p-4 text-sm space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-gray-400 dark:text-[#8c9bab] w-16 shrink-0 text-xs pt-0.5">Reporter</span>
                    <div className="flex items-center gap-2 min-w-0">
                      {isLoadingDetails ? (
                        <span className="text-gray-300 text-xs">Loading…</span>
                      ) : activeIssueDetails?.reporter ? (
                        <>
                          {renderAvatar(activeIssueDetails.reporter, "sm")}
                          <span className="font-medium text-[#172b4d] dark:text-[#b6c2cf] text-xs truncate">{activeIssueDetails.reporter}</span>
                        </>
                      ) : activeIssue?.id.startsWith("custom-") ? (
                        <span className="text-gray-400 dark:text-[#8c9bab] italic text-xs">Custom issue</span>
                      ) : (
                        <span className="text-gray-400 dark:text-[#8c9bab] italic text-xs">Unassigned</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-gray-400 dark:text-[#8c9bab] w-16 shrink-0 text-xs pt-0.5">Status</span>
                    <span className="text-xs font-semibold bg-[#dfe1e6] dark:bg-[#2c333a] text-gray-700 dark:text-[#b6c2cf] px-2 py-0.5 rounded uppercase">
                      {activeIssue?.status || "—"}
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-gray-400 dark:text-[#8c9bab] w-16 shrink-0 text-xs pt-0.5">Source</span>
                    <span className="text-xs text-gray-600 dark:text-[#9fadbc]">
                      {activeIssue?.id.startsWith("custom-") ? "Custom" : "Jira"}
                    </span>
                  </div>
                  {estimates[activeIssue?.id ?? ""] && (
                    <div className="flex items-start gap-3">
                      <span className="text-gray-400 dark:text-[#8c9bab] w-16 shrink-0 text-xs pt-0.5">Estimate</span>
                      <span className="text-xs font-bold text-[#006644] dark:text-[#57d9a3] bg-[#e3fcef] dark:bg-[#006644]/20 px-2 py-0.5 rounded">
                        {activeIssue ? estimates[activeIssue.id] : ""} pts
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Voting controls bar */}
            <div className="flex items-center gap-2 bg-gray-50/80 dark:bg-[#22272b]/50 p-3.5 rounded-xl border border-gray-200 dark:border-[#2c333a] shadow-sm flex-wrap">
              {/* Final estimate input (host) */}
              {isHost && (
                <input
                  type="text"
                  value={finalEstimate}
                  onChange={e => setFinalEstimate(e.target.value)}
                  disabled={isSaving}
                  placeholder={revealed && currentAverage ? currentAverage : "pts"}
                  title={revealed && currentAverage ? `Average: ${currentAverage}` : "Override estimate"}
                  className="w-16 h-8 bg-white dark:bg-[#1d2125] border border-gray-300 dark:border-[#2c333a] rounded px-2 text-center text-sm font-semibold focus:outline-none focus:border-[#0052cc] disabled:opacity-50 text-[#172b4d] dark:text-[#b6c2cf] placeholder:font-normal placeholder:text-gray-400 transition-colors"
                />
              )}

              {isHost && (
                <button
                  onClick={handleSaveAndNext}
                  disabled={isSaving}
                  className={`text-white text-sm font-medium px-4 h-8 rounded flex items-center gap-1.5 disabled:opacity-50 transition-colors ${isLastIssue ? "bg-green-600 hover:bg-green-700" : "bg-[#0052cc] hover:bg-[#0047b3]"}`}
                >
                  {isSaving ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : isLastIssue ? "Save & Finish" : "Save & Next →"}
                </button>
              )}

              <div className="flex items-center gap-1 border-l border-gray-300 dark:border-[#2c333a] pl-2 ml-1">
                {isHost && (
                  <button
                    onClick={resetVotes}
                    className="p-1.5 text-gray-600 dark:text-[#9fadbc] hover:bg-gray-200 dark:hover:bg-[#2c333a] rounded transition-colors"
                    title="Reset round — clears all votes for everyone"
                  >
                    <RotateCcw size={15} />
                  </button>
                )}
                {isHost && (
                  <button
                    onClick={revealVotes}
                    disabled={!canReveal}
                    title={
                      !canReveal
                        ? timerRunning
                          ? "Waiting for timer to expire"
                          : `Waiting for all ${totalParticipants} participants to vote (${votedCount}/${totalParticipants})`
                        : "Reveal all votes"
                    }
                    className="flex items-center gap-1.5 px-2.5 h-8 text-sm font-medium rounded transition-all disabled:opacity-40 disabled:cursor-not-allowed text-white bg-[#6554c0] hover:bg-[#5243aa] disabled:bg-gray-400 dark:disabled:bg-[#2c333a]"
                  >
                    <Eye size={14} /> Reveal
                  </button>
                )}
              </div>

              {/* No-timer hint for participants */}
              {!isHost && !timerRunning && !revealed && (
                <span className="text-xs text-gray-400 dark:text-[#8c9bab] ml-2">
                  {allVoted ? "All voted — waiting for host to reveal" : `${votedCount}/${totalParticipants} voted`}
                </span>
              )}

              {/* Reveal gate indicator */}
              {isHost && !revealed && (
                <div className="ml-auto flex items-center gap-2">
                  {!canReveal && (
                    <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-[#8c9bab] bg-white dark:bg-[#1d2125] border border-gray-200 dark:border-[#2c333a] px-2.5 py-1 rounded">
                      {timerRunning
                        ? <><Timer size={12} /> Timer running</>
                        : <><AlertTriangle size={12} className="text-orange-400" /> {votedCount}/{totalParticipants} voted</>
                      }
                    </span>
                  )}
                  {allVoted && !timerRunning && (
                    <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-[#57d9a3] bg-green-50 dark:bg-[#006644]/20 border border-green-200 dark:border-[#57d9a3]/30 px-2.5 py-1 rounded font-medium">
                      <Check size={12} /> Everyone voted!
                    </span>
                  )}
                </div>
              )}

              {/* Already revealed badge */}
              {!isHost && (
                <div className="ml-auto">
                  <span className={`text-xs font-bold px-3 py-1 rounded-sm uppercase tracking-wide border ${
                    revealed
                      ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700"
                      : "bg-[#e3fcef] dark:bg-[#006644]/20 text-[#006644] dark:text-[#57d9a3] border-[#006644]/20 dark:border-[#57d9a3]/20"
                  }`}>
                    {revealed ? <><EyeOff size={11} className="inline mr-1" />Revealed</> : `${votedCount}/${totalParticipants} Voted`}
                  </span>
                </div>
              )}
            </div>

            {/* Vote cards / results */}
            <div className="min-h-48 flex items-center justify-center">
              {revealed ? (
                <div className="flex flex-wrap items-end justify-center gap-5 w-full py-4">
                  {/* Stats banner: Avg / Min / Max */}
                  {currentAverage && (
                    <div className="w-full flex items-center justify-center gap-3 mb-3 flex-wrap animate-fade-in-up">
                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#172b4d] dark:text-[#dfe1e6] bg-[#e9f2ff] dark:bg-[#0052cc]/10 border border-[#cce0ff] dark:border-[#0052cc]/20 px-4 py-1.5 rounded-full">
                        Average: <span className="text-xl font-bold text-[#0052cc] dark:text-[#4c9aff]">{currentAverage}</span>
                      </span>
                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#172b4d] dark:text-[#dfe1e6] bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700/30 px-4 py-1.5 rounded-full">
                        Min: <span className="text-xl font-bold text-teal-600 dark:text-teal-400">{currentMin}</span>
                      </span>
                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#172b4d] dark:text-[#dfe1e6] bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 px-4 py-1.5 rounded-full">
                        Max: <span className="text-xl font-bold text-amber-600 dark:text-amber-400">{currentMax}</span>
                      </span>
                    </div>
                  )}
                  {Object.entries(groupedVotes)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([voteValue, players], idx) => (
                      <div key={voteValue} className="flex flex-col items-center animate-bounce-in" style={{ animationDelay: `${idx * 0.08}s` }}>
                        <span className="text-[10px] font-bold text-gray-500 dark:text-[#8c9bab] bg-gray-100 dark:bg-[#22272b] px-2 py-0.5 rounded-sm mb-2 uppercase border border-gray-200 dark:border-[#2c333a]">
                          {players.length}/{totalParticipants} → {voteValue}
                        </span>
                        <div className="w-[96px] h-[128px] bg-white dark:bg-[#1d2125] border-2 border-[#0052cc] dark:border-[#4c9aff] rounded-2xl shadow-lg shadow-[#0052cc]/10 flex flex-col items-center justify-between p-3">
                          <div className="flex justify-center -space-x-1.5 w-full">
                            {players.slice(0, 4).map((p, i) => (
                              <div key={i} className="ring-2 ring-white dark:ring-[#1d2125] rounded-full" title={p.name}>
                                {renderAvatar(p.name, "sm")}
                              </div>
                            ))}
                          </div>
                          <span className="text-4xl font-bold text-[#172b4d] dark:text-[#b6c2cf]">{voteValue}</span>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-3 justify-center w-full max-w-2xl py-4">
                  {cardValues.map(v => (
                    <button
                      key={v}
                      onClick={() => { setMyVote(v); castVote(participantName, v as number | null); }}
                      className={`w-[60px] h-[84px] rounded-xl font-bold text-xl flex items-center justify-center transition-all duration-200 select-none ${
                        myVote === v
                          ? "border-2 border-[#0052cc] dark:border-[#4c9aff] bg-gradient-to-b from-[#deebff] to-[#e9f2ff] dark:from-[#4c9aff]/20 dark:to-[#4c9aff]/10 text-[#0052cc] dark:text-[#4c9aff] -translate-y-3 shadow-lg shadow-[#0052cc]/20 scale-105"
                          : "border border-gray-200 dark:border-[#2c333a] bg-white dark:bg-[#1d2125] text-[#172b4d] dark:text-[#dfe1e6] hover:border-[#0052cc]/40 dark:hover:border-[#4c9aff]/40 hover:bg-[#f8faff] dark:hover:bg-[#0052cc]/5 hover:-translate-y-1.5 shadow-sm hover:shadow-md"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Backlog table */}
            <div className="border-t border-gray-100 dark:border-[#2c333a] pt-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-bold text-[#172b4d] dark:text-[#dfe1e6] uppercase tracking-wide">Backlog</h2>
                  <span className="bg-[#deebff] dark:bg-[#0052cc]/20 text-[#0052cc] dark:text-[#4c9aff] text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border border-[#cce0ff] dark:border-[#0052cc]/20">
                    {estimatedIssuesCount}/{issues.length} done
                  </span>
                  <span className="text-[#006644] dark:text-[#57d9a3] text-[10px] font-bold uppercase bg-[#e3fcef] dark:bg-[#006644]/20 px-2 py-0.5 rounded border border-[#006644]/20 dark:border-[#57d9a3]/20">
                    {totalStoryPoints} pts
                  </span>
                </div>
                {isHost && (
                  <button
                    onClick={handleQuickAddIssue}
                    className="flex items-center gap-1 text-gray-700 dark:text-[#b6c2cf] bg-white dark:bg-[#1d2125] border border-gray-300 dark:border-[#2c333a] px-3 py-1.5 rounded text-xs font-medium hover:bg-gray-50 dark:hover:bg-[#22272b] transition-colors shadow-sm"
                  >
                    <Plus size={13} /> Add Issue
                  </button>
                )}
              </div>

              <div className="border border-gray-200 dark:border-[#2c333a] rounded-xl bg-white dark:bg-[#1d2125] overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50/80 dark:bg-[#22272b]/50 border-b border-gray-100 dark:border-[#2c333a] text-gray-400 dark:text-[#626f86] text-[10px] uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold w-14">Est.</th>
                      <th className="px-3 py-2.5 font-semibold w-20">Key</th>
                      <th className="px-3 py-2.5 font-semibold">Summary</th>
                      <th className="px-3 py-2.5 font-semibold w-24">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issues.map((issue, idx) => {
                      const isActive = idx === currentIssueIndex;
                      const est = estimates[issue.id];
                      return (
                        <tr
                          key={issue.id}
                          onClick={() => isHost && jumpToIssue(idx)}
                          className={`border-b border-gray-100 dark:border-[#2c333a]/50 transition-colors ${
                            isActive
                              ? "bg-[#e9f2ff] dark:bg-[#0052cc]/10"
                              : isHost
                              ? "hover:bg-gray-50 dark:hover:bg-[#22272b] cursor-pointer"
                              : ""
                          }`}
                        >
                          <td className="px-4 py-2 relative">
                            <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${isActive ? "bg-[#0052cc]" : est ? "bg-[#36b37e]" : "bg-transparent"}`} />
                            {est ? (
                              <span className="bg-[#e3fcef] dark:bg-[#006644]/20 text-[#006644] dark:text-[#57d9a3] w-7 h-6 flex items-center justify-center font-bold text-xs rounded border border-[#006644]/20">
                                {est}
                              </span>
                            ) : (
                              <span className="bg-gray-100 dark:bg-[#22272b] text-gray-400 w-7 h-6 flex items-center justify-center text-xs rounded border border-gray-200 dark:border-[#2c333a]">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-[#0052cc] dark:text-[#4c9aff] font-semibold text-xs">{issue.key}</td>
                          <td className="px-3 py-2 text-[#172b4d] dark:text-[#b6c2cf] max-w-xs truncate">{issue.summary}</td>
                          <td className="px-3 py-2">
                            <span className="text-[10px] font-semibold text-gray-600 dark:text-[#b6c2cf] bg-[#dfe1e6] dark:bg-[#2c333a] px-1.5 py-0.5 rounded uppercase">
                              {issue.statusCategory || "OPEN"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {issues.length === 0 && (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-sm">No issues loaded.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR — participants */}
          <div className="w-16 border-l border-gray-100 dark:border-[#2c333a] bg-gray-50/50 dark:bg-[#111214]/50 flex flex-col items-center py-4 gap-2.5 shrink-0">
            <div className="flex items-center gap-1 text-gray-400 dark:text-[#626f86] mb-2" title="Participants">
              <Users size={14} />
              <span className="text-xs font-bold">{participants.length}</span>
            </div>
            {participants.map((player, i) => {
              const hasVoted = votes[player.name] !== undefined && votes[player.name] !== null;
              return (
                <div key={i} className="relative group" title={`${player.name}${player.isHost ? " (Host)" : ""}${hasVoted ? " — voted" : " — waiting"}`}>
                  {renderAvatar(player.name, "md")}
                  {/* Vote status indicator */}
                  <div className={`absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#111214] flex items-center justify-center ${hasVoted ? "bg-[#36b37e] dark:bg-[#57d9a3]" : "bg-gray-300 dark:bg-[#8c9bab]"}`}>
                    {hasVoted
                      ? <Check size={7} className="text-white dark:text-[#111214]" />
                      : <span className="block w-1 h-1 bg-white dark:bg-[#111214] rounded-full" />
                    }
                  </div>
                  {/* Host crown badge */}
                  {player.isHost && (
                    <div className="absolute -bottom-0.5 -left-0.5 w-3.5 h-3.5 rounded-full bg-amber-400 dark:bg-amber-500 border-2 border-white dark:border-[#111214] flex items-center justify-center">
                      <Crown size={7} className="text-white" />
                    </div>
                  )}
                  {/* Name tooltip on hover */}
                  <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-[#172b4d] dark:bg-[#b6c2cf] text-white dark:text-[#172b4d] text-xs font-medium px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {player.name}{player.isHost ? " ★" : ""}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PokerSession() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f4f5f7] dark:bg-[#111214] flex items-center justify-center text-gray-500">
        <Loader2 size={20} className="animate-spin mr-2" /> Loading session…
      </div>
    }>
      <PokerSessionContent />
    </Suspense>
  );
}