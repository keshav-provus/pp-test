"use client";

import { Plus, Users, Activity, ArrowRight, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

import { Navbar } from "@/components/dashboard/navbar";
import { RecentSessions } from "@/components/dashboard/recent-sessions";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const firstName = session?.user?.name?.split(" ")[0] || "Guest";

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="min-h-screen page-bg text-[#172b4d] dark:text-[#b6c2cf] font-sans transition-colors">
      <Navbar 
        firstName={firstName} 
        email={session?.user?.email || ""} 
        onLogout={() => signOut({ callbackUrl: "/login" })} 
      />

      <main className="max-w-6xl mx-auto px-6 py-10">
        <header className="mb-10 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} className="text-[#0052cc] dark:text-[#4c9aff]" />
            <span className="text-xs font-bold text-[#0052cc] dark:text-[#4c9aff] uppercase tracking-widest">Dashboard</span>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-[#172b4d] dark:text-[#dfe1e6]">{greeting}, {firstName}</h1>
          <p className="text-gray-500 dark:text-[#8c9bab]">
            Create a new estimation round, join your team, or review past sessions.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
          <button 
            onClick={() => router.push("/dashboard/create")}
            className="group relative flex items-start gap-4 p-6 bg-white dark:bg-[#1d2125] border border-gray-200 dark:border-[#2c333a] hover:border-[#0052cc]/40 dark:hover:border-[#4c9aff]/40 rounded-xl shadow-sm text-left card-hover animate-fade-in-up stagger-1 overflow-hidden"
          >
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#0052cc]/[0.04] dark:bg-[#4c9aff]/[0.04] rounded-full group-hover:scale-150 transition-transform duration-500" />
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#e9f2ff] to-[#deebff] dark:from-[#0052cc]/20 dark:to-[#0052cc]/10 text-[#0052cc] dark:text-[#4c9aff] flex items-center justify-center shrink-0 relative">
              <Plus size={20} strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0 relative">
              <h2 className="text-lg font-bold mb-1 text-[#172b4d] dark:text-[#dfe1e6] group-hover:text-[#0052cc] dark:group-hover:text-[#4c9aff] transition-colors flex items-center gap-2">
                Create Session
                <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
              </h2>
              <p className="text-sm text-gray-500 dark:text-[#8c9bab]">
                Start a new estimation round with custom stories or Jira integration.
              </p>
            </div>
          </button>

          <button 
            onClick={() => router.push("/dashboard/join")}
            className="group relative flex items-start gap-4 p-6 bg-white dark:bg-[#1d2125] border border-gray-200 dark:border-[#2c333a] hover:border-[#6554c0]/40 dark:hover:border-[#9f8fef]/40 rounded-xl shadow-sm text-left card-hover animate-fade-in-up stagger-2 overflow-hidden"
          >
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#6554c0]/[0.04] dark:bg-[#9f8fef]/[0.04] rounded-full group-hover:scale-150 transition-transform duration-500" />
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#eae6ff] to-[#e0dbff] dark:from-[#6554c0]/20 dark:to-[#6554c0]/10 text-[#6554c0] dark:text-[#9f8fef] flex items-center justify-center shrink-0 relative">
              <Users size={20} strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0 relative">
              <h2 className="text-lg font-bold mb-1 text-[#172b4d] dark:text-[#dfe1e6] group-hover:text-[#6554c0] dark:group-hover:text-[#9f8fef] transition-colors flex items-center gap-2">
                Join Session
                <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
              </h2>
              <p className="text-sm text-gray-500 dark:text-[#8c9bab]">
                Enter a secure room code to connect with your team&#39;s active session.
              </p>
            </div>
          </button>
        </div>

        <section className="space-y-4 animate-fade-in-up stagger-3">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-[#2c333a]">
            <Activity size={16} className="text-gray-400 dark:text-[#626f86]" />
            <h2 className="text-sm font-bold text-[#172b4d] dark:text-[#dfe1e6] uppercase tracking-wide">Recent Activity</h2>
          </div>
          <div className="bg-white dark:bg-[#1d2125] border border-gray-200 dark:border-[#2c333a] rounded-xl shadow-sm overflow-hidden">
             <RecentSessions />
          </div>
        </section>
      </main>
    </div>
  );
}