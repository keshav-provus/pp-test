"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileEdit, Share2, ArrowLeft, Plus, Trash2, Play, ArrowRight, Layers, X, Sparkles } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/dashboard/navbar";
import { JiraMultiSelector } from "@/components/jira/selector";
import { type JiraIssue } from "@/services/jira";

const generateRoomId = (length = 8) => {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes).map((byte) => alphabet[byte % alphabet.length]).join("");
};

// ─── Card Series Definitions ────────────────────────────────────────────────

type SeriesKey = "fibonacci" | "modified_fibonacci" | "sequential" | "tshirt" | "powers_of_2";

interface CardSeries {
  key: SeriesKey;
  label: string;
  description: string;
  values: (number | string)[];
  color: string;        // accent color for light mode
  colorDark: string;    // accent color for dark mode
}

const CARD_SERIES: CardSeries[] = [
  {
    key: "fibonacci",
    label: "Fibonacci",
    description: "Classic Fibonacci sequence — industry standard",
    values: [0, 1, 2, 3, 5, 8, 13, 21, 34],
    color: "#0052cc",
    colorDark: "#4c9aff",
  },
  {
    key: "modified_fibonacci",
    label: "Modified Fibonacci",
    description: "Fibonacci with ½ and ? for uncertainty",
    values: [0, "½", 1, 2, 3, 5, 8, 13, 20, 40, "?"],
    color: "#6554c0",
    colorDark: "#9f8fef",
  },
  {
    key: "sequential",
    label: "Linear (1–10)",
    description: "Simple sequential scale for straightforward estimation",
    values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    color: "#00875a",
    colorDark: "#57d9a3",
  },
  {
    key: "tshirt",
    label: "T-Shirt Sizes",
    description: "Relative sizing — great for high-level roadmaps",
    values: ["XS", "S", "M", "L", "XL", "XXL"],
    color: "#de350b",
    colorDark: "#ff7452",
  },
  {
    key: "powers_of_2",
    label: "Powers of 2",
    description: "Exponential scale for wide-ranging estimates",
    values: [0, 1, 2, 4, 8, 16, 32, 64],
    color: "#00b8d9",
    colorDark: "#79e2f2",
  },
];

type CreationMode = "menu" | "jira" | "custom";

