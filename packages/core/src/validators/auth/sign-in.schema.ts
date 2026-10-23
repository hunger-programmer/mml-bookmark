import { z } from "zod";
import { PASSWORD_MAX_LENGTH, emailField } from "./fields";

/** No minimum length: a sign-in must not reveal the password rules of an existing account. */
export const signInSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Enter your password.").max(PASSWORD_MAX_LENGTH, "Enter your password."),
});

export type SignInInput = z.infer<typeof signInSchema>;
