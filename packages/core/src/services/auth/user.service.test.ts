import { describe, expect, it, vi } from "vitest";
import type { UserRecord, UserRepository } from "./user-repository.port";
import { UserService } from "./user.service";

const row = (overrides: Partial<UserRecord> = {}): UserRecord => ({
  id: "u1",
  email: "ana@example.com",
  isAdmin: false,
  suspendedAt: null,
  createdAt: new Date("2026-10-23T00:00:00Z"),
  ...overrides,
});

function repository(rows: (UserRecord | null)[]): UserRepository & { [K in keyof UserRepository]: ReturnType<typeof vi.fn> } {
  const findById = vi.fn();
  for (const value of rows) findById.mockResolvedValueOnce(value);
  return { findById, insertIfAbsent: vi.fn(async () => undefined), updateEmail: vi.fn(async () => undefined) };
}

describe("UserService.resolve", () => {
  it("returns an existing user unchanged", async () => {
    const userRepository = repository([row()]);
    await expect(new UserService({ userRepository }).resolve({ id: "u1", email: "ana@example.com" })).resolves.toEqual(row());
    expect(userRepository.insertIfAbsent).not.toHaveBeenCalled();
    expect(userRepository.updateEmail).not.toHaveBeenCalled();
  });

  it("copies a changed email", async () => {
    const userRepository = repository([row()]);
    const user = await new UserService({ userRepository }).resolve({ id: "u1", email: "new@example.com" });
    expect(userRepository.updateEmail).toHaveBeenCalledWith("u1", "new@example.com");
    expect(user.email).toBe("new@example.com");
  });

  it("creates the row on first sight and returns what the database holds", async () => {
    const userRepository = repository([null, row({ isAdmin: true })]);
    const user = await new UserService({ userRepository }).resolve({ id: "u1", email: "ana@example.com" });
    expect(userRepository.insertIfAbsent).toHaveBeenCalledWith({ id: "u1", email: "ana@example.com" });
    expect(user.isAdmin).toBe(true);
  });

  it("throws if the row is still missing after the insert", async () => {
    const userRepository = repository([null, null]);
    await expect(new UserService({ userRepository }).resolve({ id: "u1", email: "a@b.co" })).rejects.toThrow(/missing right after insert/);
  });
});
