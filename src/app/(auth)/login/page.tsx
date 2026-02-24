"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useColor } from "@/context/ColorContext";

const CARDS = [
  { suit: "♠", value: "A", x: 14, y: 22, rot: -14, delay: 0, scale: 1.1 },
  { suit: "♦", value: "K", x: 68, y: 12, rot: 8, delay: 0.6, scale: 0.85 },
  { suit: "♣", value: "5", x: 52, y: 58, rot: -6, delay: 1.1, scale: 0.75 },
  { suit: "♥", value: "Q", x: 28, y: 70, rot: 18, delay: 0.3, scale: 0.9 },
  { suit: "♠", value: "8", x: 80, y: 68, rot: -20, delay: 0.9, scale: 0.7 },
  { suit: "♦", value: "3", x: 6, y: 55, rot: 10, delay: 1.4, scale: 0.65 },
];

export default function LoginPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const [btnState, setBtnState] = useState<"idle" | "hover" | "press">("idle");
  
  const { theme } = useTheme();
  const { primaryColor } = useColor();

  const onMouse = useCallback((e: MouseEvent) => {
    mouseRef.current = {
      x: e.clientX / window.innerWidth,
      y: e.clientY / window.innerHeight,
    };
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onMouse);
    return () => window.removeEventListener("mousemove", onMouse);
  }, [onMouse]);

  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.replace("/dashboard");
    }
  }, [session, router]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf: number;
    let t = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    /* UPDATED: Aurora blobs now use the primary brand color dynamically */
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}` : "15,40,90";
    };

    const brandRgb = hexToRgb(primaryColor);

    const blobs = [
      { x: 0.25, y: 0.30, r: 0.55, color: brandRgb, speed: 0.0008, amp: 0.08 },
      { x: 0.70, y: 0.65, r: 0.45, color: brandRgb, speed: 0.0011, amp: 0.07 },
      { x: 0.15, y: 0.75, r: 0.40, color: "30,20,80", speed: 0.0006, amp: 0.06 },
      { x: 0.80, y: 0.20, r: 0.35, color: brandRgb, speed: 0.0014, amp: 0.09 },
    ];

    const draw = () => {
      t += 1;
      const W = canvas.width;
      const H = canvas.height;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      ctx.clearRect(0, 0, W, H);

      blobs.forEach((b, i) => {
        const bx = (b.x + Math.sin(t * b.speed + i) * b.amp + (mx - 0.5) * 0.04) * W;
        const by = (b.y + Math.cos(t * b.speed * 1.3 + i) * b.amp + (my - 0.5) * 0.04) * H;
        const radius = b.r * Math.min(W, H);
        const g = ctx.createRadialGradient(bx, by, 0, bx, by, radius);
        g.addColorStop(0, `rgba(${b.color},0.30)`);
        g.addColorStop(0.5, `rgba(${b.color},0.12)`);
        g.addColorStop(1, `rgba(${b.color},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(bx, by, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      const spacing = 32;
      for (let x = 0; x < W; x += spacing) {
        for (let y = 0; y < H; y += spacing) {
          const pulse = 0.12 + 0.08 * Math.sin(t * 0.006 + x * 0.01 + y * 0.01);
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(148,163,184,${pulse})`;
          ctx.fill();
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [primaryColor]);

  const ripple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const el = document.createElement("span");
    const size = Math.max(rect.width, rect.height) * 2;
    el.style.cssText = `
      position:absolute;border-radius:50%;pointer-events:none;
      width:${size}px;height:${size}px;
      left:${e.clientX - rect.left - size/2}px;
      top:${e.clientY - rect.top - size/2}px;
      background: hsl(var(--primary));
      opacity: 0.15;
      transform:scale(0);animation:rippleAnim 0.55s ease-out forwards;
    `;
    btn.appendChild(el);
    setTimeout(() => el.remove(), 560);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,600;9..144,700&family=Bricolage+Grotesque:opsz,wght@12..96,300;12..96,400;12..96,500;12..96,600&display=swap');

        /* UPDATED: Dynamic variable mapping */
        .lp-root {
          --accent: hsl(var(--primary));
          --border-color: var(--border);
          --shadow-btn: 0 1px 2px rgba(0,0,0,0.08), 0 4px 16px hsla(var(--primary), 0.12);
          --shadow-h: 0 2px 4px rgba(0,0,0,0.10), 0 8px 28px hsla(var(--primary), 0.22);
          
          display: flex;
          width: 100vw; height: 100dvh;
          font-family: 'Bricolage Grotesque', sans-serif;
          overflow: hidden;
          background: var(--background);
          color: var(--foreground);
        }

        .left {
          position: relative;
          width: 52%;
          background: #07090f; /* Fixed dark for aurora contrast */
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 40px 52px;
        }

        .left-canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
        .left-vignette { position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(7,9,15,0.65) 100%); pointer-events: none; }

        .cards-stage { position: absolute; inset: 0; z-index: 1; pointer-events: none; }
        .p-card {
          position: absolute; width: 64px; height: 90px; border-radius: 8px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(8px); display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 2px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06);
          opacity: 0;
          animation: cardRevealK 1s cubic-bezier(0.22,1,0.36,1) var(--del, 0s) forwards, cardFloat var(--dur, 6s) ease-in-out var(--del, 0s) infinite;
        }

        @keyframes cardRevealK {
          from { opacity: 0; transform: rotate(var(--r)) translateY(20px) scale(0.9); }
          to { opacity: var(--op, 0.6); transform: rotate(var(--r)) translateY(0) scale(var(--sc, 1)); }
        }
        @keyframes cardFloat {
          0%, 100% { transform: rotate(var(--r)) translateY(0px); }
          50% { transform: rotate(var(--r)) translateY(-9px); }
        }

        .brand-mark {
          width: 32px; height: 32px; border-radius: 8px;
          background: var(--accent);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.08), 0 4px 12px hsla(var(--primary), 0.4);
        }

        .left-heading em { font-style: italic; color: var(--accent); filter: brightness(1.2); }

        .right { width: 48%; background: var(--background); display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
        .progress-line { position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: linear-gradient(to bottom, transparent 0%, var(--accent) 40%, var(--accent) 60%, transparent 100%); opacity: 0.45; }

        .google-btn {
          position: relative; overflow: hidden; width: 100%; height: 52px;
          background: var(--card); border: 1px solid var(--border-color); border-radius: 12px;
          display: flex; align-items: center; justify-content: center; gap: 11px;
          font-family: 'Bricolage Grotesque', sans-serif; font-size: 15px; font-weight: 500;
          color: var(--foreground); cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: var(--shadow-btn);
        }

        .google-btn:hover { border-color: var(--accent); box-shadow: var(--shadow-h); transform: translateY(-2px); }
        .google-btn:active { transform: scale(0.98) translateY(0); }

        @keyframes rippleAnim { to { transform: scale(1); opacity: 0; } }
        @media (max-width: 900px) { .left { display: none; } .right { width: 100%; } }
      `}</style>

      <div className="lp-root">
        <div className="left">
          <canvas ref={canvasRef} className="left-canvas" />
          <div className="left-vignette" />
          <div className="cards-stage" aria-hidden>
            {CARDS.map((c, i) => (
              <div
                key={i}
                className="p-card"
                style={{
                  left: `${c.x}%`,
                  top: `${c.y}%`,
                  "--r": `${c.rot}deg`,
                  "--del": `${0.8 + c.delay}s`,
                  "--dur": `${5.5 + i * 0.7}s`,
                  "--sc": `${c.scale}`,
                  "--op": `0.60`,
                } as React.CSSProperties}
              >
                <span className="p-card-suit" style={{ color: c.suit === "♥" || c.suit === "♦" ? "rgba(251,113,133,0.80)" : "rgba(248,250,252,0.70)" }}>
                  {c.suit}
                </span>
                <span className="p-card-val">{c.value}</span>
              </div>
            ))}
          </div>
          <div className="left-header">
            <div className="brand-mark">
               <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white">
                <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="2" />
               </svg>
            </div>
            <span className="brand-name">Provus</span>
          </div>
          <div className="left-body">
            <h1 className="left-heading">Every profitable<br />project starts<br /><em>here.</em></h1>
            <p className="left-sub">The AI quoting platform that helps services companies quote faster and price smarter.</p>
          </div>
          <div className="left-footer text-[10px] opacity-40">© 2025 Provus Inc.</div>
        </div>

        <div className="right">
          <div className="progress-line" />
          <div className="p-12 w-full max-w-sm space-y-8">
            <h1 className="text-3xl font-black italic uppercase tracking-tighter">Welcome back</h1>
            <button
              className="google-btn"
              onClick={(e) => { ripple(e); signIn("google"); }}
            >
              <span className="btn-label">Continue with Google</span>
            </button>
            <p className="text-[10px] text-center font-black uppercase tracking-widest opacity-30">Powered by Agentic AI</p>
          </div>
        </div>
      </div>
    </>
  );
}