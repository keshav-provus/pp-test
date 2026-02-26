"use client";

import { Plus, Users, Activity } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { Navbar } from "@/components/dashboard/navbar";
import { RecentSessions } from "@/components/dashboard/recent-sessions";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const firstName = session?.user?.name?.split(" ")[0] || "Guest";

  return (
    <div className="min-h-screen bg-[#f4f5f7] dark:bg-[#111214] text-[#172b4d] dark:text-[#b6c2cf] font-sans transition-colors">
      <Navbar 
        firstName={firstName} 
        email={session?.user?.email || ""} 
        onLogout={() => {}} 
      />

      <main className="max-w-6xl mx-auto px-6 py-12">
        <header className="mb-10">
          <h1 className="text-3xl font-semibold mb-2">Welcome back, {firstName}</h1>
          <p className="text-gray-600 dark:text-[#8c9bab]">
            Create a new estimation round, join your team, or review past sessions.
          </p>
        </header>

        {/* Action Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Create Card */}
          <button 
            onClick={() => router.push("/dashboard/create")}
            className="group flex flex-col items-start p-6 bg-white dark:bg-[#1d2125] border border-gray-200 dark:border-[#8c9bab]/20 hover:border-[#0052cc] dark:hover:border-[#4c9aff] rounded-lg shadow-sm hover:shadow-md transition-all text-left"
          >
            <div className="w-10 h-10 rounded bg-[#e9f2ff] dark:bg-[#0052cc]/20 text-[#0052cc] dark:text-[#4c9aff] flex items-center justify-center mb-4">
              <Plus size={20} />
            </div>
            <h2 className="text-lg font-semibold mb-2 text-[#172b4d] dark:text-[#b6c2cf]">Create Session</h2>
            <p className="text-sm text-gray-600 dark:text-[#8c9bab]">
              Start a new estimation round with custom stories or Jira integration.
            </p>
          </button>

          {/* Join Card */}
          <button 
            onClick={() => router.push("/dashboard/join")}
            className="group flex flex-col items-start p-6 bg-white dark:bg-[#1d2125] border border-gray-200 dark:border-[#8c9bab]/20 hover:border-[#6554c0] dark:hover:border-[#9f8fef] rounded-lg shadow-sm hover:shadow-md transition-all text-left"
          >
            <div className="w-10 h-10 rounded bg-[#eae6ff] dark:bg-[#6554c0]/20 text-[#6554c0] dark:text-[#9f8fef] flex items-center justify-center mb-4">
              <Users size={20} />
            </div>
            <h2 className="text-lg font-semibold mb-2 text-[#172b4d] dark:text-[#b6c2cf]">Join Session</h2>
            <p className="text-sm text-gray-600 dark:text-[#8c9bab]">
              Enter a secure room code to connect with your team&#39;s active session.
            </p>
          </button>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[#172b4d] dark:text-[#b6c2cf]">
            <Activity size={18} />
            <h2 className="text-lg font-semibold">Recent Activity</h2>
          </div>
          <div className="bg-white dark:bg-[#1d2125] border border-gray-200 dark:border-[#8c9bab]/20 rounded-lg shadow-sm p-1">
             <RecentSessions />
          </div>
        </div>
      </main>
    </div>
  );
}