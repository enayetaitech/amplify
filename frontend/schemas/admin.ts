import { z } from "zod";

export const CreateAdminUserSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phoneNumber: z.string().min(5),
  companyName: z.string().min(1),
  role: z.string().min(1),
});

export const EditAdminUserSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phoneNumber: z
    .string()
    .min(5, "Phone number must be at least 5 characters")
    .regex(/^[0-9()+\-\s]+$/, "Phone number contains invalid characters"),
  companyName: z.string().min(1, "Company is required"),
});

export const StatusUpdateSchema = z.object({
  status: z.enum(["Active", "Inactive"]),
});
