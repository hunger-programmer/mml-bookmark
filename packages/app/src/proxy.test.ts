import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import type { CookieMethodsServer } from "@supabase/ssr";

const getClaims = vi.hoisted(() => vi.fn());
const createSupabaseServerClient = vi.hoisted(() => vi.fn());
vi.mock("./server/auth/supabase-server", () => ({ createSupabaseServerClient }));

import { config, proxy } from "./proxy";

function withRotation(rotated: { name: string; value: string }[]) {
  createSupabaseServerClient.mockImplementation((cookies: CookieMethodsServer) => ({
    auth: {
      getClaims: async () => {
        await getClaims(cookies.getAll());
        cookies.setAll?.(
          rotated.map((cookie) => ({ ...cookie, options: { httpOnly: true, sameSite: "lax", path: "/" } })),
          { "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0" },
        );
      },
    },
  }));
}

describe("proxy", () => {
  it("passes through requests without a Supabase cookie", async () => {
    const response = await proxy(new NextRequest("http://x/library", { headers: { cookie: "theme=dark" } }));
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("refreshes the session onto the forwarded request and the response", async () => {
    withRotation([{ name: "sb-local-auth-token", value: "fresh" }]);
    const request = new NextRequest("http://x/api/v1/me", { headers: { cookie: "sb-local-auth-token=stale" } });
    const response = await proxy(request);
    expect(getClaims).toHaveBeenCalledWith([{ name: "sb-local-auth-token", value: "stale" }]);
    // Forwarded request: Next passes overridden request cookies to the handler through this header.
    expect(response.headers.get("x-middleware-request-cookie")).toContain("sb-local-auth-token=fresh");
    const setCookie = response.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("sb-local-auth-token=fresh");
    expect(setCookie.toLowerCase()).toContain("httponly");
    expect(response.headers.get("cache-control")).toContain("no-store");
  });

  it("forwards the request unchanged when nothing was refreshed", async () => {
    createSupabaseServerClient.mockImplementation(() => ({ auth: { getClaims: async () => undefined } }));
    const response = await proxy(new NextRequest("http://x/library", { headers: { cookie: "sb-local-auth-token=valid" } }));
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("skips static assets", () => {
    expect(config.matcher[0]).toContain("_next/static|_next/image|favicon.ico");
  });
});
