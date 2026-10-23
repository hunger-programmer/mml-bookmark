import type { SupabaseEndpoints } from "./supabase";

export interface TestSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  token_type: string;
  user: { id: string; email: string };
}

async function call<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const body = await response.text();
  if (!response.ok) throw new Error(`${init.method ?? "GET"} ${url} → ${response.status} ${body}`);
  return JSON.parse(body) as T;
}

let counter = 0;
/** A unique address per call, so tests never collide inside one reset database. */
export const uniqueEmail = (label: string) => `${label}-${Date.now()}-${counter++}@example.test`;

/** Creates a confirmed user through the Auth admin API (secret key). */
export async function createConfirmedUser(supabase: SupabaseEndpoints, email: string, password: string): Promise<{ id: string }> {
  return call(`${supabase.apiUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: { apikey: supabase.secretKey, "content-type": "application/json" },
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
}

/** Password sign-in straight against Supabase Auth, as the Chrome extension will do. */
export async function signInWithPassword(supabase: SupabaseEndpoints, email: string, password: string): Promise<TestSession> {
  return call(`${supabase.apiUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: supabase.publishableKey, "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

/**
 * The cookie `@supabase/ssr` would have written for this session: name
 * `sb-<first label of the API host>-auth-token`, value `base64-` + base64url(JSON).
 * Short sessions fit in one cookie; chunking (`.0`, `.1`) is not needed here.
 */
export function sessionCookie(supabase: SupabaseEndpoints, session: TestSession): string {
  const ref = new URL(supabase.apiUrl).hostname.split(".")[0];
  const value = `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`;
  return `sb-${ref}-auth-token=${value}`;
}
