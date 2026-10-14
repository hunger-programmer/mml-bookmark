export interface Logger {
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

/** Keys whose values never reach a log line, at any depth. */
const REDACTED_KEYS = /pass(word)?|token|secret|authorization|cookie|api[-_]?key/i;
const MAX_DEPTH = 5;

function redact(value: unknown, depth = 0): unknown {
  if (value instanceof Error) return { name: value.name, message: value.message, stack: value.stack };
  if (depth >= MAX_DEPTH || typeof value !== "object" || value === null) return value;
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, REDACTED_KEYS.test(key) ? "[redacted]" : redact(item, depth + 1)]),
  );
}

export function createLogger(write: (line: string) => void = (line) => console.log(line)): Logger {
  const log = (level: string) => (message: string, context?: Record<string, unknown>) => {
    write(JSON.stringify({ level, message, time: new Date().toISOString(), ...(redact(context) as object) }));
  };
  return { info: log("info"), warn: log("warn"), error: log("error") };
}

/** Process-wide default. Also registered on the container as `logger`. */
export const logger: Logger = createLogger();
