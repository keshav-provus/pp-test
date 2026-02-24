/**
 * Unit tests — signIn callback
 *
 * What is tested:
 *  - Domain allow-list enforcement (provusinc.com, provus.ai)
 *  - Edge-case spoofing attempts
 *  - Supabase upsert: success, error response, thrown exception
 *  - Missing / empty email guards
 *
 * Supabase is fully mocked — no network calls are made.
 */

// ─── Mock Supabase ────────────────────────────────────────────────────────────
// jest.mock() is hoisted BEFORE const declarations, so mock fns must be
// defined inside the factory. Use jest.requireMock() to retrieve them after.
jest.mock("@supabase/supabase-js", () => {
  const mockUpsert = jest.fn();
  const mockFrom = jest.fn(() => ({ upsert: mockUpsert }));
  return {
    createClient: jest.fn(() => ({ from: mockFrom })),
  };
});

jest.mock("next-auth/providers/google", () =>
  jest.fn(() => ({ id: "google", name: "Google", type: "oauth" }))
);

// ─── Imports (after jest.mock declarations) ───────────────────────────────────
import type { User } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// ─── Retrieve mock references ─────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-require-imports
const supabaseMock = jest.requireMock("@supabase/supabase-js");
const mockClientInstance = supabaseMock.createClient();
const mockFrom: jest.Mock = mockClientInstance.from;
const mockUpsert: jest.Mock = mockClientInstance.from("profiles").upsert;

// ─── Types ────────────────────────────────────────────────────────────────────
const signInCallback = authOptions.callbacks!.signIn!;

// Derive the exact parameter type straight from the callback — no manual typing
// needed, and if NextAuth changes the signature we get an error here immediately.
type SignInParams = Parameters<typeof signInCallback>[0];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function makeArgs(email: string | undefined, overrides?: Partial<User>): SignInParams {
  return {
    user: {
      id: "user-123",
      name: "Test User",
      email: email ?? null,
      image: "https://example.com/avatar.png",
      ...overrides,
    },
    // Profile is typed as a generic object — we only need email for these tests
    profile: { email, sub: "google-sub-123" },
    account: {
      provider: "google",
      type: "oauth",
      providerAccountId: "google-123",
      access_token: "test-token",
    },
  };
}

// ─── Domain validation ────────────────────────────────────────────────────────
describe("signIn callback — domain validation", () => {
  beforeEach(() => {
    mockUpsert.mockResolvedValue({ error: null });
  });

  // ── Allowed domains ────────────────────────────────────────────────────────

  it("allows a @provusinc.com email", async () => {
    const result = await signInCallback(makeArgs("alice@provusinc.com"));
    expect(result).toBe(true);
  });

  it("allows a @provus.ai email", async () => {
    const result = await signInCallback(makeArgs("bob@provus.ai"));
    expect(result).toBe(true);
  });

  it("allows any user prefix within an allowed domain", async () => {
    const result = await signInCallback(makeArgs("first.last+tag@provusinc.com"));
    expect(result).toBe(true);
  });

  // ── Blocked domains ────────────────────────────────────────────────────────

  it("blocks a @gmail.com email", async () => {
    const result = await signInCallback(makeArgs("attacker@gmail.com"));
    expect(result).toBe(false);
  });

  it("blocks an unknown corporate domain", async () => {
    const result = await signInCallback(makeArgs("user@other-company.com"));
    expect(result).toBe(false);
  });

  // ── Spoofing edge cases ────────────────────────────────────────────────────

  it("blocks a domain that merely contains 'provus.ai' as a substring", async () => {
    const result = await signInCallback(makeArgs("user@notprovus.ai"));
    expect(result).toBe(false);
  });

  it("blocks a subdomain spoof like provus.ai.evil.com", async () => {
    const result = await signInCallback(makeArgs("user@provus.ai.evil.com"));
    expect(result).toBe(false);
  });

  it("blocks a subdomain spoof like provusinc.com.phish.net", async () => {
    const result = await signInCallback(makeArgs("user@provusinc.com.phish.net"));
    expect(result).toBe(false);
  });

  it("blocks when the allowed domain appears only in the local part", async () => {
    const result = await signInCallback(makeArgs("provusinc.com@evil.com"));
    expect(result).toBe(false);
  });

  // ── Missing email ──────────────────────────────────────────────────────────

  it("blocks when profile email is undefined", async () => {
    const result = await signInCallback(makeArgs(undefined));
    expect(result).toBe(false);
  });

  it("blocks when profile email is an empty string", async () => {
    const result = await signInCallback(makeArgs(""));
    expect(result).toBe(false);
  });
});

// ─── Supabase upsert behavior ─────────────────────────────────────────────────
describe("signIn callback — Supabase upsert behavior", () => {
  const VALID_EMAIL = "dev@provusinc.com";

  beforeEach(() => {
    mockUpsert.mockReset();
    mockFrom.mockClear();
  });

  it("calls supabase.from('profiles').upsert with the correct payload", async () => {
    mockUpsert.mockResolvedValue({ error: null });

    await signInCallback(
      makeArgs(VALID_EMAIL, {
        id: "uid-999",
        name: "Dev User",
        email: VALID_EMAIL,
        image: "https://img.example.com/pic.jpg",
      })
    );

    expect(mockFrom).toHaveBeenCalledWith("profiles");
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "uid-999",
        email: VALID_EMAIL,
        display_name: "Dev User",
        avatar_url: "https://img.example.com/pic.jpg",
        last_login: expect.any(String),
      }),
      expect.objectContaining({ onConflict: "email" })
    );
  });

  it("returns true when upsert succeeds", async () => {
    mockUpsert.mockResolvedValue({ error: null });
    const result = await signInCallback(makeArgs(VALID_EMAIL));
    expect(result).toBe(true);
  });

  it("returns false and logs when upsert returns an error object", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockUpsert.mockResolvedValue({ error: { message: "duplicate key" } });

    const result = await signInCallback(makeArgs(VALID_EMAIL));

    expect(result).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith("Supabase Sync Error:", "duplicate key");
    consoleSpy.mockRestore();
  });

  it("returns false and logs when upsert throws an exception", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockUpsert.mockRejectedValue(new Error("network timeout"));

    const result = await signInCallback(makeArgs(VALID_EMAIL));

    expect(result).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith("Critical Sync Error:", expect.any(Error));
    consoleSpy.mockRestore();
  });

  it("does NOT call supabase at all when the domain is blocked", async () => {
    await signInCallback(makeArgs("hacker@evil.com"));
    expect(mockUpsert).not.toHaveBeenCalled();
  });
});
