import "server-only";
import { createServerClient, type CookieMethodsServer, type CookieOptionsWithName } from "@supabase/ssr";
import { getServerEnv } from "../env";

/**
 * The browser never runs a Supabase client (D46), so nothing client-side needs the tokens:
 * the session cookies are httpOnly. `@supabase/ssr` defaults to `httpOnly: false`; these
 * options override its defaults for every cookie it writes or removes.
 */
export function sessionCookieOptions(): CookieOptionsWithName {
  return { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" };
}

/** A Supabase client bound to one request's cookies. Server-only; uses the publishable key. */
export function createSupabaseServerClient(cookies: CookieMethodsServer) {
  const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = getServerEnv();
  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { cookies, cookieOptions: sessionCookieOptions() });
}
