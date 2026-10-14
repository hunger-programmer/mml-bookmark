import { PostgreSqlContainer } from "@testcontainers/postgresql";

// Same major version as docker-compose.yml and production.
const POSTGRES_IMAGE = "postgres:17-alpine";

export interface TestDatabase {
  url: string;
  stop(): Promise<void>;
}

/** Starts a throwaway PostgreSQL container; each run gets its own empty database. */
export async function startPostgres(): Promise<TestDatabase> {
  const container = await new PostgreSqlContainer(POSTGRES_IMAGE).start();
  return {
    url: container.getConnectionUri(),
    stop: async () => {
      await container.stop();
    },
  };
}
