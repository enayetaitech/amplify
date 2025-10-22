import { z } from "zod";
import { Roles } from "../constants/roles";

export const CreateAdminUserSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phoneNumber: z.string().min(5),
  companyName: z.string().min(1),
  role: z.nativeEnum(Roles),
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

export const ListUsersQuerySchema = z.object({
  q: z.string().optional(),
  companyName: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const ResendInviteSchema = z.object({
  userId: z.string(),
});

export const ExternalAdminsQuerySchema = z.object({
  q: z.string().optional(),
  companyName: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const TransferProjectsSchema = z.object({
  fromAdminId: z.string(),
  toAdminId: z.string(),
});

export type CreateAdminUserInput = z.infer<typeof CreateAdminUserSchema>;
export type EditAdminUserInput = z.infer<typeof EditAdminUserSchema>;
export type StatusUpdateInput = z.infer<typeof StatusUpdateSchema>;
export type ListUsersQueryInput = z.infer<typeof ListUsersQuerySchema>;
export type ResendInviteInput = z.infer<typeof ResendInviteSchema>;
export type ExternalAdminsQueryInput = z.infer<
  typeof ExternalAdminsQuerySchema
>;
export type TransferProjectsInput = z.infer<typeof TransferProjectsSchema>;
