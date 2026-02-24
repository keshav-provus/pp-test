# Authentication — Backend Documentation

## Table of Contents

1. [Overview](#overview)
2. [File Map](#file-map)
3. [Environment Validation — `lib/env.ts`](#environment-validation--libenvts)
4. [Domain Constants — `lib/constants.ts`](#domain-constants--libconstantsts)
5. [NextAuth Route Handler — `api/auth/[...nextauth]/route.ts`](#nextauth-route-handler--apiauthNextauthroutets)
   - [Session Type Augmentation](#1-session-type-augmentation)
   - [Supabase Client](#2-supabase-client)
   - [Google Provider Configuration](#3-google-provider-configuration)
   - [Session Strategy](#4-session-strategy)
   - [The signIn Callback](#5-the-signin-callback)
   - [The jwt Callback](#6-the-jwt-callback)
   - [The session Callback](#7-the-session-callback)
   - [Custom Pages](#8-custom-pages)
   - [Route Handler Export](#9-route-handler-export)
6. [Middleware — `middleware.ts`](#middleware--middlewarets)
   - [Token Verification](#token-verification)
   - [Redirect Logic](#redirect-logic)
   - [Route Matcher](#route-matcher)
7. [How All Pieces Connect](#how-all-pieces-connect)
8. [Security Design Decisions](#security-design-decisions)
9. [Environment Variables Reference](#environment-variables-reference)

---

## Overview

The backend authentication system for Provus Planning Poker is built on **NextAuth.js v4** with **Google OAuth** as the sole sign-in provider. Access is strictly restricted to Provus employees — only email addresses ending in `@provusinc.com` or `@provus.ai` are permitted. After a successful sign-in, the user's profile is upserted into a **Supabase** database. Sessions are stored entirely in **signed JWT cookies** with no server-side session table needed.

The system is composed of four files, each with a single well-defined responsibility:

| File | Responsibility |
|---|---|
| `lib/env.ts` | Validates all required environment variables exist at startup |
| `lib/constants.ts` | Single source of truth for the allowed email domains |
| `api/auth/[...nextauth]/route.ts` | NextAuth config: provider setup, callbacks, session strategy |
| `middleware.ts` | Intercepts every request and enforces auth on protected routes |

---

## File Map

```
src/
├── lib/
│   ├── env.ts                              ← Env var validation & export
│   └── constants.ts                        ← Allowed email domains
├── app/
│   └── api/
│       └── auth/
│           └── [...nextauth]/
│               └── route.ts                ← NextAuth config & HTTP handler
└── middleware.ts                            ← Request interception & redirects
```

---

## Environment Validation — `lib/env.ts`

```ts
const requiredEnvs = {
    GOOGLE_CLIENT_ID:            process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET:        process.env.GOOGLE_CLIENT_SECRET,
    NEXT_PUBLIC_SUPABASE_URL:    process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY:   process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXTAUTH_SECRET:             process.env.NEXTAUTH_SECRET,
};

Object.entries(requiredEnvs).forEach(([key, value]) => {
    if (!value) {
        throw new Error(`Missing Environment Variable: ${key}`);
    }
});

export const env = requiredEnvs as Record<keyof typeof requiredEnvs, string>;
```

### What it does

This file is a startup guard. It iterates over every required environment variable and throws an immediate, descriptive error if any are missing. Without it, the application would start silently and only fail at the exact moment a feature tries to use the missing value — which may be deep inside a user action at runtime, making the root cause much harder to diagnose.

### Why `as Record<keyof typeof requiredEnvs, string>`

After the `forEach` loop, TypeScript still types each value as `string | undefined` because it cannot statically prove the runtime check eliminated the `undefined` case. The cast at the end tells TypeScript: "trust that the validation above means these are all strings." This is safe because the `throw` inside the loop guarantees execution never continues past it if any value is missing.

### How it's used

All other backend files import `env` instead of accessing `process.env` directly:

```ts
import { env } from "@/lib/env";

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,   // always a string — never undefined
  env.SUPABASE_SERVICE_ROLE_KEY
);
```

This eliminates the need to write `process.env.X!` non-null assertions scattered throughout the codebase, and centralises the "crash early with a useful message" behaviour in one place.

---

## Domain Constants — `lib/constants.ts`

```ts
export const ALLOWED_DOMAINS = ["provusinc.com", "provus.ai"] as const;
```

### What it does

Exports the list of permitted email domains as a typed constant. Both the `signIn` callback in `route.ts` and the middleware in `middleware.ts` import from here rather than repeating the strings themselves.

### Why this matters

Before this constant existed, the domain strings were duplicated in two separate files. If only one file was updated when adding a new domain (e.g. `@provus.com`), the two enforcement layers would silently disagree about who is allowed in — a subtle but serious security inconsistency that would be hard to catch in code review. A single source of truth means any change requires editing exactly one line in exactly one file.

### `as const`

The `as const` assertion narrows the TypeScript type from a mutable `string[]` to a readonly tuple `readonly ["provusinc.com", "provus.ai"]`. This lets TypeScript reason about the exact literal string values, makes the array immutable at runtime, and gives better autocomplete when the value is used elsewhere.

---

## NextAuth Route Handler — `api/auth/[...nextauth]/route.ts`

This is the core of the authentication backend. The `[...nextauth]` folder name is a Next.js App Router catch-all segment — it means **all requests to `/api/auth/*`** are handled by this single file. This includes `/api/auth/signin`, `/api/auth/callback/google`, `/api/auth/session`, `/api/auth/signout`, and every other NextAuth endpoint.

---

### 1. Session Type Augmentation

```ts
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
```

**What this does:** NextAuth's default `Session["user"]` type only has `name`, `email`, and `image`. This `declare module` block merges an additional `id: string` field into it, so any component calling `useSession()` can access `session.user.id` without a TypeScript error.

**Why `& DefaultSession["user"]`:** The `&` (intersection) combines the new `{ id: string }` shape with the existing default fields rather than replacing them. Without the intersection, declaring `user` with only `id` would strip out `name`, `email`, and `image` from the type.

**Important:** This is compile-time only — it only affects type checking. The actual `id` value is populated at runtime by the `session` callback described below.

---

### 2. Supabase Client

```ts
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);
```

**Why the Service Role Key:** The Supabase Service Role Key bypasses Row Level Security (RLS) on all database tables. This is intentional here — at the moment the `signIn` callback runs, there is no authenticated Supabase session for the user yet (they're in the middle of signing in), so a standard user token would be rejected. The service role allows the server to write the profile row unconditionally on behalf of the user.

**Why created at module level:** The client is instantiated once when the module is first imported, not on every request. Creating a new Supabase client per request would be wasteful and slower. Since the credentials never change, one instance for the lifetime of the server process is correct.

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` has full database access. It has no `NEXT_PUBLIC_` prefix, which means Next.js will never bundle it into client-side JavaScript. It must only ever be used in server-side files.

---

### 3. Google Provider Configuration

```ts
GoogleProvider({
  clientId: env.GOOGLE_CLIENT_ID,
  clientSecret: env.GOOGLE_CLIENT_SECRET,
  authorization: {
    params: {
      prompt: "select_account",
      access_type: "offline",
      response_type: "code",
    },
  },
  profile(profile: GoogleProfile) {
    return {
      id: profile.sub,
      name: profile.name,
      email: profile.email,
      image: profile.picture,
    };
  },
}),
```

**`prompt: "select_account"`:** Forces Google to always show the account selection screen, even if the user already has an active Google session in the browser. Without this, if a developer has a personal Gmail open, Google might silently use that account for the OAuth flow — bypassing the domain check entirely.

**`access_type: "offline"` and `response_type: "code"`:** These parameters enable the **Authorization Code flow**, where Google returns a short-lived authorization code that the server then exchanges for access and refresh tokens. This is significantly more secure than the alternative Implicit flow, which returns tokens directly in the browser URL where they can be captured by browser history or extensions.

**`profile()` function:** Google's OAuth profile uses its own field names (`sub`, `picture`) which differ from NextAuth's standard User shape (`id`, `image`). This function maps between them. `profile.sub` is Google's stable unique identifier for a user — it never changes even if the user changes their Google email address, making it the correct value to store as the user's permanent `id`.

---

### 4. Session Strategy

```ts
session: {
  strategy: "jwt",
  maxAge: 24 * 60 * 60, // 24 hours in seconds
},
```

**`strategy: "jwt"`:** User sessions are stored in a signed, encrypted cookie on the user's browser. There is no session table in the database — the server reconstructs the session from the cookie on every request by verifying the JWT signature.

**Why JWT instead of database sessions:**
- No database query required per request — inherently faster
- Stateless and horizontally scalable — any server instance can verify any token without shared state
- Session data is self-contained in the cookie

**`maxAge: 86400` (24 hours):** Sessions expire 24 hours after they are issued. The `updateAge` option is not set, which means the expiry clock does not reset with user activity — it is a fixed-length window from the moment of sign-in. After expiry, the cookie is invalid and `getToken()` returns `null`, triggering the middleware to redirect to `/login`.

---

### 5. The signIn Callback

This is the most security-critical piece of code in the entire project. It runs once, immediately after Google successfully authenticates a user, and makes the final allow/deny decision.

```ts
async signIn({ user, profile }) {
  // Step 1 — Email must exist
  const email = profile?.email;
  if (!email) return false;

  // Step 2 — Email must end with an allowed domain
  const isAllowed = ALLOWED_DOMAINS.some(
    (domain) => email.endsWith(`@${domain}`)
  );
  if (!isAllowed) return false;

  // Step 3 — Sync user profile to Supabase
  try {
    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        email: user.email,
        display_name: user.name,
        avatar_url: user.image,
        last_login: new Date().toISOString(),
      },
      { onConflict: "email" }
    );

    if (error) {
      console.error("Supabase Sync Error:", error.message);
      return false;
    }
  } catch (e) {
    console.error("Critical Sync Error:", e);
    return false;
  }

  return true;
}
```

**Return values:** `true` allows the sign-in to continue and issues a session cookie. `false` blocks the sign-in and redirects the user to the `/auth/error` page (configured under [Custom Pages](#8-custom-pages)).

**Step 1 — Email guard:** `profile?.email` uses optional chaining because `profile` is typed as potentially undefined for non-OAuth providers. If there is no email at all, there is nothing to validate, so the sign-in is blocked immediately.

**Step 2 — Domain check:** `ALLOWED_DOMAINS.some(domain => email.endsWith(`@${domain}`))` is the allow-list check. The `endsWith` approach ensures the allowed domain is the actual *suffix* of the full email address — not merely a substring of it. This correctly blocks attempts like `user@notprovus.ai` (fails `endsWith("@provus.ai")`) or `provus.ai@evil.com` (the domain part is `evil.com`, not `provus.ai`).

**Step 3 — Supabase upsert:** After the domain check passes, the user's profile is written to the `profiles` table. The `upsert` operation inserts the row if it doesn't exist, or updates it if it does (based on the `email` conflict column). This keeps the `last_login` timestamp current on every sign-in without creating duplicate rows. Any database failure — whether a returned `error` object or a thrown exception — blocks the sign-in completely and logs the issue server-side. The user is never left in a partially authenticated state.

---

### 6. The jwt Callback

```ts
async jwt({ token, user }) {
  if (user) {
    token.sub = user.id;
  }
  return token;
},
```

**When it runs:** On every request that touches the NextAuth session — but `user` is only present on the very first call during sign-in. On all subsequent requests (page navigations, `useSession()` calls, API calls), `user` is `undefined` and the existing token is returned unchanged.

**What it does:** On sign-in, stamps `user.id` (Google's `profile.sub`) onto the token as `token.sub`. The `sub` (subject) field is the standard JWT claim for identifying who the token belongs to.

**Why `token.sub` specifically:** `sub` is the conventional JWT field for user identity. Placing the ID here means it follows the standard JWT specification and is automatically available to the `session` callback and to any code that calls `getToken()` directly, without needing a custom field name.

---

### 7. The session Callback

```ts
async session({ session, token }) {
  if (session.user && token.sub) {
    session.user.id = token.sub as string;
  }
  return session;
},
```

**When it runs:** Every time a component calls `useSession()` or `getServerSession()`, and every time the `/api/auth/session` endpoint is polled.

**What it does:** Copies `token.sub` from the JWT into `session.user.id` so the frontend can access the user's stable ID. Without this step, the client would only ever see `name`, `email`, and `image` from the default session shape — the ID would be trapped inside the JWT cookie, inaccessible to React components.

**Why both guards (`session.user && token.sub`):**
- `session.user` could be undefined if the session shape is malformed or if a sign-in hasn't completed cleanly
- `token.sub` could be undefined if this callback runs before the `jwt` callback has had a chance to set it (an edge case during the very first sign-in)

The `as string` cast is needed because `token.sub` is typed as `string | undefined`, but the `if` check above guarantees it is a string at the point of assignment.

---

### 8. Custom Pages

```ts
pages: {
  signIn: "/login",
  error: "/auth/error",
},
```

**`signIn: "/login"`:** Replaces NextAuth's built-in sign-in UI (at `/api/auth/signin`) with the custom-built login page at `/login`.

**`error: "/auth/error"`:** When the `signIn` callback returns `false`, or any other NextAuth error occurs, the user is redirected to `/auth/error?error=<ErrorType>`. The frontend error page reads the `error` query parameter and renders the appropriate message. Without this configuration, NextAuth would redirect to its own generic error page.

---

### 9. Route Handler Export

```ts
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

NextAuth needs to respond to both HTTP methods because the OAuth flow uses both:
- **GET** — for redirecting to Google's login page and serving the sign-in UI
- **POST** — for receiving the OAuth callback from Google and processing credentials

Next.js App Router requires named exports matching HTTP method names. The same `handler` function handles both, since NextAuth internally inspects the request method and routes accordingly.

---

## Middleware — `middleware.ts`

```ts
export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: env.NEXTAUTH_SECRET
  });

  const { pathname } = req.nextUrl;
  const isAuthenticated = !!token;

  if (isAuthenticated && (pathname === "/" || pathname === "/login")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (!isAuthenticated && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/dashboard/:path*"],
};
```

### Token Verification

`getToken()` from `next-auth/jwt` reads the session cookie from the incoming request and cryptographically verifies its signature using `NEXTAUTH_SECRET`. If the cookie exists and the signature is valid, it returns the decoded JWT payload. If the cookie is missing, expired, or tampered with, it returns `null`.

This means the middleware performs **zero database queries** — authentication state is determined entirely by in-memory cryptography. This makes it extremely fast and adds no latency overhead on every request.

---

### Redirect Logic

The middleware enforces two rules on every matched request:

**Rule 1 — Redirect authenticated users away from public pages:**

```ts
if (isAuthenticated && (pathname === "/" || pathname === "/login")) {
  return NextResponse.redirect(new URL("/dashboard", req.url));
}
```

If a user who already has a valid session tries to visit `/` or `/login`, they are immediately sent to `/dashboard`. This prevents the confusing situation where a logged-in user sees the login screen again (e.g. if they navigate back in their browser history).

**Rule 2 — Redirect unauthenticated users away from protected pages:**

```ts
if (!isAuthenticated && pathname.startsWith("/dashboard")) {
  return NextResponse.redirect(new URL("/login", req.url));
}
```

If a request arrives for any `/dashboard` route without a valid session cookie, it is redirected to `/login`. This is the primary access control gate for the application — the dashboard is completely unreachable without authentication.

**Neither rule matches:** `NextResponse.next()` passes the request through to the page normally. This covers cases like an unauthenticated user on `/` or `/login`, which should render normally.

---

### Route Matcher

```ts
export const config = {
  matcher: ["/", "/login", "/dashboard/:path*"],
};
```

The `matcher` tells Next.js which URL patterns the middleware should intercept. Routes not listed here — including all static files, images, fonts, and API routes — bypass the middleware entirely. This keeps the performance overhead minimal.

**`/dashboard/:path*`** matches `/dashboard` and all sub-paths beneath it: `/dashboard/room/123`, `/dashboard/settings`, etc. As new pages are added under `/dashboard`, they are automatically protected without any changes to the middleware.

---

## How All Pieces Connect

Here is the complete journey from an unauthenticated user to a fully loaded dashboard:

```
① User visits /
   → middleware runs: no token → not /dashboard → NextResponse.next()
   → homepage renders
         │
② User clicks Sign In → navigates to /login
   → middleware runs: no token → not /dashboard → NextResponse.next()
   → login page renders
         │
③ User clicks "Continue with Google"
   → signIn("google") called from the frontend
   → NextAuth redirects browser to Google's OAuth server
         │
④ User selects their @provusinc.com Google account
   → Google redirects to /api/auth/callback/google with an auth code
         │
⑤ NextAuth exchanges the code for a Google profile
   → signIn callback fires:
       email = "alice@provusinc.com"
       endsWith("@provusinc.com") → ✅ allowed
       Supabase upsert → ✅ success
       returns true
         │
⑥ jwt callback fires:
   → token.sub = user.id (Google's stable sub)
   → Signed JWT cookie set in browser
         │
⑦ NextAuth redirects to / (default post-login redirect)
         │
⑧ middleware runs on /:
   → getToken() → finds cookie → authenticated ✅
   → pathname is "/" → Rule 1 matches → redirect to /dashboard
         │
⑨ middleware runs on /dashboard:
   → authenticated → not / or /login → Rule 1 no match
   → authenticated → Rule 2 no match
   → NextResponse.next() → dashboard renders
         │
⑩ Dashboard calls useSession()
   → session callback fires:
       session.user.id = token.sub
   → Component receives: { user: { id, name, email, image } }
```

---

## Security Design Decisions

### `endsWith` for domain checking

The `signIn` callback uses `email.endsWith(`@${domain}`)` rather than `email.includes(domain)`. This is deliberate — `includes` would match `user@notprovus.ai`, `provus.ai@evil.com`, and `user@provus.ai.phish.net`. The `endsWith` check with the `@` prefix ensures only exact domain suffixes are accepted:

- `user@provus.ai` → ✅ `endsWith("@provus.ai")` matches
- `user@notprovus.ai` → ❌ ends with `@notprovus.ai`
- `provus.ai@evil.com` → ❌ ends with `@evil.com`
- `user@provus.ai.phish.net` → ❌ ends with `@provus.ai.phish.net`

### Service Role Key is server-only

`SUPABASE_SERVICE_ROLE_KEY` is used only inside `route.ts`, which is an API route — Next.js never bundles API route code into client-side JavaScript. The variable also has no `NEXT_PUBLIC_` prefix, providing a second layer of protection: even if someone misconfigured Next.js, the key would not appear in the client bundle.

### `prompt: "select_account"` prevents silent account reuse

Without this OAuth parameter, a developer with their personal Gmail signed in on the same browser could inadvertently (or maliciously) attempt to authenticate using that account. The account picker forces conscious, explicit account selection on every sign-in, ensuring the correct Provus account is always used.

### Fast middleware via JWT — no DB calls on every request

The middleware uses `getToken()` which only performs cryptographic signature verification — no network calls, no database queries. This keeps authentication enforcement essentially free from a latency perspective. The database is only touched once at sign-in time via the `signIn` callback.

---

## Environment Variables Reference

| Variable | Server/Client | Purpose |
|---|---|---|
| `GOOGLE_CLIENT_ID` | Server | OAuth 2.0 Client ID from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Server | OAuth 2.0 Client Secret from Google Cloud Console |
| `NEXT_PUBLIC_SUPABASE_URL` | Both | Supabase project URL — safe to expose client-side |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Full-access DB key — **never expose to browser** |
| `NEXTAUTH_SECRET` | Server | Signs and encrypts JWT session cookies |
| `NEXTAUTH_URL` | Dev only | Full base URL (e.g. `http://localhost:3000`). Not required on Vercel |

**Generating `NEXTAUTH_SECRET`:**

```bash
openssl rand -base64 32
```

**Where to set them:**

| Environment | Location |
|---|---|
| Local development | `.env.local` — git-ignored by default |
| Production | Environment variable settings in your host (Vercel, etc.) |
| Never | `.env` committed to version control |