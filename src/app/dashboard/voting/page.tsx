"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import {
  Settings,
  MoreHorizontal,
  ExternalLink,
  ChevronDown,
  RotateCcw,
  FastForward,
  Users,
  Plus,
  Check,
  FileText,
  LogOut,
  Loader2,
  X,
  Share2,
  FileEdit,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

import { useRoom } from "@/context/RoomContext";
// FIX 1: Import JiraIssueDetails to properly type the active issue state
import {
  type JiraIssue,
  type JiraIssueDetails,
  getIssueDetails,
  updateStoryPoints,
} from "@/services/jira";
import { JiraMultiSelector } from "@/components/jira/selector";

function PokerSessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const sessionId = searchParams.get("sessionId");
  const role = searchParams.get("role");
  const isHost = role === "host";

  const {
    participants,
    votes,
    revealed,
    sessionEnded,
    joinRoom,
    castVote,
    revealVotes,
    resetVotes,
    endSession,
    leaveSession,
  } = useRoom();

  const [isMounted, setIsMounted] = useState(false);
  const [issues, setIssues] = useState<JiraIssue[]>(() => {
    if (typeof window !== "undefined") {
      const savedIssues = sessionStorage.getItem("pending_jira_issues");
      return savedIssues ? JSON.parse(savedIssues) : [];
    }
    return [];
  });

  // State for hydrated date
  const [currentDate, setCurrentDate] = useState<string>("");

  const [currentIssueIndex, setCurrentIssueIndex] = useState(0);
  const [myVote, setMyVote] = useState<number | null>(null);
  const [finalEstimate, setFinalEstimate] = useState<string>("");
  const [estimates, setEstimates] = useState<Record<string, string>>({});

  // FIX 1: Use the strict JiraIssueDetails type
  const [activeIssueDetails, setActiveIssueDetails] =
    useState<JiraIssueDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Modal states for End of Backlog
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [modalMode, setModalMode] = useState<"menu" | "jira">("menu");
  const [customStorySummary, setCustomStoryName] = useState("");

  const participantName = searchParams.get("name")
    ? decodeURIComponent(searchParams.get("name") as string)
    : session?.user?.name || "Anonymous";

  useEffect(() => {
    setIsMounted(true);
    // FIX 2: Set the date here to avoid hydration mismatches, and do not redeclare it later
    setCurrentDate(
      new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    );
  }, []);

  useEffect(() => {
    if (isMounted && sessionId && role) {
      joinRoom(sessionId, participantName, isHost);
    }
  }, [isMounted, sessionId, role, isHost, participantName, joinRoom]);

  useEffect(() => {
    if (sessionEnded && !isHost) router.push("/dashboard");
  }, [sessionEnded, isHost, router]);

  const activeIssue = issues[currentIssueIndex];

  useEffect(() => {
    if (!activeIssue) return;

    if (activeIssue.id.startsWith("custom-")) {
      setActiveIssueDetails(null);
      setIsLoadingDetails(false);
      return;
    }

    const fetchDetails = async () => {
      setIsLoadingDetails(true);
      try {
        const details = await getIssueDetails(activeIssue.key);
        setActiveIssueDetails(details);
      } catch (error) {
        console.error("Failed to fetch Jira issue details:", error);
        setActiveIssueDetails(null);
      } finally {
        setIsLoadingDetails(false);
      }
    };

    fetchDetails();
  }, [activeIssue]);

  const groupedVotes = useMemo(() => {
    const groups: Record<number, typeof participants> = {};
    Object.entries(votes).forEach(([name, vote]) => {
      if (vote === null) return;
      if (!groups[vote]) groups[vote] = [];
      const participant = participants.find((p) => p.name === name);
      if (participant) groups[vote].push(participant);
    });
    return groups;
  }, [votes, participants]);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#f4f5f7] dark:bg-[#111214] flex items-center justify-center font-medium text-gray-500 dark:text-[#8c9bab]">
        Loading Session Data...
      </div>
    );
  }

  const cardValues = [0, 1, 2, 3, 5, 8, 13, 21, 34];

  const averageVote = () => {
    const activeVotes = Object.values(votes).filter(
      (v): v is number => v !== null,
    );
    if (activeVotes.length === 0) return "";
    const sum = activeVotes.reduce((acc, val) => acc + val, 0);
    return parseFloat((sum / activeVotes.length).toFixed(1)).toString();
  };

  const currentAverage = averageVote();
  const isLastIssue = currentIssueIndex === issues.length - 1;

  const handleSaveAndNext = async () => {
    if (!isHost || !activeIssue || isSaving) return;

    const estimateToSave =
      finalEstimate.trim() !== "" ? finalEstimate.trim() : currentAverage;

    if (estimateToSave !== "") {
      setIsSaving(true);
      try {
        if (!activeIssue.id.startsWith("custom-")) {
          const points = parseFloat(estimateToSave);
          if (!isNaN(points)) {
            await updateStoryPoints(activeIssue.key, points);
          }
        }
        setEstimates((prev) => ({
          ...prev,
          [activeIssue.id]: estimateToSave,
        }));
      } catch (error) {
        console.error("Failed to update Jira story points:", error);
        alert(
          "Warning: Failed to sync estimate with Jira. Continuing locally.",
        );
      } finally {
        setIsSaving(false);
      }
    }

    if (!isLastIssue) {
      setCurrentIssueIndex((prev) => prev + 1);
      resetVotes();
      setMyVote(null);
      setFinalEstimate("");
    } else {
      setShowCompletionModal(true);
      setModalMode("menu");
    }
  };

  const jumpToIssue = (index: number) => {
    if (!isHost || isSaving) return;
    setCurrentIssueIndex(index);
    resetVotes();
    setMyVote(null);
    setFinalEstimate(estimates[issues[index].id] || "");
  };

  // FIX 3: Removed the unused newTotalLength parameter. issues.length perfectly points to the first new index.
  const advanceToNewIssues = () => {
    setCurrentIssueIndex(issues.length);
    resetVotes();
    setMyVote(null);
    setFinalEstimate("");
    setShowCompletionModal(false);
  };

  const handleAppendCustomIssue = () => {
    if (!customStorySummary.trim()) return;
    const newIssue: JiraIssue = {
      id: `custom-${Date.now()}`,
      key: `C${String(issues.length + 1).padStart(3, "0")}`,
      summary: customStorySummary.trim(),
      status: "Custom Story",
      statusCategory: "To Do",
    };

    const updatedIssues = [...issues, newIssue];
    setIssues(updatedIssues);
    if (typeof window !== "undefined")
      sessionStorage.setItem(
        "pending_jira_issues",
        JSON.stringify(updatedIssues),
      );

    setCustomStoryName("");
    advanceToNewIssues();
  };

  const handleAppendJiraIssues = (newIssues: JiraIssue[]) => {
    if (newIssues.length === 0) return;
    const updatedIssues = [...issues, ...newIssues];
    setIssues(updatedIssues);
    if (typeof window !== "undefined")
      sessionStorage.setItem(
        "pending_jira_issues",
        JSON.stringify(updatedIssues),
      );

    advanceToNewIssues();
  };

  const handleQuickAddIssue = () => {
    if (!isHost) return;
    const summary = window.prompt("Enter the summary for the new issue:");
    if (!summary || summary.trim() === "") return;

    const newIssue: JiraIssue = {
      id: `custom-${Date.now()}`,
      key: `C${String(issues.length + 1).padStart(3, "0")}`,
      summary: summary.trim(),
      status: "Custom Story",
      statusCategory: "To Do",
    };

    const updatedIssues = [...issues, newIssue];
    setIssues(updatedIssues);
    if (typeof window !== "undefined")
      sessionStorage.setItem(
        "pending_jira_issues",
        JSON.stringify(updatedIssues),
      );
  };

  const handleEndOrLeaveSession = async () => {
    if (isHost) {
      if (
        window.confirm(
          "Are you sure you want to end this session for everyone?",
        )
      ) {
        await endSession();
        router.push("/dashboard");
      }
    } else {
      await leaveSession(participantName);
      router.push("/dashboard");
    }
  };

  const openJiraIssue = () => {
    if (!activeIssue || activeIssue.id.startsWith("custom-")) return;
    window.open(
      `https://provusinc.atlassian.net/browse/${activeIssue.key}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const votedCount = Object.values(votes).filter((v) => v !== null).length;
  const totalParticipants = participants.length;
  const estimatedIssuesCount = Object.keys(estimates).length;

  const totalStoryPoints = Object.values(estimates).reduce((sum, val) => {
    const num = parseFloat(val);
    return sum + (isNaN(num) ? 0 : num);
  }, 0);

  const renderAvatar = (name: string, size: "sm" | "md" = "md") => {
    const initials = name ? name.substring(0, 2).toUpperCase() : "?";
    const sizeClass = size === "md" ? "w-8 h-8 text-xs" : "w-6 h-6 text-[10px]";
    return (
      <div
        className={`${sizeClass} rounded-full bg-[#0052cc] dark:bg-[#4c9aff] text-white flex items-center justify-center font-semibold shadow-sm border border-white dark:border-[#1d2125]`}
      >
        {initials}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f4f5f7] dark:bg-[#111214] font-sans text-[#172b4d] dark:text-[#b6c2cf] flex justify-center py-6 px-4 transition-colors">
      {/* COMPLETION MODAL OVERLAY */}
      {showCompletionModal && isHost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1d2125] rounded-xl shadow-2xl w-full max-w-4xl border border-gray-200 dark:border-[#2c333a] overflow-hidden flex flex-col max-h-[90vh]">
            {modalMode === "menu" ? (
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-[#172b4d] dark:text-[#b6c2cf]">
                      Backlog Completed! 🎉
                    </h2>
                    <p className="text-gray-500 dark:text-[#8c9bab] mt-1">
                      You have estimated all issues currently in the backlog.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCompletionModal(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-[#22272b] rounded-md transition-colors"
                  >
                    <X size={20} className="text-gray-500" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Append Jira Container */}
                  <div className="border border-gray-200 dark:border-[#2c333a] rounded-lg p-5 flex flex-col items-start bg-gray-50/50 dark:bg-[#22272b]/50">
                    <div className="w-10 h-10 rounded bg-[#e9f2ff] dark:bg-[#0052cc]/20 text-[#0052cc] dark:text-[#4c9aff] flex items-center justify-center mb-3">
                      <Share2 size={20} />
                    </div>
                    <h3 className="font-semibold text-lg mb-1">
                      Import from Jira
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-[#8c9bab] mb-4">
                      Pull in more active sprints or backlog items to continue
                      the session.
                    </p>
                    <button
                      onClick={() => setModalMode("jira")}
                      className="mt-auto w-full bg-white dark:bg-[#1d2125] border border-gray-300 dark:border-[#8c9bab]/30 hover:bg-gray-50 dark:hover:bg-[#2c333a] text-[#172b4d] dark:text-[#b6c2cf] font-medium py-2 rounded transition-colors"
                    >
                      Open Selector
                    </button>
                  </div>

                  {/* Append Custom Container */}
                  <div className="border border-gray-200 dark:border-[#2c333a] rounded-lg p-5 flex flex-col items-start bg-gray-50/50 dark:bg-[#22272b]/50">
                    <div className="w-10 h-10 rounded bg-[#eae6ff] dark:bg-[#6554c0]/20 text-[#6554c0] dark:text-[#9f8fef] flex items-center justify-center mb-3">
                      <FileEdit size={20} />
                    </div>
                    <h3 className="font-semibold text-lg mb-1">
                      Add Custom Story
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-[#8c9bab] mb-4">
                      Quickly write down a new task or discussion item.
                    </p>
                    <div className="w-full mt-auto flex gap-2">
                      <input
                        type="text"
                        value={customStorySummary}
                        onChange={(e) => setCustomStoryName(e.target.value)}
                        placeholder="What needs to be done?"
                        className="flex-1 h-9 px-3 bg-white dark:bg-[#1d2125] border border-gray-300 dark:border-[#8c9bab]/30 rounded text-sm focus:outline-none focus:border-[#6554c0] dark:focus:border-[#9f8fef] transition-colors"
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleAppendCustomIssue()
                        }
                      />
                      <button
                        onClick={handleAppendCustomIssue}
                        disabled={!customStorySummary.trim()}
                        className="bg-[#6554c0] hover:bg-[#5243aa] text-white px-3 h-9 rounded text-sm font-medium disabled:opacity-50 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end border-t border-gray-200 dark:border-[#2c333a] pt-4">
                  <button
                    onClick={handleEndOrLeaveSession}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-medium flex items-center gap-2 transition-colors"
                  >
                    <LogOut size={16} /> End Session For All
                  </button>
                </div>
              </div>
            ) : (
              /* Modal Mode: JIRA SELECTOR */
              <div className="flex flex-col h-full bg-[#f4f5f7] dark:bg-[#111214]">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#2c333a] bg-white dark:bg-[#1d2125]">
                  <h2 className="font-semibold text-lg">
                    Select Issues to Append
                  </h2>
                  <button
                    onClick={() => setModalMode("menu")}
                    className="text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
                <div className="p-4 flex-1 overflow-hidden">
                  <JiraMultiSelector
                    onFinalSelection={handleAppendJiraIssues}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-[#1d2125] w-full max-w-350 rounded-md shadow-sm border border-gray-200 dark:border-[#2c333a] flex flex-col min-h-[90vh]">
        {/* TOP HEADER */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#2c333a]">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-6 h-6 bg-[#0052cc] rounded flex items-center justify-center text-white">
              <FileText size={14} />
            </div>
            <span className="text-gray-500 dark:text-[#8c9bab]">
              Planning Poker /{" "}
            </span>
            <span className="font-medium">Session Room: {sessionId}</span>
          </div>
          <div className="flex items-center gap-3 text-sm font-medium text-gray-700 dark:text-[#b6c2cf]">
            <button className="flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-[#22272b] px-2 py-1.5 rounded transition-colors">
              <Settings size={16} /> Edit backlog
            </button>
            <button
              onClick={handleEndOrLeaveSession}
              className="flex items-center gap-1 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-900/50 px-3 py-1.5 rounded transition-colors"
            >
              <LogOut size={16} /> {isHost ? "End Session" : "Leave Session"}
            </button>
            <button className="p-1 hover:bg-gray-100 dark:hover:bg-[#22272b] rounded transition-colors">
              <MoreHorizontal size={18} />
            </button>
          </div>
        </header>

        {/* CONTENT & SIDEBAR SPLIT */}
        <div className="flex flex-1 overflow-hidden">
          {/* LEFT/MAIN CONTENT */}
          <div className="flex-1 flex flex-col overflow-y-auto p-8 space-y-6">
            {/* Active Issue Banner */}
            {activeIssue ? (
              <div className="bg-[#e9f2ff] dark:bg-[#0052cc]/10 border border-[#cce0ff] dark:border-[#0052cc]/30 rounded px-4 py-3 flex items-center justify-between animate-in fade-in duration-300">
                <div className="flex items-center gap-3">
                  <div className="bg-green-500 dark:bg-green-600 w-4 h-4 rounded-sm flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </div>
                  <span
                    onClick={openJiraIssue}
                    className={`text-[#0052cc] dark:text-[#4c9aff] font-medium ${!activeIssue.id.startsWith("custom-") ? "hover:underline cursor-pointer" : ""}`}
                  >
                    {activeIssue.key}
                  </span>
                  <span className="font-semibold text-[#172b4d] dark:text-[#b6c2cf]">
                    {activeIssue.summary}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-bold text-gray-600 dark:text-[#8c9bab] border-b border-dashed border-gray-400 dark:border-[#8c9bab] cursor-pointer">
                    {activeIssue.statusCategory || "OPEN"}{" "}
                    <ChevronDown size={14} className="inline" />
                  </span>
                  {!activeIssue.id.startsWith("custom-") && (
                    <button
                      onClick={openJiraIssue}
                      className="flex items-center gap-1 text-gray-600 dark:text-[#b6c2cf] bg-white dark:bg-[#1d2125] border border-gray-300 dark:border-[#8c9bab]/30 px-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-[#22272b] shadow-sm font-medium transition-colors"
                    >
                      <ExternalLink size={14} /> Open issue
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-[#22272b] border border-gray-200 dark:border-[#2c333a] rounded px-4 py-6 text-center text-gray-500 dark:text-[#8c9bab] font-medium">
                Loading active issue...
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 space-y-6">
                {/* FIX 4: min-h-37.5 replaces min-h-[150px] */}
                <div className="border border-gray-200 dark:border-[#2c333a] rounded min-h-37.5">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-[#2c333a] hover:bg-gray-50 dark:hover:bg-[#22272b] cursor-pointer transition-colors">
                    <h3 className="font-semibold text-sm">Description</h3>
                    <ChevronDown
                      size={16}
                      className="text-gray-500 dark:text-[#8c9bab]"
                    />
                  </div>
                  <div className="p-4 text-sm text-gray-700 dark:text-[#9fadbc] space-y-4">
                    {isLoadingDetails ? (
                      <div className="flex items-center gap-2 text-gray-500 dark:text-[#8c9bab]">
                        <Loader2 size={16} className="animate-spin" /> Fetching
                        details from Jira...
                      </div>
                    ) : activeIssueDetails?.description ? (
                      <div className="whitespace-pre-wrap">
                        {activeIssueDetails.description}
                      </div>
                    ) : (
                      <>
                        <p className="italic text-gray-500 dark:text-[#8c9bab]">
                          Currently estimating:{" "}
                          {activeIssue?.summary || "No issue"}
                        </p>
                        <p>No description provided for this item.</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-span-1 space-y-6">
                <div className="border border-gray-200 dark:border-[#2c333a] rounded">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-[#2c333a] hover:bg-gray-50 dark:hover:bg-[#22272b] cursor-pointer transition-colors">
                    <h3 className="font-semibold text-sm">Details</h3>
                    <ChevronDown
                      size={16}
                      className="text-gray-500 dark:text-[#8c9bab]"
                    />
                  </div>
                  <div className="p-4 text-sm space-y-4">
                    <div className="flex items-center gap-8">
                      <span className="text-gray-500 dark:text-[#8c9bab] w-20">
                        Reporter
                      </span>
                      <div className="flex items-center gap-2">
                        {isLoadingDetails ? (
                          <span className="text-gray-400 dark:text-[#8c9bab]">
                            ...
                          </span>
                        ) : activeIssueDetails?.reporter ? (
                          <>
                            {renderAvatar(activeIssueDetails.reporter, "sm")}
                            <span className="font-medium text-[#172b4d] dark:text-[#b6c2cf]">
                              {activeIssueDetails.reporter}
                            </span>
                          </>
                        ) : (
                          <>
                            {renderAvatar(participantName, "sm")}
                            <span className="font-medium text-gray-500 dark:text-[#8c9bab] italic">
                              Custom / Unassigned
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Voting Toolbar */}
            <div className="flex items-center gap-3 bg-[#f8f9fa] dark:bg-[#22272b] p-3 rounded border border-gray-200 dark:border-[#2c333a] shadow-sm">
              <input
                type="text"
                value={finalEstimate}
                onChange={(e) => setFinalEstimate(e.target.value)}
                disabled={!isHost || isSaving}
                title={
                  revealed && currentAverage
                    ? `Calculated Average: ${currentAverage}`
                    : "Enter final estimate"
                }
                className="w-16 h-8 bg-white dark:bg-[#1d2125] border border-gray-300 dark:border-[#2c333a] rounded px-2 text-center text-sm font-semibold focus:outline-[#0052cc] dark:focus:outline-[#4c9aff] focus:border-[#0052cc] dark:focus:border-[#4c9aff] disabled:bg-gray-100 dark:disabled:bg-[#111214] placeholder:font-normal placeholder:text-gray-400 dark:placeholder:text-[#8c9bab] text-[#172b4d] dark:text-[#b6c2cf] transition-colors"
                placeholder={revealed && currentAverage ? currentAverage : "-"}
              />
              <button
                onClick={handleSaveAndNext}
                disabled={!isHost || isSaving}
                className={`text-white text-sm font-medium px-4 h-8 rounded flex items-center gap-2 disabled:opacity-50 transition-colors ${isLastIssue ? "bg-green-600 hover:bg-green-700" : "bg-[#0052cc] hover:bg-[#0047b3]"}`}
              >
                {isSaving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Saving...
                  </>
                ) : isLastIssue ? (
                  "Save & Finish"
                ) : (
                  "Save & next"
                )}
              </button>

              <div className="flex items-center gap-1 border-l border-gray-300 dark:border-[#2c333a] pl-3">
                <button
                  onClick={resetVotes}
                  disabled={!isHost}
                  className="p-1.5 text-gray-600 dark:text-[#9fadbc] hover:bg-gray-200 dark:hover:bg-[#2c333a] rounded transition-colors"
                  title="Restart Round"
                >
                  <RotateCcw size={16} />
                </button>
                <button
                  onClick={() => isHost && revealVotes()}
                  disabled={!isHost}
                  className="p-1.5 text-gray-600 dark:text-[#9fadbc] hover:bg-gray-200 dark:hover:bg-[#2c333a] rounded transition-colors"
                  title="Reveal Votes"
                >
                  <FastForward size={16} />
                </button>
              </div>

              <div className="ml-auto">
                <span className="bg-[#e3fcef] dark:bg-[#006644]/20 text-[#006644] dark:text-[#57d9a3] text-xs font-bold px-3 py-1 rounded-sm uppercase tracking-wide border border-[#006644]/20 dark:border-[#57d9a3]/20">
                  {votedCount}/{totalParticipants} Voted
                </span>
              </div>
            </div>

            {/* Voting Results & Cards Area */}
            <div className="pt-2 min-h-55">
              <div className="flex flex-wrap items-end justify-center gap-6 pb-8">
                {revealed ? (
                  Object.entries(groupedVotes).map(([voteValue, players]) => (
                    <div
                      key={voteValue}
                      className="flex flex-col items-center animate-in zoom-in duration-300"
                    >
                      <span className="text-[10px] font-bold text-gray-500 dark:text-[#8c9bab] bg-gray-100 dark:bg-[#22272b] px-2 py-0.5 rounded-sm mb-2 uppercase border border-gray-200 dark:border-[#2c333a]">
                        {players.length}/{totalParticipants} Voted: {voteValue}
                      </span>
                      <div className="w-24 h-32 bg-white dark:bg-[#1d2125] border-2 border-[#0052cc] dark:border-[#4c9aff] rounded-lg shadow-md flex flex-col items-center p-2 relative">
                        <div className="flex justify-center -space-x-2 w-full mb-auto mt-1">
                          {players.map((p, i) => (
                            <div
                              key={i}
                              className="relative ring-2 ring-white dark:ring-[#1d2125] rounded-full"
                              title={p.name}
                            >
                              {renderAvatar(p.name, "sm")}
                            </div>
                          ))}
                        </div>
                        <span className="text-4xl font-bold text-[#172b4d] dark:text-[#b6c2cf] mb-4">
                          {voteValue}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-wrap gap-3 w-full max-w-2xl mx-auto justify-center">
                    {cardValues.map((v) => (
                      <button
                        key={v}
                        onClick={() => {
                          setMyVote(v);
                          castVote(participantName, v);
                        }}
                        className={`w-14 h-20 rounded shadow-sm font-bold text-xl flex items-center justify-center transition-all duration-200 ${
                          myVote === v
                            ? "border-2 border-[#0052cc] dark:border-[#4c9aff] bg-[#deebff] dark:bg-[#4c9aff]/20 text-[#0052cc] dark:text-[#4c9aff] -translate-y-2"
                            : "border border-gray-300 dark:border-[#2c333a] bg-white dark:bg-[#1d2125] text-[#172b4d] dark:text-[#b6c2cf] hover:border-gray-400 dark:hover:border-[#8c9bab]/50 hover:bg-gray-50 dark:hover:bg-[#22272b] hover:-translate-y-1"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Game Backlog Table */}
            <div className="mt-8 border-t border-gray-200 dark:border-[#2c333a] pt-6">
              <div className="flex flex-col mb-4">
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="flex items-center gap-4">
                    <h2 className="text-lg font-bold text-[#172b4d] dark:text-[#b6c2cf]">
                      Game backlog
                    </h2>
                    <span className="bg-[#deebff] dark:bg-[#0052cc]/20 text-[#0052cc] dark:text-[#4c9aff] text-[10px] font-bold px-2 py-0.5 rounded uppercase border border-[#cce0ff] dark:border-[#0052cc]/30">
                      Estimated: {estimatedIssuesCount}/{issues.length}
                    </span>
                    <span className="text-[#006644] dark:text-[#57d9a3] text-[10px] font-bold uppercase bg-[#e3fcef] dark:bg-[#006644]/20 px-2 py-0.5 rounded border border-[#006644]/20 dark:border-[#57d9a3]/20">
                      Points: {totalStoryPoints}
                    </span>
                  </div>
                  {isHost && (
                    <button
                      onClick={handleQuickAddIssue}
                      className="flex items-center gap-1 text-gray-700 dark:text-[#b6c2cf] bg-white dark:bg-[#1d2125] border border-gray-300 dark:border-[#2c333a] px-3 py-1.5 rounded text-sm font-medium hover:bg-gray-50 dark:hover:bg-[#22272b] transition-colors shadow-sm"
                    >
                      <Plus size={16} /> Add Issues
                    </button>
                  )}
                </div>
              </div>

              <div className="w-full border border-gray-200 dark:border-[#2c333a] rounded bg-white dark:bg-[#1d2125] overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-[#f4f5f7] dark:bg-[#22272b] border-b border-gray-200 dark:border-[#2c333a] text-gray-500 dark:text-[#9fadbc] font-semibold text-xs">
                    <tr>
                      <th className="px-4 py-3 font-medium">Est.</th>
                      <th className="px-2 py-3 font-medium">T</th>
                      <th className="px-2 py-3 font-medium">Key</th>
                      <th className="px-2 py-3 font-medium w-full">Summary</th>
                      <th className="px-2 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issues.map((issue, idx) => {
                      const isActive = idx === currentIssueIndex;
                      const savedEstimate = estimates[issue.id];
                      const isEstimated = !!savedEstimate;

                      return (
                        <tr
                          key={issue.id}
                          onClick={() => jumpToIssue(idx)}
                          className={`border-b border-gray-100 dark:border-[#2c333a]/50 transition-colors ${isActive ? "bg-[#ebecf0] dark:bg-[#2c333a]" : isHost ? "hover:bg-gray-50 dark:hover:bg-[#22272b] cursor-pointer" : ""}`}
                        >
                          <td className="px-4 py-2 relative">
                            <div
                              className={`absolute left-0 top-0 bottom-0 w-1 ${isActive ? "bg-[#0052cc] dark:bg-[#4c9aff]" : isEstimated ? "bg-[#36b37e] dark:bg-[#57d9a3]" : "bg-transparent"}`}
                            ></div>
                            {isEstimated ? (
                              <div className="bg-[#e3fcef] dark:bg-[#006644]/20 text-[#006644] dark:text-[#57d9a3] w-6 h-6 flex items-center justify-center font-bold text-xs rounded-sm border border-[#006644]/20 dark:border-[#57d9a3]/20">
                                {savedEstimate}
                              </div>
                            ) : (
                              <div className="bg-gray-100 dark:bg-[#22272b] text-gray-400 dark:text-[#8c9bab] w-6 h-6 flex items-center justify-center font-bold text-xs rounded-sm border border-gray-200 dark:border-[#2c333a]">
                                -
                              </div>
                            )}
                          </td>
                          <td className="px-2 py-2">
                            <div className="w-4 h-4 bg-[#36b37e] dark:bg-[#57d9a3] rounded-sm flex items-center justify-center">
                              <Check
                                size={10}
                                className="text-white dark:text-[#111214]"
                              />
                            </div>
                          </td>
                          <td className="px-2 py-2 text-[#0052cc] dark:text-[#4c9aff] font-medium hover:underline">
                            {issue.key}
                          </td>
                          <td className="px-2 py-2 truncate max-w-md text-[#172b4d] dark:text-[#b6c2cf]">
                            {issue.summary}
                          </td>
                          <td className="px-2 py-2">
                            <span className="text-[10px] font-bold text-gray-600 dark:text-[#b6c2cf] bg-[#dfe1e6] dark:bg-[#2c333a] px-2 py-0.5 rounded uppercase">
                              {issue.statusCategory || "OPEN"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {issues.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-8 text-center text-gray-500 dark:text-[#8c9bab] font-medium"
                        >
                          No issues imported.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR (Participants) */}
          <div className="w-16 border-l border-gray-200 dark:border-[#2c333a] bg-[#fafbfc] dark:bg-[#111214] flex flex-col items-center py-4 space-y-6 transition-colors">
            <div className="flex flex-col gap-4 text-gray-500 dark:text-[#8c9bab]">
              <div
                className="flex items-center gap-1 font-bold text-xs"
                title="Participants"
              >
                <Users size={18} /> {participants.length}
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full items-center mt-4">
              {participants.map((player, index) => {
                const hasVoted =
                  votes[player.name] !== undefined &&
                  votes[player.name] !== null;
                return (
                  <div
                    key={index}
                    className="relative group cursor-pointer"
                    title={player.name}
                  >
                    {renderAvatar(player.name, "md")}
                    {hasVoted ? (
                      <div className="absolute -top-1 -right-1 bg-[#36b37e] dark:bg-[#57d9a3] rounded-full border border-white dark:border-[#111214] p-0.5 shadow-sm">
                        <Check
                          size={8}
                          className="text-white dark:text-[#111214]"
                        />
                      </div>
                    ) : (
                      <div className="absolute -top-1 -right-1 bg-gray-400 dark:bg-[#8c9bab] rounded-full border border-white dark:border-[#111214] p-0.5 shadow-sm">
                        <MoreHorizontal
                          size={8}
                          className="text-white dark:text-[#111214]"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PokerSession() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f4f5f7] dark:bg-[#111214] flex items-center justify-center font-medium text-gray-500 dark:text-[#8c9bab]">
          Loading Session Data...
        </div>
      }
    >
      <PokerSessionContent />
    </Suspense>
  );
}
