import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/** Runs a command to completion; the error carries stdout/stderr so a CI failure is readable. */
export async function run(command: string, args: string[], options: { cwd: string; env?: NodeJS.ProcessEnv }): Promise<string> {
  try {
    const { stdout } = await execFileAsync(command, args, { ...options, env: { ...process.env, ...options.env }, maxBuffer: 16 * 1024 * 1024 });
    return stdout;
  } catch (error) {
    const { stdout = "", stderr = "" } = error as { stdout?: string; stderr?: string };
    throw new Error(`${command} ${args.join(" ")} failed\n${stdout}\n${stderr}`, { cause: error });
  }
}
