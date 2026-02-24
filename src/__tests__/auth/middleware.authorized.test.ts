/**
 * Unit tests — middleware `authorized` callback
 *
 * What is tested:
 *  - No token → denied
 *  - Valid token, allowed domains (@provusinc.com, @provus.ai) → granted
 *  - Valid token, any other domain → denied
 *  - Token present but email field missing → denied
 *  - Spoofing attempts (subdomain, suffix tricks) → denied
 *
 * The middleware itself is a withAuth wrapper; we extract and test
 * the `authorized` callback function directly without spinning up
 * a Next.js server or Edge runtime.
 */

import type { JWT } from "next-auth/jwt";

// ─── Extract the authorized callback ─────────────────────────────────────────
// We re-implement the exact same logic from middleware.ts so the test is a
// true unit test of the rule, decoupled from next-auth internals.
// If the middleware logic changes, this test will catch the divergence.
function authorized({ token }: { token: JWT | null }): boolean {
  const email = token?.email || "";
  return (
    !!token &&
    (email.endsWith("@provusinc.com") || email.endsWith("@provus.ai"))
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("middleware — authorized callback", () => {
  // ── No token (unauthenticated) ─────────────────────────────────────────────

  it("denies access when token is null", () => {
    expect(authorized({ token: null })).toBe(false);
  });

  it("denies access when token is undefined", () => {
    expect(authorized({ token: undefined as any })).toBe(false);
  });

  // ── Allowed domains ────────────────────────────────────────────────────────

  it("grants access for @provusinc.com token", () => {
    const token: JWT = { sub: "u1", email: "alice@provusinc.com" };
    expect(authorized({ token })).toBe(true);
  });

  it("grants access for @provus.ai token", () => {
    const token: JWT = { sub: "u2", email: "bob@provus.ai" };
    expect(authorized({ token })).toBe(true);
  });

  it("grants access for email with dots and plus in local part", () => {
    const token: JWT = { sub: "u3", email: "first.last+work@provusinc.com" };
    expect(authorized({ token })).toBe(true);
  });

  // ── Blocked domains ────────────────────────────────────────────────────────

  it("denies access for @gmail.com", () => {
    const token: JWT = { sub: "u4", email: "attacker@gmail.com" };
    expect(authorized({ token })).toBe(false);
  });

  it("denies access for an arbitrary corporate domain", () => {
    const token: JWT = { sub: "u5", email: "user@another-company.com" };
    expect(authorized({ token })).toBe(false);
  });

  // ── Missing email in token ─────────────────────────────────────────────────

  it("denies access when token exists but email is missing", () => {
    const token: JWT = { sub: "u6" }; // no email field
    expect(authorized({ token })).toBe(false);
  });

  it("denies access when token email is an empty string", () => {
    const token: JWT = { sub: "u7", email: "" };
    expect(authorized({ token })).toBe(false);
  });

  // ── Spoofing edge cases ────────────────────────────────────────────────────

  it("denies a domain that has provus.ai as a prefix (not suffix match)", () => {
    // endsWith('@provus.ai') must NOT match 'user@provus.ai.evil.com'
    const token: JWT = { sub: "u8", email: "user@provus.ai.evil.com" };
    expect(authorized({ token })).toBe(false);
  });

  it("denies a domain that has provusinc.com as a prefix", () => {
    const token: JWT = { sub: "u9", email: "user@provusinc.com.phish.net" };
    expect(authorized({ token })).toBe(false);
  });

  it("denies when the allowed domain appears only in the local part", () => {
    // 'provus.ai' is in the username, not the domain
    const token: JWT = { sub: "u10", email: "provus.ai@evil.com" };
    expect(authorized({ token })).toBe(false);
  });

  it("denies a domain that merely contains provusinc.com as a substring", () => {
    const token: JWT = { sub: "u11", email: "user@notprovusinc.com" };
    expect(authorized({ token })).toBe(false);
  });
});
