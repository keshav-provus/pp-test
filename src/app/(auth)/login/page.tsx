"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";


const CARDS = [
  { suit: "♠", value: "A",  x: 14, y: 22, rot: -14, delay: 0,    scale: 1.1  },
  { suit: "♦", value: "K",  x: 68, y: 12, rot:  8,  delay: 0.6,  scale: 0.85 },
  { suit: "♣", value: "5",  x: 52, y: 58, rot: -6,  delay: 1.1,  scale: 0.75 },
  { suit: "♥", value: "Q",  x: 28, y: 70, rot:  18, delay: 0.3,  scale: 0.9  },
  { suit: "♠", value: "8",  x: 80, y: 68, rot: -20, delay: 0.9,  scale: 0.7  },
  { suit: "♦", value: "3",  x: 6,  y: 55, rot:  10, delay: 1.4,  scale: 0.65 },
];

export default function LoginPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef  = useRef({ x: 0.5, y: 0.5 });
  const [btnState, setBtnState] = useState<"idle"|"hover"|"press">("idle");

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


  /* ── Aurora canvas (left panel only) ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf: number;
    let t = 0;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const blobs = [
      { x: 0.25, y: 0.30, r: 0.55, color: "15,40,90",   speed: 0.0008, amp: 0.08 },
      { x: 0.70, y: 0.65, r: 0.45, color: "10,80,100",  speed: 0.0011, amp: 0.07 },
      { x: 0.15, y: 0.75, r: 0.40, color: "30,20,80",   speed: 0.0006, amp: 0.06 },
      { x: 0.80, y: 0.20, r: 0.35, color: "5,60,120",   speed: 0.0014, amp: 0.09 },
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
        g.addColorStop(0,   `rgba(${b.color},0.30)`);
        g.addColorStop(0.5, `rgba(${b.color},0.12)`);
        g.addColorStop(1,   `rgba(${b.color},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(bx, by, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      /* Fine dot grid */
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
  }, []);

  const ripple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn  = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const el   = document.createElement("span");
    const size = Math.max(rect.width, rect.height) * 2;
    el.style.cssText = `
      position:absolute;border-radius:50%;pointer-events:none;
      width:${size}px;height:${size}px;
      left:${e.clientX - rect.left - size/2}px;
      top:${e.clientY - rect.top - size/2}px;
      background:rgba(37,99,235,0.10);
      transform:scale(0);animation:rippleAnim 0.55s ease-out forwards;
    `;
    btn.appendChild(el);
    setTimeout(() => el.remove(), 560);
  };

  if (status === "loading") {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="w-8 h-8 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
 }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,600;9..144,700&family=Bricolage+Grotesque:opsz,wght@12..96,300;12..96,400;12..96,500;12..96,600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; overflow: hidden; }

        :root {
          --left-bg:    #07090f;
          --right-bg:   #f5f6fa;
          --accent:     #2563eb;
          --accent-h:   #1d4ed8;
          --text-dark:  #0c0f1a;
          --text-mid:   #4b5563;
          --text-soft:  #9ca3af;
          --border:     #e5e7eb;
          --shadow-btn: 0 1px 2px rgba(0,0,0,0.08), 0 4px 16px rgba(37,99,235,0.12);
          --shadow-h:   0 2px 4px rgba(0,0,0,0.10), 0 8px 28px rgba(37,99,235,0.22);
        }

        .lp-root {
          display: flex;
          width: 100vw; height: 100dvh;
          font-family: 'Bricolage Grotesque', sans-serif;
          overflow: hidden;
        }

        /* ══════════════════════════════ LEFT ══════════════════════════════ */
        .left {
          position: relative;
          width: 52%;
          background: var(--left-bg);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 40px 52px;
        }

        .left-canvas {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
        }

        .left::after {
          content: '';
          position: absolute; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          opacity: 0.028;
          pointer-events: none;
          mix-blend-mode: overlay;
        }

        .left-vignette {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(7,9,15,0.65) 100%);
          pointer-events: none;
        }

        .left-edge-fade {
          position: absolute;
          top: 0; right: 0; bottom: 0; width: 80px;
          background: linear-gradient(to right, transparent, rgba(7,9,15,0.6));
          pointer-events: none;
        }

        /* Floating poker cards */
        .cards-stage {
          position: absolute; inset: 0;
          z-index: 1; pointer-events: none;
        }

        .p-card {
          position: absolute;
          width: 64px; height: 90px;
          border-radius: 8px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(8px);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 2px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06);
          opacity: 0;
          animation:
            cardRevealK 1s cubic-bezier(0.22,1,0.36,1) var(--del, 0s) forwards,
            cardFloat var(--dur, 6s) ease-in-out var(--del, 0s) infinite;
        }

        @keyframes cardRevealK {
          from { opacity: 0; transform: rotate(var(--r)) translateY(20px) scale(0.9); }
          to   { opacity: var(--op, 0.6); transform: rotate(var(--r)) translateY(0) scale(var(--sc, 1)); }
        }
        @keyframes cardFloat {
          0%, 100% { transform: rotate(var(--r)) translateY(0px); }
          50%       { transform: rotate(var(--r)) translateY(-9px); }
        }

        .p-card-suit { font-size: 22px; line-height: 1; }
        .p-card-val {
          font-family: 'Fraunces', serif;
          font-size: 11px; font-weight: 600;
          color: rgba(255,255,255,0.5);
          letter-spacing: 0.02em;
        }

        /* Left content */
        .left-header {
          position: relative; z-index: 2;
          display: flex; align-items: center; gap: 10px;
          opacity: 0; transform: translateY(12px);
          animation: revL 0.7s cubic-bezier(0.22,1,0.36,1) 0.1s forwards;
        }

        .brand-mark {
          width: 32px; height: 32px;
          border-radius: 8px;
          background: linear-gradient(135deg, #2563eb, #1e40af);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.08), 0 4px 12px rgba(37,99,235,0.4);
        }
        .brand-mark svg { width: 17px; height: 17px; }
        .brand-name {
          font-size: 15px; font-weight: 500;
          color: rgba(248,250,252,0.85);
          letter-spacing: -0.01em;
        }

        .left-body {
          position: relative; z-index: 2;
          flex: 1;
          display: flex; flex-direction: column;
          justify-content: center;
          padding-bottom: 24px;
        }

        .left-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 11px; font-weight: 500;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: rgba(148,163,184,0.7);
          margin-bottom: 26px;
          opacity: 0;
          animation: revL 0.7s cubic-bezier(0.22,1,0.36,1) 0.3s forwards;
        }
        .eyebrow-line { width: 24px; height: 1px; background: rgba(148,163,184,0.4); }

        .left-heading {
          font-family: 'Fraunces', serif;
          font-weight: 600;
          font-size: clamp(38px, 3.8vw, 58px);
          line-height: 1.08;
          letter-spacing: -0.03em;
          color: #f8fafc;
          margin-bottom: 22px;
          opacity: 0;
          animation: revL 0.8s cubic-bezier(0.22,1,0.36,1) 0.45s forwards;
        }
        .left-heading em {
          font-style: italic;
          color: rgba(74, 222, 128, 0.85);
        }

        .left-sub {
          font-size: 15px; font-weight: 300;
          color: rgba(148,163,184,0.65);
          line-height: 1.7; max-width: 340px;
          margin-bottom: 44px;
          opacity: 0;
          animation: revL 0.7s cubic-bezier(0.22,1,0.36,1) 0.6s forwards;
        }

        .stats-row {
          display: flex; gap: 32px;
          opacity: 0;
          animation: revL 0.7s cubic-bezier(0.22,1,0.36,1) 0.75s forwards;
        }
        .stat { display: flex; flex-direction: column; gap: 3px; }
        .stat-num {
          font-family: 'Fraunces', serif;
          font-size: 24px; font-weight: 600;
          color: #f8fafc; letter-spacing: -0.03em; line-height: 1;
        }
        .stat-label { font-size: 11px; color: rgba(148,163,184,0.5); letter-spacing: 0.04em; }
        .stat-divider { width: 1px; background: rgba(255,255,255,0.08); align-self: stretch; }

        .left-footer {
          position: relative; z-index: 2;
          font-size: 11px;
          color: rgba(100,116,139,0.5);
          opacity: 0;
          animation: revL 0.6s ease 1.0s forwards;
        }

        @keyframes revL {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ══════════════════════════════ RIGHT ══════════════════════════════ */
        .right {
          width: 48%;
          background: var(--right-bg);
          display: flex; align-items: center; justify-content: center;
          position: relative; overflow: hidden;
        }

        /* Dot pattern */
        .right::before {
          content: '';
          position: absolute; inset: 0;
          background-image: radial-gradient(circle, rgba(0,0,0,0.055) 1px, transparent 1px);
          background-size: 22px 22px;
          pointer-events: none;
        }

        /* Soft ambient gradient */
        .right::after {
          content: '';
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse at 70% 20%, rgba(219,234,254,0.55) 0%, transparent 55%),
            radial-gradient(ellipse at 20% 85%, rgba(224,231,255,0.45) 0%, transparent 55%);
          pointer-events: none;
        }

        /* Vertical accent line */
        .progress-line {
          position: absolute;
          left: 0; top: 0; bottom: 0; width: 3px;
          background: linear-gradient(to bottom, transparent 0%, #2563eb 40%, #60a5fa 60%, transparent 100%);
          opacity: 0.45;
        }

        .right-top {
          position: absolute; top: 32px; right: 36px;
          font-size: 11px; color: var(--text-soft);
          display: flex; align-items: center; gap: 6px;
          z-index: 2;
          opacity: 0;
          animation: revR 0.6s ease 0.3s forwards;
        }

        .login-panel {
          position: relative; z-index: 1;
          width: 100%; max-width: 420px;
          padding: 0 44px;
        }

        .panel-content {
          opacity: 0; transform: translateX(20px);
          animation: revR 0.8s cubic-bezier(0.22,1,0.36,1) 0.2s forwards;
        }

        @keyframes revR {
          from { opacity: 0; transform: translateX(12px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        /* Chip */
        .panel-chip {
          display: inline-flex; align-items: center; gap: 6px;
          background: white;
          border: 1px solid var(--border);
          border-radius: 20px; padding: 5px 12px 5px 8px;
          font-size: 11.5px; font-weight: 500; color: var(--text-mid);
          margin-bottom: 36px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          opacity: 0;
          animation: revR 0.6s ease 0.4s forwards;
        }
        .chip-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 0 2px rgba(34,197,94,0.18);
          animation: chipPulse 2.5s ease-in-out infinite;
        }
        @keyframes chipPulse {
          0%,100% { box-shadow: 0 0 0 2px rgba(34,197,94,0.18); }
          50%      { box-shadow: 0 0 0 4px rgba(34,197,94,0.10); }
        }

        /* Heading */
        .panel-heading {
          margin-bottom: 10px;
          opacity: 0;
          animation: revR 0.7s cubic-bezier(0.22,1,0.36,1) 0.55s forwards;
        }
        .panel-heading h1 {
          font-family: 'Fraunces', serif;
          font-weight: 600; font-size: 36px;
          letter-spacing: -0.03em; color: var(--text-dark);
          line-height: 1.1;
        }

        .panel-sub {
          font-size: 14px; color: var(--text-soft);
          font-weight: 300; line-height: 1.65;
          margin-bottom: 40px;
          opacity: 0;
          animation: revR 0.7s cubic-bezier(0.22,1,0.36,1) 0.7s forwards;
        }

        /* Google button */
        .google-wrap {
          opacity: 0;
          animation: revR 0.7s cubic-bezier(0.22,1,0.36,1) 0.85s forwards;
        }

        .google-btn {
          position: relative; overflow: hidden;
          width: 100%; height: 52px;
          background: white;
          border: 1px solid var(--border);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center; gap: 11px;
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 15px; font-weight: 500;
          color: var(--text-dark);
          cursor: pointer;
          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease,
            transform 0.18s cubic-bezier(0.34,1.56,0.64,1),
            background 0.2s ease;
          box-shadow: var(--shadow-btn);
          letter-spacing: -0.01em;
        }

        .google-btn::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(219,234,254,0.5) 0%, rgba(238,242,255,0.3) 100%);
          opacity: 0; transition: opacity 0.25s ease;
          border-radius: 12px;
        }

        .google-btn:hover {
          border-color: rgba(37,99,235,0.25);
          box-shadow: var(--shadow-h);
          transform: translateY(-2px);
          background: #fafbff;
        }
        .google-btn:hover::before { opacity: 1; }
        .google-btn:active {
          transform: scale(0.98) translateY(0);
          transition-duration: 0.08s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
        }

        @keyframes rippleAnim { to { transform: scale(1); opacity: 0; } }

        .g-logo { width: 20px; height: 20px; flex-shrink: 0; position: relative; z-index: 1; }
        .btn-label { position: relative; z-index: 1; }

        /* Divider */
        .divider {
          display: flex; align-items: center; gap: 12px;
          margin: 24px 0;
          opacity: 0;
          animation: revR 0.6s ease 1.0s forwards;
        }
        .div-line { flex: 1; height: 1px; background: var(--border); }
        .div-text { font-size: 11.5px; color: var(--text-soft); white-space: nowrap; letter-spacing: 0.04em; }

        /* Trust badges */
        .trust-row {
          display: flex; align-items: center; justify-content: center; gap: 20px;
          opacity: 0;
          animation: revR 0.6s ease 1.1s forwards;
        }
        .trust-item {
          display: flex; align-items: center; gap: 5px;
          font-size: 11px; color: var(--text-soft); font-weight: 400;
        }
        .trust-icon { width: 13px; height: 13px; color: #6b7280; }
        .trust-sep { width: 3px; height: 3px; border-radius: 50%; background: var(--border); }

        /* Footer */
        .panel-footer {
          margin-top: 36px; text-align: center;
          font-size: 11.5px; color: var(--text-soft); line-height: 1.7;
          opacity: 0;
          animation: revR 0.6s ease 1.15s forwards;
        }
        .panel-footer a {
          color: #2563eb; text-decoration: none; font-weight: 500;
          transition: color 0.2s;
        }
        .panel-footer a:hover { color: #1d4ed8; text-decoration: underline; }

        @media (max-width: 900px) {
          .left { display: none; }
          .right { width: 100%; }
        }
      `}</style>

      <div className="lp-root">

        {/* ═══════════════════════ LEFT PANEL ═══════════════════════ */}
        <div className="left">
          <canvas ref={canvasRef} className="left-canvas" />
          <div className="left-vignette" />
          <div className="left-edge-fade" />

          {/* Floating poker cards */}
          <div className="cards-stage" aria-hidden>
            {CARDS.map((c, i) => (
              <div
                key={i}
                className="p-card"
                style={{
                  left: `${c.x}%`,
                  top:  `${c.y}%`,
                  "--r":   `${c.rot}deg`,
                  "--del": `${0.8 + c.delay}s`,
                  "--dur": `${5.5 + i * 0.7}s`,
                  "--sc":  `${c.scale}`,
                  "--op":  `0.60`,
                } as React.CSSProperties}
              >
                <span
                  className="p-card-suit"
                  style={{
                    color: c.suit === "♥" || c.suit === "♦"
                      ? "rgba(251,113,133,0.80)"
                      : "rgba(248,250,252,0.70)",
                  }}
                >
                  {c.suit}
                </span>
                <span className="p-card-val">{c.value}</span>
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="left-header">
            <div className="brand-mark">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3"  width="8" height="11" rx="2" fill="white" opacity="0.9"/>
                <rect x="13" y="3" width="8" height="11" rx="2" fill="white" opacity="0.6"/>
                <rect x="3" y="16" width="8" height="5"  rx="1.5" fill="white" opacity="0.4"/>
                <rect x="13" y="16" width="8" height="5" rx="1.5" fill="white" opacity="0.4"/>
              </svg>
            </div>
            <span className="brand-name">Provus</span>
          </div>

          {/* Body */}
          <div className="left-body">
            <div className="left-eyebrow">
              <div className="eyebrow-line" />
              Services Quoting Cloud
            </div>
            <h1 className="left-heading">
              Every profitable<br />project starts<br /><em>here.</em>
            </h1>
            <p className="left-sub">
              The AI quoting platform that helps services companies quote faster, price smarter, and deliver with confidence.
            </p>
            <div className="stats-row">
              <div className="stat">
                <span className="stat-num">$5B+</span>
                <span className="stat-label">Revenue powered</span>
              </div>
              <div className="stat-divider" />
              <div className="stat">
                <span className="stat-num">70%</span>
                <span className="stat-label">Faster quoting</span>
              </div>
              <div className="stat-divider" />
              <div className="stat">
                <span className="stat-num">100%</span>
                <span className="stat-label">Quote accuracy</span>
              </div>
            </div>
          </div>

          <div className="left-footer">
            © 2025 Provus Inc. · All rights reserved
          </div>
        </div>

        {/* ═══════════════════════ RIGHT PANEL ═══════════════════════ */}
        <div className="right">
          <div className="progress-line" />

          <div className="right-top">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Secured by NextAuth
          </div>

          <div className="login-panel">
            <div className="panel-content">

              <div className="panel-chip">
                <div className="chip-dot" />
                AUTHORIZED ACCESS ONLY
              </div>

              <div className="panel-heading">
                <h1>Welcome back</h1>
              </div>
              <p className="panel-sub">
                Sign in to access your workspace and build profitable quotes in real time.
              </p>

              <div className="google-wrap">
                <button
                  className="google-btn"
                  onMouseEnter={() => setBtnState("hover")}
                  onMouseLeave={() => setBtnState("idle")}
                  onMouseDown={() => setBtnState("press")}
                  onMouseUp={() => setBtnState("hover")}
                  onClick={(e) => {
                    ripple(e);
                    signIn("google")
                  }}
                  aria-label="Continue with Google"
                >
                  <svg className="g-logo" viewBox="0 0 48 48">
                    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
                  </svg>
                  <span className="btn-label">Continue with Google</span>
                </button>
              </div>

              <div className="divider">
                <div className="div-line" />
                <span className="div-text">Powered by Agentic AI</span>
                <div className="div-line" />
              </div>

              <div className="trust-row">
                <div className="trust-item">
                  <svg className="trust-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  Quote Optimizer
                </div>
                <div className="trust-sep" />
                <div className="trust-item">
                  <svg className="trust-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  Deal Predictor
                </div>
                <div className="trust-sep" />
                <div className="trust-item">
                  <svg className="trust-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
                  </svg>
                  Margin Protection
                </div>
              </div>

             

            </div>
          </div>
        </div>

      </div>
    </>
  );
}
