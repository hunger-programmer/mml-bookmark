import type { TestProject } from "vitest/node";
import { buildApp, migrate, startApp } from "./app-server";
import { startPostgres } from "./postgres";

declare module "vitest" {
  export interface ProvidedContext {
    baseUrl: string;
  }
}

/**
 * Ephemeral environment for the whole run: build the app, start PostgreSQL in a container,
 * apply migrations, start the production server against it. Everything is torn down afterwards.
 */
export default async function setup(project: TestProject): Promise<() => Promise<void>> {
  await buildApp();
  const database = await startPostgres();
  try {
    await migrate(database.url);
    const app = await startApp(database.url);
    project.provide("baseUrl", app.baseUrl);
    return async () => {
      await app.stop();
      await database.stop();
    };
  } catch (error) {
    await database.stop();
    throw error;
  }
}
