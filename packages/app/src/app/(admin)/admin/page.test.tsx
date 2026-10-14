import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("./database-status", () => ({ DatabaseStatus: () => <p>db status</p> }));

import AdminPage from "./page";

describe("AdminPage", () => {
  it("renders the heading, the database status and the shadcn button", () => {
    const html = renderToStaticMarkup(<AdminPage />);
    expect(html).toContain("<h1");
    expect(html).toContain("Admin");
    expect(html).toContain("db status");
    expect(html).toContain("shadcn/ui button");
  });
});
