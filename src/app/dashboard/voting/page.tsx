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
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(console.error);
  }
}

const isJiraIssue = (key?: string) => !!key && /^[A-Z][A-Z0-9_]*-[0-9]+$/i.test(key);

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
    <>
      {/* Timer bar */}
      <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all ${
        expired
          ? "bg-destructive/10 border-destructive/50"
          : urgent
          ? "bg-warning/20 border-warning/50"
          : "bg-card border-border"
      }`}>
        <Timer size={15} className={urgent ? "text-warning" : "text-muted-foreground"} />
      </div>

      {/* Duration editor (host only, when not running) */}
      {isHost && !timerRunning && editing ? (
        <div className="flex items-center gap-1">
          <input
            type="number" min={0} max={59}
            value={draftMins}
            onChange={e => setDraftMins(e.target.value)}
            className="w-10 text-center text-sm font-mono bg-card border border-border rounded px-1 py-0.5 focus:outline-none focus:border-primary transition-colors"
          />
          <span className="text-muted-foreground font-mono">:</span>
          <input
            type="number" min={0} max={59}
            value={draftSecs}
            onChange={e => setDraftSecs(e.target.value)}
            className="w-10 text-center text-sm font-mono bg-card border border-border rounded px-1 py-0.5 focus:outline-none focus:border-primary transition-colors"
          />
          <button
            onClick={() => {
              const d = (parseInt(draftMins) || 0) * 60 + (parseInt(draftSecs) || 0);
              onSetDuration(d);
              setEditing(false);
            }}
            className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded hover:bg-primary/90 transition-colors ml-1 font-medium"
          >Set</button>
          <button onClick={() => setEditing(false)} className="text-xs text-muted-foreground hover:text-foreground px-1 transition-colors">✕</button>
        </div>
      ) : (
        <button
          onClick={() => isHost && !timerRunning && setEditing(true)}
          className={`font-mono text-sm font-semibold tabular-nums min-w-[3rem] ${
            urgent ? "text-warning" :
            expired ? "text-destructive" :
            "text-foreground"
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
        <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              urgent ? "bg-warning" : expired ? "bg-destructive" : "bg-primary"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {expired && (
        <span className="text-xs font-semibold text-destructive tracking-wide animate-pulse">
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
              className="flex items-center gap-1 text-xs text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-40 px-3 py-1.5 rounded-lg transition-colors font-medium"
            >
              <Play size={11} className="fill-current" /> Start
            </button>
          ) : (
            <button
              onClick={onStop}
              className="flex items-center gap-1 text-xs bg-card text-foreground border border-border hover:bg-secondary px-3 py-1.5 rounded-lg transition-colors font-medium"
            >
              <Square size={11} className="fill-current" /> Stop
            </button>
          )}
          <button
            onClick={onReset}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-all"
            title="Reset timer"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      )}
    </>
  );
}

// ─── Copy toast ──────────────────────────────────────────────────────────────

