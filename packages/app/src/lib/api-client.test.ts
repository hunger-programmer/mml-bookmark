import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiCall, apiCallOrThrow } from "./api-client";

function stubFetch(response: Response | Error) {
  const fetchMock = vi.fn(async () => {
    if (response instanceof Error) throw response;
    return response;
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe("apiCall", () => {
  it("refuses paths outside /api/", async () => {
    await expect(apiCall("https://evil.example/x")).rejects.toThrow("apiCall only calls /api/*");
  });

  it("always sends the CSRF header and no body or content-type for plain calls", async () => {
    const fetchMock = stubFetch(Response.json({ status: "ok" }));
    const result = await apiCall<{ status: string }>("/api/v1/health");
    expect(result).toEqual({ ok: true, status: 200, data: { status: "ok" } });
    const [path, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(path).toBe("/api/v1/health");
    const headers = new Headers(init.headers);
    expect(headers.get("x-mml-csrf")).toBe("1");
    expect(headers.has("content-type")).toBe(false);
    expect(init.body).toBeUndefined();
  });

  it("serialises a json option and merges caller headers and method", async () => {
    const fetchMock = stubFetch(Response.json({ id: "1" }, { status: 201 }));
    const result = await apiCall("/api/v1/bookmarks", { method: "POST", json: { url: "https://a.b" }, headers: { "x-extra": "1" } });
    expect(result).toMatchObject({ ok: true, status: 201 });
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect(init.body).toBe('{"url":"https://a.b"}');
    const headers = new Headers(init.headers);
    expect(headers.get("content-type")).toBe("application/json");
    expect(headers.get("x-extra")).toBe("1");
  });

  it("treats an empty success body as undefined data", async () => {
    stubFetch(new Response(null, { status: 204 }));
    expect(await apiCall("/api/v1/x", { method: "DELETE" })).toEqual({ ok: true, status: 204, data: undefined });
  });

  it("treats an unparsable success body as undefined data", async () => {
    stubFetch(new Response("<html>", { status: 200 }));
    expect(await apiCall("/api/v1/x")).toEqual({ ok: true, status: 200, data: undefined });
  });

  it("returns a typed failure from the error body, including field errors", async () => {
    stubFetch(Response.json({ error: { code: "validation_failed", message: "bad", fields: { url: "invalid" } } }, { status: 422 }));
    expect(await apiCall("/api/v1/bookmarks", { method: "POST" })).toEqual({
      ok: false,
      status: 422,
      code: "validation_failed",
      message: "bad",
      fields: { url: "invalid" },
    });
  });

  it("falls back to generic text when the error body has no code or message", async () => {
    stubFetch(Response.json({ error: {} }, { status: 500 }));
    expect(await apiCall("/api/v1/x")).toMatchObject({ ok: false, status: 500, code: "http_error", message: "Something went wrong. Try again." });
  });

  it.each([["not json"], ["null"], ['"text"'], ['{"error":"flat"}'], ['{"error":null}'], ["{}"]])("falls back when the failure body is %s", async (body) => {
    stubFetch(new Response(body, { status: 502 }));
    expect(await apiCall("/api/v1/x")).toMatchObject({ ok: false, status: 502, code: "http_error" });
  });

  it("reports a network failure as status 0", async () => {
    stubFetch(new TypeError("fetch failed"));
    expect(await apiCall("/api/v1/x")).toMatchObject({ ok: false, status: 0, code: "network_error" });
  });
});

describe("apiCallOrThrow", () => {
  it("returns the data on success", async () => {
    stubFetch(Response.json({ a: 1 }));
    expect(await apiCallOrThrow<{ a: number }>("/api/v1/x")).toEqual({ a: 1 });
  });

  it("throws an ApiError carrying the failure", async () => {
    stubFetch(Response.json({ error: { code: "not_found", message: "gone" } }, { status: 404 }));
    const error = await apiCallOrThrow("/api/v1/x").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).failure).toMatchObject({ status: 404, code: "not_found" });
    expect((error as ApiError).message).toBe("gone");
    expect((error as ApiError).name).toBe("ApiError");
  });
});
