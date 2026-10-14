import { describe, expect, it } from "vitest";
import { createAppContainer } from "./container";
import { EventBus } from "./events/event-bus";
import { logger } from "./logger";
import { registerCore } from "./register";

describe("registerCore", () => {
  it("registers the shared logger", () => {
    const container = createAppContainer();
    registerCore(container);
    expect(container.cradle.logger).toBe(logger);
  });

  it("registers one EventBus singleton shared by every scope", () => {
    const container = createAppContainer();
    registerCore(container);
    const bus = container.cradle.eventBus;
    expect(bus).toBeInstanceOf(EventBus);
    expect(container.createScope().cradle.eventBus).toBe(bus);
  });
});
