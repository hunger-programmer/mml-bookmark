import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("merges class names and skips falsy values", () => {
    expect(cn("a", false, undefined, "b")).toBe("a b");
  });
});
