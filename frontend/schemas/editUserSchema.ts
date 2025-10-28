import { z } from "zod";

const onlyLettersSpaces = /^[A-Za-z ]+$/;

// Will trim and collapse multiple spaces between words
const normalizeSpaces = (val: string) => val.replace(/\s+/g, " ").trim();

export const editUserSchema = z.object({
  firstName: z
    .string()
    .max(50, { message: "First Name can be at most 50 characters long" })
    .regex(onlyLettersSpaces, {
      message: "First Name can only contain letters and spaces",
    })
    .transform(normalizeSpaces)
    .refine((val) => val.length > 0, {
      message: "First Name cannot be empty or only spaces",
    }),
  lastName: z
    .string()
    .max(50, { message: "Last Name can be at most 50 characters long" })
    .regex(onlyLettersSpaces, {
      message: "Last Name can only contain letters and spaces",
    })
    .transform(normalizeSpaces)
    .refine((val) => val.length > 0, {
      message: "Last Name cannot be empty or only spaces",
    }),
  email: z
    .string()
    .email({ message: "Invalid email address" })
    .transform((val) => val.toLowerCase().trim()),
  phoneNumber: z
    .string()
    .min(10, { message: "Phone Number must be at least 10 digits long" })
    .max(15, { message: "Phone Number can be at most 15 digits long" })
    .regex(/^\+?[0-9]{10,15}$/, {
      message:
        "Phone Number must be 10–15 digits long, and may start with a '+'",
    }),
  companyName: z
    .string()
    .max(50, { message: "Company Name can be at most 50 characters long" })
    .regex(onlyLettersSpaces, {
      message: "Company Name can only contain letters and spaces",
    })
    .transform(normalizeSpaces)
    .refine((val) => val.length > 0, {
      message: "Company Name cannot be empty or only spaces",
    }),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
});

export type EditUserFormValues = z.infer<typeof editUserSchema>;
