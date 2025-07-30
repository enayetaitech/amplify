// schemas/changePasswordSchema.ts
import { z } from "zod";

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(9, "Password must be at least 9 characters")
      .regex(
        /(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*\W)/,
        "Must include uppercase, lowercase, number & special char"
      ),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  // confirm matches newPassword
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords must match",
  })
  // newPassword ≠ currentPassword
  .refine((d) => d.newPassword !== d.currentPassword, {
    path: ["newPassword"],
    message: "New password cannot be the same as the current password",
  });

export type ChangePasswordInputs = z.infer<typeof changePasswordSchema>;
