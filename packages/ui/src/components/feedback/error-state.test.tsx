import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ErrorState } from "./error-state";

describe("ErrorState", () => {
  it("renders an alert with the default title only", () => {
    const html = renderToStaticMarkup(<ErrorState />);
    expect(html).toContain('role="alert"');
    expect(html).toContain("Something went wrong");
    expect(html).not.toContain("text-muted-foreground");
  });

  it("renders title, message, action and class name", () => {
    const html = renderToStaticMarkup(<ErrorState title="Nope" message="Try later" action={<a href="/retry">Retry</a>} className="extra" />);
    expect(html).toContain("Nope");
    expect(html).toContain("Try later");
    expect(html).toContain('href="/retry"');
    expect(html).toContain("extra");
  });
});
