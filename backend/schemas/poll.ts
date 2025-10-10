import { z } from "zod";

const baseQuestion = z.object({
  _id: z.string().optional(),
  type: z.string(),
  prompt: z.string(),
  required: z.boolean().optional(),
  image: z.string().optional(),
});

const singleChoice = baseQuestion.extend({
  type: z.literal("SINGLE_CHOICE"),
  answers: z.array(z.string()).min(2),
  correctAnswer: z.number().int().nonnegative().optional(),
  showDropdown: z.boolean().optional(),
});

const multipleChoice = baseQuestion.extend({
  type: z.literal("MULTIPLE_CHOICE"),
  answers: z.array(z.string()).min(2),
  correctAnswers: z.array(z.number().int()).optional(),
});

const shortAnswer = baseQuestion.extend({
  type: z.literal("SHORT_ANSWER"),
  minChars: z.number().int().optional(),
  maxChars: z.number().int().optional(),
});
const longAnswer = baseQuestion.extend({
  type: z.literal("LONG_ANSWER"),
  minChars: z.number().int().optional(),
  maxChars: z.number().int().optional(),
});

const fillInBlank = baseQuestion.extend({
  type: z.literal("FILL_IN_BLANK"),
  answers: z.array(z.string()),
});

const matching = baseQuestion.extend({
  type: z.literal("MATCHING"),
  options: z.array(z.string()),
  answers: z.array(z.string()),
});

const rankOrder = baseQuestion.extend({
  type: z.literal("RANK_ORDER"),
  rows: z.array(z.string()),
  columns: z.array(z.string()),
});

const ratingScale = baseQuestion.extend({
  type: z.literal("RATING_SCALE"),
  scoreFrom: z.number().int(),
  scoreTo: z.number().int(),
  lowLabel: z.string().optional(),
  highLabel: z.string().optional(),
});

export const zPollQuestion = z.union([
  singleChoice,
  multipleChoice,
  shortAnswer,
  longAnswer,
  fillInBlank,
  matching,
  rankOrder,
  ratingScale,
]);

export const zCreatePollPayload = z.object({
  projectId: z.string(),
  sessionId: z.string().optional(),
  title: z.string().min(1),
  questions: z.array(zPollQuestion).min(1),
  createdBy: z.string(),
  createdByRole: z.enum(["Admin", "Moderator"]),
});

export const zUpdatePollPayload = z.object({
  title: z.string().optional(),
  questions: z.array(zPollQuestion).optional(),
  isRun: z.boolean().optional(),
});

export const zLaunchPayload = z.object({
  sessionId: z.string(),
  settings: z
    .object({
      anonymous: z.boolean().optional(),
      shareResults: z.enum(["never", "onStop", "immediate"]).optional(),
      timeLimitSec: z.number().int().optional(),
    })
    .optional(),
});

export const zStopPayload = z.object({ sessionId: z.string() });

export const zSharePayload = z.object({
  sessionId: z.string(),
  runId: z.string(),
});

// Respond answer variants
const zAnswerSingle = z.object({
  questionId: z.string(),
  value: z.number().int().min(0),
});
const zAnswerMulti = z.object({
  questionId: z.string(),
  value: z.array(z.number().int().min(0)).nonempty(),
});
const zAnswerText = z.object({ questionId: z.string(), value: z.string() });
const zAnswerRating = z.object({
  questionId: z.string(),
  value: z.number().int(),
});
const zAnswerFill = z.object({
  questionId: z.string(),
  value: z.array(z.string()),
});
const zAnswerMatching = z.object({
  questionId: z.string(),
  value: z.array(z.tuple([z.number().int(), z.number().int()])),
});
const zAnswerRank = z.object({
  questionId: z.string(),
  value: z.array(z.number().int()),
});

export const zRespondPayload = z.object({
  sessionId: z.string(),
  runId: z.string(),
  answers: z.array(
    z.union([
      zAnswerSingle,
      zAnswerMulti,
      zAnswerText,
      zAnswerRating,
      zAnswerFill,
      zAnswerMatching,
      zAnswerRank,
    ])
  ),
});

export type CreatePollPayload = z.infer<typeof zCreatePollPayload>;
export type RespondPayload = z.infer<typeof zRespondPayload>;
