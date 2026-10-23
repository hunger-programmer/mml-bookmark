import type { EntityManager } from "@mikro-orm/postgresql";
import { describe, expect, it, vi } from "vitest";
import { User } from "../../entities/auth/user.entity";
import { MikroUserRepository } from "./user.repository";

const created = new Date("2026-10-23T00:00:00Z");

function fakeEm(found: unknown) {
  const execute = vi.fn(async () => undefined);
  const ignore = vi.fn(() => ({ execute }));
  const onConflict = vi.fn(() => ({ ignore }));
  const insert = vi.fn(() => ({ onConflict }));
  const em = {
    findOne: vi.fn(async () => found),
    nativeUpdate: vi.fn(async () => 1),
    createQueryBuilder: vi.fn(() => ({ insert })),
  };
  return { em: em as unknown as EntityManager, raw: em, insert, onConflict, ignore, execute };
}

describe("MikroUserRepository", () => {
  it("maps a found row to a plain record", async () => {
    const { em, raw } = fakeEm({ id: "u1", email: "a@b.co", isAdmin: true, suspendedAt: undefined, createdAt: created, extra: "x" });
    await expect(new MikroUserRepository({ em }).findById("u1")).resolves.toEqual({
      id: "u1",
      email: "a@b.co",
      isAdmin: true,
      suspendedAt: null,
      createdAt: created,
    });
    expect(raw.findOne).toHaveBeenCalledWith(User, { id: "u1" });
  });

  it("returns null when the row does not exist", async () => {
    const { em } = fakeEm(null);
    await expect(new MikroUserRepository({ em }).findById("u1")).resolves.toBeNull();
  });

  it("inserts with ON CONFLICT (id) DO NOTHING", async () => {
    const f = fakeEm(null);
    await new MikroUserRepository({ em: f.em }).insertIfAbsent({ id: "u1", email: "a@b.co" });
    expect(f.raw.createQueryBuilder).toHaveBeenCalledWith(User);
    expect(f.insert).toHaveBeenCalledWith({ id: "u1", email: "a@b.co" });
    expect(f.onConflict).toHaveBeenCalledWith("id");
    expect(f.ignore).toHaveBeenCalled();
    expect(f.execute).toHaveBeenCalled();
  });

  it("updates the email by id", async () => {
    const f = fakeEm(null);
    await new MikroUserRepository({ em: f.em }).updateEmail("u1", "new@b.co");
    expect(f.raw.nativeUpdate).toHaveBeenCalledWith(User, { id: "u1" }, { email: "new@b.co" });
  });
});
