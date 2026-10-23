import { z } from "zod";
import { newPasswordField } from "./fields";

export const passwordSchema = z.object({ password: newPasswordField });

export type PasswordInput = z.infer<typeof passwordSchema>;
