import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

async function load() {
  vi.resetModules();
  return (await import("./env")).getServerEnv;
}

describe("getServerEnv", () => {
  beforeEach(() => {
    vi.stubEnv("SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("returns the validated values and caches them", async () => {
    const getServerEnv = await load();
    const env = getServerEnv();
    expect(env).toEqual({ SUPABASE_URL: "http://127.0.0.1:54321", SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test" });
    vi.stubEnv("SUPABASE_URL", "http://changed");
    expect(getServerEnv()).toBe(env);
  });

  it("names the missing or invalid variables without printing values", async () => {
    vi.stubEnv("SUPABASE_URL", "not a url");
    vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "");
    const getServerEnv = await load();
    expect(() => getServerEnv()).toThrow(/SUPABASE_URL .*SUPABASE_PUBLISHABLE_KEY/);
    expect(() => getServerEnv()).not.toThrow(/not a url/);
  });
});
