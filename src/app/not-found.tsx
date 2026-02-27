"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, ArrowRight } from "lucide-react";

export default function NotFound() {
    const [countdown, setCountdown] = useState(5);
    const router = useRouter();

    useEffect(() => {
        if (countdown <= 0) {
            router.push("/dashboard");
            return;
        }
        const timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [countdown, router]);

    return (
        <main className="relative flex min-h-screen flex-col items-center justify-center bg-[#0a0f14] p-6 font-sans text-slate-200">
            {/* Dark Grid Background Effect */}
            <div className="absolute inset-0 z-0 opacity-20"
                style={{ backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            <div className="relative z-10 flex w-full max-w-md flex-col items-center rounded-3xl border border-slate-800 bg-[#161b22] p-10 shadow-2xl shadow-black">

                {/* Top Icon Area */}
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
                    <ShieldAlert className="h-10 w-10 text-red-500" />
                </div>

                <h1 className="mb-2 text-3xl font-bold tracking-tight text-white">404 - Page Not Found</h1>

                <p className="mb-8 text-center text-slate-400 text-sm leading-relaxed">
                    The table you&apos;re looking for doesn&apos;t exist. We&apos;re moving you back to the main lobby in 
                </p>

                {/* Circular Countdown Progress */}
                <div className="relative mb-10 flex items-center justify-center">
                    <svg className="h-16 w-16 -rotate-90">
                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-slate-800" />
                        <circle
                            cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="3" fill="transparent"
                            strokeDasharray={175.9}
                            strokeDashoffset={175.9 - (175.9 * countdown) / 5}
                            className="text-emerald-500 transition-all duration-1000 ease-linear"
                        />
                    </svg>
                    <span className="absolute text-xs font-medium text-slate-400">{countdown}</span>
                </div>

                {/* Action Button */}
                <Link
                    href="/dashboard"
                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#00c278] py-4 text-sm font-bold text-[#0a0f14] transition-all hover:bg-[#00e08b] active:scale-95"
                >
                    Return to Dashboard Now
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
            </div>

            {/* Brand Logo Placeholder */}
            <div className="relative z-10 mt-8 flex items-center gap-2 opacity-50">
                <div className="h-6 w-6 rounded-md bg-emerald-500/20 p-1 border border-emerald-500/40">
                    <div className="h-full w-full bg-emerald-500 rounded-sm" />
                </div>
                <span className="text-lg font-bold tracking-tight text-white">Provus<span className="text-slate-400">Poker</span></span>
            </div>
        </main>
    );
}