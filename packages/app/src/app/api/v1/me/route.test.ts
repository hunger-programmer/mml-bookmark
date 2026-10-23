import { describe, expect, it, vi } from "vitest";

const getSession = vi.hoisted(() => vi.fn());
vi.mock("@/server/container", () => ({
  getRequestScope: async () => ({ cradle: { sessionReader: { getSession, getToken: async () => null } } }),
}));

import { GET } from "./route";

const session = { userId: "u1", email: "ana@example.com", isAdmin: false, suspended: false, via: "bearer" as const };

describe("GET /api/v1/me", () => {
  it("returns the signed-in user without internal fields", async () => {
    getSession.mockResolvedValue(session);
    const response = await GET(new Request("http://x/api/v1/me"), undefined);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: "u1", email: "ana@example.com", isAdmin: false });
  });

  it("answers 401 without a session", async () => {
    getSession.mockResolvedValue(null);
    const response = await GET(new Request("http://x/api/v1/me"), undefined);
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ error: { code: "unauthorized" } });
  });

  it("answers 403 account_suspended for a suspended user", async () => {
    getSession.mockResolvedValue({ ...session, suspended: true });
    const response = await GET(new Request("http://x/api/v1/me"), undefined);
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: { code: "account_suspended" } });
  });
});
