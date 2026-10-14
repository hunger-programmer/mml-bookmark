import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { Browser } from "../src/browser";

describe("admin panel", () => {
  const baseUrl = inject("baseUrl");
  const browser = new Browser();

  beforeAll(async () => {
    await browser.open(`${baseUrl}/admin`);
  });
  afterAll(async () => {
    await browser.close();
  });

  it("has the admin title", async () => {
    expect(await browser.title()).toBe("mml-bookmark admin");
  });

  it("shows the heading and the shadcn button", async () => {
    const snapshot = await browser.snapshot();
    expect(snapshot).toContain('heading "Admin"');
    expect(snapshot).toContain('button "shadcn/ui button"');
  });

  it("reports the database as connected (real PostgreSQL from testcontainers)", async () => {
    await expect.poll(() => browser.text(), { timeout: 15_000 }).toContain("Database: connected");
  });
});
