import { z } from "zod";
import { emailField, newPasswordField } from "./fields";

export const signUpSchema = z.object({ email: emailField, password: newPasswordField });

export type SignUpInput = z.infer<typeof signUpSchema>;
