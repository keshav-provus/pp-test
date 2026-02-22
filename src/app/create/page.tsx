"use client";

import React, { useState } from 'react';
import { BoardSelector } from "@/components/pages/board-selector";
import { SprintSelector } from "@/components/pages/sprint-selector";
import { IssueSelector } from "@/components/pages/issue-selector";
import { getIssuesBySprint, getIssuesByBoard } from "../../../services/jira";
import { ChevronLeft, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';

export default function CreateRoomPage() {
  const [step, setStep] = useState<'board' | 'sprint' | 'launch'>('board');
  const [selectedBoard, setSelectedBoard] = useState<any>(null);
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleBoardSelect = async (board: any) => {
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
        console.error("Error fetching board issues:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSprintSelect = async (sprint: any) => {
    setLoading(true);
    try {
      const data = await getIssuesBySprint(sprint.id);
      setIssues(data);
      setStep('launch');
    } catch (err) {
      console.error("Error fetching sprint issues:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    /* FIXED: min-h-screen with justify-center to vertically center the card */
    <div className="min-h-screen bg-[#080808] text-zinc-100 flex flex-col items-center justify-center px-6">
      
      {loading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center">
          <Loader2 className="animate-spin text-indigo-500" size={40} />
        </div>
      )}

      {/* Container for the content - centered by parent flex */}
      <div className="w-full max-w-2xl">
        
        {/* Animated Back Button */}
        <AnimatePresence>
          {step !== 'board' && (
            <motion.button 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onClick={() => setStep('board')}
              className="flex items-center gap-2 text-zinc-500 hover:text-white mb-6 text-sm transition-colors"
            >
              <ChevronLeft size={16} /> Back to Boards
            </motion.button>
          )}
        </AnimatePresence>

        <motion.div 
          layout
          className="bg-zinc-900/10 border border-zinc-800 p-8 md:p-10 rounded-3xl backdrop-blur-md shadow-2xl w-full"
        >
          <div className="mb-10">
            <h1 className="text-3xl font-bold tracking-tight mb-2 uppercase italic text-white">
              {step === 'board' ? 'Select Board' : step === 'sprint' ? 'Choose Sprint' : 'Initialize Arena'}
            </h1>
            <p className="text-zinc-500 font-medium text-sm">Professional agile estimation powered by Jira.</p>
          </div>

          {/* Animate switch between components */}
          <div className="relative">
            <AnimatePresence mode="wait">
              {step === 'board' && (
                <motion.div
                  key="board"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <BoardSelector onSelect={handleBoardSelect} />
                </motion.div>
              )}

              {step === 'sprint' && (
                <motion.div
                  key="sprint"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <SprintSelector boardId={selectedBoard.id} onSelect={handleSprintSelect} />
                </motion.div>
              )}

              {step === 'launch' && (
                <motion.div
                  key="launch"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <IssueSelector preFetchedIssues={issues} onLaunch={(issue) => console.log("Final Launch:", issue)} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}