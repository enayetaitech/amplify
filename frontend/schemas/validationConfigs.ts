// schemas/validationConfigs.ts
import {
  noLeadingSpace,
  noTrailingSpace,
  noMultipleSpaces,
  alphanumericSingleSpace,
  alphaSingleSpace,
} from "./validators";

export const textRules = [
  { fn: noLeadingSpace, message: "Cannot start with a space" },
  { fn: noTrailingSpace, message: "Cannot end with a space" },
  { fn: noMultipleSpaces, message: "No multiple spaces allowed" },
];

export const alphaRules = [
  ...textRules,
  { fn: alphaSingleSpace, message: "Only letters & single spaces allowed" },
];

export const alphanumericRules = [
  ...textRules,
  {
    fn: alphanumericSingleSpace,
    message: "Only letters, numbers & single spaces allowed",
  },
];
