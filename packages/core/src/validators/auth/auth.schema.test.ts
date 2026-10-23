import { describe, expect, it } from "vitest";
import { passwordResetSchema, passwordSchema, signInSchema, signUpSchema } from "./index";

const long = (n: number) => "x".repeat(n);

describe("signUpSchema", () => {
  it("accepts a valid email and password, normalising the email", () => {
    expect(signUpSchema.parse({ email: " Ana@Example.COM ", password: "12345678" })).toEqual({ email: "ana@example.com", password: "12345678" });
  });

  it.each([
    [{ email: "not-an-email", password: "12345678" }, "email"],
    [{ email: "a@b.co", password: "1234567" }, "password"],
    [{ email: "a@b.co", password: long(73) }, "password"],
    [{ email: "a@b.co" }, "password"],
  ])("rejects %j on %s", (input, field) => {
    const result = signUpSchema.safeParse(input);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual([field]);
  });

  it("accepts the 72-character maximum", () => {
    expect(signUpSchema.safeParse({ email: "a@b.co", password: long(72) }).success).toBe(true);
  });
});

describe("signInSchema", () => {
  it("accepts any non-empty password up to 72 characters", () => {
    expect(signInSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
  });

  it("rejects an empty or over-long password and a bad email", () => {
    expect(signInSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
    expect(signInSchema.safeParse({ email: "a@b.co", password: long(73) }).success).toBe(false);
    expect(signInSchema.safeParse({ email: "nope", password: "x" }).success).toBe(false);
  });
});

describe("passwordResetSchema", () => {
  it("requires a valid email", () => {
    expect(passwordResetSchema.safeParse({ email: "a@b.co" }).success).toBe(true);
    expect(passwordResetSchema.safeParse({ email: "" }).success).toBe(false);
  });
});

describe("passwordSchema", () => {
  it("applies the new-password rules", () => {
    expect(passwordSchema.safeParse({ password: "12345678" }).success).toBe(true);
    expect(passwordSchema.safeParse({ password: "short" }).success).toBe(false);
  });
});
