import { describe, expect, it, vi } from "vitest";
import type { UserRecord, UserService } from "@mml-bookmark/core/auth";

const getClaims = vi.hoisted(() => vi.fn());
const createSupabaseServerClient = vi.hoisted(() => vi.fn<(cookies: { getAll: () => unknown }) => unknown>(() => ({ auth: { getClaims } })));
vi.mock("./supabase-server", () => ({ createSupabaseServerClient }));
const parseCookieHeader = vi.hoisted(() => vi.fn());
vi.mock("@supabase/ssr", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@supabase/ssr")>();
  parseCookieHeader.mockImplementation(actual.parseCookieHeader);
  return { ...actual, parseCookieHeader };
});

import { SupabaseSessionReader } from "./session-reader";

const claims = { sub: "u1", email: "Ana@Example.com", role: "authenticated" };
const user: UserRecord = { id: "u1", email: "ana@example.com", isAdmin: true, suspendedAt: null, createdAt: new Date() };

function reader(resolved = user) {
  const resolve = vi.fn(async () => resolved);
  return { reader: new SupabaseSessionReader({ userService: { resolve } as unknown as UserService }), resolve };
}
const request = (headers: Record<string, string>) => new Request("http://x/api/v1/me", { headers });
const cookiesSeen = () => createSupabaseServerClient.mock.calls.at(-1)?.[0].getAll();

describe("SupabaseSessionReader", () => {
  it("prefers a Bearer token, verifies it and ignores cookies", async () => {
    getClaims.mockResolvedValue({ data: { claims }, error: null });
    const { reader: r, resolve } = reader();
    const session = await r.getSession(request({ authorization: "Bearer abc.def.ghi", cookie: "sb-x-auth-token=cookie" }));
    expect(getClaims).toHaveBeenCalledWith("abc.def.ghi");
    expect(cookiesSeen()).toEqual([]);
    expect(resolve).toHaveBeenCalledWith({ id: "u1", email: "ana@example.com" });
    expect(session).toEqual({ userId: "u1", email: "ana@example.com", isAdmin: true, suspended: false, via: "bearer" });
  });

  it("falls back to the request cookies", async () => {
    getClaims.mockResolvedValue({ data: { claims }, error: null });
    const session = await reader().reader.getSession(request({ cookie: "sb-x-auth-token=abc; other=1" }));
    expect(getClaims).toHaveBeenCalledWith(undefined);
    expect(cookiesSeen()).toEqual([
      { name: "sb-x-auth-token", value: "abc" },
      { name: "other", value: "1" },
    ]);
    expect(session?.via).toBe("cookie");
  });

  it("passes a cookie without a value as an empty string", async () => {
    getClaims.mockResolvedValue({ data: null, error: null });
    parseCookieHeader.mockReturnValueOnce([{ name: "flag" }]);
    await reader().reader.getSession(request({ cookie: "flag" }));
    expect(cookiesSeen()).toEqual([{ name: "flag", value: "" }]);
  });

  it("reads no cookies when there is no cookie header", async () => {
    getClaims.mockResolvedValue({ data: null, error: null });
    await expect(reader().reader.getSession(request({}))).resolves.toBeNull();
    expect(cookiesSeen()).toEqual([]);
  });

  it("marks a suspended user", async () => {
    getClaims.mockResolvedValue({ data: { claims }, error: null });
    const session = await reader({ ...user, suspendedAt: new Date() }).reader.getSession(request({ authorization: "Bearer t" }));
    expect(session?.suspended).toBe(true);
  });

  it("rejects a malformed Authorization header without falling back to cookies", async () => {
    const { reader: r } = reader();
    getClaims.mockClear();
    await expect(r.getSession(request({ authorization: "Basic abc", cookie: "sb-x=1" }))).resolves.toBeNull();
    expect(getClaims).not.toHaveBeenCalled();
  });

  it.each([
    ["an invalid JWT", { data: null, error: new Error("invalid JWT") }],
    ["an anon-key token", { data: { claims: { ...claims, role: "anon" } }, error: null }],
    ["a token without a subject", { data: { claims: { ...claims, sub: "" } }, error: null }],
    ["a token without an email", { data: { claims: { ...claims, email: undefined } }, error: null }],
  ])("returns null for %s", async (_label, result) => {
    getClaims.mockResolvedValue(result);
    const { reader: r, resolve } = reader();
    await expect(r.getSession(request({ authorization: "Bearer t" }))).resolves.toBeNull();
    expect(resolve).not.toHaveBeenCalled();
  });

  it("has no personal tokens yet", async () => {
    await expect(reader().reader.getToken()).resolves.toBeNull();
  });
});