function CopyToast({ show }: { show: boolean }) {
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-full shadow-lg border border-border text-sm font-medium transition-all duration-300 ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"}`}>
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
    currentIssueIndex, activeIssue, issuesList,
    timer, timerRemaining,
    joinRoom, castVote, revealVotes, resetVotes,
    endSession, leaveSession,
    broadcastActiveIssue, broadcastIssuesList,
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
  const [showAddIssueModal, setShowAddIssueModal] = useState(false);
  const [addIssueTab, setAddIssueTab] = useState<"custom" | "jira">("custom");
  const [addIssueCustomSummary, setAddIssueCustomSummary] = useState("");

  // Track if timer already auto-revealed (prevent double trigger)
  const autoRevealedRef = useRef(false);

  const participantName = searchParams.get("name")
    ? decodeURIComponent(searchParams.get("name") as string)
    : session?.user?.name || "Anonymous";

  const timerRunning = timer.startedAt !== null;
  const activeParticipants = participants.length > 0 ? participants : Object.keys(votes).map(name => ({ name, isHost: name === participantName ? isHost : false }));
  const allVoted = activeParticipants.length > 0 && activeParticipants.every(p => votes[p.name] !== undefined && votes[p.name] !== null);
  const canReveal = isHost && (timerRunning ? timerRemaining === 0 : allVoted);

  // ── Mount ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    setIsMounted(true);
    // Only the host needs to load issues from sessionStorage
    if (isHost && typeof window !== "undefined") {
      const saved = sessionStorage.getItem("pending_jira_issues");
      if (saved) {
        const parsed = JSON.parse(saved) as JiraIssue[];
        setIssues(parsed);
        // Broadcast the full list so participants can see the backlog
        broadcastIssuesList(parsed.map(i => ({
          id: i.id, key: i.key, summary: i.summary,
          status: i.status, statusCategory: i.statusCategory,
        })));
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isMounted) {
      if (!sessionId || !role) {
        router.push("/dashboard");
        return;
      }
      if (authStatus !== "loading") {
        joinRoom(sessionId, participantName, isHost);
      }
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
    if (!activeIssue) return;
    if (!isJiraIssue(activeIssue.key)) { setActiveIssueDetails(null); return; }

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
      const p = participants.find(part => part.name === name) || { name, isHost: false };
      groups[vote].push(p);
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

  const votedCount = Object.values(votes).filter(v => v !== null).length;
  const totalParticipants = Math.max(participants.length, votedCount) || 1;
  // For host, use local issues array; for participants, use the broadcast issuesList
  const displayIssues: JiraIssue[] = isHost
    ? issues
    : issuesList.map(i => ({ id: i.id, key: i.key, summary: i.summary, status: i.status, statusCategory: i.statusCategory }));
  // isLastIssue only meaningful for host (they own the issues array)
  const isLastIssue = isHost && displayIssues.length > 0 && currentIssueIndex === displayIssues.length - 1;
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
        if (isJiraIssue(activeIssue.key)) {
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
    broadcastIssuesList(updated.map(i => ({
      id: i.id, key: i.key, summary: i.summary,
      status: i.status, statusCategory: i.statusCategory,
    })));
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
    broadcastIssuesList(updated.map(i => ({
      id: i.id, key: i.key, summary: i.summary,
      status: i.status, statusCategory: i.statusCategory,
    })));
    setShowCompletionModal(false);
    const first = newIssues[0];
    await broadcastActiveIssue(issues.length, {
      id: first.id, key: first.key,
      summary: first.summary, status: first.status,
      statusCategory: first.statusCategory,
    });
  };

  const handleOpenAddIssueModal = () => {
    setAddIssueCustomSummary("");
    setAddIssueTab("custom");
    setShowAddIssueModal(true);
  };

  const handleAddCustomIssueFromModal = () => {
    if (!addIssueCustomSummary.trim()) return;
    const newIssue: JiraIssue = {
      id: `custom-${Date.now()}`,
      key: `C${String(issues.length + 1).padStart(3, "0")}`,
      summary: addIssueCustomSummary.trim(),
      status: "Custom Story",
      statusCategory: "To Do",
    };
    const updated = [...issues, newIssue];
    setIssues(updated);
    sessionStorage.setItem("pending_jira_issues", JSON.stringify(updated));
    broadcastIssuesList(updated.map(i => ({
      id: i.id, key: i.key, summary: i.summary,
      status: i.status, statusCategory: i.statusCategory,
    })));
    setAddIssueCustomSummary("");
    setShowAddIssueModal(false);
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
          source: isJiraIssue(issue.key) ? "jira" : "custom",
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
    if (!activeIssue || !isJiraIssue(activeIssue.key)) return;
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
    <div className="min-h-screen page-bg flex items-center justify-center text-muted-foreground">
      <Loader2 size={20} className="animate-spin mr-2" /> Loading session…
    </div>
  );

  return (
    <div className="min-h-screen page-bg font-sans text-foreground flex justify-center py-6 px-4 transition-colors">
      <CopyToast show={showCopyToast} />

      {/* ── COMPLETION MODAL ─────────────────────────────────────────────── */}
      {showCompletionModal && isHost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-4xl border border-border overflow-hidden flex flex-col max-h-[90vh]">
            {modalMode === "menu" ? (
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground">Backlog Completed! 🎉</h2>
                    <p className="text-muted-foreground mt-1 text-sm">All issues in this backlog have been estimated.</p>
                  </div>
                  <button onClick={() => setShowCompletionModal(false)} className="p-2 hover:bg-secondary rounded-md transition-colors text-muted-foreground hover:text-foreground">
                    <X size={20} />
                  </button>
                </div>

                {/* Summary */}
                <div className="flex gap-4 mb-6 p-4 bg-secondary rounded-xl border border-border">
                  <div className="text-center px-4 border-r border-border">
                    <div className="text-2xl font-semibold text-foreground">{estimatedIssuesCount}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Issues Estimated</div>
                  </div>
                  <div className="text-center px-4">
                    <div className="text-2xl font-semibold text-foreground">{totalStoryPoints}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Total Story Points</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="border border-border rounded-xl p-5 flex flex-col bg-card">
                    <div className="w-10 h-10 rounded-xl bg-secondary text-foreground flex items-center justify-center mb-3 border border-border"><Share2 size={20} /></div>
                    <h3 className="font-semibold text-lg mb-1 text-foreground">Import from Jira</h3>
                    <p className="text-sm text-muted-foreground mb-4 flex-1">Pull in more active sprints or backlog items.</p>
                    <button onClick={() => setModalMode("jira")} className="w-full bg-card border border-border hover:bg-secondary font-medium py-2 rounded-lg transition-colors text-sm text-foreground">
                      Open Selector
                    </button>
                  </div>
                  <div className="border border-border rounded-xl p-5 flex flex-col bg-card">
                    <div className="w-10 h-10 rounded-xl bg-secondary text-foreground flex items-center justify-center mb-3 border border-border"><FileEdit size={20} /></div>
                    <h3 className="font-semibold text-lg mb-1 text-foreground">Add Custom Story</h3>
                    <p className="text-sm text-muted-foreground mb-4 flex-1">Write a new task or discussion item.</p>
                    <div className="flex gap-2">
                      <input
                        type="text" value={customStorySummary}
                        onChange={e => setCustomStoryName(e.target.value)}
                        placeholder="What needs to be done?"
                        onKeyDown={e => e.key === "Enter" && handleAppendCustomIssue()}
                        className="flex-1 h-9 px-3 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-colors text-foreground placeholder:text-muted-foreground"
                      />
                      <button onClick={handleAppendCustomIssue} disabled={!customStorySummary.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 h-9 rounded-lg text-sm font-medium disabled:opacity-40 transition-colors active:scale-[0.98]">Add</button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end border-t border-border pt-5">
                  <button onClick={handleEndOrLeave} className="bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors text-sm">
                    <LogOut size={16} /> End Session For All
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full bg-card">
                <div className="flex items-center justify-between p-4 border-b border-border bg-card">
                  <h2 className="font-semibold text-lg text-foreground">Select Issues to Append</h2>
                  <button onClick={() => setModalMode("menu")} className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">Cancel</button>
                </div>
                <div className="p-4 flex-1 overflow-hidden">
                  <JiraMultiSelector onFinalSelection={handleAppendJiraIssues} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ADD ISSUE MODAL ──────────────────────────────────────────────── */}
      {showAddIssueModal && isHost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-2xl border border-border overflow-hidden flex flex-col max-h-[80vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Add Issue</h2>
              <button onClick={() => setShowAddIssueModal(false)} className="p-1.5 hover:bg-secondary rounded-md transition-colors text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border">
              <button
                onClick={() => setAddIssueTab("custom")}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  addIssueTab === "custom"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileEdit size={14} className="inline mr-1.5 -mt-0.5" /> Custom Issue
              </button>
              <button
                onClick={() => setAddIssueTab("jira")}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  addIssueTab === "jira"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Share2 size={14} className="inline mr-1.5 -mt-0.5" /> Fetch from Jira
              </button>
            </div>

            {/* Tab content */}
            <div className={`flex-1 overflow-auto ${addIssueTab === "custom" ? "p-5" : "bg-white dark:bg-[#1d2125]"}`}>
              {addIssueTab === "custom" ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Enter a summary for the new custom issue.</p>
                  <input
                    type="text"
                    value={addIssueCustomSummary}
                    onChange={(e) => setAddIssueCustomSummary(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddCustomIssueFromModal()}
                    placeholder="What needs to be estimated?"
                    className="w-full h-11 px-4 bg-card border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground transition-all"
                    autoFocus
                  />
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowAddIssueModal(false)}
                      className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddCustomIssueFromModal}
                      disabled={!addIssueCustomSummary.trim()}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-40 transition-colors"
                    >
                      Add Issue
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-[70vh] min-h-[500px] w-full">
                  <JiraMultiSelector onFinalSelection={(newIssues) => {
                    if (!newIssues.length) return;
                    const updated = [...issues, ...newIssues];
                    setIssues(updated);
                    sessionStorage.setItem("pending_jira_issues", JSON.stringify(updated));
                    broadcastIssuesList(updated.map(i => ({
                      id: i.id, key: i.key, summary: i.summary,
                      status: i.status, statusCategory: i.statusCategory,
                    })));
                    setShowAddIssueModal(false);
                  }} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN CARD ────────────────────────────────────────────────────── */}
      <div className="relative bg-card w-full max-w-[1400px] rounded-2xl shadow-sm border border-border flex flex-col min-h-[90vh] overflow-hidden">

        {/* TOP HEADER */}
        <header className="flex items-center justify-between px-5 py-3 border-b border-border gap-3 flex-wrap bg-card z-10 sticky top-0">
          <div className="flex items-center gap-2 text-sm min-w-0">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shrink-0">
              <FileText size={13} />
            </div>
            <span className="text-muted-foreground hidden sm:inline text-xs font-medium">Poker /</span>
            {sessionDisplayName && (
              <span className="text-xs font-semibold text-foreground hidden sm:inline">{sessionDisplayName} /</span>
            )}
            {/* Tap session ID to copy */}
            <button
              onClick={handleCopySessionId}
              title="Click to copy session ID"
              className="flex items-center gap-1.5 font-mono font-semibold text-sm text-foreground hover:bg-secondary px-2.5 py-1 rounded-lg transition-all group tracking-wide"
            >
              {sessionId}
              {copiedSessionId
                ? <Check size={13} className="text-foreground" />
                : <Copy size={13} className="opacity-40 group-hover:opacity-100 transition-opacity" />
              }
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Copy invite link */}
            <button
              onClick={handleCopyInviteLink}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground bg-card hover:bg-secondary border border-border px-3.5 py-1.5 rounded-lg transition-all font-medium text-xs"
            >
              <Link2 size={14} /> <span className="hidden sm:inline">Copy Invite Link</span>
            </button>

            {/* Timer toggle (host only) */}
            {isHost && (
              <button
                onClick={() => setShowTimerPanel(v => !v)}
                className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-all font-medium text-xs ${
                  showTimerPanel
                    ? "bg-primary text-primary-foreground border-primary"
                    : "text-muted-foreground bg-card border-border hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Timer size={14} /> <span className="hidden sm:inline">Timer</span>
              </button>
            )}

            <button
              onClick={handleEndOrLeave}
              className="flex items-center gap-1.5 text-xs text-destructive bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 px-3.5 py-1.5 rounded-lg transition-colors font-medium"
            >
              <LogOut size={14} /> <span className="hidden sm:inline">{isHost ? "End" : "Leave"}</span>
            </button>
            {seriesLabel && (
              <span className="text-[10px] font-semibold px-2 py-1 rounded-md bg-secondary border border-border text-muted-foreground uppercase tracking-wider hidden sm:inline-flex">
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
              <div className="bg-secondary/50 border border-border rounded-xl px-5 py-3.5 flex items-center justify-between gap-3 flex-wrap animate-fade-in-up">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="bg-primary w-4 h-4 rounded-[4px] flex items-center justify-center shrink-0">
                    <Check size={10} className="text-primary-foreground" />
                  </div>
                  <button
                    onClick={openJiraIssue}
                    className={`text-foreground font-semibold shrink-0 ${isJiraIssue(activeIssue.key) ? "hover:underline cursor-pointer" : "cursor-default"}`}
                  >
                    {activeIssue.key}
                  </button>
                  <span className="font-medium text-muted-foreground truncate">
                    {activeIssue.summary}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 text-sm">
                  <span className="bg-card border border-border text-muted-foreground text-[10px] font-semibold px-2 py-1 rounded-md uppercase tracking-wider">
                    {activeIssue.statusCategory || "OPEN"}
                  </span>
                  {isJiraIssue(activeIssue.key) && (
                    <button
                      onClick={openJiraIssue}
                      className="flex items-center gap-1.5 text-muted-foreground bg-card border border-border px-2.5 py-1 rounded-lg hover:bg-secondary font-medium transition-colors text-xs"
                    >
                      <ExternalLink size={12} /> Open in Jira
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-secondary/50 border border-border rounded-xl px-4 py-6 text-center text-muted-foreground text-sm font-medium">
                {issues.length === 0 ? "No issues loaded for this session." : "Waiting for host to select an issue…"}
              </div>
            )}

            {/* Issue details grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Description */}
              <div className="lg:col-span-2 border border-border rounded-xl overflow-hidden bg-card">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-secondary/50">
                  <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Description</h3>
                  <ChevronDown size={15} className="text-muted-foreground" />
                </div>
                <div className="p-4 text-sm text-muted-foreground min-h-24">
                  {isLoadingDetails ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 size={14} className="animate-spin" /> Fetching from Jira…
                    </div>
                  ) : !isJiraIssue(activeIssue?.key) ? (
                    <div className="space-y-2">
                      <p className="font-medium text-foreground">{activeIssue?.summary}</p>
                      <p className="text-muted-foreground italic text-xs">Custom story — no Jira description available.</p>
                    </div>
                  ) : activeIssueDetails?.description ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{activeIssueDetails.description}</p>
                  ) : (
                    <p className="text-muted-foreground italic">No description provided for this issue.</p>
                  )}
                </div>
              </div>

              {/* Details sidebar */}
              <div className="border border-border rounded-xl overflow-hidden bg-card">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-secondary/50">
                  <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Details</h3>
                  <ChevronDown size={15} className="text-muted-foreground" />
                </div>
                <div className="p-4 text-sm space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-muted-foreground w-16 shrink-0 text-xs pt-0.5">Reporter</span>
                    <div className="flex items-center gap-2 min-w-0">
                      {isLoadingDetails ? (
                        <span className="text-muted-foreground text-xs">Loading…</span>
                      ) : activeIssueDetails?.reporter ? (
                        <>
                          {renderAvatar(activeIssueDetails.reporter, "sm")}
                          <span className="font-medium text-foreground text-xs truncate">{activeIssueDetails.reporter}</span>
                        </>
                      ) : !isJiraIssue(activeIssue?.key) ? (
                        <span className="text-muted-foreground italic text-xs">Custom issue</span>
                      ) : (
                        <span className="text-muted-foreground italic text-xs">Unassigned</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-muted-foreground w-16 shrink-0 text-xs pt-0.5">Status</span>
                    <span className="text-[10px] font-semibold bg-secondary text-muted-foreground px-2 py-0.5 rounded uppercase tracking-wider">
                      {activeIssue?.status || "—"}
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-muted-foreground w-16 shrink-0 text-xs pt-0.5">Source</span>
                    <span className="text-xs text-foreground font-medium">
                      {!isJiraIssue(activeIssue?.key) ? "Custom" : "Jira"}
                    </span>
                  </div>
                  {estimates[activeIssue?.id ?? ""] && (
                    <div className="flex items-start gap-3">
                      <span className="text-muted-foreground w-16 shrink-0 text-xs pt-0.5">Estimate</span>
                      <span className="text-xs font-bold text-foreground bg-secondary border border-border px-2 py-0.5 rounded-md">
                        {activeIssue ? estimates[activeIssue.id] : ""} pts
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Voting controls bar */}
            <div className="flex items-center gap-2 bg-card p-3.5 rounded-xl border border-border shadow-sm flex-wrap">
              {/* Final estimate input (host) */}
              {isHost && (
                <input
                  type="text"
                  value={finalEstimate}
                  onChange={e => setFinalEstimate(e.target.value)}
                  disabled={isSaving}
                  placeholder={revealed && currentAverage ? currentAverage : "pts"}
                  title={revealed && currentAverage ? `Average: ${currentAverage}` : "Override estimate"}
                  className="w-16 h-8 bg-secondary border border-border rounded-lg px-2 text-center text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 text-foreground placeholder:font-normal placeholder:text-muted-foreground transition-all"
                />
              )}

              {isHost && (
                <button
                  onClick={handleSaveAndNext}
                  disabled={isSaving}
                  className={`text-sm font-medium px-4 h-8 rounded-lg flex items-center gap-1.5 disabled:opacity-50 transition-colors active:scale-[0.98] ${isLastIssue ? "bg-card border border-border text-foreground hover:bg-secondary" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}
                >
                  {isSaving ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : isLastIssue ? "Save & Finish" : "Save & Next →"}
                </button>
              )}

              <div className="flex items-center gap-1 border-l border-border pl-2 ml-1">
                {isHost && (
                  <button
                    onClick={resetVotes}
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
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
                    className="flex items-center gap-1.5 px-2.5 h-8 text-sm font-medium rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed text-foreground bg-secondary hover:bg-secondary/80 border border-border active:scale-[0.98]"
                  >
                    <Eye size={14} /> Reveal
                  </button>
                )}
              </div>

              {/* No-timer hint for participants */}
              {!isHost && !timerRunning && !revealed && (
                <span className="text-xs text-muted-foreground ml-2 font-medium">
                  {allVoted ? "All voted — waiting for host to reveal" : `${votedCount}/${totalParticipants} voted`}
                </span>
              )}

              {/* Reveal gate indicator */}
              {isHost && !revealed && (
                <div className="ml-auto flex items-center gap-2">
                  {!canReveal && (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary border border-border px-2.5 py-1 rounded-md font-medium">
                      {timerRunning
                        ? <><Timer size={12} /> Timer running</>
                        : <><AlertTriangle size={12} className="text-warning" /> {votedCount}/{totalParticipants} voted</>
                      }
                    </span>
                  )}
                  {allVoted && !timerRunning && (
                    <span className="flex items-center gap-1.5 text-xs text-foreground bg-secondary border border-border px-2.5 py-1 rounded-md font-medium">
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
                      ? "bg-secondary text-foreground border-border"
                      : "bg-secondary/50 text-muted-foreground border-border"
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
                    <div className="w-full flex items-center justify-center gap-12 mb-6 flex-wrap animate-fade-in-up border-b border-border pb-6">
                      <div className="flex flex-col items-center">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Average</span>
                        <span className="text-4xl font-black text-foreground drop-shadow-sm">{currentAverage}</span>
                      </div>
                      <div className="w-px h-10 bg-border" />
                      <div className="flex flex-col items-center">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Min</span>
                        <span className="text-4xl font-black text-foreground drop-shadow-sm">{currentMin}</span>
                      </div>
                      <div className="w-px h-10 bg-border" />
                      <div className="flex flex-col items-center">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Max</span>
                        <span className="text-4xl font-black text-foreground drop-shadow-sm">{currentMax}</span>
                      </div>
                    </div>
                  )}
                  {Object.entries(groupedVotes)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([voteValue, players], idx) => (
                      <div key={voteValue} className="flex flex-col items-center animate-bounce-in" style={{ animationDelay: `${idx * 0.08}s` }}>
                        <span className="text-[10px] font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-md mb-2 uppercase border border-border tracking-wider">
                          {players.length}/{totalParticipants} → {voteValue}
                        </span>
                        <div className="w-[96px] h-[128px] bg-card border-2 border-primary rounded-xl shadow-sm flex flex-col items-center justify-between p-3">
                          <div className="flex justify-center -space-x-1.5 w-full">
                            {players.slice(0, 4).map((p, i) => (
                              <div key={i} className="ring-2 ring-card rounded-full" title={p.name}>
                                {renderAvatar(p.name, "sm")}
                              </div>
                            ))}
                          </div>
                          <span className="text-4xl font-bold text-foreground">{voteValue}</span>
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
                          ? "border-2 border-primary bg-primary/10 text-primary -translate-y-2 shadow-sm scale-110"
                          : "border border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground hover:-translate-y-1 shadow-sm"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Backlog table */}
            <div className="border-t border-border pt-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Backlog</h2>
                  <span className="bg-secondary text-foreground text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase border border-border">
                    {estimatedIssuesCount}/{displayIssues.length} done
                  </span>
                  <span className="text-foreground text-[10px] font-semibold uppercase bg-secondary px-2 py-0.5 rounded-md border border-border">
                    {totalStoryPoints} pts
                  </span>
                </div>
                {isHost && (
                  <button
                    onClick={handleOpenAddIssueModal}
                    className="flex items-center gap-1 text-muted-foreground bg-card border border-border px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-secondary hover:text-foreground transition-colors"
                  >
                    <Plus size={13} /> Add Issue
                  </button>
                )}
              </div>

              <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-secondary/50 border-b border-border text-muted-foreground text-[10px] uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold w-14">Est.</th>
                      <th className="px-3 py-2.5 font-semibold w-20">Key</th>
                      <th className="px-3 py-2.5 font-semibold">Summary</th>
                      <th className="px-3 py-2.5 font-semibold w-24">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayIssues.map((issue, idx) => {
                      const isActive = idx === currentIssueIndex;
                      const est = estimates[issue.id];
                      return (
                        <tr
                          key={issue.id}
                          onClick={() => isHost && jumpToIssue(idx)}
                          className={`border-b border-border transition-colors ${
                            isActive
                              ? "bg-secondary"
                              : isHost
                              ? "hover:bg-secondary/50 cursor-pointer"
                              : ""
                          }`}
                        >
                          <td className="px-4 py-2 relative">
                            <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${isActive ? "bg-primary" : "bg-transparent"}`} />
                            {est ? (
                              <span className="bg-secondary text-foreground w-7 h-6 flex items-center justify-center font-semibold text-xs rounded-md border border-border">
                                {est}
                              </span>
                            ) : (
                              <span className="bg-card text-muted-foreground w-7 h-6 flex items-center justify-center text-xs rounded-md border border-border">—</span>
                            )}
                          </td>
                          <td className={`px-3 py-2 font-medium text-xs ${isActive ? "text-foreground" : "text-muted-foreground"}`}>{issue.key}</td>
                          <td className={`px-3 py-2 max-w-xs truncate ${isActive ? "text-foreground" : "text-muted-foreground"}`}>{issue.summary}</td>
                          <td className="px-3 py-2">
                            <span className="text-[10px] font-semibold text-muted-foreground bg-secondary border border-border px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                              {issue.statusCategory || "OPEN"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {displayIssues.length === 0 && (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground text-sm">No issues loaded.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR — participants */}
          <div className="w-16 border-l border-border bg-secondary/30 flex flex-col items-center py-4 gap-2.5 shrink-0 z-10 sticky top-0 h-full">
            <div className="flex items-center gap-1 text-muted-foreground mb-2" title="Participants">
              <Users size={14} />
              <span className="text-xs font-semibold">{totalParticipants}</span>
            </div>
            {(participants.length > 0 ? participants : [{ name: participantName, isHost: isHost }]).map((player, i) => {
              const hasVoted = votes[player.name] !== undefined && votes[player.name] !== null;
              return (
                <div key={i} className="relative group" title={`${player.name}${player.isHost ? " (Host)" : ""}${hasVoted ? " — voted" : " — waiting"}`}>
                  {renderAvatar(player.name, "md")}
                  {/* Vote status indicator */}
                  <div className={`absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card flex items-center justify-center ${hasVoted ? "bg-primary" : "bg-muted"}`}>
                    {hasVoted
                      ? <Check size={7} className="text-primary-foreground" />
                      : <span className="block w-1.5 h-1.5 bg-card rounded-full" />
                    }
                  </div>
                  {/* Host crown badge */}
                  {player.isHost && (
                    <div className="absolute -bottom-0.5 -left-0.5 w-3.5 h-3.5 rounded-full bg-warning border-2 border-card flex items-center justify-center">
                      <Crown size={7} className="text-white" />
                    </div>
                  )}
                  {/* Name tooltip on hover */}
                  <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-popover text-popover-foreground text-xs font-medium px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-border">
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
      <div className="min-h-screen page-bg flex items-center justify-center text-muted-foreground">
        <Loader2 size={20} className="animate-spin mr-2" /> Loading session…
      </div>
    }>
      <PokerSessionContent />
    </Suspense>
  );
}