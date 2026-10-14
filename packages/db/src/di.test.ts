import { createAppContainer } from "@mml-bookmark/core";
import type { MikroORM } from "@mikro-orm/postgresql";
import { describe, expect, it, vi } from "vitest";
import { registerDb } from "./di";

function fakeOrm() {
  const fork = vi.fn(() => ({ forked: true }));
  return { orm: { em: { fork } } as unknown as MikroORM, fork };
}

describe("registerDb", () => {
  it("registers the ORM as a singleton value", () => {
    const { orm } = fakeOrm();
    const container = createAppContainer();
    registerDb(container, orm);
    expect(container.cradle.orm).toBe(orm);
  });

  it("gives every scope its own EntityManager fork, stable within the scope", () => {
    const { orm, fork } = fakeOrm();
    const container = createAppContainer();
    registerDb(container, orm);
    const a = container.createScope();
    const b = container.createScope();
    expect(a.cradle.em).toBe(a.cradle.em);
    expect(a.cradle.em).not.toBe(b.cradle.em);
    expect(fork).toHaveBeenCalledTimes(2);
  });
});
