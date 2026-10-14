import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const connection = vi.hoisted(() => vi.fn(async () => undefined));
const getRequestScope = vi.hoisted(() => vi.fn());
vi.mock("next/server", () => ({ connection }));
vi.mock("@/server/container", () => ({ getRequestScope }));

import { DatabaseStatus } from "./database-status";

function scopeWith(status: { ok: boolean; reason?: string }) {
  getRequestScope.mockResolvedValue({ cradle: { em: { getConnection: () => ({ checkConnection: async () => status }) } } });
}

describe("DatabaseStatus", () => {
  it("shows connected when the check passes", async () => {
    scopeWith({ ok: true });
    const html = renderToStaticMarkup(await DatabaseStatus());
    expect(connection).toHaveBeenCalledOnce();
    expect(html).toContain("Database: connected");
  });

  it("shows the reason when the check fails", async () => {
    scopeWith({ ok: false, reason: "ECONNREFUSED" });
    const html = renderToStaticMarkup(await DatabaseStatus());
    expect(html).toContain("Database: ECONNREFUSED");
    expect(html).toContain("text-destructive");
  });
});
