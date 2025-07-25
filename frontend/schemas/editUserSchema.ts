import { z } from "zod";

const onlyLettersSpaces = /^[A-Za-z ]+$/;

export const editUserSchema = z.object({
  firstName: z
    .string()
    .max(50, { message: "First Name can be at most 50 characters long" })
    .regex(onlyLettersSpaces, { message: "First Name can only contain letters and spaces" })
    .refine((val) => val.trim().length > 0, { message: "First Name cannot be only spaces" }),
  lastName: z
    .string()
    .max(50, { message: "Last Name can be at most 50 characters long" })
    .regex(onlyLettersSpaces, { message: "Last Name can only contain letters and spaces" })
    .refine((val) => val.trim().length > 0, { message: "Last Name cannot be only spaces" }),
  companyName: z
    .string()
    .max(50, { message: "Company Name can be at most 50 characters long" })
    .regex(onlyLettersSpaces, { message: "Company Name can only contain letters and spaces" })
    .refine((val) => val.trim().length > 0, { message: "Company Name cannot be only spaces" }),
  phoneNumber: z
    .string()
    .min(10, { message: "Phone Number must be at least 10 digits long" })
    .max(15, { message: "Phone Number can be at most 15 digits long" })
    .regex(/^[0-9]+$/, { message: "Phone Number can only contain digits" }),
});

export type EditUserFormValues = z.infer<typeof editUserSchema>;
