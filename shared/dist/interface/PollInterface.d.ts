export type QuestionType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "MATCHING" | "RANK_ORDER" | "SHORT_ANSWER" | "LONG_ANSWER" | "FILL_IN_BLANK" | "RATING_SCALE";
export type BaseQuestion = {
    _id: string;
    type: QuestionType;
    prompt: string;
    required: boolean;
    image?: string;
};
export interface SingleChoiceQuestion extends BaseQuestion {
    type: "SINGLE_CHOICE";
    answers: string[];
    correctAnswer: number;
    showDropdown: boolean;
}
export interface MultipleChoiceQuestion extends BaseQuestion {
    type: "MULTIPLE_CHOICE";
    answers: string[];
    correctAnswers: number[];
}
export interface MatchingQuestion extends BaseQuestion {
    type: "MATCHING";
    options: string[];
    answers: string[];
}
export interface RankOrderQuestion extends BaseQuestion {
    type: "RANK_ORDER";
    rows: string[];
    columns: string[];
}
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
export interface FillInBlankQuestion extends BaseQuestion {
    type: "FILL_IN_BLANK";
    answers: string[];
}
export interface RatingScaleQuestion extends BaseQuestion {
    type: "RATING_SCALE";
    scoreFrom: number;
    scoreTo: number;
    lowLabel: string;
    highLabel: string;
}
export type PollQuestion = SingleChoiceQuestion | MultipleChoiceQuestion | MatchingQuestion | RankOrderQuestion | ShortAnswerQuestion | LongAnswerQuestion | FillInBlankQuestion | RatingScaleQuestion;
export interface IPoll {
    _id: string;
    projectId: string;
    sessionId?: string;
    title: string;
    questions: PollQuestion[];
    createdBy: {
        _id: string;
        firstName: string;
        lastName: string;
    };
    createdByRole: "Admin" | "Moderator";
    lastModified: Date;
    responsesCount: number;
    isRun: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface DraftQuestion {
    id: string;
    prompt: string;
    type: QuestionType;
    options: string[];
    answers: string[];
    rows: string[];
    columns: string[];
    required: boolean;
    correctAnswer: number;
    showDropdown: boolean;
    correctAnswers: number[];
    scoreFrom: number;
    scoreTo: number;
    lowLabel: string;
    highLabel: string;
    minChars: number;
    maxChars: number;
}
export type CreatePollPayload = {
    projectId: string;
    sessionId?: string;
    title: string;
    questions: APIPollQuestion[];
    createdBy: string;
    createdByRole: string;
};
export type APIPollQuestion = (DraftQuestion & {}) | {
    id: string;
    prompt: string;
    required: boolean;
    type: "RANK_ORDER";
    rows: string[];
    columns: string[];
};
export {};
//# sourceMappingURL=PollInterface.d.ts.map