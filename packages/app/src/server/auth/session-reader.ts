import "server-only";
import type { UserService } from "@mml-bookmark/core/auth";
import type { Session, SessionReader, TokenPrincipal } from "@mml-bookmark/core/http";
import { parseCookieHeader } from "@supabase/ssr";
import { createSupabaseServerClient } from "./supabase-server";

const BEARER = /^Bearer\s+(\S+)$/i;

/** `undefined`: no Authorization header. `null`: a header that is not a usable Bearer token. */
function bearerToken(request: Request): string | null | undefined {
  const header = request.headers.get("authorization");
  if (header === null) return undefined;
  return BEARER.exec(header)?.[1] ?? null;
}

/**
 * Turns a request into a session through Supabase (D46). A Bearer header (Chrome extension)
 * wins over cookies; when present, cookies are ignored. Cookies are read only: refreshing
 * an expired token is `proxy.ts`'s job, which has already run for this request.
 */
export class SupabaseSessionReader implements SessionReader {
  private readonly userService: UserService;

  constructor({ userService }: { userService: UserService }) {
    this.userService = userService;
  }

  async getSession(request: Request): Promise<Session | null> {
    const bearer = bearerToken(request);
    if (bearer === null) return null;
    const via = bearer === undefined ? "cookie" : "bearer";
    const supabase = createSupabaseServerClient({
      getAll: () => (via === "bearer" ? [] : parseCookieHeader(request.headers.get("cookie") ?? "").map(({ name, value }) => ({ name, value: value ?? "" }))),
    });
    const { data, error } = await supabase.auth.getClaims(bearer);
    if (error || !data) return null;
    const { sub, email, role } = data.claims;
    // An anon-key JWT verifies too; only signed-in users with an email are accepted.
    if (role !== "authenticated" || !sub || !email) return null;
    const user = await this.userService.resolve({ id: sub, email: email.toLowerCase() });
    return { userId: user.id, email: user.email, isAdmin: user.isAdmin, suspended: user.suspendedAt !== null, via };
  }

  /** Personal tokens (R23) arrive with the clients spec. */
  async getToken(): Promise<TokenPrincipal | null> {
    return null;
  }
}
