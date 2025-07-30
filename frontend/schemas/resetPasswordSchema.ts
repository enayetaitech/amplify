// schemas/resetPasswordSchema.ts
import { z } from "zod";

export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(9, "Password must be at least 9 characters")
      .regex(
        /(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*\W)/,
        "Must include uppercase, lowercase, number & special char"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

export type ResetPasswordInputs = z.infer<typeof resetPasswordSchema>;
