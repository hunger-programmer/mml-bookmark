import { beforeAll, describe, expect, inject, it } from "vitest";
import { createConfirmedUser, sessionCookie, signInWithPassword, uniqueEmail, type TestSession } from "../src/supabase-auth";

const PASSWORD = "correct-horse-battery";

describe("GET /api/v1/me (users and sessions)", () => {
  const baseUrl = inject("baseUrl");
  const supabase = inject("supabase");
  let email: string;
  let session: TestSession;

  beforeAll(async () => {
    email = uniqueEmail("me");
    await createConfirmedUser(supabase, email, PASSWORD);
    session = await signInWithPassword(supabase, email, PASSWORD);
  });

  it("answers 401 without credentials", async () => {
    const response = await fetch(`${baseUrl}/api/v1/me`);
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ error: { code: "unauthorized" } });
  });

  it("answers 401 for a forged Bearer token", async () => {
    const response = await fetch(`${baseUrl}/api/v1/me`, { headers: { authorization: "Bearer not.a.jwt" } });
    expect(response.status).toBe(401);
  });

  it("returns the user for a Supabase Bearer token and creates the users row once", async () => {
    const first = await fetch(`${baseUrl}/api/v1/me`, { headers: { authorization: `Bearer ${session.access_token}` } });
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ id: session.user.id, email, isAdmin: false });
    const again = await fetch(`${baseUrl}/api/v1/me`, { headers: { authorization: `Bearer ${session.access_token}` } });
    expect((await again.json()).id).toBe(session.user.id);
  });

  it("returns the user for a cookie session", async () => {
    const response = await fetch(`${baseUrl}/api/v1/me`, { headers: { cookie: sessionCookie(supabase, session) } });
    expect(response.status).toBe(200);
    expect((await response.json()).email).toBe(email);
  });

  it("refreshes an expired cookie session in the proxy and still answers the same request", async () => {
    const fresh = await signInWithPassword(supabase, email, PASSWORD);
    const expired = { ...fresh, expires_at: Math.floor(Date.now() / 1000) - 60 };
    const response = await fetch(`${baseUrl}/api/v1/me`, { headers: { cookie: sessionCookie(supabase, expired) } });
    expect(response.status).toBe(200);
    const setCookie = response.headers.get("set-cookie") ?? "";
    expect(setCookie).toMatch(/sb-127-auth-token=base64-/);
    expect(setCookie.toLowerCase()).toContain("httponly");
  });

  it("keeps users out of the Data API for the publishable key and for user tokens", async () => {
    const anon = await fetch(`${supabase.apiUrl}/rest/v1/users?select=*`, { headers: { apikey: supabase.publishableKey } });
    const user = await fetch(`${supabase.apiUrl}/rest/v1/users?select=*`, {
      headers: { apikey: supabase.publishableKey, authorization: `Bearer ${session.access_token}` },
    });
    for (const response of [anon, user]) {
      const body = await response.text();
      // Revoked grants answer 401/403 "permission denied"; an empty list would also mean no rows leak.
      expect(response.status === 200 ? JSON.parse(body) : response.status).toSatisfy((value: unknown) =>
        Array.isArray(value) ? value.length === 0 : value === 401 || value === 403,
      );
      expect(body).not.toContain(email);
    }
  });
});
