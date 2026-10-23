import { createAppContainer } from "@mml-bookmark/core";
import { asValue } from "awilix";
import { describe, expect, it, vi } from "vitest";

vi.mock("./supabase-server", () => ({ createSupabaseServerClient: vi.fn() }));

import { registerAppAuth } from "./register";
import { SupabaseSessionReader } from "./session-reader";

describe("registerAppAuth", () => {
  it("registers a scoped Supabase session reader", () => {
    const container = createAppContainer();
    registerAppAuth(container);
    const scope = container.createScope();
    scope.register({ userService: asValue({ resolve: vi.fn() }) });
    expect(scope.cradle.sessionReader).toBeInstanceOf(SupabaseSessionReader);
    expect(scope.cradle.sessionReader).toBe(scope.cradle.sessionReader);
  });
});
