import { afterEach, describe, expect, it, vi } from "vitest";

const init = vi.hoisted(() => vi.fn());
vi.mock("@mikro-orm/postgresql", () => ({ MikroORM: { init } }));
vi.mock("./config", () => ({ createOrmConfig: () => ({ fake: "config" }) }));

import { getOrm } from "./orm";

const globalForOrm = globalThis as { __mmlOrm?: unknown };

describe("getOrm", () => {
  afterEach(() => {
    delete globalForOrm.__mmlOrm;
  });

  it("initialises once, connects explicitly and caches the instance", async () => {
    const connect = vi.fn(async () => undefined);
    init.mockResolvedValue({ connect });
    const first = await getOrm();
    const second = await getOrm();
    expect(first).toBe(second);
    expect(init).toHaveBeenCalledTimes(1);
    expect(init).toHaveBeenCalledWith({ fake: "config" });
    expect(connect).toHaveBeenCalledOnce();
  });

  it("clears the cache after a failure so the next call retries", async () => {
    init.mockRejectedValueOnce(new Error("no database"));
    await expect(getOrm()).rejects.toThrow("no database");
    const connect = vi.fn(async () => undefined);
    init.mockResolvedValueOnce({ connect });
    await expect(getOrm()).resolves.toMatchObject({ connect });
  });
});
