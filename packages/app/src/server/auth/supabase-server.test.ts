import { afterEach, describe, expect, it, vi } from "vitest";

const createServerClient = vi.hoisted(() => vi.fn(() => ({ client: true })));
vi.mock("@supabase/ssr", () => ({ createServerClient }));
vi.mock("../env", () => ({ getServerEnv: () => ({ SUPABASE_URL: "http://supabase.test", SUPABASE_PUBLISHABLE_KEY: "sb_publishable_x" }) }));

import { createSupabaseServerClient, sessionCookieOptions } from "./supabase-server";

describe("Supabase server client", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("creates the client with the publishable key and httpOnly lax cookies", () => {
    const cookies = { getAll: () => [] };
    expect(createSupabaseServerClient(cookies)).toEqual({ client: true });
    expect(createServerClient).toHaveBeenCalledWith("http://supabase.test", "sb_publishable_x", {
      cookies,
      cookieOptions: { httpOnly: true, secure: false, sameSite: "lax", path: "/" },
    });
  });

  it("marks cookies secure in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(sessionCookieOptions()).toMatchObject({ httpOnly: true, secure: true });
  });
});
