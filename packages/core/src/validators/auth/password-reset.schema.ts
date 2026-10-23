import { z } from "zod";
import { emailField } from "./fields";

export const passwordResetSchema = z.object({ email: emailField });

export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
