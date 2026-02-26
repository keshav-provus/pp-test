"use client";

import { signIn } from "next-auth/react";
import { Layers, UserCheck, Shield } from "lucide-react";

export default function LoginPage() {
  const isDev = process.env.NODE_ENV === "development";

  const handleMockLogin = (name: string, email: string) => {
    signIn("credentials", {
      name,
      email,
      callbackUrl: "/dashboard",
    });
  };

  return (
    <div className="min-h-screen page-bg flex items-center justify-center p-6 transition-colors">
      <div className="w-full max-w-[400px] space-y-6 relative animate-fade-in-up">
        {/* Brand */}
        <div className="text-center flex flex-col items-center">
          <div className="inline-flex w-12 h-12 rounded-xl bg-[#111] dark:bg-white text-white dark:text-[#111] items-center justify-center mb-5 shadow-sm">
            <Layers size={24} />
          </div>
          <h1 className="text-2xl font-semibold text-[#111] dark:text-[#ededed] tracking-tight">
            Planning Poker
          </h1>
          <p className="text-[#666] dark:text-[#a1a1aa] mt-2 text-sm">
            Sign in to start estimating with your team
          </p>
        </div>

        {/* Card */}
        <div className="relative bg-white dark:bg-[#0a0a0a] p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-[#333]">
          {/* Google Sign-in */}
          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#333] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] active:scale-[0.98] text-[#111] dark:text-[#ededed] font-medium text-sm py-2.5 px-4 rounded-lg transition-all duration-200"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 2.58 9 2.58z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* Security note */}
          <div className="flex items-center justify-center gap-1.5 mt-5 text-[11px] text-[#888] dark:text-[#666]">
            <Shield size={12} />
            <span>Secured with OAuth 2.0</span>
          </div>

          {/* DEVELOPMENT BYPASS UI */}
          {isDev && (
            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-[#222]">
              <div className="flex items-center gap-2 mb-4 text-[#666] dark:text-[#888]">
                <UserCheck size={14} />
                <span className="text-[10px] font-semibold uppercase tracking-widest">Dev Bypass</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleMockLogin("Keshav (Host)", "keshav@provusinc.com")}
                  className="flex flex-col items-center justify-center p-3 rounded-lg border border-gray-200 dark:border-[#333] hover:border-gray-400 dark:hover:border-[#666] active:scale-[0.98] bg-gray-50/50 dark:bg-[#111]/50 transition-all group"
                >
                  <span className="text-sm text-[#111] dark:text-[#ededed]">Host User</span>
                  <span className="text-[10px] text-[#888] dark:text-[#666] mt-0.5 group-hover:text-[#111] dark:group-hover:text-[#ededed] transition-colors">Dev only</span>
                </button>
                <button
                  onClick={() => handleMockLogin("Guest User", "guest@provusinc.com")}
                  className="flex flex-col items-center justify-center p-3 rounded-lg border border-gray-200 dark:border-[#333] hover:border-gray-400 dark:hover:border-[#666] active:scale-[0.98] bg-gray-50/50 dark:bg-[#111]/50 transition-all group"
                >
                  <span className="text-sm text-[#111] dark:text-[#ededed]">Guest User</span>
                  <span className="text-[10px] text-[#888] dark:text-[#666] mt-0.5 group-hover:text-[#111] dark:group-hover:text-[#ededed] transition-colors">Dev only</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-[11px] text-[#888] dark:text-[#666] tracking-wide">
          Restricted to authorized organizational domains
        </p>
      </div>
    </div>
  );
}