import { Migration } from '@mikro-orm/migrations';

export class Migration20261023004313 extends Migration {

  override name = 'Migration20261023004313';

  override up(): void | Promise<void> {
    this.addSql(`create table "users" ("id" uuid not null, "email" text not null, "is_admin" boolean not null default false, "suspended_at" timestamptz null, "created_at" timestamptz not null default now(), primary key ("id"));`);

    this.addSql(`alter table "users" enable row level security;`);

    // Hand-written, not from the diff: Supabase grants every role full access to new tables in
    // `public`, and its Data API exposes them to the publishable key and to user JWTs. RLS with no
    // policies already denies rows; revoking the grants denies the table itself. The default
    // privileges cover every table, sequence and function later migrations create.
    this.addSql(`revoke all on table "users" from anon, authenticated;`);
    this.addSql(`alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;`);
    this.addSql(`alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;`);
    this.addSql(`alter default privileges for role postgres in schema public revoke all on functions from anon, authenticated;`);
  }

  override down(): void | Promise<void> {
    // Restores Supabase's defaults for `public`.
    this.addSql(`alter default privileges for role postgres in schema public grant all on tables to anon, authenticated;`);
    this.addSql(`alter default privileges for role postgres in schema public grant all on sequences to anon, authenticated;`);
    this.addSql(`alter default privileges for role postgres in schema public grant all on functions to anon, authenticated;`);
    this.addSql(`drop table if exists "users" cascade;`);
  }

}
