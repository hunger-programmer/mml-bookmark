import type { TestProject } from "vitest/node";
import { buildApp, checkSchema, migrate, startApp } from "./app-server";
import { startSupabase } from "./supabase";

declare module "vitest" {
  export interface ProvidedContext {
    baseUrl: string;
  }
}

/**
 * Environment for the whole run: build the app, start (or reuse) the local Supabase stack and
 * reset its database, apply migrations, check that entities and migrations agree, start the
 * production server against it.
 */
export default async function setup(project: TestProject): Promise<() => Promise<void>> {
  await buildApp();
  const supabase = await startSupabase();
  try {
    await migrate(supabase.dbUrl);
    await checkSchema(supabase.dbUrl);
    const app = await startApp(supabase.dbUrl);
    project.provide("baseUrl", app.baseUrl);
    return async () => {
      await app.stop();
      await supabase.stop();
    };
  } catch (error) {
    await supabase.stop();
    throw error;
  }
}
