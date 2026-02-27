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
        ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50"
        : urgent
        ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50"
        : "bg-white dark:bg-[#0a0a0a] border-gray-200 dark:border-[#333]"
    }`}>
      <Timer size={15} className={urgent ? "text-amber-500" : "text-[#888] dark:text-[#666]"} />

      {/* Duration editor (host only, when not running) */}
      {isHost && !timerRunning && editing ? (
        <div className="flex items-center gap-1">
          <input
            type="number" min={0} max={59}
            value={draftMins}
            onChange={e => setDraftMins(e.target.value)}
            className="w-10 text-center text-sm font-mono bg-white dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded px-1 py-0.5 focus:outline-none focus:border-[#111] dark:focus:border-white transition-colors"
          />
          <span className="text-[#888] font-mono">:</span>
          <input
            type="number" min={0} max={59}
            value={draftSecs}
            onChange={e => setDraftSecs(e.target.value)}
            className="w-10 text-center text-sm font-mono bg-white dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded px-1 py-0.5 focus:outline-none focus:border-[#111] dark:focus:border-white transition-colors"
          />
          <button
            onClick={() => {
              const d = (parseInt(draftMins) || 0) * 60 + (parseInt(draftSecs) || 0);
              onSetDuration(d);
              setEditing(false);
            }}
            className="text-xs bg-[#111] dark:bg-white text-white dark:text-[#111] px-2 py-0.5 rounded hover:bg-[#333] dark:hover:bg-[#e5e5e5] transition-colors ml-1 font-medium"
          >Set</button>
          <button onClick={() => setEditing(false)} className="text-xs text-[#888] hover:text-[#111] dark:hover:text-[#ededed] px-1 transition-colors">✕</button>
        </div>
      ) : (
        <button
          onClick={() => isHost && !timerRunning && setEditing(true)}
          className={`font-mono text-sm font-semibold tabular-nums min-w-[3rem] ${
            urgent ? "text-amber-600 dark:text-amber-500" :
            expired ? "text-red-600 dark:text-red-500" :
            "text-[#111] dark:text-[#ededed]"
          } ${isHost && !timerRunning ? "cursor-pointer hover:opacity-75" : "cursor-default"}`}
          title={isHost && !timerRunning ? "Click to edit timer" : undefined}
        >
          {timerRunning || (!timerRunning && duration > 0 && remaining < duration)
            ? fmtTime(remaining)
            : fmtTime(duration)}
        </button>
      )}

      {/* Progress bar */}
      {duration > 0 && (
        <div className="flex-1 h-1.5 bg-gray-100 dark:bg-[#222] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              urgent ? "bg-amber-500" : expired ? "bg-red-500" : "bg-[#111] dark:bg-white"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {expired && (
        <span className="text-xs font-semibold text-red-600 dark:text-red-500 tracking-wide animate-pulse">
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
              className="flex items-center gap-1 text-xs text-white dark:text-[#111] bg-[#111] dark:bg-white hover:bg-[#333] dark:hover:bg-[#e5e5e5] disabled:opacity-40 px-3 py-1.5 rounded-lg transition-colors font-medium"
            >
              <Play size={11} className="fill-current" /> Start
            </button>
          ) : (
            <button
              onClick={onStop}
              className="flex items-center gap-1 text-xs bg-white dark:bg-[#111] text-[#111] dark:text-[#ededed] border border-gray-200 dark:border-[#333] hover:bg-gray-50 dark:hover:bg-[#222] px-3 py-1.5 rounded-lg transition-colors font-medium"
            >
              <Square size={11} className="fill-current" /> Stop
            </button>
          )}
          <button
            onClick={onReset}
            className="p-1.5 text-[#888] hover:text-[#111] dark:hover:text-[#ededed] hover:bg-gray-100 dark:hover:bg-[#222] rounded-lg transition-all"
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
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 bg-[#111] dark:bg-white text-white dark:text-[#111] px-5 py-3 rounded-full shadow-lg border border-[#333] dark:border-gray-200 text-sm font-medium transition-all duration-300 ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"}`}>
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
  }, [activeIssue]);

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
      <div className={`${sz} rounded-full bg-gray-100 dark:bg-[#222] text-[#111] dark:text-[#ededed] flex items-center justify-center font-semibold shadow-sm border border-gray-200 dark:border-[#333] shrink-0 uppercase`}>
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
          <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-xl w-full max-w-4xl border border-gray-200 dark:border-[#333] overflow-hidden flex flex-col max-h-[90vh]">
            {modalMode === "menu" ? (
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-[#111] dark:text-[#ededed]">Backlog Completed! 🎉</h2>
                    <p className="text-[#666] dark:text-[#a1a1aa] mt-1 text-sm">All issues in this backlog have been estimated.</p>
                  </div>
                  <button onClick={() => setShowCompletionModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-[#222] rounded-md transition-colors text-[#888] hover:text-[#111] dark:hover:text-[#ededed]">
                    <X size={20} />
                  </button>
                </div>

                {/* Summary */}
                <div className="flex gap-4 mb-6 p-4 bg-gray-50 dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#333]">
                  <div className="text-center px-4 border-r border-gray-200 dark:border-[#333]">
                    <div className="text-2xl font-semibold text-[#111] dark:text-[#ededed]">{estimatedIssuesCount}</div>
                    <div className="text-xs text-[#666] dark:text-[#a1a1aa] mt-0.5">Issues Estimated</div>
                  </div>
                  <div className="text-center px-4">
                    <div className="text-2xl font-semibold text-[#111] dark:text-[#ededed]">{totalStoryPoints}</div>
                    <div className="text-xs text-[#666] dark:text-[#a1a1aa] mt-0.5">Total Story Points</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="border border-gray-200 dark:border-[#333] rounded-xl p-5 flex flex-col bg-white dark:bg-[#0a0a0a]">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#222] text-[#111] dark:text-[#ededed] flex items-center justify-center mb-3 border border-gray-200 dark:border-[#333]"><Share2 size={20} /></div>
                    <h3 className="font-semibold text-lg mb-1 text-[#111] dark:text-[#ededed]">Import from Jira</h3>
                    <p className="text-sm text-[#666] dark:text-[#a1a1aa] mb-4 flex-1">Pull in more active sprints or backlog items.</p>
                    <button onClick={() => setModalMode("jira")} className="w-full bg-white dark:bg-[#111] border border-gray-200 dark:border-[#333] hover:bg-gray-50 dark:hover:bg-[#222] font-medium py-2 rounded-lg transition-colors text-sm text-[#111] dark:text-[#ededed]">
                      Open Selector
                    </button>
                  </div>
                  <div className="border border-gray-200 dark:border-[#333] rounded-xl p-5 flex flex-col bg-white dark:bg-[#0a0a0a]">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#222] text-[#111] dark:text-[#ededed] flex items-center justify-center mb-3 border border-gray-200 dark:border-[#333]"><FileEdit size={20} /></div>
                    <h3 className="font-semibold text-lg mb-1 text-[#111] dark:text-[#ededed]">Add Custom Story</h3>
                    <p className="text-sm text-[#666] dark:text-[#a1a1aa] mb-4 flex-1">Write a new task or discussion item.</p>
                    <div className="flex gap-2">
                      <input
                        type="text" value={customStorySummary}
                        onChange={e => setCustomStoryName(e.target.value)}
                        placeholder="What needs to be done?"
                        onKeyDown={e => e.key === "Enter" && handleAppendCustomIssue()}
                        className="flex-1 h-9 px-3 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#111] dark:focus:ring-white transition-colors text-[#111] dark:text-[#ededed] placeholder:text-gray-400 dark:placeholder:text-[#666]"
                      />
                      <button onClick={handleAppendCustomIssue} disabled={!customStorySummary.trim()} className="bg-[#111] dark:bg-white text-white dark:text-[#111] hover:bg-[#333] dark:hover:bg-[#e5e5e5] px-4 h-9 rounded-lg text-sm font-medium disabled:opacity-40 transition-colors active:scale-[0.98]">Add</button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end border-t border-gray-100 dark:border-[#333] pt-5">
                  <button onClick={handleEndOrLeave} className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-500 border border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/50 px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors text-sm">
                    <LogOut size={16} /> End Session For All
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full bg-gray-50 dark:bg-[#0a0a0a]">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#333] bg-white dark:bg-[#0a0a0a]">
                  <h2 className="font-semibold text-lg text-[#111] dark:text-[#ededed]">Select Issues to Append</h2>
                  <button onClick={() => setModalMode("menu")} className="text-[#888] hover:text-[#111] dark:hover:text-[#ededed] text-sm font-medium transition-colors">Cancel</button>
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
      <div className="relative bg-white dark:bg-[#0a0a0a] w-full max-w-[1400px] rounded-2xl shadow-sm border border-gray-200 dark:border-[#333] flex flex-col min-h-[90vh] overflow-hidden">

        {/* TOP HEADER */}
        <header className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-[#333] gap-3 flex-wrap bg-white dark:bg-[#0a0a0a] z-10 sticky top-0">
          <div className="flex items-center gap-2 text-sm min-w-0">
            <div className="w-7 h-7 bg-[#111] dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-[#111] shrink-0">
              <FileText size={13} />
            </div>
            <span className="text-[#888] dark:text-[#666] hidden sm:inline text-xs font-medium">Poker /</span>
            {sessionDisplayName && (
              <span className="text-xs font-semibold text-[#111] dark:text-[#ededed] hidden sm:inline">{sessionDisplayName} /</span>
            )}
            {/* Tap session ID to copy */}
            <button
              onClick={handleCopySessionId}
              title="Click to copy session ID"
              className="flex items-center gap-1.5 font-mono font-semibold text-sm text-[#111] dark:text-[#ededed] hover:text-[#111] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#222] px-2.5 py-1 rounded-lg transition-all group tracking-wide"
            >
              {sessionId}
              {copiedSessionId
                ? <Check size={13} className="text-[#111] dark:text-white" />
                : <Copy size={13} className="opacity-40 group-hover:opacity-100 transition-opacity" />
              }
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Copy invite link */}
            <button
              onClick={handleCopyInviteLink}
              className="flex items-center gap-1.5 text-sm text-[#666] dark:text-[#a1a1aa] hover:text-[#111] dark:hover:text-white bg-white dark:bg-[#111] hover:bg-gray-50 dark:hover:bg-[#222] border border-gray-200 dark:border-[#333] px-3.5 py-1.5 rounded-lg transition-all font-medium text-xs"
            >
              <Link2 size={14} /> <span className="hidden sm:inline">Copy Invite Link</span>
            </button>

            {/* Timer toggle (host only) */}
            {isHost && (
              <button
                onClick={() => setShowTimerPanel(v => !v)}
                className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-all font-medium text-xs ${
                  showTimerPanel
                    ? "bg-[#111] dark:bg-white text-white dark:text-[#111] border-[#111] dark:border-white"
                    : "text-[#666] dark:text-[#a1a1aa] bg-white dark:bg-[#111] border-gray-200 dark:border-[#333] hover:text-[#111] dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#222]"
                }`}
              >
                <Timer size={14} /> <span className="hidden sm:inline">Timer</span>
              </button>
            )}

            <button
              onClick={handleEndOrLeave}
              className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-500 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-900/50 px-3.5 py-1.5 rounded-lg transition-colors font-medium"
            >
              <LogOut size={14} /> <span className="hidden sm:inline">{isHost ? "End" : "Leave"}</span>
            </button>
            {seriesLabel && (
              <span className="text-[10px] font-semibold px-2 py-1 rounded-md bg-gray-100 dark:bg-[#222] border border-gray-200 dark:border-[#333] text-[#888] dark:text-[#666] uppercase tracking-wider hidden sm:inline-flex">
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
              <div className="bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-xl px-5 py-3.5 flex items-center justify-between gap-3 flex-wrap animate-fade-in-up">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="bg-[#111] dark:bg-white w-4 h-4 rounded-[4px] flex items-center justify-center shrink-0">
                    <Check size={10} className="text-white dark:text-[#111]" />
                  </div>
                  <button
                    onClick={openJiraIssue}
                    className={`text-[#111] dark:text-[#ededed] font-semibold shrink-0 ${!activeIssue.id.startsWith("custom-") ? "hover:underline cursor-pointer" : "cursor-default"}`}
                  >
                    {activeIssue.key}
                  </button>
                  <span className="font-medium text-[#666] dark:text-[#a1a1aa] truncate">
                    {activeIssue.summary}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 text-sm">
                  <span className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-[#888] dark:text-[#666] text-[10px] font-semibold px-2 py-1 rounded-md uppercase tracking-wider">
                    {activeIssue.statusCategory || "OPEN"}
                  </span>
                  {!activeIssue.id.startsWith("custom-") && (
                    <button
                      onClick={openJiraIssue}
                      className="flex items-center gap-1.5 text-[#666] dark:text-[#a1a1aa] bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] px-2.5 py-1 rounded-lg hover:bg-gray-50 dark:hover:bg-[#222] font-medium transition-colors text-xs"
                    >
                      <ExternalLink size={12} /> Open in Jira
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-xl px-4 py-6 text-center text-[#888] dark:text-[#666] text-sm font-medium">
                {issues.length === 0 ? "No issues loaded for this session." : "Waiting for host to select an issue…"}
              </div>
            )}

            {/* Issue details grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Description */}
              <div className="lg:col-span-2 border border-gray-200 dark:border-[#333] rounded-xl overflow-hidden bg-white dark:bg-[#0a0a0a]">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-[#333] bg-gray-50/50 dark:bg-[#111]">
                  <h3 className="font-semibold text-xs text-[#888] dark:text-[#666] uppercase tracking-wider">Description</h3>
                  <ChevronDown size={15} className="text-gray-400 dark:text-[#666]" />
                </div>
                <div className="p-4 text-sm text-[#666] dark:text-[#a1a1aa] min-h-24">
                  {isLoadingDetails ? (
                    <div className="flex items-center gap-2 text-[#888]">
                      <Loader2 size={14} className="animate-spin" /> Fetching from Jira…
                    </div>
                  ) : activeIssue?.id.startsWith("custom-") ? (
                    <div className="space-y-2">
                      <p className="font-medium text-[#111] dark:text-[#ededed]">{activeIssue.summary}</p>
                      <p className="text-[#888] dark:text-[#666] italic text-xs">Custom story — no Jira description available.</p>
                    </div>
                  ) : activeIssueDetails?.description ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{activeIssueDetails.description}</p>
                  ) : (
                    <p className="text-[#888] dark:text-[#666] italic">No description provided for this issue.</p>
                  )}
                </div>
              </div>

              {/* Details sidebar */}
              <div className="border border-gray-200 dark:border-[#333] rounded-xl overflow-hidden bg-white dark:bg-[#0a0a0a]">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-[#333] bg-gray-50/50 dark:bg-[#111]">
                  <h3 className="font-semibold text-xs text-[#888] dark:text-[#666] uppercase tracking-wider">Details</h3>
                  <ChevronDown size={15} className="text-gray-400 dark:text-[#666]" />
                </div>
                <div className="p-4 text-sm space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-[#888] dark:text-[#666] w-16 shrink-0 text-xs pt-0.5">Reporter</span>
                    <div className="flex items-center gap-2 min-w-0">
                      {isLoadingDetails ? (
                        <span className="text-gray-400 dark:text-[#666] text-xs">Loading…</span>
                      ) : activeIssueDetails?.reporter ? (
                        <>
                          {renderAvatar(activeIssueDetails.reporter, "sm")}
                          <span className="font-medium text-[#111] dark:text-[#ededed] text-xs truncate">{activeIssueDetails.reporter}</span>
                        </>
                      ) : activeIssue?.id.startsWith("custom-") ? (
                        <span className="text-[#888] dark:text-[#666] italic text-xs">Custom issue</span>
                      ) : (
                        <span className="text-[#888] dark:text-[#666] italic text-xs">Unassigned</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-[#888] dark:text-[#666] w-16 shrink-0 text-xs pt-0.5">Status</span>
                    <span className="text-[10px] font-semibold bg-gray-100 dark:bg-[#222] text-[#888] dark:text-[#666] px-2 py-0.5 rounded uppercase tracking-wider">
                      {activeIssue?.status || "—"}
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-[#888] dark:text-[#666] w-16 shrink-0 text-xs pt-0.5">Source</span>
                    <span className="text-xs text-[#111] dark:text-[#ededed] font-medium">
                      {activeIssue?.id.startsWith("custom-") ? "Custom" : "Jira"}
                    </span>
                  </div>
                  {estimates[activeIssue?.id ?? ""] && (
                    <div className="flex items-start gap-3">
                      <span className="text-[#888] dark:text-[#666] w-16 shrink-0 text-xs pt-0.5">Estimate</span>
                      <span className="text-xs font-bold text-[#111] dark:text-white bg-gray-100 dark:bg-[#222] border border-gray-200 dark:border-[#333] px-2 py-0.5 rounded-md">
                        {activeIssue ? estimates[activeIssue.id] : ""} pts
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Voting controls bar */}
            <div className="flex items-center gap-2 bg-white dark:bg-[#0a0a0a] p-3.5 rounded-xl border border-gray-200 dark:border-[#333] shadow-sm flex-wrap">
              {/* Final estimate input (host) */}
              {isHost && (
                <input
                  type="text"
                  value={finalEstimate}
                  onChange={e => setFinalEstimate(e.target.value)}
                  disabled={isSaving}
                  placeholder={revealed && currentAverage ? currentAverage : "pts"}
                  title={revealed && currentAverage ? `Average: ${currentAverage}` : "Override estimate"}
                  className="w-16 h-8 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-lg px-2 text-center text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-[#111] dark:focus:ring-white disabled:opacity-50 text-[#111] dark:text-[#ededed] placeholder:font-normal placeholder:text-gray-400 transition-all"
                />
              )}

              {isHost && (
                <button
                  onClick={handleSaveAndNext}
                  disabled={isSaving}
                  className={`text-sm font-medium px-4 h-8 rounded-lg flex items-center gap-1.5 disabled:opacity-50 transition-colors active:scale-[0.98] ${isLastIssue ? "bg-white dark:bg-[#111] border border-gray-200 dark:border-[#333] text-[#111] dark:text-[#ededed] hover:bg-gray-50 dark:hover:bg-[#222]" : "bg-[#111] dark:bg-white text-white dark:text-[#111] hover:bg-[#333] dark:hover:bg-[#e5e5e5]"}`}
                >
                  {isSaving ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : isLastIssue ? "Save & Finish" : "Save & Next →"}
                </button>
              )}

              <div className="flex items-center gap-1 border-l border-gray-200 dark:border-[#333] pl-2 ml-1">
                {isHost && (
                  <button
                    onClick={resetVotes}
                    className="p-1.5 text-[#888] hover:text-[#111] dark:hover:text-[#ededed] hover:bg-gray-100 dark:hover:bg-[#222] rounded-lg transition-colors"
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
                    className="flex items-center gap-1.5 px-2.5 h-8 text-sm font-medium rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed text-[#111] dark:text-[#ededed] bg-gray-100 dark:bg-[#222] hover:bg-gray-200 dark:hover:bg-[#333] border border-gray-200 dark:border-[#333] active:scale-[0.98]"
                  >
                    <Eye size={14} /> Reveal
                  </button>
                )}
              </div>

              {/* No-timer hint for participants */}
              {!isHost && !timerRunning && !revealed && (
                <span className="text-xs text-[#888] dark:text-[#666] ml-2 font-medium">
                  {allVoted ? "All voted — waiting for host to reveal" : `${votedCount}/${totalParticipants} voted`}
                </span>
              )}

              {/* Reveal gate indicator */}
              {isHost && !revealed && (
                <div className="ml-auto flex items-center gap-2">
                  {!canReveal && (
                    <span className="flex items-center gap-1.5 text-xs text-[#888] dark:text-[#666] bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] px-2.5 py-1 rounded-md font-medium">
                      {timerRunning
                        ? <><Timer size={12} /> Timer running</>
                        : <><AlertTriangle size={12} className="text-amber-500" /> {votedCount}/{totalParticipants} voted</>
                      }
                    </span>
                  )}
                  {allVoted && !timerRunning && (
                    <span className="flex items-center gap-1.5 text-xs text-[#111] dark:text-white bg-gray-100 dark:bg-[#222] border border-gray-200 dark:border-[#333] px-2.5 py-1 rounded-md font-medium">
                      <Check size={12} /> Everyone voted!
                    </span>
                  )}
                </div>
              )}

              {/* Already revealed badge */}
              {!isHost && (
                <div className="ml-auto">
                  <span className={`text-[10px] font-semibold px-2 py-1.5 rounded-md uppercase tracking-wide border ${
                    revealed
                      ? "bg-gray-100 dark:bg-[#222] text-[#111] dark:text-[#ededed] border-gray-200 dark:border-[#333]"
                      : "bg-gray-50 dark:bg-[#111] text-[#888] dark:text-[#666] border-gray-200 dark:border-[#333]"
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
                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#111] dark:text-[#ededed] bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] px-4 py-1.5 rounded-full">
                        Average: <span className="text-xl font-bold">{currentAverage}</span>
                      </span>
                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#111] dark:text-[#ededed] bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] px-4 py-1.5 rounded-full">
                        Min: <span className="text-xl font-bold">{currentMin}</span>
                      </span>
                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#111] dark:text-[#ededed] bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] px-4 py-1.5 rounded-full">
                        Max: <span className="text-xl font-bold">{currentMax}</span>
                      </span>
                    </div>
                  )}
                  {Object.entries(groupedVotes)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([voteValue, players], idx) => (
                      <div key={voteValue} className="flex flex-col items-center animate-bounce-in" style={{ animationDelay: `${idx * 0.08}s` }}>
                        <span className="text-[10px] font-semibold text-[#888] dark:text-[#666] bg-gray-50 dark:bg-[#111] px-2 py-0.5 rounded-md mb-2 uppercase border border-gray-200 dark:border-[#333] tracking-wider">
                          {players.length}/{totalParticipants} → {voteValue}
                        </span>
                        <div className="w-[96px] h-[128px] bg-white dark:bg-[#0a0a0a] border-2 border-[#111] dark:border-white rounded-xl shadow-sm flex flex-col items-center justify-between p-3">
                          <div className="flex justify-center -space-x-1.5 w-full">
                            {players.slice(0, 4).map((p, i) => (
                              <div key={i} className="ring-2 ring-white dark:ring-[#0a0a0a] rounded-full" title={p.name}>
                                {renderAvatar(p.name, "sm")}
                              </div>
                            ))}
                          </div>
                          <span className="text-4xl font-bold text-[#111] dark:text-[#ededed]">{voteValue}</span>
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
                          ? "border-2 border-[#111] dark:border-white bg-gray-50 dark:bg-[#111] text-[#111] dark:text-[#ededed] -translate-y-2 shadow-sm scale-110"
                          : "border border-gray-200 dark:border-[#333] bg-white dark:bg-[#0a0a0a] text-[#888] dark:text-[#666] hover:border-[#111] dark:hover:border-white hover:text-[#111] dark:hover:text-[#ededed] hover:-translate-y-1 shadow-sm"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Backlog table */}
            <div className="border-t border-gray-100 dark:border-[#333] pt-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-semibold text-[#111] dark:text-[#ededed] uppercase tracking-wider">Backlog</h2>
                  <span className="bg-gray-100 dark:bg-[#222] text-[#111] dark:text-[#ededed] text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase border border-gray-200 dark:border-[#333]">
                    {estimatedIssuesCount}/{issues.length} done
                  </span>
                  <span className="text-[#111] dark:text-[#ededed] text-[10px] font-semibold uppercase bg-gray-100 dark:bg-[#222] px-2 py-0.5 rounded-md border border-gray-200 dark:border-[#333]">
                    {totalStoryPoints} pts
                  </span>
                </div>
                {isHost && (
                  <button
                    onClick={handleQuickAddIssue}
                    className="flex items-center gap-1 text-[#666] dark:text-[#a1a1aa] bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50 dark:hover:bg-[#111] hover:text-[#111] dark:hover:text-white transition-colors"
                  >
                    <Plus size={13} /> Add Issue
                  </button>
                )}
              </div>

              <div className="border border-gray-200 dark:border-[#333] rounded-xl bg-white dark:bg-[#0a0a0a] overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-[#111] border-b border-gray-100 dark:border-[#333] text-[#888] dark:text-[#666] text-[10px] uppercase tracking-wider">
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
                          className={`border-b border-gray-100 dark:border-[#333]/50 transition-colors ${
                            isActive
                              ? "bg-gray-50 dark:bg-[#222]"
                              : isHost
                              ? "hover:bg-gray-50/50 dark:hover:bg-[#111] cursor-pointer"
                              : ""
                          }`}
                        >
                          <td className="px-4 py-2 relative">
                            <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${isActive ? "bg-[#111] dark:bg-white" : "bg-transparent"}`} />
                            {est ? (
                              <span className="bg-gray-100 dark:bg-[#222] text-[#111] dark:text-[#ededed] w-7 h-6 flex items-center justify-center font-semibold text-xs rounded-md border border-gray-200 dark:border-[#333]">
                                {est}
                              </span>
                            ) : (
                              <span className="bg-white dark:bg-[#0a0a0a] text-gray-400 dark:text-[#666] w-7 h-6 flex items-center justify-center text-xs rounded-md border border-gray-200 dark:border-[#333]">—</span>
                            )}
                          </td>
                          <td className={`px-3 py-2 font-medium text-xs ${isActive ? "text-[#111] dark:text-[#ededed]" : "text-[#666] dark:text-[#a1a1aa]"}`}>{issue.key}</td>
                          <td className={`px-3 py-2 max-w-xs truncate ${isActive ? "text-[#111] dark:text-[#ededed]" : "text-[#666] dark:text-[#a1a1aa]"}`}>{issue.summary}</td>
                          <td className="px-3 py-2">
                            <span className="text-[10px] font-semibold text-[#888] dark:text-[#666] bg-gray-100 dark:bg-[#222] border border-gray-200 dark:border-[#333] px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                              {issue.statusCategory || "OPEN"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {issues.length === 0 && (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-[#888] dark:text-[#666] text-sm">No issues loaded.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR — participants */}
          <div className="w-16 border-l border-gray-100 dark:border-[#333] bg-gray-50/50 dark:bg-[#111] flex flex-col items-center py-4 gap-2.5 shrink-0 z-10 sticky top-0 h-full">
            <div className="flex items-center gap-1 text-[#888] dark:text-[#666] mb-2" title="Participants">
              <Users size={14} />
              <span className="text-xs font-semibold">{participants.length}</span>
            </div>
            {participants.map((player, i) => {
              const hasVoted = votes[player.name] !== undefined && votes[player.name] !== null;
              return (
                <div key={i} className="relative group" title={`${player.name}${player.isHost ? " (Host)" : ""}${hasVoted ? " — voted" : " — waiting"}`}>
                  {renderAvatar(player.name, "md")}
                  {/* Vote status indicator */}
                  <div className={`absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-gray-50 dark:border-[#111] flex items-center justify-center ${hasVoted ? "bg-[#111] dark:bg-white" : "bg-gray-300 dark:bg-[#333]"}`}>
                    {hasVoted
                      ? <Check size={7} className="text-white dark:text-[#111]" />
                      : <span className="block w-1.5 h-1.5 bg-white dark:bg-[#111] rounded-full" />
                    }
                  </div>
                  {/* Host crown badge */}
                  {player.isHost && (
                    <div className="absolute -bottom-0.5 -left-0.5 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-gray-50 dark:border-[#111] flex items-center justify-center">
                      <Crown size={7} className="text-white" />
                    </div>
                  )}
                  {/* Name tooltip on hover */}
                  <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-[#111] dark:bg-white text-white dark:text-[#111] text-xs font-medium px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-[#333] dark:border-gray-200">
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
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex items-center justify-center text-[#888] dark:text-[#666]">
        <Loader2 size={20} className="animate-spin mr-2" /> Loading session…
      </div>
    }>
      <PokerSessionContent />
    </Suspense>
  );
}