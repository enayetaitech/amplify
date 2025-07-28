import { z } from "zod";
import { alphanumericSingleSpace, alphaSingleSpace, noLeadingSpace, noMultipleSpaces, noTrailingSpace } from "./validators";

export const addModeratorSchema = z.object({
  firstName: z
    .string()
    .min(1, "First Name is required")
    .refine(noLeadingSpace, { message: "Cannot start with a space" })
    .refine(noTrailingSpace, { message: "Cannot end with a space" })
    .refine(alphaSingleSpace, {
      message: "Only letters and single spaces allowed",
    }),
  lastName: z
    .string()
    .min(1, "Last Name is required")
    .refine(noLeadingSpace, { message: "Cannot start with a space" })
    .refine(noTrailingSpace, { message: "Cannot end with a space" })
    .refine(alphaSingleSpace, {
      message: "Only letters and single spaces allowed",
    }),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Must be a valid email")
    .refine(noLeadingSpace, { message: "Cannot start with a space" })
    .refine(noTrailingSpace, { message: "Cannot end with a space" }),
  companyName: z
    .string()
    .min(1, "Company Name is required")
    .refine(noLeadingSpace, { message: "Cannot start with a space" })
    .refine(noTrailingSpace, { message: "Cannot end with a space" })
    .refine(noMultipleSpaces, {
      message: "No multiple spaces allowed",
    })
    .refine(alphanumericSingleSpace, {
      message: "Only letters/numbers & single spaces",
    }),
  roles: z
    .array(z.enum(["Admin", "Moderator", "Observer"]))
    .min(1, "Please select at least one role"),
});

export type AddModeratorValues = z.infer<typeof addModeratorSchema>;