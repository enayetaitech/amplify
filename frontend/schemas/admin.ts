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
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phoneNumber: z.string().min(5).optional(),
  companyName: z.string().min(1).optional(),
});

export const StatusUpdateSchema = z.object({
  status: z.enum(["Active", "Inactive"]),
});
