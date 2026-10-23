import type { Configuration } from "@mikro-orm/core";
import type { AbstractSqlDriver } from "@mikro-orm/postgresql";
import { describe, expect, it } from "vitest";
import { Migration20261023004313 } from "./Migration20261023004313";

function statements(direction: "up" | "down"): string[] {
  const migration = new Migration20261023004313({} as AbstractSqlDriver, {} as Configuration);
  void migration[direction]();
  return migration.getQueries().map((query) => String(query));
}

describe("Migration20261023004313 (users)", () => {
  it("creates users with RLS and no Data API access for anon or authenticated", () => {
    const up = statements("up");
    expect(up[0]).toMatch(/^create table "users"/);
    expect(up).toContain(`alter table "users" enable row level security;`);
    expect(up).toContain(`revoke all on table "users" from anon, authenticated;`);
    for (const kind of ["tables", "sequences", "functions"]) {
      expect(up).toContain(`alter default privileges for role postgres in schema public revoke all on ${kind} from anon, authenticated;`);
    }
  });

  it("restores Supabase's default grants and drops the table on the way down", () => {
    const down = statements("down");
    expect(down.at(-1)).toBe(`drop table if exists "users" cascade;`);
    expect(down.filter((sql) => sql.includes("grant all on"))).toHaveLength(3);
  });
});
