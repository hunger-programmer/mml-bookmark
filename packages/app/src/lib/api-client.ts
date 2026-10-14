import { CSRF_HEADER } from "@mml-bookmark/core/http";

export interface ApiFailure {
  status: number;
  code: string;
  message: string;
  fields?: Record<string, string>;
}

export type ApiResult<T> = { ok: true; status: number; data: T } | ({ ok: false } & ApiFailure);

export class ApiError extends Error {
  constructor(readonly failure: ApiFailure) {
    super(failure.message);
    this.name = "ApiError";
  }
}

const NETWORK_FAILURE: ApiFailure = {
  status: 0,
  code: "network_error",
  message: "Couldn't reach the server. Check your connection and try again.",
};

function isErrorBody(value: unknown): value is { error: { code?: string; message?: string; fields?: Record<string, string> } } {
  return typeof value === "object" && value !== null && "error" in value && typeof value.error === "object" && value.error !== null;
}

/**
 * The only place the browser calls `/api/*`. Never throws on HTTP or network failure:
 * the caller branches on `ok`. Reads the body as text first so an empty or HTML error page
 * becomes a typed failure instead of a JSON parse exception.
 */
export async function apiCall<T>(path: string, init: Omit<RequestInit, "body"> & { json?: unknown } = {}): Promise<ApiResult<T>> {
  if (!path.startsWith("/api/")) throw new Error(`apiCall only calls /api/* (got "${path}")`);
  const { json, headers, ...rest } = init;
  const finalHeaders = new Headers(headers);
  finalHeaders.set(CSRF_HEADER, "1");
  if (json !== undefined) finalHeaders.set("content-type", "application/json");

  let response: Response;
  try {
    response = await fetch(path, { ...rest, headers: finalHeaders, body: json === undefined ? undefined : JSON.stringify(json) });
  } catch {
    return { ok: false, ...NETWORK_FAILURE };
  }

  const text = await response.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch {
    body = undefined;
  }

  if (response.ok) return { ok: true, status: response.status, data: body as T };
  const detail = isErrorBody(body) ? body.error : undefined;
  return {
    ok: false,
    status: response.status,
    code: detail?.code ?? "http_error",
    message: detail?.message ?? "Something went wrong. Try again.",
    fields: detail?.fields,
  };
}

/** For call sites that prefer try/catch over branching on `ok`. */
export async function apiCallOrThrow<T>(path: string, init?: Parameters<typeof apiCall>[1]): Promise<T> {
  const result = await apiCall<T>(path, init);
  if (!result.ok) throw new ApiError(result);
  return result.data;
}
