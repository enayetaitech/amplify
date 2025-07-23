// shared/schemas/auth.ts
import { z } from "zod";

const nameRegex = /^(?=.*[A-Za-z])[A-Za-z ]+$/;

export const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(1, { message: "First Name is required" })
      .max(50, { message: "First Name can be at most 50 characters long" })
      .regex(nameRegex, {
        message: "First Name must contain only letters/spaces and at least one letter",
      }),
    lastName: z
      .string()
      .min(1, { message: "Last Name is required" })
       .max(50, { message: "Last Name can be at most 50 characters long" })
      .regex(nameRegex, {
        message: "Last Name must contain only letters/spaces and at least one letter",
      }),
    email: z.string().email({ message: "Please enter a valid email address" }),
    companyName: z
      .string()
      .min(1, { message: "Company name is required" })
      .max(50, { message: "Company Name can be at most 50 characters long" })
      .regex(/^[A-Za-z ]+$/, {
        message: "Company Name can only contain letters and spaces",
      }),
    phoneNumber: z.string().min(10, { message: "Phone number is required" }),
    password: z.string().min(9, {
      message: "Password must be at least 9 characters long",
    }),
    confirmPassword: z
      .string()
      .min(1, { message: "Please confirm your password" }),
    terms: z.boolean().refine((val) => val === true, {
      message: "You must accept the Terms & Conditions",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Export the inferred TypeScript type as well, if needed:
export type RegisterFormValues = z.infer<typeof registerSchema>;
