import { z } from "zod";

/** Supabase hashes passwords with bcrypt, which ignores bytes past 72. */
export const PASSWORD_MAX_LENGTH = 72;
/** Must equal `minimum_password_length` in `supabase/config.toml` and the production project. */
export const PASSWORD_MIN_LENGTH = 8;

/** Trimmed and lowercased before the format check, so " Ana@X.com " is the same account as "ana@x.com". */
export const emailField = z.string("Enter a valid email address.").trim().toLowerCase().max(320).pipe(z.email("Enter a valid email address."));

export const newPasswordField = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters.`)
  .max(PASSWORD_MAX_LENGTH, `Use at most ${PASSWORD_MAX_LENGTH} characters.`);
