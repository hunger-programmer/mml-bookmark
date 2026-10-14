import { defineConfig, type Options } from "@mikro-orm/postgresql";
import { entities } from "./entities";

function intFromEnv(name: string, fallback: number): number {
  const value = process.env[name];
  if (value === undefined || value === "") return fallback;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`${name} must be an integer, got "${value}"`);
  }
  return parsed;
}

/**
 * Runtime ORM config shared by the app and the CLI. Reads env at call time,
 * so callers load `.env` first.
 */
export function createOrmConfig(overrides: Options = {}): Options {
  const clientUrl = process.env.DATABASE_URL;
  if (!clientUrl) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env.");
  }

  return defineConfig({
    clientUrl,
    entities: [...entities],
    pool: {
      min: intFromEnv("DB_POOL_MIN", 2),
      max: intFromEnv("DB_POOL_MAX", 10),
    },
    // No entities exist yet; drop this once the first one is added.
    discovery: { warnWhenNoEntities: false },
    debug: process.env.DB_DEBUG === "true",
    ...overrides,
  });
}
