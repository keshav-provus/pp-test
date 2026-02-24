"use client";

import React, { useState } from 'react';
import { BoardSelector } from "@/components/pages/board-selector";
import { SprintSelector } from "@/components/pages/sprint-selector";
import { IssueSelector } from "@/components/pages/issue-selector";
import { getIssuesBySprint, getIssuesByBoard } from "../../../services/jira";
import { ChevronLeft, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from "sonner";
import { useTheme } from "next-themes";

interface Board {
  id: string;
  name: string;
  type: 'scrum' | 'kanban' | string;
}

interface Sprint {
  id: string;
  name: string;
  state: string;
}

interface Issue {
  id: string;
  key: string;
  summary: string;
  status: string;
  statusCategory: string;
}

export default function CreateRoomPage() {
  const [step, setStep] = useState<'board' | 'sprint' | 'launch'>('board');
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();

  const handleSyncIssues = async () => {
    if (!selectedBoard) return;
    
    setLoading(true);
    const toastId = toast.loading("Syncing latest Jira data...");
    try {
      let data: Issue[];
      if (selectedSprint) {
        data = await getIssuesBySprint(selectedSprint.id);
      } else {
        data = await getIssuesByBoard(selectedBoard.id);
      }
      setIssues(data);
      toast.success("Board updated", { id: toastId });
    } catch (err) {
      toast.error("Failed to sync Jira", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleBoardSelect = async (board: Board) => {
    setSelectedBoard(board);
    if (board.type === 'scrum') {
      setStep('sprint');
    } else {
      setLoading(true);
      try {
        const data = await getIssuesByBoard(board.id);
        setIssues(data);
        setStep('launch');
      } catch (err) {
        toast.error("Failed to load board issues");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSprintSelect = async (sprint: Sprint) => {
    setSelectedSprint(sprint);
    setLoading(true);
    try {
      const data = await getIssuesBySprint(sprint.id);
      setIssues(data);
      setStep('launch');
    } catch (err) {
      toast.error("Failed to load sprint issues");
    } finally {
      setLoading(false);
    }
  };

  return (
    /* FIXED: Changed bg-[#080808] to bg-background and text-zinc-100 to text-foreground */
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6 transition-colors duration-500">
      
      {/* Dynamic Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:40px_40px] opacity-[0.05] pointer-events-none" />

      <Toaster theme={theme === 'dark' ? 'dark' : 'light'} position="bottom-right" />
      
      {/* Loader Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-md z-[100] flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      )}

      <div className="w-full max-w-4xl relative z-10 transition-all duration-500">
        <AnimatePresence>
          {step !== 'board' && (
            <motion.button 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onClick={() => {
                setStep('board');
                setSelectedSprint(null);
              }}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-xs font-black uppercase tracking-widest transition-colors"
            >
              <ChevronLeft size={16} /> Back to Boards
            </motion.button>
          )}
        </AnimatePresence>

        <motion.div 
          layout
          /* FIXED: Changed bg-white/5 to bg-card and border-white/10 to border-border */
          className={`bg-card border border-border p-8 md:p-10 rounded-[40px] backdrop-blur-md shadow-2xl w-full transition-all duration-500 ${step === 'launch' ? 'max-w-none' : ''}`}
        >
          <div className="mb-10">
            <h1 className="text-4xl font-black italic tracking-tighter mb-2 uppercase text-foreground">
              {step === 'board' ? 'Select Board' : step === 'sprint' ? 'Choose Sprint' : 'Initialize Arena'}
            </h1>
            <p className="text-muted-foreground font-medium text-sm italic">Professional agile estimation powered by Jira.</p>
          </div>

          <div className="relative">
            <AnimatePresence mode="wait">
              {step === 'board' && (
                <motion.div key="board" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <BoardSelector onSelect={handleBoardSelect} />
                </motion.div>
              )}

              {step === 'sprint' && selectedBoard && (
                <motion.div key="sprint" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <SprintSelector boardId={selectedBoard.id} onSelect={handleSprintSelect} />
                </motion.div>
              )}

              {step === 'launch' && (
                <motion.div key="launch" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <IssueSelector 
                    preFetchedIssues={issues} 
                    onLaunch={(issue: Issue) => console.log("Final Launch:", issue)} 
                    onSync={handleSyncIssues}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}