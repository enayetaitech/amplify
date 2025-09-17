import { z } from "zod";
import {
  noLeadingSpace,
  noTrailingSpace,
  noMultipleSpaces,
  alphaSingleSpace,
  emailChars,
} from "./validators";

// Builder to create a name schema with a field-specific required message
const buildNameSchema = (requiredMsg: string) =>
  z
    .string()
    .min(1, { message: requiredMsg })
    .max(20, { message: "Must be 20 characters or fewer" })
    .refine(noLeadingSpace, { message: "Cannot start with a space" })
    .refine(noTrailingSpace, { message: "Cannot end with a space" })
    .refine(noMultipleSpaces, { message: "No multiple spaces allowed" })
    .refine(alphaSingleSpace, {
      message: "Only letters and single spaces allowed",
    });

export const participantJoinSchema = z
  .object({
    firstName: buildNameSchema("First name is required"),
    lastName: buildNameSchema("Last name is required"),
    email: z
      .string()
      .min(1, { message: "Email is required" })
      .max(254, { message: "Email is too long" })
      .refine(noLeadingSpace, { message: "Cannot start with a space" })
      .refine(noTrailingSpace, { message: "Cannot end with a space" })
      .refine(noMultipleSpaces, { message: "No multiple spaces allowed" })
      .refine(emailChars, { message: "Invalid characters in email" })
      .transform((v) => v.trim().toLowerCase())
      .pipe(z.string().email({ message: "Please enter a valid email" })),
  })
  .strict();

export type ParticipantJoinValues = z.infer<typeof participantJoinSchema>;
