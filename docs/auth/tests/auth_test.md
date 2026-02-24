# Authentication Unit Tests — Documentation

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Setup & Configuration](#setup--configuration)
   - [jest.config.ts](#jestconfigts)
   - [jest.setup.ts](#jestsetupts)
   - [tsconfig.json](#tsconfigjson)
5. [How Authentication Works](#how-authentication-works)
6. [Test Files](#test-files)
   - [signIn.callback.test.ts](#signin-callback)
   - [jwt-session.callbacks.test.ts](#jwt--session-callbacks)
   - [middleware.authorized.test.ts](#middleware-authorized-callback)
7. [Mocking Strategy](#mocking-strategy)
8. [TypeScript Patterns Used](#typescript-patterns-used)
9. [Known Gotchas & Solutions](#known-gotchas--solutions)
10. [Running the Tests](#running-the-tests)
11. [Test Coverage Summary](#test-coverage-summary)

---

## Overview

This suite contains **unit tests** for the authentication layer of the Provus Planning Poker application. Authentication is handled by **NextAuth.js** with a **Google OAuth** provider, restricted to users with `@provusinc.com` or `@provus.ai` email domains. After a successful sign-in, user data is synced to a **Supabase** database.

The tests verify three distinct layers of the auth system:

| Layer | File Tested | What It Does |
|---|---|---|
| Sign-in gate | `route.ts` → `signIn` callback | Decides whether a Google login attempt is allowed or rejected |
| Token pipeline | `route.ts` → `jwt` + `session` callbacks | Builds and passes the user's identity through the session |
| Route protection | `middleware.ts` → `authorized` callback | Blocks unauthenticated or unauthorized users from accessing protected pages |

All tests are **unit tests only** — no real network calls, no real database, no browser. Everything external is mocked.

---

## Tech Stack

| Tool | Purpose |
|---|---|
| [Jest](https://jestjs.io/) | Test runner and assertion library |
| [ts-jest](https://kulshekhar.github.io/ts-jest/) | Runs TypeScript test files directly without a separate compile step |
| [@types/jest](https://www.npmjs.com/package/@types/jest) | TypeScript type definitions for Jest globals (`describe`, `it`, `expect`, etc.) |
| [NextAuth.js v4](https://next-auth.js.org/) | Authentication library being tested |
| [Supabase JS](https://supabase.com/docs/reference/javascript/introduction) | Database client — fully mocked in tests |

### Installation

```bash
npm install -D jest ts-jest @types/jest
```

---

## Project Structure

```
planning-poker/
├── jest.config.ts                          ← Jest configuration
├── jest.setup.ts                           ← Environment variable injection
├── src/
│   ├── app/
│   │   └── api/
│   │       └── auth/
│   │           └── [...nextauth]/
│   │               └── route.ts            ← Source: NextAuth config & callbacks
│   ├── middleware.ts                        ← Source: Route protection
│   └── __tests__/
│       └── auth/
│           ├── signIn.callback.test.ts     ← Tests for the signIn callback
│           ├── jwt-session.callbacks.test.ts ← Tests for jwt + session callbacks
│           └── middleware.authorized.test.ts ← Tests for middleware
```

---

## Setup & Configuration

### jest.config.ts

```ts
import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",           // Use ts-jest to compile TypeScript on the fly
  testEnvironment: "node",     // Run in Node (not jsdom) — no browser APIs needed
  roots: ["<rootDir>/src"],    // Only look for tests inside /src
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",  // Resolve the @/ path alias (same as tsconfig)
  },
  setupFiles: ["<rootDir>/jest.setup.ts"],      // Runs before each test file
  testMatch: ["**/__tests__/**/*.test.ts"],      // Only pick up .test.ts files
  clearMocks: true,            // Reset mock state between every test automatically
};
```

**Key decisions:**
- `preset: "ts-jest"` means you do not need to compile TypeScript first — Jest handles it inline.
- `clearMocks: true` ensures that mock call counts, return values, and implementations do not leak between tests.
- `moduleNameMapper` is critical — without it, any import using `@/` would fail because Node doesn't understand that alias.

---

### jest.setup.ts

```ts
process.env.NEXT_PUBLIC_SUPABASE_URL    = "https://test.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY   = "test-service-role-key";
process.env.GOOGLE_CLIENT_ID            = "test-google-client-id";
process.env.GOOGLE_CLIENT_SECRET        = "test-google-client-secret";
process.env.NEXTAUTH_SECRET             = "test-nextauth-secret";
process.env.NEXTAUTH_URL                = "http://localhost:3000";
```

**Why this file exists:**

The `route.ts` file calls `createClient()` at the **module level** (outside any function), which means it runs the moment the file is imported. If `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` are not set at that point, the Supabase client throws an error before any test even runs.

`setupFiles` runs these assignments **before** any test file is imported, which guarantees the environment is ready in time.

> ⚠️ These are fake values — they are never sent anywhere because Supabase is fully mocked.

---

### tsconfig.json

Add `"jest"` to the `types` array so TypeScript recognises all Jest globals project-wide:

```json
{
  "compilerOptions": {
    "types": ["jest", "node"]
  }
}
```

Without this, TypeScript will show errors like:
- `Cannot find name 'describe'`
- `Cannot find name 'it'`
- `Cannot find name 'expect'`
- `Cannot find name 'jest'`

These are type errors only — the tests still run — but your editor and CI will report them as failures.

---

## How Authentication Works

Understanding the source code makes the tests much easier to follow.

### The sign-in flow

```
User clicks "Sign in with Google"
        │
        ▼
Google OAuth returns a profile with an email address
        │
        ▼
[signIn callback] ── Is the email @provusinc.com or @provus.ai?
        │                    │
       NO                   YES
        │                    │
        ▼                    ▼
  Redirect to          Upsert user into
  /auth/error          Supabase profiles table
                             │
                        Success? ── NO ──▶ Return false (block sign-in)
                             │
                            YES
                             │
                             ▼
                    Return true (allow sign-in)
                             │
                             ▼
              [jwt callback] ── Attach user.id to the token as token.sub
                             │
                             ▼
           [session callback] ── Expose token.sub as session.user.id
                             │
                             ▼
                  User lands on /dashboard
```

### The route protection flow

```
User requests /dashboard (or any /dashboard/* route)
        │
        ▼
[middleware authorized callback]
        │
  Does a valid JWT token exist AND does its email end with
  @provusinc.com or @provus.ai?
        │
       NO ──▶ Redirect to /login
        │
       YES ──▶ Allow request through
```

---

## Test Files

---

### signIn Callback

**File:** `src/__tests__/auth/signIn.callback.test.ts`

This is the most security-critical test file. It tests the `signIn` callback inside `authOptions`, which is the primary gatekeeper for the entire application.

#### What the signIn callback does in source code

```ts
async signIn({ user, profile }) {
  const email = profile?.email;
  if (!email) return false;                          // No email → block

  const allowedDomains = ["provusinc.com", "provus.ai"];
  const isAllowed = allowedDomains.some(
    domain => email.endsWith(`@${domain}`)           // Domain check
  );
  if (!isAllowed) return false;                      // Wrong domain → block

  // Sync to Supabase
  const { error } = await supabase.from('profiles').upsert({ ... });
  if (error) return false;                           // DB error → block

  return true;                                       // All good → allow
}
```

#### Suite 1 — Domain Validation (11 tests)

Tests whether the allow-list logic correctly permits or denies email addresses.

**Allowed domain tests:**

| Test | Email | Expected |
|---|---|---|
| Standard provusinc.com email | `alice@provusinc.com` | ✅ `true` |
| Standard provus.ai email | `bob@provus.ai` | ✅ `true` |
| Complex local part (dots, plus) | `first.last+tag@provusinc.com` | ✅ `true` |

**Blocked domain tests:**

| Test | Email | Expected |
|---|---|---|
| Public Gmail account | `attacker@gmail.com` | ❌ `false` |
| Unknown corporate domain | `user@other-company.com` | ❌ `false` |

**Spoofing edge case tests:**

These are the most important security tests. They verify that the `endsWith` check cannot be tricked by clever email formatting.

| Test | Email | Why It's Dangerous | Expected |
|---|---|---|---|
| Substring in domain | `user@notprovus.ai` | `notprovus.ai` contains `provus.ai` but `endsWith('@provus.ai')` correctly rejects it | ❌ `false` |
| Domain as prefix | `user@provus.ai.evil.com` | Attacker registers `provus.ai.evil.com` — the allowed domain appears at the start, not the end | ❌ `false` |
| Domain as prefix (2) | `user@provusinc.com.phish.net` | Same attack with the other allowed domain | ❌ `false` |
| Domain in local part | `provusinc.com@evil.com` | The allowed domain appears before the `@`, not after it | ❌ `false` |

**Missing email tests:**

| Test | Input | Expected |
|---|---|---|
| Email is undefined | `profile.email = undefined` | ❌ `false` |
| Email is empty string | `profile.email = ""` | ❌ `false` |

#### Suite 2 — Supabase Upsert Behavior (5 tests)

Tests whether the database sync behaves correctly for all outcomes.

| Test | Setup | Expected |
|---|---|---|
| Correct payload is sent | Upsert succeeds | `mockFrom` called with `"profiles"`, `mockUpsert` called with `id`, `email`, `display_name`, `avatar_url`, `last_login` |
| Upsert succeeds | Returns `{ error: null }` | Sign-in returns `true` |
| Upsert returns error object | Returns `{ error: { message: "..." } }` | Sign-in returns `false`, logs `"Supabase Sync Error:"` |
| Upsert throws exception | `mockRejectedValue(new Error(...))` | Sign-in returns `false`, logs `"Critical Sync Error:"` |
| Blocked domain never touches DB | Email is `hacker@evil.com` | `mockUpsert` is **never called** |

The last test is important — it confirms that the domain check happens **before** any database call, so blocked users never create any load on the database at all.

---

### JWT & Session Callbacks

**File:** `src/__tests__/auth/jwt-session.callbacks.test.ts`

Tests the two callbacks that build and expose the user's identity across requests.

#### How the JWT strategy works

NextAuth with `strategy: "jwt"` does not use a database to store sessions. Instead:

1. **On first sign-in** — the `jwt` callback receives the `user` object (from Google) and attaches `user.id` to the token as `token.sub`.
2. **On every subsequent request** — the `jwt` callback is called again, but `user` is `undefined`. It simply returns the existing token unchanged.
3. **When a component calls `useSession()`** — the `session` callback runs, copying `token.sub` into `session.user.id` so the frontend can access the user's ID.

#### Suite 1 — jwt callback (4 tests)

| Test | Scenario | What Is Verified |
|---|---|---|
| First sign-in | `user` object is present | `result.sub` equals `user.id` |
| Subsequent request | `user` is absent | `result` equals the original token exactly |
| Subsequent request | Token already has `sub` | `sub` is not overwritten |
| First sign-in | Token has other fields (name, email, picture) | All other fields are preserved alongside the new `sub` |

#### Suite 2 — session callback (4 tests)

| Test | Scenario | What Is Verified |
|---|---|---|
| Normal session | Token has `sub` | `session.user.id` equals `token.sub` |
| Missing sub | Token has no `sub` field | `session.user.id` is not changed |
| Field preservation | Session has name, email, image | All three fields survive the callback untouched |
| No user object | `session.user` is undefined | Callback resolves without throwing |

---

### Middleware Authorized Callback

**File:** `src/__tests__/auth/middleware.authorized.test.ts`

Tests the `authorized` function inside `middleware.ts`, which is the **second line of defence** after the `signIn` callback.

#### Why two layers of domain checking?

The `signIn` callback only runs once — when the user first signs in. After that, the JWT token is issued and stored in a cookie. The middleware runs on **every single request** to a protected route, re-checking the email in the token. This means:

- If someone somehow obtained a valid JWT for a blocked domain, the middleware would still reject them.
- Both layers must agree on what counts as an allowed domain.

This is why the middleware tests intentionally mirror the spoofing test cases from `signIn.callback.test.ts` — we want to confirm that both layers enforce the same rules.

#### The authorized function under test

```ts
function authorized({ token }: { token: JWT | null }): boolean {
  const email = token?.email || "";
  return (
    !!token &&
    (email.endsWith("@provusinc.com") || email.endsWith("@provus.ai"))
  );
}
```

#### All 12 tests

**No token (unauthenticated):**

| Test | Token | Expected |
|---|---|---|
| Token is null | `null` | ❌ `false` |
| Token is undefined | `undefined` | ❌ `false` |

**Allowed domains:**

| Test | Email | Expected |
|---|---|---|
| provusinc.com | `alice@provusinc.com` | ✅ `true` |
| provus.ai | `bob@provus.ai` | ✅ `true` |
| Complex local part | `first.last+work@provusinc.com` | ✅ `true` |

**Blocked domains:**

| Test | Email | Expected |
|---|---|---|
| Gmail | `attacker@gmail.com` | ❌ `false` |
| Unknown corporate | `user@another-company.com` | ❌ `false` |

**Missing email in token:**

| Test | Token | Expected |
|---|---|---|
| Email field absent | `{ sub: "u6" }` (no email) | ❌ `false` |
| Email is empty string | `{ sub: "u7", email: "" }` | ❌ `false` |

**Spoofing edge cases (mirrors signIn tests):**

| Test | Email | Expected |
|---|---|---|
| Allowed domain as prefix in hostname | `user@provus.ai.evil.com` | ❌ `false` |
| Allowed domain as prefix in hostname (2) | `user@provusinc.com.phish.net` | ❌ `false` |
| Allowed domain in local part | `provus.ai@evil.com` | ❌ `false` |
| Allowed domain as substring | `user@notprovusinc.com` | ❌ `false` |

---

## Mocking Strategy

### Why mock at all?

Unit tests test **one thing in isolation**. If a test for the `signIn` callback also talks to a real Supabase database, then a test failure could mean either "the callback logic is wrong" or "the database is down" or "the network is slow". Mocking removes everything external so failures can only mean one thing: the code being tested is wrong.

### Mocking Supabase

The Supabase client is created at module level in `route.ts`:

```ts
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

We mock the entire `@supabase/supabase-js` package so `createClient` returns a fake object that we control:

```ts
jest.mock("@supabase/supabase-js", () => {
  const mockUpsert = jest.fn();
  const mockFrom = jest.fn(() => ({ upsert: mockUpsert }));
  return {
    createClient: jest.fn(() => ({ from: mockFrom })),
  };
});
```

In each test we control what `mockUpsert` returns:
- `mockUpsert.mockResolvedValue({ error: null })` → simulate success
- `mockUpsert.mockResolvedValue({ error: { message: "..." } })` → simulate a DB error
- `mockUpsert.mockRejectedValue(new Error(...))` → simulate a thrown exception

### Mocking Google Provider

NextAuth's `GoogleProvider` tries to fetch OAuth metadata from Google's servers when initialised. We mock the entire provider to return a simple static object instead:

```ts
jest.mock("next-auth/providers/google", () =>
  jest.fn(() => ({ id: "google", name: "Google", type: "oauth" }))
);
```

---

## TypeScript Patterns Used

### 1. Deriving callback parameter types with `Parameters<>`

Instead of manually writing out what a callback expects, we extract the type directly from the function:

```ts
type SignInParams = Parameters<typeof signInCallback>[0];
```

This means if NextAuth ever changes the signature of the `signIn` callback, TypeScript will immediately show an error at every place we build a `SignInParams` object — telling us exactly what needs to be updated rather than silently passing wrong data.

### 2. The `unknown` bridge for structurally impossible states

NextAuth's type definitions require `user` and `account` on every `JwtParams` call, even though they are `undefined` at runtime after the first sign-in. This is a known mismatch between NextAuth's types and its actual runtime behaviour for JWT sessions.

The correct way to handle this without using `any`:

```ts
user: undefined as unknown as User,
```

- `any` would silently bypass all type checks everywhere.
- `unknown as T` is the narrowest possible escape — it acknowledges the mismatch in one place and keeps the rest of the type safe.

### 3. Type narrowing with `in` guard

`Session["user"]` is a union of two shapes: one with `id`, one without. TypeScript won't let you access `.id` directly. The `in` operator narrows the union:

```ts
function getUserId(user: Session["user"] | undefined): string | undefined {
  if (user && "id" in user) return user.id;  // TypeScript now knows `id` exists
  return undefined;
}
```

This is the idiomatic TypeScript approach — use the type system's built-in narrowing rather than casting.

---

## Known Gotchas & Solutions

### Gotcha 1 — `jest.mock` hoisting causes ReferenceError

**Problem:** `jest.mock()` calls are hoisted by ts-jest to the top of the compiled file, before any `const` statements. So this fails:

```ts
const mockUpsert = jest.fn();  // ← not yet initialized when jest.mock runs

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({ upsert: mockUpsert })),  // ← ReferenceError
}));
```

**Solution:** Define mock functions inside the factory, retrieve them via `jest.requireMock()` afterwards:

```ts
jest.mock("@supabase/supabase-js", () => {
  const mockUpsert = jest.fn();  // ← created inside factory, safe
  return { createClient: jest.fn(() => ({ upsert: mockUpsert })) };
});

const mockUpsert = jest.requireMock("@supabase/supabase-js")
  .createClient().from("profiles").upsert;
```

### Gotcha 2 — `testPathPattern` is not a valid config key

**Problem:** `testPathPattern` is a Jest CLI flag only. Using it in `jest.config.ts` causes a TypeScript error.

**Solution:** Use `testMatch` in the config file instead:

```ts
testMatch: ["**/__tests__/**/*.test.ts"]
```

### Gotcha 3 — Jest globals show as TypeScript errors

**Problem:** `describe`, `it`, `expect`, `jest` are unknown to TypeScript without the right setup.

**Solution:** Install `@types/jest` and add `"jest"` to `compilerOptions.types` in `tsconfig.json`.

### Gotcha 4 — `Session["user"].id` is not directly accessible

**Problem:** `session.user` is a union type — one branch has `id`, one does not — so TypeScript blocks direct access to `.id`.

**Solution:** Use an `in` type guard to narrow the union before accessing the property. See the `getUserId` helper in `jwt-session.callbacks.test.ts`.

---

## Running the Tests

```bash
# Run all tests
npx jest

# Run a specific file
npx jest signIn.callback

# Run in watch mode (re-runs on file save)
npx jest --watch

# Show coverage report
npx jest --coverage
```

---

## Test Coverage Summary

| File | Suites | Tests | What Is Covered |
|---|---|---|---|
| `signIn.callback.test.ts` | 2 | 16 | Domain allow-list, spoofing, missing email, Supabase success/error/exception, DB not called on block |
| `jwt-session.callbacks.test.ts` | 2 | 8 | JWT sub assignment, passthrough, field preservation, session id population, graceful null handling |
| `middleware.authorized.test.ts` | 1 | 12 | Null/undefined token, allowed domains, blocked domains, missing email, all 4 spoofing patterns |
| **Total** | **5** | **36** | |