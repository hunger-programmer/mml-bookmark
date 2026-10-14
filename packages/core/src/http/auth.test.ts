import { describe, expect, it } from "vitest";
import { ForbiddenError, UnauthorizedError } from "./errors";
import { CSRF_HEADER, assertOwns, requireAdmin, requireSession, requireToken, type SessionReader } from "./auth";

const reader = (overrides: Partial<SessionReader> = {}): SessionReader => ({
  getSession: async () => ({ userId: "u1", isAdmin: false }),
  getToken: async () => ({ userId: "u1", scope: "save" }),
  ...overrides,
});
const req = (method = "GET", headers: Record<string, string> = {}) => new Request("http://x/api", { method, headers });

describe("requireSession", () => {
  it("returns the session for a safe method without a CSRF header", async () => {
    await expect(requireSession(reader(), req("GET"))).resolves.toEqual({ userId: "u1", isAdmin: false });
    await expect(requireSession(reader(), req("head"))).resolves.toBeDefined();
  });

  it("requires the CSRF header on unsafe methods", async () => {
    await expect(requireSession(reader(), req("POST"))).rejects.toBeInstanceOf(ForbiddenError);
    await expect(requireSession(reader(), req("DELETE", { [CSRF_HEADER]: "0" }))).rejects.toBeInstanceOf(ForbiddenError);
    await expect(requireSession(reader(), req("POST", { [CSRF_HEADER]: "1" }))).resolves.toBeDefined();
  });

  it("is unauthorized without a session", async () => {
    await expect(requireSession(reader({ getSession: async () => null }), req())).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("fails closed when the reader throws", async () => {
    const broken = reader({ getSession: async () => { throw new Error("store down"); } });
    await expect(requireSession(broken, req())).rejects.toBeInstanceOf(UnauthorizedError);
  });
});

describe("requireToken", () => {
  it("accepts a save token for save and a read+save token for both", async () => {
    await expect(requireToken(reader(), req("POST"), "save")).resolves.toEqual({ userId: "u1", scope: "save" });
    const full = reader({ getToken: async () => ({ userId: "u1", scope: "read+save" }) });
    await expect(requireToken(full, req(), "read")).resolves.toBeDefined();
    await expect(requireToken(full, req(), "save")).resolves.toBeDefined();
  });

  it("forbids reading with a save-only token", async () => {
    await expect(requireToken(reader(), req(), "read")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("is unauthorized without a token and fails closed when the reader throws", async () => {
    await expect(requireToken(reader({ getToken: async () => null }), req(), "save")).rejects.toBeInstanceOf(UnauthorizedError);
    const broken = reader({ getToken: async () => { throw new Error("db down"); } });
    await expect(requireToken(broken, req(), "save")).rejects.toBeInstanceOf(UnauthorizedError);
  });
});

describe("requireAdmin", () => {
  it("allows admins and forbids everyone else", () => {
    expect(() => requireAdmin({ userId: "a", isAdmin: true })).not.toThrow();
    expect(() => requireAdmin({ userId: "u", isAdmin: false })).toThrow(ForbiddenError);
  });
});

describe("assertOwns", () => {
  it("passes for the owner and denies a different, null or undefined owner", () => {
    expect(() => assertOwns({ userId: "u1" }, "u1")).not.toThrow();
    expect(() => assertOwns({ userId: "u1" }, "u2")).toThrow(ForbiddenError);
    expect(() => assertOwns({ userId: "u1" }, null)).toThrow(ForbiddenError);
    expect(() => assertOwns({ userId: "u1" }, undefined)).toThrow(ForbiddenError);
  });
});
