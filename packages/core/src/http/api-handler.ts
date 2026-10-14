import { logger as defaultLogger, type Logger } from "../logger";
import { AppError, RateLimitedError, ValidationError } from "./errors";

export interface ApiErrorBody {
  error: { code: string; message: string; fields?: Record<string, string> };
}

export function json(body: unknown, init?: ResponseInit): Response {
  return Response.json(body, init);
}

/** Parses a JSON request body; malformed or non-object input is a validation error, not a 500. */
export async function readJson(request: Request): Promise<Record<string, unknown>> {
  const text = await request.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new ValidationError("The request body must be valid JSON.");
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new ValidationError("The request body must be a JSON object.");
  }
  return parsed as Record<string, unknown>;
}

function errorResponse(error: AppError): Response {
  const body: ApiErrorBody = { error: { code: error.code, message: error.message } };
  if (error.fields) body.error.fields = error.fields;
  const headers = new Headers();
  if (error instanceof RateLimitedError && error.retryAfterSeconds !== undefined) {
    headers.set("Retry-After", String(error.retryAfterSeconds));
  }
  return Response.json(body, { status: error.status, headers });
}

/**
 * Wraps a route handler. Maps `AppError`s to their status and error body, logs anything
 * else and answers a generic 500 (no message, no stack). No route writes its own try/catch.
 */
export function apiHandler<Context = unknown>(
  handler: (request: Request, context: Context) => Promise<Response>,
  { logger = defaultLogger }: { logger?: Logger } = {},
): (request: Request, context: Context) => Promise<Response> {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      if (error instanceof AppError) return errorResponse(error);
      logger.error("Unhandled error in route handler", { method: request.method, url: new URL(request.url).pathname, error });
      return errorResponse(new AppError("internal_error", 500, "Something went wrong. Try again."));
    }
  };
}
