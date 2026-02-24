/**
 * Unit tests — jwt and session callbacks
 *
 * What is tested:
 * - jwt callback: token.sub is set from user.id on first sign-in
 * - jwt callback: existing token is returned unchanged on subsequent calls
 * - session callback: session.user.id is populated from token.sub
 * - session callback: session is untouched when token.sub is absent
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({ upsert: jest.fn() })),
  })),
}));

jest.mock("next-auth/providers/google", () =>
  jest.fn(() => ({ id: "google", name: "Google", type: "oauth" }))
);

// ─── Imports ──────────────────────────────────────────────────────────────────
import type { DefaultSession, Session, User } from "next-auth";
import type { AdapterUser } from "next-auth/adapters";
import type { JWT } from "next-auth/jwt";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// ─── Callbacks + derived parameter types ─────────────────────────────────────
const jwtCallback     = authOptions.callbacks!.jwt!;
const sessionCallback = authOptions.callbacks!.session!;

type JwtParams     = Parameters<typeof jwtCallback>[0];
type SessionParams = Parameters<typeof sessionCallback>[0];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Builds JwtParams for an initial sign-in where user + account are present.
 * Both fields are required by the type on every call — we pass undefined
 * explicitly for the "subsequent request" cases below to satisfy the type
 * while still testing the no-user branch of the callback logic.
 */
function makeJwtSignInParams(token: JWT, user: User): JwtParams {
  return {
    token,
    user,
    account: { provider: "google", type: "oauth", providerAccountId: "gid-123" },
    trigger: "signIn",
  };
}

function makeJwtRefreshParams(token: JWT): JwtParams {
  return {
    token,
    // user and account are technically required by the union type but will be
    // undefined at runtime on every request after the initial sign-in.
    // Casting the minimal object lets us test that branch without `any`.
    user:    undefined as unknown as User,
    account: null,
    trigger: "update",
  };
}

/**
 * Builds SessionParams. NextAuth's session callback type intersects a branch
 * that requires `user: AdapterUser`, even though it is undefined at runtime
 * for JWT-strategy sessions. We use the same unknown bridge to satisfy the
 * type without introducing `any`.
 */
function makeSessionParams(session: Session, token: JWT): SessionParams {
  return {
    session,
    token,
    user:       undefined as unknown as AdapterUser,
    newSession: null,
    trigger:    "update",
  };
}

/**
 * Narrows the session.user union to the augmented branch that carries `id`.
 * NextAuth's Session["user"] is a union: the base branch has no `id`, while
 * the augmented branch (declared in route.ts) adds `id: string`. The `in`
 * guard tells TypeScript which branch we're on so `.id` is accessible.
 */
function getUserId(user: Session["user"] | DefaultSession["user"] | undefined): string | undefined {
  if (user && "id" in user) return (user as { id: string }).id;
  return undefined;
}

// ─── jwt callback ─────────────────────────────────────────────────────────────
describe("jwt callback", () => {
  it("sets token.sub from user.id on the initial sign-in call (user present)", async () => {
    const token: JWT = { name: "Alice", email: "alice@provusinc.com" };
    const user: User = { id: "uid-abc", name: "Alice", email: "alice@provusinc.com", image: null };

    const result = await jwtCallback(makeJwtSignInParams(token, user));

    expect(result.sub).toBe("uid-abc");
  });

  it("returns the token unchanged when user is absent (subsequent requests)", async () => {
    const token: JWT = { sub: "uid-abc", name: "Alice", email: "alice@provusinc.com" };

    const result = await jwtCallback(makeJwtRefreshParams(token));

    expect(result).toEqual(token);
    expect(result.sub).toBe("uid-abc");
  });

  it("does not overwrite an existing token.sub when user is absent", async () => {
    const token: JWT = { sub: "original-id", email: "alice@provusinc.com" };

    const result = await jwtCallback(makeJwtRefreshParams(token));

    expect(result.sub).toBe("original-id");
  });

  it("preserves all other token fields when setting sub", async () => {
    const token: JWT = { name: "Bob", email: "bob@provus.ai", picture: "https://example.com/bob.jpg" };
    const user: User = { id: "uid-bob", name: "Bob", email: "bob@provus.ai", image: null };

    const result = await jwtCallback(makeJwtSignInParams(token, user));

    expect(result.name).toBe("Bob");
    expect(result.email).toBe("bob@provus.ai");
    expect(result.picture).toBe("https://example.com/bob.jpg");
    expect(result.sub).toBe("uid-bob");
  });
});

// ─── session callback ─────────────────────────────────────────────────────────
describe("session callback", () => {
  function makeSession(overrides?: Partial<Session["user"]>): Session {
    return {
      user: {
        id: "",
        name: "Alice",
        email: "alice@provusinc.com",
        image: null,
        ...overrides,
      } as Session["user"],
      expires: new Date(Date.now() + 86_400_000).toISOString(),
    };
  }

  it("assigns token.sub to session.user.id", async () => {
    const session = makeSession();
    const token: JWT = { sub: "uid-abc", email: "alice@provusinc.com" };
    const params = makeSessionParams(session, token);

    const result = await sessionCallback(params);

    expect(getUserId(result.user)).toBe("uid-abc");
  });

  it("returns the session unchanged when token.sub is undefined", async () => {
    const session = makeSession({ id: "existing-id" });
    const token: JWT = { email: "alice@provusinc.com" }; // no sub
    const params = makeSessionParams(session, token);

    const result = await sessionCallback(params);

    expect(getUserId(result.user)).toBe("existing-id");
  });

  it("preserves all other session.user fields when setting id", async () => {
    const session = makeSession({
      name: "Alice",
      email: "alice@provusinc.com",
      image: "https://example.com/alice.jpg",
    });
    const token: JWT = { sub: "uid-abc" };
    const params = makeSessionParams(session, token);

    const result = await sessionCallback(params);

    expect(result.user?.name).toBe("Alice");
    expect(result.user?.email).toBe("alice@provusinc.com");
    expect(result.user?.image).toBe("https://example.com/alice.jpg");
  });

  it("handles a session with no user object gracefully (does not throw)", async () => {
    const session = { expires: new Date().toISOString() } as Session;
    const token: JWT = { sub: "uid-abc" };
    const params = makeSessionParams(session, token);

    await expect(sessionCallback(params)).resolves.not.toThrow();
  });
});