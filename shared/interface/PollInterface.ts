/* ──────────────────────────  Question unions  ────────────────────────── */

type BaseQuestion = {
  _id: string; 
  type:
    | "SINGLE_CHOICE"
    | "MULTIPLE_CHOICE"
    | "MATCHING"
    | "RANK_ORDER"
    | "SHORT_ANSWER"
    | "LONG_ANSWER"
    | "FILL_IN_BLANK"
    | "RATING_SCALE";
  prompt: string;
  required: boolean;
  image?: string; 
};

/* SINGLE_CHOICE */
export interface SingleChoiceQuestion extends BaseQuestion {
  type: "SINGLE_CHOICE";
  answers: string[];
  correctAnswer: number; 
  showDropdown: boolean;
}

/* MULTIPLE_CHOICE */
export interface MultipleChoiceQuestion extends BaseQuestion {
  type: "MULTIPLE_CHOICE";
  answers: string[];
  correctAnswers: number[];   
}

/* MATCHING */
export interface MatchingQuestion extends BaseQuestion {
  type: "MATCHING";
  options: string[];  
  answers: string[];  
}

/* RANK_ORDER */
export interface RankOrderQuestion extends BaseQuestion {
  type: "RANK_ORDER";
  rows: string[];
  columns: string[];
}

/* SHORT / LONG ANSWER */
interface TextQuestionBase extends BaseQuestion {
  minChars?: number;
  maxChars?: number;
}
export interface ShortAnswerQuestion extends TextQuestionBase {
  type: "SHORT_ANSWER";
}
export interface LongAnswerQuestion extends TextQuestionBase {
  type: "LONG_ANSWER";
}

/* FILL_IN_BLANK */
export interface FillInBlankQuestion extends BaseQuestion {
  type: "FILL_IN_BLANK";
  answers: string[];  
}

/* RATING_SCALE */
export interface RatingScaleQuestion extends BaseQuestion {
  type: "RATING_SCALE";
  scoreFrom: number;
  scoreTo: number;
  lowLabel: string;
  highLabel: string;
}

/* Union of all question shapes */
export type PollQuestion =
  | SingleChoiceQuestion
  | MultipleChoiceQuestion
  | MatchingQuestion
  | RankOrderQuestion
  | ShortAnswerQuestion
  | LongAnswerQuestion
  | FillInBlankQuestion
  | RatingScaleQuestion;

/* ──────────────────────────  Poll interface  ────────────────────────── */

export interface IPoll {
  _id: string;
  projectId: string;
  sessionId?: string; 
  title: string;
  questions: PollQuestion[];

  createdBy: string;
  createdByRole: "ADMIN" | "MODERATOR";
  lastModified: Date;

  responsesCount: number;
  isRun: boolean;

  createdAt: Date;
  updatedAt: Date;
}
