import { describe, expect, it } from "vitest";
import * as db from "./index";

describe("@mml-bookmark/db public API", () => {
  it("exports the config factory, entity list, getOrm and registerDb", () => {
    expect(db.createOrmConfig).toBeTypeOf("function");
    expect(db.entities).toEqual([]);
    expect(db.getOrm).toBeTypeOf("function");
    expect(db.registerDb).toBeTypeOf("function");
  });
});
