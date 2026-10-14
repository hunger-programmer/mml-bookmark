import { beforeEach, describe, expect, it, vi } from "vitest";

const existsSync = vi.hoisted(() => vi.fn());
vi.mock("node:fs", () => ({ existsSync }));

import { loadRootEnv } from "./env";

describe("loadRootEnv", () => {
  let loadEnvFile: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    loadEnvFile = vi.spyOn(process, "loadEnvFile").mockImplementation(() => undefined);
  });

  it("loads the monorepo-root .env when it exists", () => {
    existsSync.mockReturnValue(true);
    loadRootEnv();
    expect(loadEnvFile).toHaveBeenCalledOnce();
    expect(String(loadEnvFile.mock.calls[0]?.[0])).toMatch(/mml-bookmark[\\/]\.env$|[\\/]\.env$/);
  });

  it("does nothing when there is no .env", () => {
    existsSync.mockReturnValue(false);
    loadRootEnv();
    expect(loadEnvFile).not.toHaveBeenCalled();
  });
});
