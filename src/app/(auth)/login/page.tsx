"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (session) {
      router.replace("/dashboard");
    }
  }, [session, router]);

  if (status === "loading") {
    return <div className="p-10 text-white bg-black min-h-screen">Loading Auth State...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 font-sans">
      <div className="p-8 bg-white shadow-xl rounded-2xl border border-slate-200 max-w-sm w-full text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Provus Poker</h1>
        <p className="text-slate-500 mb-8 text-sm">Phase 2: Authentication Foundation</p>
        
        <button
          onClick={() => signIn("google")}
          className="flex items-center justify-center gap-3 w-full py-3 px-4 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-all font-medium text-slate-700 shadow-sm"
        >
          <img 
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
            alt="Google" 
            className="w-5 h-5"
          />
          Sign in with Google
        </button>

        <div className="mt-6 pt-6 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
            Functional MVP - Security Layer v0.1
          </p>
        </div>
      </div>
    </div>
  );
}