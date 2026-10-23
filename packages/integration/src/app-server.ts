import { type ChildProcess, spawn } from "node:child_process";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import { appDir, repoRoot } from "./paths";
import { run } from "./commands";

const STARTUP_TIMEOUT_MS = 60_000;
const POLL_INTERVAL_MS = 250;

export interface RunningApp {
  baseUrl: string;
  stop(): Promise<void>;
}

async function freePort(): Promise<number> {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => (address && typeof address === "object" ? resolvePort(address.port) : reject(new Error("no port"))));
    });
  });
}

async function waitForHealth(baseUrl: string, child: ChildProcess, logs: () => string): Promise<void> {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`next start exited with code ${child.exitCode}\n${logs()}`);
    try {
      if ((await fetch(`${baseUrl}/api/v1/health`)).ok) return;
    } catch {
      // not listening yet
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  throw new Error(`The app did not answer /api/v1/health within ${STARTUP_TIMEOUT_MS} ms\n${logs()}`);
}

/** Production build of the app. Skipped when INTEGRATION_SKIP_BUILD=1 (CI builds in an earlier step). */
export async function buildApp(): Promise<void> {
  if (process.env.INTEGRATION_SKIP_BUILD === "1") return;
  await run("pnpm", ["--filter", "@mml-bookmark/app", "build"], { cwd: repoRoot });
}

/** Applies committed migrations to the database through the same script developers use. */
export async function migrate(databaseUrl: string): Promise<void> {
  await run("pnpm", ["db:migration:up"], { cwd: repoRoot, env: { DATABASE_URL: databaseUrl } });
}

/**
 * Fails when entities and migrations disagree, or when the diff would touch a schema
 * Supabase owns (a new one missing from `SUPABASE_SCHEMAS` in `@mml-bookmark/db`).
 */
export async function checkSchema(databaseUrl: string): Promise<void> {
  await run("pnpm", ["db:migration:check"], { cwd: repoRoot, env: { DATABASE_URL: databaseUrl } });
}

/** Starts `next start` on a free port against the given database and waits until it is healthy. */
export async function startApp(databaseUrl: string): Promise<RunningApp> {
  const port = await freePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const nextBin = createRequire(`${appDir}/package.json`).resolve("next/dist/bin/next");
  let output = "";
  const child = spawn(process.execPath, [nextBin, "start", "-p", String(port), "-H", "127.0.0.1"], {
    cwd: appDir,
    env: { ...process.env, DATABASE_URL: databaseUrl, NODE_ENV: "production" },
  });
  child.stdout.on("data", (chunk: Buffer) => (output += chunk.toString()));
  child.stderr.on("data", (chunk: Buffer) => (output += chunk.toString()));

  try {
    await waitForHealth(baseUrl, child, () => output);
  } catch (error) {
    child.kill("SIGTERM");
    throw error;
  }

  return {
    baseUrl,
    stop: async () => {
      if (child.exitCode !== null) return;
      const exited = new Promise<void>((resolveExit) => child.once("exit", () => resolveExit()));
      child.kill("SIGTERM");
      await exited;
    },
  };
}
