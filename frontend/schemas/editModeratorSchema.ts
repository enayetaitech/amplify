import { z } from "zod";
import { alphanumericSingleSpace, alphaSingleSpace, noLeadingSpace, noMultipleSpaces, noTrailingSpace } from "./validators";

export const editModeratorSchema = z.object({
  firstName: z
    .string()
    .min(1, "First Name is required")
    .refine(noLeadingSpace, { message: "First Name Cannot start with a space" })
    .refine(noTrailingSpace, { message: "First Name Cannot end with a space" })
    .refine(alphaSingleSpace, {
      message: "Only letters and single spaces allowed in first name",
    }),
  lastName: z
    .string()
    .min(1, "Last Name is required")
    .refine(noLeadingSpace, { message: "Last Name Cannot start with a space" })
    .refine(noTrailingSpace, { message: "Last Name Cannot end with a space" })
    .refine(alphaSingleSpace, {
      message: "Only letters and single spaces allowed in last name ",
    }),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Must be a valid email")
    .refine(noLeadingSpace, { message: "Email Cannot start with a space" })
    .refine(noTrailingSpace, { message: "Email Cannot end with a space" }),
  companyName: z
    .string()
    .min(1, "Company Name is required")
    .refine(noLeadingSpace, { message: "Company Name Cannot start with a space" })
    .refine(noTrailingSpace, { message: "Company Name Cannot end with a space" })
    .refine(noMultipleSpaces, { message: "No multiple spaces allowed in company name " })
    .refine(alphanumericSingleSpace, {
      message: "Company Name can only contain letters/numbers & single spaces",
    }),
  adminAccess: z.boolean(),
  isActive:    z.boolean(),
});

export type EditModeratorForm = z.infer<typeof editModeratorSchema>;
