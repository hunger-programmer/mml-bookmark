import { describe, expect, it, vi } from "vitest";
import { createLogger, logger } from "./logger";

function capture() {
  const lines: string[] = [];
  return { lines, log: createLogger((line) => lines.push(line)), last: () => JSON.parse(lines.at(-1) ?? "{}") as Record<string, unknown> };
}

describe("createLogger", () => {
  it("writes one JSON line per call with level, message, time and context", () => {
    const { log, last } = capture();
    log.info("hello", { a: 1 });
    expect(last()).toMatchObject({ level: "info", message: "hello", a: 1 });
    expect(typeof last().time).toBe("string");
  });

  it("supports warn and error levels and calls without context", () => {
    const { log, last } = capture();
    log.warn("careful");
    expect(last()).toMatchObject({ level: "warn", message: "careful" });
    log.error("broken");
    expect(last()).toMatchObject({ level: "error", message: "broken" });
  });

  it("redacts sensitive keys at any depth, including inside arrays", () => {
    const { log, last } = capture();
    log.info("x", { password: "p", nested: { Authorization: "Bearer a", ok: 1 }, list: [{ apiKey: "k", fine: true }], cookie: "c", SECRET: "s", sessionToken: "t" });
    expect(last()).toMatchObject({
      password: "[redacted]",
      nested: { Authorization: "[redacted]", ok: 1 },
      list: [{ apiKey: "[redacted]", fine: true }],
      cookie: "[redacted]",
      SECRET: "[redacted]",
      sessionToken: "[redacted]",
    });
  });

  it("redacts Supabase session cookies by name", () => {
    const { log, last } = capture();
    log.info("x", { "sb-127-chunk.0": "base64-abc", "sb-ref-auth-token": "base64-def", sbFine: 1 });
    expect(last()).toMatchObject({ "sb-127-chunk.0": "[redacted]", "sb-ref-auth-token": "[redacted]", sbFine: 1 });
  });

  it("serialises errors as name, message and stack", () => {
    const { log, last } = capture();
    log.error("failed", { error: new TypeError("bad") });
    expect(last().error).toMatchObject({ name: "TypeError", message: "bad" });
  });

  it("stops descending after a fixed depth and leaves deeper values as they are", () => {
    const { log, last } = capture();
    log.info("deep", { l1: { l2: { l3: { l4: { l5: { l6: { token: "kept-because-too-deep" } } } } } } });
    expect(JSON.stringify(last())).toContain("kept-because-too-deep");
  });

  it("keeps primitives untouched", () => {
    const { log, last } = capture();
    log.info("p", { n: 1, s: "s", b: false, nothing: null });
    expect(last()).toMatchObject({ n: 1, s: "s", b: false, nothing: null });
  });

  it("writes to console.log by default", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    createLogger().info("to console");
    expect(spy).toHaveBeenCalledOnce();
  });

  it("exports a process-wide default logger", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    logger.warn("default");
    expect(spy).toHaveBeenCalledOnce();
  });
});
