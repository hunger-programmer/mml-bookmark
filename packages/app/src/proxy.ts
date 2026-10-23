import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "./server/auth/supabase-server";

const SESSION_COOKIE_PREFIX = "sb-";

/**
 * Refreshes an expired Supabase session (Supabase's Next.js 16 pattern). It authorises
 * nothing: `requireSession` does that in the handler. Rotated cookies go onto the forwarded
 * request, so the handler of this same request sees the fresh token, and onto the
 * response, so the browser keeps them.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  if (!request.cookies.getAll().some(({ name }) => name.startsWith(SESSION_COOKIE_PREFIX))) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createSupabaseServerClient({
    getAll: () => request.cookies.getAll(),
    setAll: (cookiesToSet, headers) => {
      for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
      response = NextResponse.next({ request });
      for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
      for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
    },
  });
  await supabase.auth.getClaims();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
