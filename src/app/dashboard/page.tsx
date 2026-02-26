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

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Clean Header */}
        <header className="mb-10">
          <h1 className="text-2xl font-semibold mb-2 text-[#172b4d] dark:text-[#b6c2cf]">
            Welcome back, {firstName}
          </h1>
          <p className="text-sm text-gray-600 dark:text-[#8c9bab]">
            Create a new estimation round, join your team, or review past sessions.
          </p>
        </header>

        {/* Action Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
          {/* Create Card */}
          <button 
            onClick={() => router.push("/dashboard/create")}
            className="group flex items-start gap-4 p-5 bg-white dark:bg-[#1d2125] border border-gray-200 dark:border-[#2c333a] hover:border-[#0052cc] dark:hover:border-[#4c9aff] rounded-md shadow-sm hover:shadow-md transition-all text-left"
          >
            <div className="w-10 h-10 rounded-md bg-[#e9f2ff] dark:bg-[#0052cc]/20 text-[#0052cc] dark:text-[#4c9aff] flex items-center justify-center shrink-0">
              <Plus size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold mb-1 text-[#172b4d] dark:text-[#b6c2cf] group-hover:text-[#0052cc] dark:group-hover:text-[#4c9aff] transition-colors">
                Create Session
              </h2>
              <p className="text-sm text-gray-500 dark:text-[#8c9bab] leading-relaxed">
                Start a new estimation round with custom stories or Jira integration.
              </p>
            </div>
          </button>

          {/* Join Card */}
          <button 
            onClick={() => router.push("/dashboard/join")}
            className="group flex items-start gap-4 p-5 bg-white dark:bg-[#1d2125] border border-gray-200 dark:border-[#2c333a] hover:border-[#6554c0] dark:hover:border-[#9f8fef] rounded-md shadow-sm hover:shadow-md transition-all text-left"
          >
            <div className="w-10 h-10 rounded-md bg-[#eae6ff] dark:bg-[#6554c0]/20 text-[#6554c0] dark:text-[#9f8fef] flex items-center justify-center shrink-0">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold mb-1 text-[#172b4d] dark:text-[#b6c2cf] group-hover:text-[#6554c0] dark:group-hover:text-[#9f8fef] transition-colors">
                Join Session
              </h2>
              <p className="text-sm text-gray-500 dark:text-[#8c9bab] leading-relaxed">
                Enter a secure room code to connect with your team&#39;s active session.
              </p>
            </div>
          </button>
        </div>

        {/* Recent Activity */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-[#2c333a]">
            <Activity size={18} className="text-gray-500 dark:text-[#8c9bab]" />
            <h2 className="text-base font-semibold text-[#172b4d] dark:text-[#b6c2cf]">
              Recent Activity
            </h2>
          </div>
          <div className="bg-white dark:bg-[#1d2125] border border-gray-200 dark:border-[#2c333a] rounded-md shadow-sm overflow-hidden">
             {/* Render your existing RecentSessions component inside this clean wrapper */}
             <RecentSessions />
          </div>
        </section>

      </main>
    </div>
  );
}