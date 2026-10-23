import { describe, expect, it } from "vitest";
import { AccountSuspendedError, ForbiddenError, UnauthorizedError } from "./errors";
import {
  CSRF_HEADER,
  assertActive,
  assertOwns,
  requireAdmin,
  requireCsrf,
  requireSession,
  requireToken,
  type Session,
  type SessionReader,
} from "./auth";

const cookieSession: Session = { userId: "u1", email: "u1@example.com", isAdmin: false, suspended: false, via: "cookie" };
const reader = (overrides: Partial<SessionReader> = {}): SessionReader => ({
  getSession: async () => cookieSession,
  getToken: async () => ({ userId: "u1", scope: "save" }),
  ...overrides,
});
const req = (method = "GET", headers: Record<string, string> = {}) => new Request("http://x/api", { method, headers });

describe("requireSession", () => {
  it("returns the session for a safe method without a CSRF header", async () => {
    await expect(requireSession(reader(), req("GET"))).resolves.toEqual(cookieSession);
    await expect(requireSession(reader(), req("head"))).resolves.toBeDefined();
  });

  it("requires the CSRF header on unsafe methods", async () => {
    await expect(requireSession(reader(), req("POST"))).rejects.toBeInstanceOf(ForbiddenError);
    await expect(requireSession(reader(), req("DELETE", { [CSRF_HEADER]: "0" }))).rejects.toBeInstanceOf(ForbiddenError);
    await expect(requireSession(reader(), req("POST", { [CSRF_HEADER]: "1" }))).resolves.toBeDefined();
  });

  it("does not require the CSRF header for Bearer sessions", async () => {
    const bearer = reader({ getSession: async () => ({ ...cookieSession, via: "bearer" }) });
    await expect(requireSession(bearer, req("POST"))).resolves.toMatchObject({ via: "bearer" });
  });

  it("rejects a suspended account, after the CSRF check", async () => {
    const suspended = reader({ getSession: async () => ({ ...cookieSession, suspended: true }) });
    await expect(requireSession(suspended, req("GET"))).rejects.toBeInstanceOf(AccountSuspendedError);
    await expect(requireSession(suspended, req("POST"))).rejects.toBeInstanceOf(ForbiddenError);
    const suspendedBearer = reader({ getSession: async () => ({ ...cookieSession, via: "bearer", suspended: true }) });
    await expect(requireSession(suspendedBearer, req("POST"))).rejects.toMatchObject({ code: "account_suspended", status: 403 });
  });

  it("is unauthorized without a session", async () => {
    await expect(requireSession(reader({ getSession: async () => null }), req())).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("fails closed when the reader throws", async () => {
    const broken = reader({ getSession: async () => { throw new Error("store down"); } });
    await expect(requireSession(broken, req())).rejects.toBeInstanceOf(UnauthorizedError);
  });
});

describe("requireCsrf", () => {
  it("rejects unsafe methods without the header and allows safe ones", () => {
    expect(() => requireCsrf(req("POST"))).toThrow(ForbiddenError);
    expect(() => requireCsrf(req("PATCH", { [CSRF_HEADER]: "yes" }))).toThrow(ForbiddenError);
    expect(() => requireCsrf(req("POST", { [CSRF_HEADER]: "1" }))).not.toThrow();
    expect(() => requireCsrf(req("GET"))).not.toThrow();
  });
});

describe("assertActive", () => {
  it("throws only for a suspended principal", () => {
    expect(() => assertActive({ suspended: true })).toThrow(AccountSuspendedError);
    expect(() => assertActive({ suspended: false })).not.toThrow();
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
    expect(() => requireAdmin({ isAdmin: true })).not.toThrow();
    expect(() => requireAdmin({ isAdmin: false })).toThrow(ForbiddenError);
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
