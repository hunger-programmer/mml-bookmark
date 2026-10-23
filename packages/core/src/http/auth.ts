import { AccountSuspendedError, ForbiddenError, UnauthorizedError } from "./errors";

export interface Session {
  userId: string;
  email: string;
  isAdmin: boolean;
  suspended: boolean;
  /** How the request authenticated. Only cookie sessions carry an ambient credential, so only they need CSRF. */
  via: "cookie" | "bearer";
}

export type TokenScope = "save" | "read+save";

export interface TokenPrincipal {
  userId: string;
  scope: TokenScope;
}

/**
 * How `app` turns a request into an identity (Supabase cookies or Bearer token, personal
 * tokens later). `core` only depends on this port.
 */
export interface SessionReader {
  getSession(request: Request): Promise<Session | null>;
  getToken(request: Request): Promise<TokenPrincipal | null>;
}

/**
 * Header that `api-client` always sends. A cross-site HTML form or simple fetch cannot add it
 * without a CORS preflight, which is the CSRF defence for cookie-authenticated writes.
 */
export const CSRF_HEADER = "x-mml-csrf";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * CSRF check for state-changing requests. `requireSession` runs it for cookie sessions;
 * unauthenticated writes (sign-in, sign-up, password reset) call it directly.
 */
export function requireCsrf(request: Request): void {
  if (!SAFE_METHODS.has(request.method.toUpperCase()) && request.headers.get(CSRF_HEADER) !== "1") {
    throw new ForbiddenError("Missing CSRF header.");
  }
}

/** Rejects a suspended account. Every principal check (session, personal token) calls it. */
export function assertActive(principal: { suspended: boolean }): void {
  if (principal.suspended) throw new AccountSuspendedError();
}

/** Fail closed: a reader that throws counts as "not signed in". */
export async function requireSession(reader: SessionReader, request: Request): Promise<Session> {
  let session: Session | null = null;
  try {
    session = await reader.getSession(request);
  } catch {
    throw new UnauthorizedError();
  }
  if (!session) throw new UnauthorizedError();
  if (session.via === "cookie") requireCsrf(request);
  assertActive(session);
  return session;
}

/** Bearer-token clients (browser extension). Sends no ambient credential, so no CSRF header is needed. */
export async function requireToken(
  reader: SessionReader,
  request: Request,
  needs: "save" | "read",
): Promise<TokenPrincipal> {
  let principal: TokenPrincipal | null = null;
  try {
    principal = await reader.getToken(request);
  } catch {
    throw new UnauthorizedError();
  }
  if (!principal) throw new UnauthorizedError();
  if (needs === "read" && principal.scope !== "read+save") throw new ForbiddenError("This token can't read.");
  return principal;
}

export function requireAdmin(session: Pick<Session, "isAdmin">): void {
  if (!session.isAdmin) throw new ForbiddenError();
}

/** Ownership check for a loaded record. Missing owner id is a denial. */
export function assertOwns(session: Pick<Session, "userId">, ownerId: string | null | undefined): void {
  if (!ownerId || ownerId !== session.userId) throw new ForbiddenError();
}
