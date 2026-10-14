import { afterEach, describe, expect, it, vi } from "vitest";

const getOrm = vi.hoisted(() => vi.fn());
const registerDb = vi.hoisted(() => vi.fn());
vi.mock("react", () => ({ cache: <T,>(fn: T) => fn }));
vi.mock("@mml-bookmark/db", () => ({ getOrm, registerDb }));

import { getContainer, getRequestScope } from "./container";

const globalForContainer = globalThis as { __mmlContainer?: unknown };

describe("composition root", () => {
  afterEach(() => {
    delete globalForContainer.__mmlContainer;
  });

  it("builds the root container once, registering core and db", async () => {
    getOrm.mockResolvedValue({ fake: "orm" });
    const first = await getContainer();
    const second = await getContainer();
    expect(first).toBe(second);
    expect(getOrm).toHaveBeenCalledTimes(1);
    expect(registerDb).toHaveBeenCalledWith(first, { fake: "orm" });
    expect(first.cradle.logger).toBeDefined();
    expect(first.cradle.eventBus).toBeDefined();
  });

  it("clears the cached promise on failure so the next call retries", async () => {
    getOrm.mockRejectedValueOnce(new Error("no database"));
    await expect(getContainer()).rejects.toThrow("no database");
    getOrm.mockResolvedValueOnce({ fake: "orm" });
    await expect(getContainer()).resolves.toBeDefined();
  });

  it("creates a scope from the root container", async () => {
    getOrm.mockResolvedValue({ fake: "orm" });
    const scope = await getRequestScope();
    expect(scope.cradle.logger).toBe((await getContainer()).cradle.logger);
  });
});
