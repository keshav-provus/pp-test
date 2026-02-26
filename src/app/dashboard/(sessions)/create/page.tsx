"use client";

import { useState } from "react"; // Removed unused useEffect
import { useRouter } from "next/navigation";
import { FileEdit, Share2, ArrowLeft, Plus, Trash2, Play } from "lucide-react"; // Removed unused User
import { useSession } from "next-auth/react";

import { Input } from "@/components/ui/input"; // Removed unused Button
import { Navbar } from "@/components/dashboard/navbar";
import { JiraMultiSelector } from "@/components/jira/selector";
import { type JiraIssue } from "@/services/jira";

const generateRoomId = (length = 8) => {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes).map((byte) => alphabet[byte % alphabet.length]).join("");
};

type CreationMode = "menu" | "jira" | "custom";

export default function CreateSessionPage() {
  const router = useRouter();
  const { data: session } = useSession();
  
  const [customName, setCustomName] = useState<string | null>(null);
  const [mode, setMode] = useState<CreationMode>("menu");
  
  const [customIssues, setCustomIssues] = useState([{ id: 1, summary: "" }]);
  const [nextIdCounter, setNextIdCounter] = useState(2);

  const activeUsername = customName !== null ? customName : (session?.user?.name || "");

  const finalizeSession = (issuesToSave: JiraIssue[]) => {
    if (!activeUsername.trim()) return;
    if (typeof window !== "undefined") {
      sessionStorage.setItem("pending_jira_issues", JSON.stringify(issuesToSave));
    }
    const sessionId = generateRoomId(8);
    router.push(`/dashboard/voting?sessionId=${sessionId}&role=host&name=${encodeURIComponent(activeUsername.trim())}`);
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

  // --- JIRA SELECTION MODE ---
  if (mode === "jira") {
    return (
      <div className="min-h-screen bg-[#f4f5f7] dark:bg-[#111214] text-[#172b4d] dark:text-[#b6c2cf] transition-colors">
        <Navbar firstName={session?.user?.name?.split(" ")[0] || "Guest"} email={session?.user?.email || ""} onLogout={() => {}} />
        <div className="max-w-6xl mx-auto py-8 px-6 space-y-4">
          <button onClick={() => setMode("menu")} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#0052cc] dark:hover:text-[#4c9aff] transition-colors">
            <ArrowLeft size={16} /> Back to options
          </button>
          <JiraMultiSelector onFinalSelection={finalizeSession} />
        </div>
      </div>
    );
  }

  // --- CUSTOM STORIES MODE ---
  if (mode === "custom") {
    return (
      <div className="min-h-screen bg-[#f4f5f7] dark:bg-[#111214] text-[#172b4d] dark:text-[#b6c2cf] transition-colors">
        <Navbar firstName={session?.user?.name?.split(" ")[0] || "Guest"} email={session?.user?.email || ""} onLogout={() => {}} />

        <main className="max-w-3xl mx-auto px-6 py-12">
          <button onClick={() => setMode("menu")} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#0052cc] dark:hover:text-[#4c9aff] transition-colors mb-6">
            <ArrowLeft size={16} /> Back to options
          </button>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-[#172b4d] dark:text-[#b6c2cf]">Create Custom Backlog</h1>
              <p className="text-sm text-gray-500 dark:text-[#8c9bab]">Define the items you want to estimate.</p>
            </div>
            <button 
              onClick={handleCustomFinalize}
              disabled={customIssues.every(i => i.summary.trim() === "")}
              className="bg-[#0052cc] hover:bg-[#0047b3] text-white px-4 py-2 rounded text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              Start Session <Play size={14} className="fill-current" />
            </button>
          </div>

          <div className="bg-white dark:bg-[#1d2125] border border-gray-200 dark:border-[#2c333a] rounded-md shadow-sm">
            <div className="grid grid-cols-[60px_1fr_40px] gap-4 px-6 py-3 border-b border-gray-200 dark:border-[#2c333a] text-xs font-semibold text-gray-500 dark:text-[#9fadbc]">
              <span>Key</span>
              <span>Summary</span>
              <span className="text-center"></span>
            </div>

            <div className="p-2 space-y-1 max-h-[50vh] overflow-y-auto">
              {customIssues.map((issue, index) => {
                const formattedKey = `C${String(index + 1).padStart(3, "0")}`;
                return (
                  <div key={issue.id} className="grid grid-cols-[60px_1fr_40px] gap-4 items-center group px-4 py-2 hover:bg-gray-50 dark:hover:bg-[#22272b] rounded-md transition-colors">
                    <div className="text-xs font-medium text-[#0052cc] dark:text-[#4c9aff]">
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
                      className="h-8 bg-transparent border-transparent hover:border-gray-300 dark:hover:border-[#8c9bab]/30 focus-visible:ring-[#0052cc] rounded shadow-none text-sm px-2"
                    />
                    <button
                      onClick={() => setCustomIssues(customIssues.filter(i => i.id !== issue.id))}
                      className="h-8 w-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-[#2c333a]">
              <button 
                onClick={() => {
                  setCustomIssues([...customIssues, { id: nextIdCounter, summary: "" }]);
                  setNextIdCounter(prev => prev + 1);
                }}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#172b4d] dark:text-[#9fadbc] dark:hover:text-[#b6c2cf] font-medium transition-colors"
              >
                <Plus size={16} /> Add a story
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // --- MAIN MENU MODE ---
  return (
    <div className="min-h-screen bg-[#f4f5f7] dark:bg-[#111214] text-[#172b4d] dark:text-[#b6c2cf] transition-colors">
      <Navbar firstName={session?.user?.name?.split(" ")[0] || "Guest"} email={session?.user?.email || ""} onLogout={() => {}} />

      <main className="max-w-2xl mx-auto px-6 py-12">
        <button onClick={() => router.push("/dashboard")} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#0052cc] dark:hover:text-[#4c9aff] transition-colors mb-6">
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#172b4d] dark:text-[#b6c2cf] mb-2">Create New Session</h1>
          <p className="text-sm text-gray-600 dark:text-[#8c9bab]">Enter your display name and choose your story source.</p>
        </div>

        <div className="bg-white dark:bg-[#1d2125] border border-gray-200 dark:border-[#2c333a] rounded-md shadow-sm p-6 mb-8">
          <label className="text-xs font-semibold text-gray-600 dark:text-[#9fadbc] uppercase mb-2 block">
            Host Display Name
          </label>
          <Input
            type="text"
            placeholder="John Doe"
            value={activeUsername}
            onChange={(e) => setCustomName(e.target.value)}
            className="h-10 bg-[#fafbfc] dark:bg-[#22272b] border-gray-300 dark:border-[#2c333a] text-sm focus-visible:ring-[#0052cc] transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={() => activeUsername.trim() && setMode("custom")}
            className="flex flex-col items-start p-6 bg-white dark:bg-[#1d2125] border border-gray-200 dark:border-[#2c333a] hover:border-[#0052cc] dark:hover:border-[#4c9aff] rounded-md shadow-sm transition-all text-left"
          >
            <FileEdit size={24} className="text-[#0052cc] dark:text-[#4c9aff] mb-3" />
            <h3 className="font-semibold mb-1">Custom Stories</h3>
            <p className="text-sm text-gray-500 dark:text-[#8c9bab]">Manually build a list of stories for your estimation round.</p>
          </button>
          
          <button 
            onClick={() => activeUsername.trim() && setMode("jira")}
            className="flex flex-col items-start p-6 bg-white dark:bg-[#1d2125] border border-gray-200 dark:border-[#2c333a] hover:border-[#0052cc] dark:hover:border-[#4c9aff] rounded-md shadow-sm transition-all text-left"
          >
            <Share2 size={24} className="text-[#0052cc] dark:text-[#4c9aff] mb-3" />
            <h3 className="font-semibold mb-1">Jira Integration</h3>
            <p className="text-sm text-gray-500 dark:text-[#8c9bab]">Sync active sprints or backlogs directly from your boards.</p>
          </button>
        </div>
      </main>
    </div>
  );
}