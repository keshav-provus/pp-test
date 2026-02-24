"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldX, Spade } from "lucide-react";

// 1. Create a component that contains the logic using searchParams
function AuthErrorContent() {
  const params = useSearchParams();
  const router = useRouter();
  const error = params.get("error");

  const [count, setCount] = useState(5);

  useEffect(() => {
    if (!error) {
      router.replace("/login");
    }
  }, [error, router]);

  useEffect(() => {
    if (!error) return;

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
  }, [error, router]);

  if (!error) return null;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{ backgroundColor: "#050d14" }}
    >
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-red-500/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-emerald-900/15 rounded-full blur-[100px]" />
        
        {/* grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Branding */}
      <div className="relative z-10 flex items-center gap-2.5 mb-10">
        <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
          <Spade className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <span className="text-white font-semibold text-base">
          Provus<span className="text-emerald-400">Poker</span>
        </span>
      </div>

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 p-10 text-center"
        style={{
          background:
            "linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        }}
      >
        {/* Accent line */}
        <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent rounded-full" />

        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
          <ShieldX className="w-8 h-8 text-red-400" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-3 tracking-tight">
          Access Denied
        </h1>

        {/* Description */}
        <p className="text-white/50 text-sm leading-relaxed mb-8">
          Only accounts with{" "}
          <span className="text-white/80 font-medium">@provusinc.com</span> or{" "}
          <span className="text-white/80 font-medium">@provus.ai</span> domains
          can access this portal.
        </p>

        {/* Countdown ring */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="relative w-10 h-10">
            <svg
              className="absolute inset-0 w-10 h-10 -rotate-90"
              viewBox="0 0 36 36"
            >
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="2.5"
              />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="rgb(52,211,153)"
                strokeWidth="2.5"
                strokeDasharray="94.2"
                strokeDashoffset={94.2 - (count / 5) * 94.2}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.9s linear" }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-emerald-400">
              {count}
            </span>
          </div>
          <p className="text-white/40 text-xs">Redirecting to login</p>
        </div>

        {/* Button */}
        <button
          onClick={() => router.push("/login")}
          className="w-full py-2.5 rounded-lg text-sm font-semibold text-black bg-emerald-500 hover:bg-emerald-400 transition-colors"
        >
          Return to Login Now
        </button>
      </div>
    </div>
  );
}

// 2. Wrap that component in Suspense for the default export
export default function AuthError() {
  return (
    <Suspense fallback={null}>
      <AuthErrorContent />
    </Suspense>
  );
}