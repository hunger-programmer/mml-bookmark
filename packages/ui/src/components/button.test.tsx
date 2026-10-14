import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Button, buttonVariants } from "./button";

describe("Button", () => {
  it("renders a button with default variant and size", () => {
    const html = renderToStaticMarkup(<Button>Save</Button>);
    expect(html).toContain("<button");
    expect(html).toContain('data-slot="button"');
    expect(html).toContain("bg-primary");
    expect(html).toContain("h-8");
    expect(html).toContain("Save");
  });

  it.each(["default", "outline", "secondary", "ghost", "destructive", "link"] as const)("renders the %s variant", (variant) => {
    expect(renderToStaticMarkup(<Button variant={variant}>x</Button>)).toContain("<button");
    expect(buttonVariants({ variant })).toBeTypeOf("string");
  });

  it.each(["default", "xs", "sm", "lg", "icon", "icon-xs", "icon-sm", "icon-lg"] as const)("renders the %s size", (size) => {
    expect(buttonVariants({ size })).toBeTypeOf("string");
    expect(renderToStaticMarkup(<Button size={size}>x</Button>)).toContain("<button");
  });

  it("merges a custom className and forwards props", () => {
    const html = renderToStaticMarkup(<Button className="custom-class" disabled>x</Button>);
    expect(html).toContain("custom-class");
    expect(html).toContain("disabled");
  });
});
