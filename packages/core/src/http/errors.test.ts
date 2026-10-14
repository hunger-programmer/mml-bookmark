import { describe, expect, it } from "vitest";
import { AppError, ConflictError, ForbiddenError, NotFoundError, RateLimitedError, UnauthorizedError, ValidationError } from "./errors";

describe("AppError hierarchy", () => {
  it("carries code, status, message and optional fields, and names itself after the subclass", () => {
    const error = new AppError("custom", 418, "teapot", { a: "b" });
    expect(error).toMatchObject({ code: "custom", status: 418, message: "teapot", fields: { a: "b" }, name: "AppError" });
    expect(new ValidationError().name).toBe("ValidationError");
  });

  it.each([
    [new ValidationError(), 422, "validation_failed"],
    [new UnauthorizedError(), 401, "unauthorized"],
    [new ForbiddenError(), 403, "forbidden"],
    [new NotFoundError(), 404, "not_found"],
    [new ConflictError(), 409, "conflict"],
    [new RateLimitedError(), 429, "rate_limited"],
  ])("%s has a default status and code", (error, status, code) => {
    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({ status, code });
    expect(error.message.length).toBeGreaterThan(0);
  });

  it("accepts custom messages, fields, conflict codes and retry hints", () => {
    expect(new ValidationError("bad", { url: "invalid" })).toMatchObject({ message: "bad", fields: { url: "invalid" } });
    expect(new UnauthorizedError("who?").message).toBe("who?");
    expect(new ForbiddenError("no").message).toBe("no");
    expect(new NotFoundError("gone").message).toBe("gone");
    expect(new ConflictError("dup", "duplicate_bookmark")).toMatchObject({ message: "dup", code: "duplicate_bookmark" });
    expect(new RateLimitedError("slow", 30)).toMatchObject({ message: "slow", retryAfterSeconds: 30 });
  });
});
