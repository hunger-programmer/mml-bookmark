import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("Home", () => {
  it("renders the public landing content with its links", () => {
    const html = renderToStaticMarkup(<Home />);
    expect(html).toContain("<h1");
    expect(html).toContain("page.tsx");
    expect(html).toContain("<a ");
  });
});
