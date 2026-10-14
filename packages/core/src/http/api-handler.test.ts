import { describe, expect, it, vi } from "vitest";
import type { Logger } from "../logger";
import { apiHandler, json, readJson } from "./api-handler";
import { ConflictError, RateLimitedError, ValidationError } from "./errors";

const post = (body?: string) => new Request("http://x/api/test", { method: "POST", body });
const silentLogger = (): Logger => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() });

describe("json", () => {
  it("builds a JSON response with the given status", async () => {
    const response = json({ a: 1 }, { status: 201 });
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ a: 1 });
  });
});

describe("readJson", () => {
  it("returns a parsed object", async () => {
    expect(await readJson(post('{"url":"https://a.b"}'))).toEqual({ url: "https://a.b" });
  });

  it.each(["{nope", "", "[1]", "null", '"text"', "5"])("rejects %j as a validation error", async (body) => {
    await expect(readJson(post(body))).rejects.toBeInstanceOf(ValidationError);
  });
});

describe("apiHandler", () => {
  it("passes the handler's response through and forwards request and context", async () => {
    const handler = vi.fn(async () => new Response("ok"));
    const request = post();
    const response = await apiHandler(handler, { logger: silentLogger() })(request, { id: "1" });
    expect(await response.text()).toBe("ok");
    expect(handler).toHaveBeenCalledWith(request, { id: "1" });
  });

  it("maps an AppError to its status and the error body", async () => {
    const response = await apiHandler(async () => {
      throw new ConflictError("dup", "duplicate_bookmark");
    })(post(), undefined);
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: { code: "duplicate_bookmark", message: "dup" } });
  });

  it("includes field errors when present", async () => {
    const response = await apiHandler(async () => {
      throw new ValidationError("bad", { url: "Not a valid URL" });
    })(post(), undefined);
    expect(await response.json()).toEqual({ error: { code: "validation_failed", message: "bad", fields: { url: "Not a valid URL" } } });
  });

  it("sets Retry-After for rate-limited errors that carry a hint, and omits it otherwise", async () => {
    const hinted = await apiHandler(async () => {
      throw new RateLimitedError(undefined, 30);
    })(post(), undefined);
    expect(hinted.headers.get("retry-after")).toBe("30");
    const plain = await apiHandler(async () => {
      throw new RateLimitedError();
    })(post(), undefined);
    expect(plain.status).toBe(429);
    expect(plain.headers.get("retry-after")).toBeNull();
  });

  it("logs unknown errors and answers a generic 500 without leaking the message", async () => {
    const logger = silentLogger();
    const response = await apiHandler(async () => {
      throw new Error("db password=hunter2");
    }, { logger })(post(), undefined);
    expect(response.status).toBe(500);
    const text = await response.text();
    expect(text).not.toContain("hunter2");
    expect(JSON.parse(text)).toEqual({ error: { code: "internal_error", message: "Something went wrong. Try again." } });
    expect(logger.error).toHaveBeenCalledWith("Unhandled error in route handler", expect.objectContaining({ method: "POST", url: "/api/test" }));
  });

  it("uses the shared logger when none is given", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    await apiHandler(async () => {
      throw new Error("oops");
    })(post(), undefined);
    expect(spy).toHaveBeenCalledOnce();
  });
});