export default function CreateSessionPage() {
  const router = useRouter();
  const { data: session } = useSession();
  
  const [customName, setCustomName] = useState<string | null>(null);
  const [mode, setMode] = useState<CreationMode>("menu");
  
  const [customIssues, setCustomIssues] = useState([{ id: 1, summary: "" }]);
  const [nextIdCounter, setNextIdCounter] = useState(2);

  // Session config popup state
  const [showConfigPopup, setShowConfigPopup] = useState(false);
  const [pendingMode, setPendingMode] = useState<"custom" | "jira">("custom");
  const [sessionName, setSessionName] = useState("");
  const [selectedSeries, setSelectedSeries] = useState<SeriesKey>("fibonacci");

  const activeUsername = customName !== null ? customName : (session?.user?.name || "");

  const handleOpenConfig = (targetMode: "custom" | "jira") => {
    if (!activeUsername.trim()) return;
    setPendingMode(targetMode);
    setShowConfigPopup(true);
  };

  const handleConfirmConfig = () => {
    setShowConfigPopup(false);
    // Store session config in sessionStorage for the voting page to read
    const config = {
      sessionName: sessionName.trim() || "Untitled Session",
      seriesKey: selectedSeries,
      seriesValues: CARD_SERIES.find(s => s.key === selectedSeries)!.values,
    };
    sessionStorage.setItem("session_config", JSON.stringify(config));
    setMode(pendingMode);
  };

  const finalizeSession = (issuesToSave: JiraIssue[]) => {
    if (!activeUsername.trim()) return;
    if (typeof window !== "undefined") {
      sessionStorage.setItem("pending_jira_issues", JSON.stringify(issuesToSave));
    }
    const sessionId = generateRoomId(8);
    router.push(`/dashboard/voting?sessionId=${sessionId}&role=host&name=${encodeURIComponent(activeUsername.trim())}&series=${selectedSeries}`);
  };

  const handleCustomFinalize = () => {
    const validIssues: JiraIssue[] = customIssues
      .filter((issue) => issue.summary.trim() !== "")
      .map((issue, index) => ({
        id: `custom-${issue.id}`,
        key: `C${String(index + 1).padStart(3, "0")}`,
        summary: issue.summary.trim(),
        status: "Custom Story",
        statusCategory: "To Do",
      }));
    finalizeSession(validIssues);
  };

  const navbarProps = {
    firstName: session?.user?.name?.split(" ")[0] || "Guest",
    email: session?.user?.email || "",
    onLogout: () => signOut({ callbackUrl: "/login" }),
  };

  const activeSeries = CARD_SERIES.find(s => s.key === selectedSeries)!;

  // --- SESSION CONFIG POPUP ---
  const configPopup = showConfigPopup && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in-up">
      <div className="relative bg-white dark:bg-[#0a0a0a] w-full max-w-lg rounded-2xl shadow-xl border border-gray-200 dark:border-[#333] overflow-hidden animate-scale-in" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-[#222] text-[#111] dark:text-[#ededed] border border-gray-200 dark:border-[#333] flex items-center justify-center shadow-sm">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#111] dark:text-[#ededed]">Session Settings</h2>
              <p className="text-xs text-[#888] dark:text-[#666]">Configure before you start</p>
            </div>
          </div>
          <button
            onClick={() => setShowConfigPopup(false)}
            className="p-2 text-[#888] hover:text-[#111] dark:hover:text-[#ededed] hover:bg-gray-100 dark:hover:bg-[#1a1a1a] rounded-lg transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Session Name */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-[#888] dark:text-[#666] uppercase tracking-wider block">
              Session Name
            </label>
            <Input
              type="text"
              placeholder="e.g. Sprint 42 Planning"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              className="h-11 bg-white dark:bg-[#111] border-gray-200 dark:border-[#333] text-sm focus-visible:ring-1 focus-visible:ring-[#111] dark:focus-visible:ring-white focus-visible:border-[#111] dark:focus-visible:border-white rounded-xl transition-all"
              autoFocus
            />
          </div>

          {/* Card Series Selection */}
          <div className="space-y-2.5">
            <label className="text-[11px] font-semibold text-[#888] dark:text-[#666] uppercase tracking-wider block">
              Estimation Scale
            </label>
            <div className="grid gap-2">
              {CARD_SERIES.map((series) => {
                const isSelected = selectedSeries === series.key;
                return (
                  <button
                    key={series.key}
                    onClick={() => setSelectedSeries(series.key)}
                    className={`relative flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-[#111] dark:border-[#ededed] bg-gray-50 dark:bg-[#111] shadow-sm"
                        : "border-gray-200 dark:border-[#333] bg-white dark:bg-[#0a0a0a] hover:border-gray-300 dark:hover:border-[#444]"
                    }`}
                  >
                    {/* Radio indicator */}
                    <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? "border-[#111] dark:border-[#ededed]"
                        : "border-gray-300 dark:border-[#333]"
                    }`}>
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-[#111] dark:bg-[#ededed]" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-sm text-[#111] dark:text-[#ededed]">{series.label}</span>
                      </div>
                      <p className="text-[11px] text-[#666] dark:text-[#a1a1aa] mb-2">{series.description}</p>
                      {/* Card preview */}
                      <div className="flex flex-wrap gap-1">
                        {series.values.map((v, i) => (
                          <span
                            key={i}
                            className={`inline-flex items-center justify-center min-w-[28px] h-7 px-1.5 rounded-md text-[11px] font-semibold border transition-colors ${
                              isSelected
                                ? "border-gray-300 dark:border-[#444] text-[#111] dark:text-[#ededed] bg-white dark:bg-[#0a0a0a]"
                                : "border-gray-200 dark:border-[#333] text-[#888] dark:text-[#666] bg-gray-50 dark:bg-[#111]"
                            }`}
                          >
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-[#222] flex items-center justify-end gap-3">
          <button
            onClick={() => setShowConfigPopup(false)}
            className="px-4 py-2 text-sm font-medium text-[#666] dark:text-[#888] hover:bg-gray-100 dark:hover:bg-[#111] rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmConfig}
            className="px-5 py-2.5 text-sm font-medium text-white dark:text-[#111] bg-[#111] dark:bg-white hover:bg-[#333] dark:hover:bg-[#e5e5e5] rounded-xl transition-all flex items-center gap-2 active:scale-[0.98]"
          >
            Continue <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  // --- JIRA SELECTION MODE ---
  if (mode === "jira") {
    return (
      <div className="min-h-screen page-bg text-[#111] dark:text-[#ededed] transition-colors">
        <Navbar {...navbarProps} />
        <div className="max-w-6xl mx-auto py-8 px-6 space-y-4 animate-fade-in-up">
          <button onClick={() => setMode("menu")} className="flex items-center gap-2 text-sm text-[#888] hover:text-[#111] dark:text-[#666] dark:hover:text-[#ededed] transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> Back to options
          </button>
          <JiraMultiSelector onFinalSelection={finalizeSession} />
        </div>
      </div>
    );
  }

  // --- CUSTOM STORIES MODE ---
  if (mode === "custom") {
    return (
      <div className="min-h-screen page-bg text-[#111] dark:text-[#ededed] transition-colors">
        <Navbar {...navbarProps} />

        <main className="max-w-3xl mx-auto px-6 py-10 animate-fade-in-up">
          <button onClick={() => setMode("menu")} className="flex items-center gap-2 text-sm text-[#888] hover:text-[#111] dark:text-[#666] dark:hover:text-[#ededed] transition-colors mb-6 group">
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> Back to options
          </button>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-semibold text-[#111] dark:text-[#ededed]">Create Custom Backlog</h1>
              <p className="text-sm text-[#666] dark:text-[#a1a1aa] mt-0.5">
                Define the items you want to estimate.
                <span className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded bg-gray-100 dark:bg-[#111] border border-gray-200 dark:border-[#333] text-[#111] dark:text-[#ededed] uppercase">
                  {activeSeries.label}
                </span>
              </p>
            </div>
            <button 
              onClick={handleCustomFinalize}
              disabled={customIssues.every(i => i.summary.trim() === "")}
              className="bg-[#111] dark:bg-white hover:bg-[#333] dark:hover:bg-[#e5e5e5] text-white dark:text-[#111] px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all disabled:opacity-40 active:scale-[0.98]"
            >
              Start Session <Play size={14} className="fill-current" />
            </button>
          </div>

          <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[60px_1fr_40px] gap-4 px-6 py-3 border-b border-gray-200 dark:border-[#333] bg-gray-50/50 dark:bg-[#111]/50 text-[10px] font-semibold text-[#888] dark:text-[#666] uppercase tracking-widest">
              <span>Key</span>
              <span>Summary</span>
              <span className="text-center"></span>
            </div>

            {/* Rows */}
            <div className="p-2 space-y-0.5 max-h-[50vh] overflow-y-auto">
              {customIssues.map((issue, index) => {
                const formattedKey = `C${String(index + 1).padStart(3, "0")}`;
                return (
                  <div key={issue.id} className="grid grid-cols-[60px_1fr_40px] gap-4 items-center group px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-[#111] rounded-lg transition-colors">
                    <div className="text-xs font-semibold text-[#111] dark:text-[#ededed] font-mono">
                      {formattedKey}
                    </div>
                    <Input
                      type="text"
                      placeholder="What needs to be done?"
                      value={issue.summary}
                      onChange={(e) => {
                        const newIssues = [...customIssues];
                        newIssues[index].summary = e.target.value;
                        setCustomIssues(newIssues);
                      }}
                      className="h-9 bg-transparent border-transparent hover:border-gray-200 dark:hover:border-[#333] focus-visible:ring-1 focus-visible:ring-[#111] dark:focus-visible:ring-white rounded-lg shadow-none text-sm px-3"
                    />
                    <button
                      onClick={() => setCustomIssues(customIssues.filter(i => i.id !== issue.id))}
                      className="h-8 w-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Add row */}
            <div className="p-4 border-t border-gray-100 dark:border-[#333]">
              <button 
                onClick={() => {
                  setCustomIssues([...customIssues, { id: nextIdCounter, summary: "" }]);
                  setNextIdCounter(prev => prev + 1);
                }}
                className="flex items-center gap-2 text-sm text-[#888] hover:text-[#111] dark:text-[#666] dark:hover:text-[#ededed] font-medium transition-colors group"
              >
                <Plus size={16} className="group-hover:rotate-90 transition-transform duration-200" /> Add a story
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // --- MAIN MENU MODE ---
  return (
    <div className="min-h-screen page-bg text-[#111] dark:text-[#ededed] transition-colors">
      <Navbar {...navbarProps} />
      {configPopup}

      <main className="max-w-2xl mx-auto px-6 py-10 animate-fade-in-up">
        <button onClick={() => router.push("/dashboard")} className="flex items-center gap-2 text-sm text-[#888] hover:text-[#111] dark:text-[#666] dark:hover:text-[#ededed] transition-colors mb-6 group">
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> Back to Dashboard
        </button>

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Layers size={14} className="text-[#111] dark:text-[#ededed]" />
            <span className="text-[10px] font-semibold text-[#111] dark:text-[#ededed] uppercase tracking-widest">New Session</span>
          </div>
          <h1 className="text-xl font-semibold text-[#111] dark:text-[#ededed] mb-1">Create New Session</h1>
          <p className="text-sm text-[#666] dark:text-[#a1a1aa]">Enter your display name and choose your story source.</p>
        </div>

        {/* Host name input */}
        <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] rounded-xl shadow-sm p-6 mb-8">
          <label className="text-[11px] font-semibold text-[#888] dark:text-[#666] uppercase tracking-wider mb-2.5 block">
            Host Display Name
          </label>
          <Input
            type="text"
            placeholder="John Doe"
            value={activeUsername}
            onChange={(e) => setCustomName(e.target.value)}
            className="h-11 bg-white dark:bg-[#111] border-gray-200 dark:border-[#333] text-sm focus-visible:ring-1 focus-visible:ring-[#111] dark:focus-visible:ring-white focus-visible:border-[#111] dark:focus-visible:border-white transition-colors rounded-xl"
          />
        </div>

        {/* Story source cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={() => handleOpenConfig("custom")}
            className="group relative flex flex-col items-start p-6 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] hover:border-[#111] dark:hover:border-white rounded-xl shadow-sm text-left transition-all overflow-hidden"
          >
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#222] text-[#111] dark:text-[#ededed] border border-gray-200 dark:border-[#333] flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
              <FileEdit size={20} />
            </div>
            <h3 className="font-semibold mb-1 text-[#111] dark:text-[#ededed] transition-colors flex items-center gap-2">
              Custom Stories
              <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 text-[#888] dark:text-[#666]" />
            </h3>
            <p className="text-sm text-[#666] dark:text-[#a1a1aa] leading-relaxed">Manually build a list of stories for estimation.</p>
          </button>
          
          <button 
            onClick={() => handleOpenConfig("jira")}
            className="group relative flex flex-col items-start p-6 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] hover:border-[#111] dark:hover:border-white rounded-xl shadow-sm text-left transition-all overflow-hidden"
          >
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#222] text-[#111] dark:text-[#ededed] border border-gray-200 dark:border-[#333] flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
              <Share2 size={20} />
            </div>
            <h3 className="font-semibold mb-1 text-[#111] dark:text-[#ededed] transition-colors flex items-center gap-2">
              Jira Integration
              <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 text-[#888] dark:text-[#666]" />
            </h3>
            <p className="text-sm text-[#666] dark:text-[#a1a1aa] leading-relaxed">Sync sprints or backlogs directly from your boards.</p>
          </button>
        </div>
      </main>
    </div>
  );
}