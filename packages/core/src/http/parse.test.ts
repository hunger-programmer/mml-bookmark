import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ValidationError } from "./errors";
import { parseWith } from "./parse";

const schema = z.object({ name: z.string().min(2, "Too short."), age: z.number("Must be a number.") });

describe("parseWith", () => {
  it("returns the parsed output", () => {
    expect(parseWith(schema, { name: "Al", age: 3 })).toEqual({ name: "Al", age: 3 });
  });

  it("throws a ValidationError with the first message per field", () => {
    const run = () => parseWith(schema.extend({ name: z.string().min(2, "Too short.").regex(/^A/, "Starts with A.") }), { name: "b", age: "x" });
    expect(run).toThrow(ValidationError);
    try {
      run();
    } catch (error) {
      expect((error as ValidationError).fields).toEqual({ name: "Too short.", age: "Must be a number." });
    }
  });

  it("reports root-level issues under `_`", () => {
    expect(() => parseWith(z.string("Expected text."), 1)).toThrow(expect.objectContaining({ fields: { _: "Expected text." } }));
  });
});
