import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "geist-sans-var" }),
  Geist_Mono: () => ({ variable: "geist-mono-var" }),
}));
vi.mock("./globals.css", () => ({}));

import RootLayout, { metadata } from "./layout";

describe("RootLayout", () => {
  it("wraps children in the public html shell with the font variables", () => {
    const html = renderToStaticMarkup(<RootLayout params={Promise.resolve({})}>child</RootLayout>);
    expect(html).toContain('lang="en"');
    expect(html).toContain("geist-sans-var");
    expect(html).toContain("geist-mono-var");
    expect(html).toContain("child");
  });

  it("describes the product", () => {
    expect(metadata).toMatchObject({ title: "mml-bookmark", description: "Save links, group them, connect them to other tools." });
  });
});
