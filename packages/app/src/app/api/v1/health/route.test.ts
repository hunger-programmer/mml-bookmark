import { describe, expect, it, vi } from "vitest";

const connection = vi.hoisted(() => vi.fn(async () => undefined));
vi.mock("next/server", () => ({ connection }));

import { GET } from "./route";

describe("GET /api/v1/health", () => {
  it("opts into request time and answers ok without touching the database", async () => {
    const response = await GET(new Request("http://x/api/v1/health"), undefined);
    expect(connection).toHaveBeenCalledOnce();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });

  it("maps failures through apiHandler", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    connection.mockRejectedValueOnce(new Error("boom"));
    const response = await GET(new Request("http://x/api/v1/health"), undefined);
    expect(response.status).toBe(500);
  });
});
