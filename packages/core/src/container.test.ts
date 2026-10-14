import { asClass, asValue } from "awilix";
import { describe, expect, it } from "vitest";
import { createAppContainer } from "./container";

describe("createAppContainer", () => {
  it("resolves registrations by name from the cradle (PROXY injection)", () => {
    class Greeter {
      constructor(private readonly deps: { name: string }) {}
      greet() {
        return `hi ${this.deps.name}`;
      }
    }
    const container = createAppContainer();
    container.register({ name: asValue("zuza"), greeter: asClass(Greeter) } as never);
    expect((container.cradle as unknown as { greeter: Greeter }).greeter.greet()).toBe("hi zuza");
  });

  it("is strict: a singleton cannot depend on a scoped registration", () => {
    const container = createAppContainer();
    container.register({
      scoped: asClass(class Scoped {}).scoped(),
      single: asClass(class Single { constructor(readonly deps: { scoped: unknown }) { void deps.scoped; } }).singleton(),
    } as never);
    expect(() => (container.cradle as unknown as { single: unknown }).single).toThrow();
  });
});
