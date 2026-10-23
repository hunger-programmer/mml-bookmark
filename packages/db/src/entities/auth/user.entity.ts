import { defineEntity, p, type InferEntity } from "@mikro-orm/postgresql";

/**
 * Our own user row (D47). `id` is the Supabase user id; there is deliberately no foreign key
 * into the `auth` schema, which Supabase owns and the schema diff ignores.
 * RLS is declared here (no policies = deny all) so the diff keeps it enabled: the Data API
 * must never expose this table to `anon` or `authenticated` (spec: Data API lockdown).
 */
export const User = defineEntity({
  name: "User",
  tableName: "users",
  rowLevelSecurity: true,
  properties: {
    id: p.uuid().primary(),
    email: p.text(),
    isAdmin: p.boolean().default(false),
    suspendedAt: p.datetime().nullable(),
    createdAt: p.datetime().defaultRaw("now()"),
  },
});

export type IUser = InferEntity<typeof User>;
