import { existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Loads the monorepo-root `.env` for processes that Next.js does not start
 * (the MikroORM CLI, scripts). Variables already set in the environment win.
 */
export function loadRootEnv(): void {
  const file = resolve(import.meta.dirname, "../../../.env");
  if (existsSync(file)) {
    process.loadEnvFile(file);
  }
}
