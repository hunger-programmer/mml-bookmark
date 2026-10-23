import type { z } from "zod";
import { ValidationError } from "./errors";

/**
 * Parses input with a shared schema. Failures become a `ValidationError` whose `fields`
 * map each top-level field to its first message, the shape forms render.
 */
export function parseWith<Schema extends z.ZodType>(schema: Schema, input: unknown): z.output<Schema> {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  const fields: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.length > 0 ? String(issue.path[0]) : "_";
    fields[key] ??= issue.message;
  }
  throw new ValidationError("Check the highlighted fields.", fields);
}
