"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Unplug } from "lucide-react";
import { useTheme } from "next-themes";

export default function AuthError() {
  const [count, setCount] = useState(5);
  const router = useRouter();
  const { theme } = useTheme();

  useEffect(() => {
    const timer = setInterval(() => {
      setCount((prev) => prev - 1);
    }, 1000);

    const redirect = setTimeout(() => {
      router.push("/login");
    }, 5000);

    return () => {
      clearInterval(timer);
      clearTimeout(redirect);
    };
  }, [router]);

  return (
    /* UPDATED: Changed bg-gray-50 to bg-background and added transition */
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground transition-colors duration-500 px-4">
      {/* UPDATED: Changed bg-white to bg-card and border-gray-200 to border-border */}
      <div className="max-w-md w-full bg-card p-10 rounded-[40px] border border-border shadow-2xl text-center animate-in fade-in zoom-in duration-300">
        <div className="flex justify-center mb-6">
          {/* UPDATED: Changed text-red-500 to text-destructive for theme-aware errors */}
          <div className="p-4 bg-destructive/10 rounded-full">
            <Unplug className="h-10 w-10 text-destructive" />
          </div>
        </div>
        
        <h1 className="text-3xl font-black italic uppercase tracking-tighter mb-4">
          Access Denied
        </h1>
        
        <p className="text-muted-foreground mb-8 text-sm leading-relaxed italic">
          Sorry, only accounts with <strong>@provusinc.com</strong> or <strong>@provus.ai</strong> domains can access this portal.
        </p>
        
        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted py-3 rounded-2xl border border-border">
          Redirecting to login in <span className="text-primary">{count}</span> seconds...
        </div>

        <button 
          onClick={() => router.push("/login")}
          /* UPDATED: Changed bg-gray-900 to bg-primary to match brand accent */
          className="mt-8 w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase italic text-[11px] hover:opacity-90 transition-all shadow-lg shadow-primary/20"
        >
          Return to Login Now
        </button>
      </div>
    </div>
  );
}