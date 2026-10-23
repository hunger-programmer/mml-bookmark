import { run } from "./commands";
import { repoRoot } from "./paths";

/** The local Supabase stack, from `supabase status -o env`. Auth keys are added when a test needs them. */
export interface TestSupabase {
  dbUrl: string;
  stop(): Promise<void>;
}

const supabase = (args: string[]) => run("pnpm", ["exec", "supabase", ...args], { cwd: repoRoot });

/** Parses `KEY="value"` lines; the CLI quotes every value. */
export function parseStatusEnv(output: string): Record<string, string> {
  const values: Record<string, string> = {};
  for (const line of output.split("\n")) {
    const [, key, value] = /^([A-Z_]+)="?(.*?)"?$/.exec(line.trim()) ?? [];
    if (key && value !== undefined) values[key] = value;
  }
  return values;
}

function required(values: Record<string, string>, key: string): string {
  const value = values[key];
  if (!value) throw new Error(`supabase status did not report ${key}`);
  return value;
}

async function isRunning(): Promise<boolean> {
  try {
    await supabase(["status"]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Uses the local Supabase stack, starting it when it is not running, and wipes it with
 * `supabase db reset` (public and auth data both go). A stack this run started is stopped
 * afterwards; one that was already running (a developer's) is left running.
 */
export async function startSupabase(): Promise<TestSupabase> {
  const wasRunning = await isRunning();
  if (!wasRunning) await run("pnpm", ["supabase:start"], { cwd: repoRoot });
  await supabase(["db", "reset"]);
  const values = parseStatusEnv(await supabase(["status", "-o", "env"]));
  return {
    dbUrl: required(values, "DB_URL"),
    stop: async () => {
      if (!wasRunning) await run("pnpm", ["supabase:stop"], { cwd: repoRoot });
    },
  };
}
