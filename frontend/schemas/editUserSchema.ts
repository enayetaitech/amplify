// shared/schemas/editUser.ts
import { z } from "zod";

export const editUserSchema = z.object({
  firstName: z
    .string()
    .min(1, { message: "First Name is required" })
    .max(50, { message: "First Name can be at most 50 characters long" })
    .regex(/^[A-Za-z ]+$/, {
      message: "First Name can only contain letters and spaces",
    }),
  lastName: z
    .string()
    .min(1, { message: "Last Name is required" })
    .max(50, { message: "Last Name can be at most 50 characters long" })
    .regex(/^[A-Za-z ]+$/, {
      message: "Last Name can only contain letters and spaces",
    }),
  companyName: z
    .string()
    .min(1, { message: "Company Name is required" })
    .max(50, { message: "Company Name can be at most 50 characters long" })
    .regex(/^[A-Za-z ]+$/, {
      message: "Company Name can only contain letters and spaces",
    }),
  phoneNumber: z
    .string()
    .min(10, { message: "Phone Number must be at least 10 digits long" })
    .max(15, { message: "Phone Number can be at most 15 digits long" })
    .regex(/^[0-9]+$/, {
      message: "Phone Number can only contain digits",
    }),
});

export type EditUserFormValues = z.infer<typeof editUserSchema>;
