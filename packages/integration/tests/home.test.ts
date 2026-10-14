import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { Browser } from "../src/browser";

describe("home page", () => {
  const baseUrl = inject("baseUrl");
  const browser = new Browser();

  beforeAll(async () => {
    await browser.open(baseUrl);
  });
  afterAll(async () => {
    await browser.close();
  });

  it("has the product title", async () => {
    expect(await browser.title()).toBe("mml-bookmark");
  });

  it("renders the public landing content", async () => {
    const snapshot = await browser.snapshot();
    expect(snapshot).toContain('heading "To get started');
    expect(snapshot).toContain('link "Templates"');
    expect(snapshot).toContain('link "Documentation"');
  });

  it("serves the health endpoint", async () => {
    const response = await fetch(`${baseUrl}/api/v1/health`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });
});
