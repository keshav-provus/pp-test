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
      {/* Subtle background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#0052cc]/[0.03] dark:bg-[#4c9aff]/[0.03] rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#6554c0]/[0.03] dark:bg-[#9f8fef]/[0.03] rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-[420px] space-y-6 relative animate-fade-in-up">
        {/* Brand */}
        <div className="text-center">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0052cc] to-[#2684ff] text-white items-center justify-center mb-5 shadow-lg shadow-[#0052cc]/25">
            <Layers size={28} />
          </div>
          <h1 className="text-3xl font-bold text-[#172b4d] dark:text-[#dfe1e6] tracking-tight">
            Planning Poker
          </h1>
          <p className="text-gray-500 dark:text-[#8c9bab] mt-2 text-[15px]">
            Sign in to start estimating with your team
          </p>
        </div>

        {/* Card */}
        <div className="relative bg-white dark:bg-[#1d2125] p-8 rounded-2xl shadow-xl shadow-black/[0.04] dark:shadow-black/20 border border-gray-200/80 dark:border-[#2c333a]">
          {/* Top accent */}
          <div className="absolute top-0 inset-x-0 h-[3px] rounded-t-2xl brand-gradient" />

          {/* Google Sign-in */}
          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-[#22272b] border border-gray-200 dark:border-[#2c333a] hover:border-gray-300 dark:hover:border-[#4c9aff]/40 hover:shadow-md text-[#172b4d] dark:text-[#dfe1e6] font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 card-hover"
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
          <div className="flex items-center justify-center gap-1.5 mt-5 text-[11px] text-gray-400 dark:text-[#626f86]">
            <Shield size={11} />
            <span>Secured with OAuth 2.0</span>
          </div>

          {/* DEVELOPMENT BYPASS UI */}
          {isDev && (
            <div className="mt-8 pt-6 border-t border-dashed border-gray-200 dark:border-[#2c333a]">
              <div className="flex items-center gap-2 mb-4 text-[#0052cc] dark:text-[#4c9aff]">
                <UserCheck size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Dev Bypass</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleMockLogin("Keshav (Host)", "keshav@provusinc.com")}
                  className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-gray-200 dark:border-[#2c333a] hover:border-[#0052cc] dark:hover:border-[#4c9aff] bg-gray-50/50 dark:bg-[#111214]/50 transition-all group card-hover"
                >
                  <span className="text-sm font-semibold text-[#172b4d] dark:text-[#dfe1e6]">Host User</span>
                  <span className="text-[10px] text-gray-400 group-hover:text-[#0052cc] dark:group-hover:text-[#4c9aff] transition-colors mt-0.5">Dev only</span>
                </button>
                <button
                  onClick={() => handleMockLogin("Guest User", "guest@provusinc.com")}
                  className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-gray-200 dark:border-[#2c333a] hover:border-[#6554c0] dark:hover:border-[#9f8fef] bg-gray-50/50 dark:bg-[#111214]/50 transition-all group card-hover"
                >
                  <span className="text-sm font-semibold text-[#172b4d] dark:text-[#dfe1e6]">Guest User</span>
                  <span className="text-[10px] text-gray-400 group-hover:text-[#6554c0] dark:group-hover:text-[#9f8fef] transition-colors mt-0.5">Dev only</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-[11px] text-gray-400 dark:text-[#626f86] tracking-wide">
          Restricted to authorized organizational domains
        </p>
      </div>
    </div>
  );
}