import { describe, expect, it, vi } from "vitest";
import type { Logger } from "../logger";
import { EventBus } from "./event-bus";
import "./event-map";

declare module "./event-map" {
  interface EventMap {
    "test.thing.happened": { id: string };
  }
}

const silentLogger = (): Logger => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() });

describe("EventBus", () => {
  it("delivers the payload to every handler in registration order", async () => {
    const bus = new EventBus(silentLogger());
    const calls: string[] = [];
    bus.on("test.thing.happened", ({ id }) => void calls.push(`a:${id}`));
    bus.on("test.thing.happened", async ({ id }) => void calls.push(`b:${id}`));
    await bus.emit("test.thing.happened", { id: "1" });
    expect(calls).toEqual(["a:1", "b:1"]);
  });

  it("does nothing when nobody listens", async () => {
    await expect(new EventBus(silentLogger()).emit("test.thing.happened", { id: "1" })).resolves.toBeUndefined();
  });

  it("stops delivering after unsubscribe", async () => {
    const bus = new EventBus(silentLogger());
    const handler = vi.fn();
    const off = bus.on("test.thing.happened", handler);
    off();
    await bus.emit("test.thing.happened", { id: "1" });
    expect(handler).not.toHaveBeenCalled();
  });

  it("logs a failing handler and still runs the others", async () => {
    const logger = silentLogger();
    const bus = new EventBus(logger);
    const after = vi.fn();
    bus.on("test.thing.happened", () => {
      throw new Error("boom");
    });
    bus.on("test.thing.happened", after);
    await expect(bus.emit("test.thing.happened", { id: "1" })).resolves.toBeUndefined();
    expect(after).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalledWith("Event handler failed", expect.objectContaining({ event: "test.thing.happened" }));
  });
});
