"use client";

import { signIn } from "next-auth/react";
import { Layers, Chrome, UserCheck } from "lucide-react";
import { useState, useEffect } from "react";

export default function LoginPage() {
  const isDev = process.env.NODE_ENV === "development";

  const handleMockLogin = (name: string, email: string) => {
    // Uses the CredentialsProvider configured in your route.ts
    signIn("credentials", {
      name,
      email,
      callbackUrl: "/dashboard",
    });
  };

  return (
    <div className="min-h-screen bg-[#f4f5f7] dark:bg-[#111214] flex items-center justify-center p-6 transition-colors">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="inline-flex w-12 h-12 rounded-lg bg-[#0052cc] text-white items-center justify-center mb-4 shadow-lg">
            <Layers size={28} />
          </div>
          <h1 className="text-3xl font-bold text-[#172b4d] dark:text-[#b6c2cf]">Planning Poker</h1>
          <p className="text-gray-500 dark:text-[#8c9bab] mt-2">Sign in to start estimating with your team</p>
        </div>

        <div className="bg-white dark:bg-[#1d2125] p-8 rounded-xl shadow-sm border border-gray-200 dark:border-[#2c333a]">
          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-[#22272b] border border-gray-300 dark:border-[#2c333a] hover:bg-gray-50 dark:hover:bg-[#2c333a] text-[#172b4d] dark:text-[#b6c2cf] font-medium py-3 px-4 rounded-lg transition-all"
          >
            <Chrome size={20} className="text-[#4285F4]" />
            Continue with Google
          </button>

          {/* DEVELOPMENT BYPASS UI */}
          {isDev && (
            <div className="mt-10 pt-6 border-t border-dashed border-gray-200 dark:border-[#2c333a]">
              <div className="flex items-center gap-2 mb-4 text-[#0052cc] dark:text-[#4c9aff]">
                <UserCheck size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Dev Mode Bypass</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleMockLogin("Keshav (Host)", "keshav@provusinc.com")}
                  className="flex flex-col items-center justify-center p-3 rounded-lg border border-gray-200 dark:border-[#2c333a] hover:border-[#0052cc] dark:hover:border-[#4c9aff] bg-gray-50 dark:bg-[#111214] transition-all group"
                >
                  <span className="text-sm font-semibold">Host User</span>
                  <span className="text-[10px] text-gray-400 group-hover:text-[#0052cc]">Localhost only</span>
                </button>
                <button
                  onClick={() => handleMockLogin("Guest User", "guest@provusinc.com")}
                  className="flex flex-col items-center justify-center p-3 rounded-lg border border-gray-200 dark:border-[#2c333a] hover:border-[#0052cc] dark:hover:border-[#4c9aff] bg-gray-50 dark:bg-[#111214] transition-all group"
                >
                  <span className="text-sm font-semibold">Guest User</span>
                  <span className="text-[10px] text-gray-400 group-hover:text-[#0052cc]">Localhost only</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-[#8c9bab]">
          Restricted to authorized organizational domains.
        </p>
      </div>
    </div>
  );
}