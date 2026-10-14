import { describe, expect, it } from "vitest";
import * as core from "./index";

describe("@mml-bookmark/core public API", () => {
  it("exports the container factory, registerCore and the logger", () => {
    expect(core.createAppContainer).toBeTypeOf("function");
    expect(core.registerCore).toBeTypeOf("function");
    expect(core.createLogger).toBeTypeOf("function");
    expect(core.logger).toBeDefined();
  });
});
