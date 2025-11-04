import { NextFunction } from "express";
import ErrorHandler from "../../utils/ErrorHandler";

export const validateQuestion = (
  q: any,
  idx: number,
  next: NextFunction
): boolean => {
  const fail = (msg: string) => {
    next(new ErrorHandler(`Question ${idx + 1}: ${msg}`, 400));
    return true;
  };

  if (!q || typeof q !== "object") return fail("must be an object");
  if (!q.type) return fail("type is required");

  switch (q.type) {
    case "SINGLE_CHOICE":
      if (!Array.isArray(q.answers) || q.answers.length < 2)
        return fail("requires at least two answers");
      break;

    case "MULTIPLE_CHOICE":
      if (!Array.isArray(q.answers) || q.answers.length < 2)
        return fail("requires at least two answers");
      break;

    case "MATCHING":
      if (!Array.isArray(q.options) || !Array.isArray(q.answers))
        return fail("options and answers arrays are required");
      // Add length check here if you need strict one-to-one mapping
      // if (q.options.length !== q.answers.length)
      //   return error("options and answers must be the same length");
      break;

    case "RANK_ORDER":
      if (!Array.isArray(q.rows) || !Array.isArray(q.columns))
        return fail("rows and columns arrays are required");
      break;

    case "SHORT_ANSWER":
    case "LONG_ANSWER":
      // Add min/max char checks if desired
      break;

    case "FILL_IN_BLANK":
      // No validation needed - blanks don't require answers
      break;

    case "RATING_SCALE":
      if (
        typeof q.scoreFrom !== "number" ||
        typeof q.scoreTo !== "number" ||
        q.scoreFrom >= q.scoreTo
      )
        return fail("scoreFrom must be less than scoreTo");
      break;

    default:
      return fail(`unknown type "${q.type}"`);
  }

  return false; // validation passed
};
