# Authentication — Frontend Documentation

## Table of Contents

1. [Overview](#overview)
2. [File Map](#file-map)
3. [Global Session Provider — `components/Providers.tsx` + `app/layout.tsx`](#global-session-provider)
   - [Providers.tsx](#providerstsx)
   - [layout.tsx](#layouttsx)
4. [Login Page — `app/(auth)/login/page.tsx`](#login-page--appauthlginpagetsx)
   - [Route Group Explained](#route-group-explained)
   - [State and Refs](#state-and-refs)
   - [Session Redirect Guard](#session-redirect-guard)
   - [Loading State](#loading-state)
   - [Aurora Canvas — Left Panel Animation](#aurora-canvas--left-panel-animation)
   - [Floating Poker Cards](#floating-poker-cards)
   - [Ripple Effect](#ripple-effect)
   - [The Sign-In Button](#the-sign-in-button)
   - [Layout Structure](#layout-structure)
   - [Responsive Behaviour](#responsive-behaviour)
5. [Auth Error Page — `app/auth/error/page.tsx`](#auth-error-page--appautherrorpagetsx)
   - [How It Receives the Error](#how-it-receives-the-error)
   - [Missing Error Guard](#missing-error-guard)
   - [Countdown and Auto-Redirect](#countdown-and-auto-redirect)
   - [Countdown Ring — SVG Mechanics](#countdown-ring--svg-mechanics)
   - [Layout and Visual Design](#layout-and-visual-design)
6. [Dashboard Page — `app/dashboard/page.tsx`](#dashboard-page--appdashboardpagetsx)
   - [Session Access](#session-access)
   - [Sign Out](#sign-out)
   - [UI Sections](#ui-sections)
7. [Authentication Flow — User's Perspective](#authentication-flow--users-perspective)
8. [Component Relationships](#component-relationships)
9. [Known Issues and Improvements](#known-issues-and-improvements)

---

## Overview

The frontend authentication layer consists of four parts that work together to give users a seamless, secure experience:

| File | Role |
|---|---|
| `components/Providers.tsx` | Wraps the entire app in NextAuth's `SessionProvider` |
| `app/layout.tsx` | Root layout that mounts `Providers` and sets metadata |
| `app/(auth)/login/page.tsx` | Split-panel login page with Google OAuth sign-in |
| `app/auth/error/page.tsx` | Error screen shown when sign-in is rejected (wrong domain) |
| `app/dashboard/page.tsx` | Protected landing page that consumes the session |

All auth-related pages are Client Components (`"use client"`) because they use React hooks (`useSession`, `useRouter`, `useState`, `useEffect`) that only work in the browser.

---

## Global Session Provider

### Providers.tsx

```tsx
"use client";
import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

**What it does:** Wraps its children in NextAuth's `SessionProvider`, which sets up a React context that makes session data available anywhere in the component tree via the `useSession()` hook. Without this wrapper, every call to `useSession()` would fail with a context error.

**Why it's a separate file:** The root layout (`layout.tsx`) is a Server Component in Next.js App Router. `SessionProvider` is a Client Component that uses React context internally. You cannot use Client Components directly inside Server Components — they must be imported from a file explicitly marked `"use client"`. The `Providers.tsx` wrapper file serves as this bridge: the Server Component (`layout.tsx`) imports `Providers`, and because `Providers` is a Client Component, the `SessionProvider` it renders works correctly.

**Why `children: React.ReactNode`:** The provider needs to wrap the entire application tree without knowing or caring what's inside it. Accepting `children` as a prop is the standard React pattern for this.

---

### layout.tsx

```tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

**What it does:** This is the single root layout that wraps every page in the application. By placing `<Providers>` here, the `SessionProvider` context is available on every route — the login page, the dashboard, the error page — without needing to wrap each one individually.

**Metadata:** The `metadata` export configures the HTML `<title>`, `<meta description>`, Open Graph tags (for link previews on Slack, Twitter, etc.), and Twitter card data. This is declared here at the root level so it applies as a default to all pages, with individual pages able to override it if needed.

**Font situation (note):** Three font families are imported — `Inter`, `Geist`, and `Geist_Mono` — but only `Inter` is applied to the `<html>` element via `className={inter.variable}`. The `geistSans` and `geistMono` CSS variables are added to `<body>` but the login page overrides the font entirely with inline CSS using `Bricolage Grotesque` and `Fraunces` via a Google Fonts import. This is an inconsistency worth tidying in a future cleanup.

---

## Login Page — `app/(auth)/login/page.tsx`

This is the most complex frontend file in the auth system. It renders a full-screen split-panel layout with a live canvas animation on the left and the Google sign-in form on the right.

### Route Group Explained

The file lives at `app/(auth)/login/page.tsx`. The `(auth)` folder name is a **Next.js Route Group** — the parentheses tell Next.js to ignore this segment when building the URL. So the page is served at `/login`, not `/auth/login`. Route groups are used to organise files without affecting the URL structure, which is useful here for keeping all auth-related pages together.

---

### State and Refs

```tsx
const canvasRef = useRef<HTMLCanvasElement>(null);
const mouseRef  = useRef({ x: 0.5, y: 0.5 });
const [btnState, setBtnState] = useState<"idle" | "hover" | "press">("idle");
```

**`canvasRef`:** A ref attached to the `<canvas>` element in the left panel. The animation loop needs a direct reference to the DOM element to get a 2D drawing context — this cannot be done through React state.

**`mouseRef`:** Stores the current mouse position as normalised values (0–1 range) relative to the viewport. It uses a ref rather than state because updating it should **not** trigger a re-render — the canvas animation loop reads it directly on every frame. If this were state, every mouse movement would cause the entire component to re-render, which would be massively wasteful.

**`btnState`:** Tracks the Google button's interaction state (`"idle"`, `"hover"`, `"press"`). This is state rather than a ref because changing it should trigger a visual update. In the current implementation the state is tracked but not yet used to visually differentiate button appearance beyond the CSS hover/active styles — it's ready to wire up to more complex visual feedback if needed.

---

### Session Redirect Guard

```tsx
const { data: session, status } = useSession();
const router = useRouter();

useEffect(() => {
  if (session) {
    router.replace("/dashboard");
  }
}, [session, router]);
```

**What it does:** If a user who is already signed in somehow lands on `/login` (e.g. by typing the URL directly or navigating back), this effect immediately replaces the history entry with `/dashboard`. The user never sees the login page.

**Why `router.replace` instead of `router.push`:** `replace` overwrites the current history entry rather than pushing a new one. This means the user cannot press the browser back button from `/dashboard` and return to `/login` — the login page is removed from the navigation history entirely.

**Note:** The middleware in `middleware.ts` also performs this redirect server-side before the page even renders. This client-side guard acts as a belt-and-suspenders fallback for cases where the middleware redirect didn't fire (e.g. during client-side navigation that bypasses the middleware).

---

### Loading State

```tsx
if (status === "loading") {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="w-8 h-8 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
```

`useSession()` returns `status: "loading"` during the initial hydration period while it checks the session cookie. Rendering a spinner during this window prevents a flash where the login form appears briefly for a user who is already authenticated before the redirect fires.

---

### Aurora Canvas — Left Panel Animation

The left panel background is driven by a `<canvas>` animation loop that creates a shifting, mouse-reactive "aurora" effect. This is all drawn using the browser's Canvas 2D API — no animation library is used.

```tsx
useEffect(() => {
  const canvas = canvasRef.current;
  const ctx = canvas.getContext("2d");
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
    { x: 0.25, y: 0.30, r: 0.55, color: "15,40,90",  speed: 0.0008, amp: 0.08 },
    { x: 0.70, y: 0.65, r: 0.45, color: "10,80,100", speed: 0.0011, amp: 0.07 },
    // ...two more blobs
  ];

  const draw = () => {
    t += 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    blobs.forEach((b, i) => {
      // Position shifts over time with sine/cosine and reacts to mouse
      const bx = (b.x + Math.sin(t * b.speed + i) * b.amp + (mx - 0.5) * 0.04) * W;
      const by = (b.y + Math.cos(t * b.speed * 1.3 + i) * b.amp + (my - 0.5) * 0.04) * H;

      // Each blob is a radial gradient — opaque centre, transparent edge
      const g = ctx.createRadialGradient(bx, by, 0, bx, by, radius);
      g.addColorStop(0,   `rgba(${b.color},0.30)`);
      g.addColorStop(0.5, `rgba(${b.color},0.12)`);
      g.addColorStop(1,   `rgba(${b.color},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(bx, by, radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Fine animated dot grid
    for (let x = 0; x < W; x += 32) {
      for (let y = 0; y < H; y += 32) {
        const pulse = 0.12 + 0.08 * Math.sin(t * 0.006 + x * 0.01 + y * 0.01);
        ctx.fillStyle = `rgba(148,163,184,${pulse})`;
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    raf = requestAnimationFrame(draw);
  };
  draw();

  return () => { cancelAnimationFrame(raf); ro.disconnect(); };
}, []);
```

**Animation loop:** `requestAnimationFrame(draw)` schedules the next frame immediately after each draw call, creating a continuous loop that runs at the display's refresh rate (typically 60fps). The `t` counter increments by 1 each frame and is used as the time input to sine and cosine functions, producing smooth oscillating movement.

**Blob positions:** Each blob has a base position (`x`, `y` as 0–1 fractions of the canvas size), an oscillation amplitude (`amp`), and a speed (`speed`). On each frame, the actual drawn position is calculated as:

```
actualX = (baseX + sin(t × speed + blobIndex) × amp + mouseOffset) × canvasWidth
```

The `(mx - 0.5) * 0.04` term adds a subtle parallax: blobs drift slightly toward the cursor, making the animation feel alive and responsive without being distracting.

**`ResizeObserver`:** Canvas elements do not automatically scale with CSS — if the element's size changes (window resize, orientation change) but the canvas's internal pixel dimensions (`canvas.width`, `canvas.height`) don't update, the drawing will be stretched. The `ResizeObserver` fires the `resize` function whenever the canvas element changes size, keeping the pixel buffer in sync with the display size.

**Cleanup:** The `useEffect` return function calls `cancelAnimationFrame(raf)` and `ro.disconnect()`. Without this, navigating away from the login page would leave the animation loop and the observer running in the background, consuming CPU and potentially causing memory leaks.

**Mouse tracking:** The `onMouse` callback is wrapped in `useCallback` with an empty dependency array so it's created only once:

```tsx
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
```

Dividing by the viewport dimensions normalises the mouse coordinates to a 0–1 range regardless of screen size, which is then used directly in the blob position calculation above.

---

### Floating Poker Cards

```tsx
const CARDS = [
  { suit: "♠", value: "A", x: 14, y: 22, rot: -14, delay: 0,   scale: 1.1  },
  { suit: "♦", value: "K", x: 68, y: 12, rot:  8,  delay: 0.6, scale: 0.85 },
  // ...four more cards
];
```

Six poker cards are positioned absolutely across the left panel using CSS custom properties (`--r` for rotation, `--del` for animation delay, `--dur` for float duration, `--sc` for scale, `--op` for final opacity). All animation is pure CSS with no JavaScript involved:

**`cardRevealK` keyframe:** Cards begin invisible, slightly below their final position, and scaled down. They animate to their final state with a spring-like cubic-bezier easing. Each card has a different `--del` (delay) so they appear sequentially rather than all at once.

**`cardFloat` keyframe:** After revealing, cards loop through a subtle vertical bob (`translateY(-9px)` at 50%) on an infinite loop. Each card has a different `--dur` (duration between 5.5s and 9.2s) so they float at different rhythms and never look perfectly synchronised.

Red suits (♥ ♦) receive a rose-tinted color (`rgba(251,113,133,0.80)`), black suits (♠ ♣) receive a white-tinted color (`rgba(248,250,252,0.70)`), matching conventional card coloring.

The cards-stage div has `aria-hidden` because the cards are purely decorative and should not be read by screen readers.

---

### Ripple Effect

```tsx
const ripple = (e: React.MouseEvent<HTMLButtonElement>) => {
  const btn  = e.currentTarget;
  const rect = btn.getBoundingClientRect();
  const el   = document.createElement("span");
  const size = Math.max(rect.width, rect.height) * 2;

  el.style.cssText = `
    position:absolute; border-radius:50%; pointer-events:none;
    width:${size}px; height:${size}px;
    left:${e.clientX - rect.left - size/2}px;
    top:${e.clientY - rect.top - size/2}px;
    background:rgba(37,99,235,0.10);
    transform:scale(0); animation:rippleAnim 0.55s ease-out forwards;
  `;

  btn.appendChild(el);
  setTimeout(() => el.remove(), 560);
};
```

When the Google button is clicked, this function creates a circular `<span>` positioned exactly at the click coordinates relative to the button, then removes it after the 550ms animation completes. The `rippleAnim` keyframe (defined in the `<style>` block) scales it from 0 to full size while fading out, producing the Material Design ripple effect.

`e.clientX - rect.left - size/2` centres the span horizontally on the click point: `clientX` is the click's X position on the screen, `rect.left` converts it to be relative to the button, and `- size/2` offsets by half the span's width so it's centred on the point rather than starting from it.

---

### The Sign-In Button

```tsx
<button
  className="google-btn"
  onMouseEnter={() => setBtnState("hover")}
  onMouseLeave={() => setBtnState("idle")}
  onMouseDown={() => setBtnState("press")}
  onMouseUp={() => setBtnState("hover")}
  onClick={(e) => {
    ripple(e);
    signIn("google");
  }}
  aria-label="Continue with Google"
>
```

**`signIn("google")`** is imported from `next-auth/react`. Calling it with `"google"` triggers NextAuth to redirect the browser to Google's OAuth authorization URL, beginning the sign-in flow. It requires no other arguments because NextAuth already knows the `clientId`, `clientSecret`, and callback URLs from the server-side `authOptions` config.

**`aria-label`:** The button contains an SVG logo and text. The `aria-label` provides a clean label for screen readers in case the text alone isn't sufficient context.

---

### Layout Structure

The page is a two-column `flex` layout filling the full viewport:

```
┌─────────────────────────────┬──────────────────────────────┐
│         LEFT (52%)          │         RIGHT (48%)          │
│   Dark background (#07090f) │   Light background (#f5f6fa) │
│                             │                              │
│   [Canvas aurora animation] │   [Dot pattern background]   │
│   [Noise texture overlay]   │   [Ambient blue gradients]   │
│   [Vignette + edge fade]    │   [Vertical accent line]     │
│   [6 floating poker cards]  │                              │
│                             │   ┌────────────────────────┐ │
│   Provus wordmark (top)     │   │  • All systems ready   │ │
│                             │   │  Welcome back          │ │
│   "Every profitable         │   │  Sign in to access...  │ │
│    project starts here."    │   │                        │ │
│                             │   │  [Google button]       │ │
│   $5B+ | 70% | 100%         │   │                        │ │
│   (stat counters)           │   │  ── Agentic AI ──      │ │
│                             │   │  [Trust badges]        │ │
│   © 2025 Provus Inc (foot)  │   └────────────────────────┘ │
└─────────────────────────────┴──────────────────────────────┘
```

All CSS is written as a single inline `<style>` block using scoped class names (`.left`, `.right`, `.google-btn`, etc.) rather than Tailwind utilities. This was chosen because the page has many complex styles (layered pseudo-elements, CSS custom properties used as animation variables passed through `style` props) that would be cumbersome with Tailwind's utility-class model.

---

### Responsive Behaviour

```css
@media (max-width: 900px) {
  .left { display: none; }
  .right { width: 100%; }
}
```

On screens narrower than 900px, the left decorative panel is hidden entirely and the right sign-in panel expands to fill the full width. This gives mobile users a clean, focused sign-in screen without the animation overhead.

---

## Auth Error Page — `app/auth/error/page.tsx`

This page is shown when NextAuth redirects after a failed sign-in — specifically when the `signIn` callback in `route.ts` returns `false` (domain check failed) or when another NextAuth error occurs.

### How It Receives the Error

```tsx
const params = useSearchParams();
const error = params.get("error");
```

NextAuth redirects to `/auth/error?error=<ErrorType>` when sign-in fails. The `useSearchParams()` hook reads the `error` query parameter from the URL. In the case of a domain rejection, the value will be `"AccessDenied"`. Other possible values from NextAuth include `"Configuration"`, `"Verification"`, and `"Default"`, though this page currently displays the same "Access Denied" message for all of them since domain rejection is the only expected failure case for this application.

---

### Missing Error Guard

```tsx
useEffect(() => {
  if (!error) {
    router.replace("/login");
  }
}, [error, router]);

if (!error) return null;
```

If someone navigates to `/auth/error` directly without a `?error=` query parameter, there is nothing meaningful to display. The component immediately redirects them to `/login`. The `return null` prevents any flash of content during the redirect. The redirect uses `router.replace` so the empty error page is not added to the browser history.

---

### Countdown and Auto-Redirect

```tsx
const [count, setCount] = useState(5);

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
```

When an error is present, two timers run simultaneously:

**`setInterval` (every 1000ms):** Decrements the `count` state from 5 down to 0. This drives the countdown number displayed in the SVG ring and the text label.

**`setTimeout` (5000ms):** After 5 seconds, pushes the user to `/login`. This uses `router.push` (not `replace`) so the user can press back if they want to see the error message again.

**Cleanup function:** Both timers are cleared in the `useEffect` return. This is critical — if the component unmounts before 5 seconds (e.g. the user clicks "Return to Login Now"), the timers would continue running and attempt to update state on an unmounted component, causing a React warning and a potential crash.

**Why `setCount((prev) => prev - 1)` instead of `setCount(count - 1)`:** Using the functional updater form ensures each decrement is based on the most recent state value, not the value captured in the closure at the time the `setInterval` was created. Without this, `count` would be stale inside the interval callback and the decrement might not work correctly.

---

### Countdown Ring — SVG Mechanics

```tsx
<svg viewBox="0 0 36 36" className="-rotate-90">
  {/* Background track */}
  <circle cx="18" cy="18" r="15"
    fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5"
  />
  {/* Animated progress arc */}
  <circle cx="18" cy="18" r="15"
    fill="none" stroke="rgb(52,211,153)" strokeWidth="2.5"
    strokeDasharray="94.2"
    strokeDashoffset={94.2 - (count / 5) * 94.2}
    strokeLinecap="round"
    style={{ transition: "stroke-dashoffset 0.9s linear" }}
  />
</svg>
```

The countdown ring is drawn using SVG's `strokeDasharray` and `strokeDashoffset` technique:

**`strokeDasharray="94.2"`** sets the total dash length to the full circumference of the circle. A circle with radius 15 has circumference `2π × 15 ≈ 94.2`. Setting the dash to exactly this length means the stroke appears as one solid arc covering the whole circle.

**`strokeDashoffset`** shifts the starting point of the dash. When the offset equals the full circumference (94.2), none of the dash is visible. When it is 0, the full dash is visible. The formula:

```
offset = 94.2 - (count / 5) * 94.2
```

At `count=5`: offset = `94.2 - (5/5) × 94.2 = 0` → full circle visible  
At `count=3`: offset = `94.2 - (3/5) × 94.2 = 37.68` → 60% visible  
At `count=0`: offset = `94.2 - (0/5) × 94.2 = 94.2` → nothing visible

**`className="-rotate-90"`** rotates the SVG so the arc starts from the top of the circle (12 o'clock position) rather than the right (3 o'clock), matching the expected visual of a countdown timer.

**`transition: "stroke-dashoffset 0.9s linear"`** smoothly animates each 1-second decrement rather than jumping. The 0.9s duration is slightly shorter than the 1s interval so each transition completes before the next one starts.

---

### Layout and Visual Design

The page uses the same `#050d14` dark background as the rest of the homepage, creating visual consistency. Key design elements:

**Background layers:**
- A large, diffuse red radial glow (`bg-red-500/8`) centred above-middle signals an error state
- A subtle emerald glow in the bottom-right corner softens the all-red palette
- A 60px white grid at 4% opacity adds texture without competing with the content

**Glassmorphism card:** The error card uses `backdrop-filter: blur(12px)` with a very low-opacity white gradient background (`rgba(255,255,255,0.05)` to `rgba(255,255,255,0.02)`), giving it a frosted-glass appearance that floats above the background layers.

**Red accent line:** A 1px horizontal gradient at the very top of the card (`via-red-500/40`) acts as a subtle color-coded indicator of the error state without being harsh.

**Branding:** The ProvusPoker wordmark with the Spade icon appears above the card to make clear this is an internal tool, not a generic error page.

---

## Dashboard Page — `app/dashboard/page.tsx`

The dashboard is the first protected page a user sees after signing in. It demonstrates the correct pattern for consuming the session in a Client Component.

### Session Access

```tsx
const { data: session } = useSession();
```

`useSession()` returns the session object that was built by the `session` callback in `route.ts`. The `data` property contains `{ user: { id, name, email, image }, expires }`. The dashboard uses `session?.user?.email` and `session?.user?.name` to personalise the UI.

The middleware already guarantees that any user who reaches this page has a valid session — so `session` will not be `null` here under normal circumstances. The optional chaining (`?.`) is still used as a TypeScript safety measure since `useSession()` returns `null` during the initial loading period.

---

### Sign Out

```tsx
<button onClick={() => signOut({ callbackUrl: "/login" })}>
  <LogOut className="w-5 h-5" />
</button>
```

`signOut()` from `next-auth/react` clears the session cookie and calls the NextAuth sign-out endpoint. The `callbackUrl: "/login"` option ensures the user is redirected to the login page after signing out rather than to the default NextAuth sign-out confirmation page.

---

### UI Sections

The dashboard currently has three sections that demonstrate the intended layout, though the functionality is not yet wired up:

**Navigation bar:** Shows the Provus Poker brand mark, the user's email address (from `session.user.email`), and the sign-out button. It's sticky (`sticky top-0 z-50`) so it stays visible as content scrolls.

**Welcome header:** Greets the user by first name using `session?.user?.name?.split(' ')[0]`. The `.split(' ')[0]` extracts only the first word of the full name, so "Alice Johnson" becomes "Alice".

**Action grid:** Three cards for Create Session, Join Room, and History. These are currently visual placeholders — the onClick handlers are not yet implemented.

**Recent Sessions table:** Shows a dashed empty state with a "No active sessions found" message. This will eventually list past estimation sessions fetched from Supabase.

---

## Authentication Flow — User's Perspective

```
Unauthenticated user visits any URL
         │
         ├── Visits / or /login ────────────────────────────────▶ Login page renders
         │                                                               │
         │                                                    Clicks "Continue with Google"
         │                                                               │
         │                                              Google account picker appears
         │                                                               │
         │                                     ┌─────────────────────────────────────┐
         │                                     │                                     │
         │                           Picks @provusinc.com              Picks @gmail.com
         │                           or @provus.ai account             or other account
         │                                     │                                     │
         │                              ✅ signIn callback           ❌ signIn callback
         │                                  returns true                returns false
         │                                     │                                     │
         │                           Session cookie issued          Redirect to /auth/error
         │                                     │                    (5-second countdown)
         │                           Redirect to /dashboard                          │
         │                                                                 Redirect to /login
         │
         └── Visits /dashboard/* ─────────────────────────────▶ Middleware redirects to /login


Authenticated user visits any URL
         │
         ├── Visits / or /login ─────────────▶ Middleware redirects to /dashboard
         │
         └── Visits /dashboard/* ───────────▶ Page renders with session data
```

---

## Component Relationships

```
layout.tsx (Server Component)
└── Providers.tsx (Client Component)
    └── SessionProvider (from next-auth/react)
        ├── app/(auth)/login/page.tsx
        │   ├── useSession() → checks session, redirects if logged in
        │   └── signIn("google") → initiates OAuth flow
        │
        ├── app/auth/error/page.tsx
        │   ├── useSearchParams() → reads ?error= from URL
        │   └── useRouter() → auto-redirects to /login after 5s
        │
        └── app/dashboard/page.tsx
            ├── useSession() → reads user name, email, id
            └── signOut() → clears cookie, redirects to /login
```

---

## Known Issues and Improvements

These are existing issues in the codebase worth addressing in future work:

**1. Inconsistent accent colour**

The dashboard uses `lime-400` (`#a3e635`) for its accent colour while the homepage, login page, and error page all use `emerald-400` (`#34d399`). These are visually similar but different — standardising on `emerald-400` throughout would make the design more cohesive.

**2. Three fonts imported, one actually used**

`layout.tsx` imports `Inter`, `Geist`, and `Geist_Mono` but only applies `Inter` to the `<html>` element. The login page imports its own fonts (`Bricolage Grotesque`, `Fraunces`) via an inline `<style>` tag. This should be consolidated: either move the login page fonts into `layout.tsx` using `next/font/google`, or remove the unused `Geist` imports.

**3. Dashboard `useEffect` and `useRouter` are imported but unused**

`dashboard/page.tsx` imports `useEffect` from React and `useRouter` from Next.js navigation, but neither is used anywhere in the component. These should be removed to keep the import list clean.

**4. Login page trust badges reference wrong product**

The three trust badges in the login page's right panel say "Quote Optimizer", "Deal Predictor", and "Margin Protection" — these are Provus CPQ product features, not Planning Poker features. They should be updated to reflect the actual tool (e.g. "Real-time Voting", "Jira Sync", "Session History").

**5. `btnState` is tracked but not used**

The Google button tracks `"idle"`, `"hover"`, and `"press"` states via `setBtnState`, but the current render output doesn't read `btnState` anywhere — the button's visual states are handled entirely by CSS `:hover` and `:active` pseudo-classes. The state can be removed, or it can be put to use for more sophisticated JS-driven visual feedback.

**6. Dashboard action buttons are not wired up**

"Create Session", "Join Room", and "History" are visual placeholders with no `onClick` handlers. These will need to be implemented as the planning poker functionality is built out.