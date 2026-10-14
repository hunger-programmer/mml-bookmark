import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createOrmConfig } from "./config";

describe("createOrmConfig", () => {
  beforeEach(() => {
    vi.stubEnv("DATABASE_URL", "postgres://u:p@localhost:5432/db");
    vi.stubEnv("DB_POOL_MIN", "");
    vi.stubEnv("DB_POOL_MAX", "");
    vi.stubEnv("DB_DEBUG", "");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("requires DATABASE_URL", () => {
    vi.stubEnv("DATABASE_URL", "");
    expect(() => createOrmConfig()).toThrow(/DATABASE_URL is not set/);
  });

  it("uses the URL, default pool sizes, no debug and the registered entities", () => {
    const config = createOrmConfig();
    expect(config.clientUrl).toBe("postgres://u:p@localhost:5432/db");
    expect(config.pool).toEqual({ min: 2, max: 10 });
    expect(config.debug).toBe(false);
    expect(config.entities).toEqual([]);
  });

  it("reads pool sizes and debug from the environment", () => {
    vi.stubEnv("DB_POOL_MIN", "1");
    vi.stubEnv("DB_POOL_MAX", "4");
    vi.stubEnv("DB_DEBUG", "true");
    const config = createOrmConfig();
    expect(config.pool).toEqual({ min: 1, max: 4 });
    expect(config.debug).toBe(true);
  });

  it("falls back to the default when a variable is unset", () => {
    vi.stubEnv("DB_POOL_MIN", undefined as unknown as string);
    expect(createOrmConfig().pool?.min).toBe(2);
  });

  it("rejects a non-integer pool size", () => {
    vi.stubEnv("DB_POOL_MAX", "many");
    expect(() => createOrmConfig()).toThrow('DB_POOL_MAX must be an integer, got "many"');
  });

  it("lets callers override any option", () => {
    expect(createOrmConfig({ debug: true }).debug).toBe(true);
  });
});
