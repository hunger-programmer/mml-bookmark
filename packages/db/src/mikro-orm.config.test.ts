import { afterEach, describe, expect, it, vi } from "vitest";

const loadRootEnv = vi.hoisted(() => vi.fn());
vi.mock("./env", () => ({ loadRootEnv }));

describe("MikroORM CLI config", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("loads the root .env and enables the migrator with transactional migrations", async () => {
    vi.stubEnv("DATABASE_URL", "postgres://u:p@localhost:5432/db");
    const { default: config } = await import("./mikro-orm.config");
    expect(loadRootEnv).toHaveBeenCalledOnce();
    expect(config.extensions).toHaveLength(1);
    expect(config.migrations).toMatchObject({ path: "src/migrations", emit: "ts", transactional: true, allOrNothing: true });
    expect(config.migrations?.glob).toBe("!(*.d|*.test).{js,ts}");
  });
});
