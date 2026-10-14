import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EmptyState } from "./empty-state";

describe("EmptyState", () => {
  it("renders only the title by default", () => {
    const html = renderToStaticMarkup(<EmptyState title="Nothing saved yet" />);
    expect(html).toContain("Nothing saved yet");
    expect(html).not.toContain("text-muted-foreground");
  });

  it("renders description, action and class name", () => {
    const html = renderToStaticMarkup(<EmptyState title="t" description="Add a link" action={<button>Add</button>} className="extra" />);
    expect(html).toContain("Add a link");
    expect(html).toContain("<button>Add</button>");
    expect(html).toContain("extra");
  });
});
