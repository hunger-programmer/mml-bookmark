import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LoadingState } from "./loading-state";

describe("LoadingState", () => {
  it("announces itself as a status with the default label", () => {
    const html = renderToStaticMarkup(<LoadingState />);
    expect(html).toContain('role="status"');
    expect(html).toContain("Loading…");
  });

  it("accepts a label and a class name", () => {
    const html = renderToStaticMarkup(<LoadingState label="Fetching" className="extra" />);
    expect(html).toContain("Fetching");
    expect(html).toContain("extra");
  });
});
