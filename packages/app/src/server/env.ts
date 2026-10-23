import "server-only";
import { z } from "zod";

const serverEnvSchema = z.object({
  SUPABASE_URL: z.url(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;

/**
 * Server env, validated on first use rather than at import, so `next build` passes with
 * none of it set (CI builds without secrets). The error names variables, never values.
 */
export function getServerEnv(): ServerEnv {
  if (cached) return cached;
  const result = serverEnvSchema.safeParse(process.env);
  if (!result.success) {
    const problems = result.error.issues.map((issue) => `${issue.path.join(".")} (${issue.message})`).join(", ");
    throw new Error(`Server environment is not valid: ${problems}. See .env.example.`);
  }
  cached = result.data;
  return cached;
}
