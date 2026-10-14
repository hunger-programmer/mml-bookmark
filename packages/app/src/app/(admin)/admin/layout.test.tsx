import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "geist-sans-var" }),
  Geist_Mono: () => ({ variable: "geist-mono-var" }),
}));
vi.mock("@mml-bookmark/ui/globals.css", () => ({}));

import AdminLayout, { metadata } from "./layout";

describe("AdminLayout", () => {
  it("wraps children in the admin html shell with the font variables", () => {
    const html = renderToStaticMarkup(<AdminLayout params={Promise.resolve({})}>child</AdminLayout>);
    expect(html).toContain('lang="en"');
    expect(html).toContain("geist-sans-var");
    expect(html).toContain("geist-mono-var");
    expect(html).toContain("child");
  });

  it("sets the admin title", () => {
    expect(metadata.title).toBe("mml-bookmark admin");
  });
});
