import { asValue } from "awilix";
import { describe, expect, it } from "vitest";
import { createAppContainer } from "../../container";
import { registerAuth } from "./register";
import { UserService } from "./user.service";

describe("registerAuth", () => {
  it("registers a scoped UserService that uses the scope's repository", () => {
    const container = createAppContainer();
    registerAuth(container);
    const scope = container.createScope();
    scope.register({ userRepository: asValue({ findById: async () => null, insertIfAbsent: async () => undefined, updateEmail: async () => undefined }) });
    expect(scope.cradle.userService).toBeInstanceOf(UserService);
    expect(scope.cradle.userService).toBe(scope.cradle.userService);
  });
});
