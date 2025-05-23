"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateQuestion = void 0;
const ErrorHandler_1 = __importDefault(require("../../../shared/utils/ErrorHandler"));
const validateQuestion = (q, idx, next) => {
    const fail = (msg) => {
        next(new ErrorHandler_1.default(`Question ${idx + 1}: ${msg}`, 400));
        return true;
    };
    if (!q || typeof q !== "object")
        return fail("must be an object");
    if (!q.type)
        return fail("type is required");
    switch (q.type) {
        case "SINGLE_CHOICE":
            if (!Array.isArray(q.answers) || q.answers.length < 2)
                return fail("requires at least two answers");
            if (typeof q.correctAnswer !== "number")
                return fail("correctAnswer (index) is required");
            if (q.correctAnswer < 0 || q.correctAnswer >= q.answers.length)
                return fail("correctAnswer index is out of range");
            break;
        case "MULTIPLE_CHOICE":
            if (!Array.isArray(q.answers) || q.answers.length < 2)
                return fail("requires at least two answers");
            if (!Array.isArray(q.correctAnswers) || q.correctAnswers.length === 0)
                return fail("correctAnswers array is required");
            if (q.correctAnswers.some((n) => n < 0 || n >= q.answers.length))
                return fail("one or more correctAnswers indices are out of range");
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
            if (!Array.isArray(q.answers) || q.answers.length === 0)
                return fail("answers array is required");
            break;
        case "RATING_SCALE":
            if (typeof q.scoreFrom !== "number" ||
                typeof q.scoreTo !== "number" ||
                q.scoreFrom >= q.scoreTo)
                return fail("scoreFrom must be less than scoreTo");
            break;
        default:
            return fail(`unknown type "${q.type}"`);
    }
    return false; // validation passed
};
exports.validateQuestion = validateQuestion;
