import { describe, expect, it } from "vitest";
import * as http from "./index";

describe("@mml-bookmark/core/http", () => {
  it("exports the error classes, the handler and the auth helpers", () => {
    for (const name of ["AppError", "ValidationError", "apiHandler", "json", "readJson", "requireSession", "requireToken", "requireAdmin", "assertOwns", "CSRF_HEADER"]) {
      expect(http).toHaveProperty(name);
    }
  });
});
