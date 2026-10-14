import { describe, expect, it } from "vitest";
import { EventBus } from "./index";

describe("@mml-bookmark/core/events", () => {
  it("exports EventBus", () => {
    expect(EventBus).toBeTypeOf("function");
  });
});
