import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { run } from "./commands";
import { repoRoot } from "./paths";

const require = createRequire(import.meta.url);
const agentBrowserBin = resolve(dirname(require.resolve("agent-browser/package.json")), "bin/agent-browser.js");

/**
 * Thin wrapper over the agent-browser CLI. Each instance owns one browser session, so test
 * files cannot interfere with each other. Call `close()` in `afterAll`.
 */
export class Browser {
  private readonly session = `itest-${randomUUID().slice(0, 8)}`;

  private cli(args: string[]): Promise<string> {
    return run(process.execPath, [agentBrowserBin, "--session", this.session, ...args], { cwd: repoRoot });
  }

  async open(url: string): Promise<void> {
    await this.cli(["open", url]);
  }

  async title(): Promise<string> {
    return (await this.cli(["get", "title"])).trim();
  }

  /** Visible text of the element matching `selector` (default: whole page). */
  async text(selector = "body"): Promise<string> {
    return (await this.cli(["get", "text", selector])).trim();
  }

  /** Accessibility tree with element refs: roles and accessible names, what a user (or agent) perceives. */
  async snapshot(): Promise<string> {
    return this.cli(["snapshot"]);
  }

  async close(): Promise<void> {
    await this.cli(["close"]);
  }
}
