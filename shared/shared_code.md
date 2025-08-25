--- C:\work\amplify-new\shared\interface\ApiResponseInterface.ts ---


export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}


export interface ErrorResponse {
  message: string;
}

--- C:\work\amplify-new\shared\interface\ChatMessageInterface.d.ts ---

export interface IChatMessage {
    _id: string;
    senderName: string;
    receiverName: string;
    senderEmail: string;
    receiverEmail: string;
    message: string;
    timestamp: Date;
}
//# sourceMappingURL=ChatMessageInterface.d.ts.map

--- C:\work\amplify-new\shared\interface\ChatMessageInterface.ts ---

export interface IChatMessage {
  _id: string;
  senderName: string;
  receiverName: string;
  senderEmail: string;
  receiverEmail: string;
  message: string;
  timestamp: Date;
}


--- C:\work\amplify-new\shared\interface\CountryCodeInterface.ts ---

export interface CountryCode {
  country: string;
  code: string;
  iso: string;
}


--- C:\work\amplify-new\shared\interface\CreateProjectInterface.ts ---

import { IProjectForm } from "./ProjectFormInterface";

// Local state type override: treat Date fields as strings to allow initial empty values

export type IProjectFormState = Omit<IProjectForm, "firstDateOfStreaming" | "projectDate"> & {
  firstDateOfStreaming: string;
  projectDate: string;
};

export interface StepProps {
  formData: IProjectFormState;
  updateFormData: (fields: Partial<IProjectFormState>) => void;
  uniqueId: string | null;
}


export interface Step1Props {
  // Note: We're using the state type that we defined in CreateProjectPage (date fields as strings)
  formData: Omit<IProjectFormState, "firstDateOfStreaming" | "projectDate"> & {
    firstDateOfStreaming: string;
    projectDate: string;
  };
  updateFormData: (fields: Partial<
    Omit<IProjectFormState, "firstDateOfStreaming" | "projectDate"> & {
      firstDateOfStreaming: string;
      projectDate: string;
    }
  >) => void;
}

export interface Step2Props {
  formData: IProjectFormState;
 updateFormData: (fields: Partial<IProjectFormState>) => void;
 uniqueId: string | null;
}

export type Step2FormValues = {
 respondentsPerSession: number;
 numberOfSessions: number;
 sessionLength: number;
 preWorkDetails: string;
 selectedLanguage: string;
 languageSessionBreakdown: string;
 additionalInfo: string;
 inLanguageHosting?: "yes" | "no";
 recruitmentSpecs?: string;
  provideInterpreter?: "yes" | "no" | "";
};

export interface Step3Props {
  formData: IProjectFormState;
  updateFormData: (fields: Partial<IProjectFormState>) => void;
  uniqueId: string | null;
}


export interface Step4Props {
  formData: {
    name: string;
    service: string;
    respondentCountry: string;
    respondentLanguage: string | string[];
    sessions: Array<{ number: number; duration: string }>;
    description?: string;
    firstDateOfStreaming: string;
  };
  updateFormData: (fields: Partial<IProjectFormState>) => void;
  uniqueId: string | null;
}

export interface PaymentIntegrationProps {
  totalPurchasePrice: number;
  totalCreditsNeeded: number;
  projectData: IProjectFormState;
  uniqueId: string | null;
}

export interface BillingFormProps {
  onSuccess: () => void;
}

export interface CardSetupFormProps {
  onCardSaved: () => void;
}

--- C:\work\amplify-new\shared\interface\ErrorInterface.d.ts ---

export interface ICustomError extends Error {
    statusCode?: number;
    message: string;
    name: string;
    code?: number;
    keyValue?: any;
    path?: string;
}
//# sourceMappingURL=ErrorInterface.d.ts.map

--- C:\work\amplify-new\shared\interface\ErrorInterface.ts ---

// error.interface.ts
export interface ICustomError extends Error {
  statusCode?: number;
  message: string;
  name: string;
  code?: number;
  keyValue?: any;
  path?: string;
}


--- C:\work\amplify-new\shared\interface\FilterValuesInterface.ts ---

export interface FilterValues {
  startDate: string;
  endDate: string;
  status: string;
  role: string;
  tag: string;
}


--- C:\work\amplify-new\shared\interface\GroupMessageInterface.d.ts ---

export interface IGroupMessage {
    _id: string;
    meetingId: string;
    senderEmail: string;
    name: string;
    content: string;
    timestamp: Date;
}
//# sourceMappingURL=GroupMessageInterface.d.ts.map

--- C:\work\amplify-new\shared\interface\GroupMessageInterface.ts ---

export interface IGroupMessage {
  _id: string;
  meetingId: string;
  senderEmail: string;
  name: string;
  content: string;
  timestamp: Date;
}


--- C:\work\amplify-new\shared\interface\LiveSessionInterface.d.ts ---

export type UserRole = "Participant" | "Observer" | "Moderator" | "Admin";
export interface IWaitingUser {
    name: string;
    email: string;
    role: Extract<UserRole, "Participant" | "Moderator" | "Admin">
    joinedAt: Date;
}
export interface IObserverWaitingUser {
    userId?: string;
    name: string;
    email: string;
    role: Extract<UserRole, "Observer" | "Moderator" | "Admin">
    joinedAt: Date;
}
export interface IParticipant {
    name: string;
    email: string;
    role: Extract<UserRole, "Participant" | "Moderator" | "Admin">
    joinedAt: Date;
}
export interface IObserver {
    userId?: string;
    name: string;
    email: string;
    role: Extract<UserRole, "Observer" | "Moderator" | "Admin">
    joinedAt: Date;
}
export interface ILiveSession {
    _id: string;
    sessionId: string;
    ongoing: boolean;
    startTime?: Date;
    endTime?: Date;
    participantWaitingRoom: IWaitingUser[];
    observerWaitingRoom: IObserverWaitingUser[];
    participantsList: IParticipant[];
    observerList: IObserver[];
}
//# sourceMappingURL=LiveSessionInterface.d.ts.map

--- C:\work\amplify-new\shared\interface\LiveSessionInterface.ts ---

// shared/interfaces/LiveSessionInterface.ts

export type UserRole = "Participant" | "Observer" | "Moderator" | "Admin";

export interface IWaitingUser {
  name: string;
  email: string;
  role: Extract<UserRole, "Participant" | "Moderator"  | "Admin">
  joinedAt: Date;
}

export interface IObserverWaitingUser {
  userId?: string;
  name: string;
  email: string;
  role: Extract<UserRole, "Observer" | "Moderator"  | "Admin">
  joinedAt: Date;
}

export interface IParticipant {
  name: string;
  email: string;
  role: Extract<UserRole, "Participant" | "Moderator" | "Admin">
  joinedAt: Date;
}

export interface IObserver {
  userId?: string;
  name: string;
  email: string;
  role: Extract<UserRole, "Observer" | "Moderator" | "Admin">
  joinedAt: Date;
}

export interface ILiveSession {
  _id: string;
  sessionId: string; 
  ongoing: boolean; 
  startTime?: Date;
  endTime?: Date;
  participantWaitingRoom: IWaitingUser[];
  observerWaitingRoom: IObserverWaitingUser[];
  participantsList: IParticipant[];
  observerList: IObserver[];
}

// export interface ILiveSession {
//   _id: string;
//   sessionId: string; // ref to ISession._id
//   ongoing: boolean; // toggled when moderator clicks “Start”
//   startTime?: Date;
//   endTime?: Date;
//   participantWaitingRoom: Array<{ 
//     name: string;
//     email: string;
//     role: "Participant" | "Moderator";
//     joinedAt: Date;
//   }>;
//   observerWaitingRoom: Array<{ 
//     userId?: string;
//     name: string;
//     email: string;
//     role: "Observer" | "Moderator";
//     joinedAt: Date;
//   }>;
//   participantsList: Array<{ 
//     name: string;
//     email: string;
//     role: "Participant" | "Moderator";
//     joinedAt: Date;
//   }>;
//   observerList: Array<{ 
//     userId?: string;
//     name: string;
//     email: string;
//     role: "Observer" | "Moderator";
//     joinedAt: Date;
//   }>;
//   // add any other runtime flags here (e.g. breakRooms, currentPollId, etc.)
// }


--- C:\work\amplify-new\shared\interface\ModeratorAddedEmailInterface.d.ts ---

export interface ModeratorAddedEmailParams {
    moderatorName: string;
    addedByName: string;
    projectName: string;
    loginUrl: string;
}
//# sourceMappingURL=ModeratorAddedEmailInterface.d.ts.map

--- C:\work\amplify-new\shared\interface\ModeratorAddedEmailInterface.ts ---


export interface ModeratorAddedEmailParams {
  moderatorName: string;
  addedByName: string;
  projectName: string;
  loginUrl: string;
  roles: string[]
}

--- C:\work\amplify-new\shared\interface\ModeratorInterface.d.ts ---

export type Role = "Admin" | "Moderator" | "Observer";
export interface IModerator {
    _id?: string;
    firstName: string;
    lastName: string;
    email: string;
    companyName: string;
    adminAccess: boolean;
    roles: Role[];
    projectId: string;
    isVerified: boolean;
    isActive: boolean;
}
//# sourceMappingURL=ModeratorInterface.d.ts.map

--- C:\work\amplify-new\shared\interface\ModeratorInterface.ts ---

export type Role = "Admin" | "Moderator" | "Observer";

export interface IModerator {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  adminAccess: boolean;
  roles: Role[];
  projectId: string;
  isVerified: boolean;
  isActive: boolean;
}

--- C:\work\amplify-new\shared\interface\ObserverDocumentInterface.d.ts ---

export interface IObserverDocument {
    _id: string;
    projectId: string;
    sessionId: string;
    displayName: string;
    size: number;
    storageKey: string;
    addedBy: string;
    addedByRole: "ADMIN" | "MODERATOR" | "OBSERVER";
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=ObserverDocumentInterface.d.ts.map

--- C:\work\amplify-new\shared\interface\ObserverDocumentInterface.ts ---

// shared/interfaces/IObserverDocument.ts
export interface IObserverDocument {
  _id: string;  
  projectId: string;  
  sessionId: string;  
  displayName: string;
  size: number;  
  storageKey: string;  
  addedBy: string;  
  addedByRole: "ADMIN" | "MODERATOR" | "OBSERVER";
  createdAt: Date;
  updatedAt: Date;
}


--- C:\work\amplify-new\shared\interface\ObserverGroupMessageInterface.d.ts ---

export interface IObserverGroupMessage {
    _id: string;
    meetingId: string;
    senderEmail: string;
    name: string;
    content: string;
    timestamp: Date;
}
//# sourceMappingURL=ObserverGroupMessageInterface.d.ts.map

--- C:\work\amplify-new\shared\interface\ObserverGroupMessageInterface.ts ---

export interface IObserverGroupMessage {
  _id: string;
  meetingId: string;
  senderEmail: string;
  name: string;
  content: string;
  timestamp: Date;
}


--- C:\work\amplify-new\shared\interface\PaginationInterface.ts ---

export interface IPaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
}

--- C:\work\amplify-new\shared\interface\PollInterface.d.ts ---

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
    createdBy: string;
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

--- C:\work\amplify-new\shared\interface\PollInterface.ts ---

/* ──────────────────────────  Question unions  ────────────────────────── */

export type QuestionType =
  | "SINGLE_CHOICE"
  | "MULTIPLE_CHOICE"
  | "MATCHING"
  | "RANK_ORDER"
  | "SHORT_ANSWER"
  | "LONG_ANSWER"
  | "FILL_IN_BLANK"
  | "RATING_SCALE";

export type BaseQuestion = {
  _id: string; 
  type: QuestionType;
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

export type APIPollQuestion =
  | (DraftQuestion & {})
  | { id: string;
      prompt: string;
      required: boolean;
      type: "RANK_ORDER";
      rows: string[];
      columns: string[];
    };



--- C:\work\amplify-new\shared\interface\ProjectFormInterface.d.ts ---

import { IProjectSession } from "./ProjectInterface";
export type InLanguageHostingOption = "yes" | "no" | "";
export type ProvideInterpreterOption = "yes" | "no" | "";
export interface IProjectForm {
    user: string;
    name: string;
    service: string;
    addOns: string[];
    respondentCountry: string;
    respondentLanguage: string[];
    sessions: IProjectSession[];
    firstDateOfStreaming: Date;
    projectDate: Date;
    respondentsPerSession: number;
    numberOfSessions: number;
    sessionLength: string;
    recruitmentSpecs: string;
    preWorkDetails: string;
    selectedLanguage: string;
    inLanguageHosting: InLanguageHostingOption;
    provideInterpreter: ProvideInterpreterOption;
    languageSessionBreakdown: string;
    additionalInfo: string;
    emailSent: string;
    createdAt?: Date;
    updatedAt?: Date;
}
//# sourceMappingURL=ProjectFormInterface.d.ts.map

--- C:\work\amplify-new\shared\interface\ProjectFormInterface.ts ---

import { IProjectSession } from "./ProjectInterface";

export type InLanguageHostingOption = "yes" | "no" | "";
export type ProvideInterpreterOption = "yes" | "no" | "";

export interface IProjectForm {
  user: string; 
  name: string;
  service: string;
  addOns: string[]; 
  respondentCountry: string;
  respondentLanguage: string[];
  sessions: IProjectSession[];
  firstDateOfStreaming: Date;
  projectDate: Date;
  respondentsPerSession: number;
  numberOfSessions: number;
  sessionLength: number;
  recruitmentSpecs: string;
  preWorkDetails: string;
  selectedLanguage: string;
  inLanguageHosting: InLanguageHostingOption;
  provideInterpreter: ProvideInterpreterOption;
  languageSessionBreakdown: string;
  additionalInfo: string;
  emailSent: string;
  createdAt?: Date;
  updatedAt?: Date;
}


--- C:\work\amplify-new\shared\interface\ProjectInfoEmailInterface.d.ts ---

export interface TemplateParams {
    user: {
        firstName: string;
        lastName: string;
        email: string;
    };
    formData: any;
    formattedSessions: string;
}
export interface ProjectCreateAndPaymentConfirmationEmailTemplateParams {
    firstName: string;
    purchaseAmount: number;
    creditsPurchased: number;
    transactionDate: string;
    newCreditBalance: number;
}
//# sourceMappingURL=ProjectInfoEmailInterface.d.ts.map

--- C:\work\amplify-new\shared\interface\ProjectInfoEmailInterface.ts ---

export interface TemplateParams {
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  formData: any;
  formattedSessions: string;
}


export interface ProjectCreateAndPaymentConfirmationEmailTemplateParams {
  firstName: string;
  purchaseAmount: number;
  creditsPurchased: number;
  transactionDate: string;
  newCreditBalance: number;
}

--- C:\work\amplify-new\shared\interface\ProjectInterface.d.ts ---

import { IModerator } from "./ModeratorInterface";
import { ISession } from "./SessionInterface";
import { ITag } from "./TagInterface";
export interface IProjectSession {
    number: number;
    duration: string;
}
export type ProjectStatus = "Draft" | "Active" | "Inactive" | "Closed" | "Archived";
export type ProjectService = "Concierge" | "Signature";
export interface IProject {
    _id: string;
    name: string;
    internalProjectName: string;
    description: string;
    startDate: Date;
    status: ProjectStatus;
    createdBy: string;
    tags: ITag[];
    moderators: IModerator[];
    meetings: ISession[];
    projectPasscode?: string;
    cumulativeMinutes: number;
    service: ProjectService;
    respondentCountry: string;
    respondentLanguage: string;
    sessions: IProjectSession[];
    recordingAccess: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface SessionRow {
    id: string;
    number: number;
    duration: string;
}
//# sourceMappingURL=ProjectInterface.d.ts.map

--- C:\work\amplify-new\shared\interface\ProjectInterface.ts ---

// src/interfaces/project.interface.ts

import { IModerator } from "./ModeratorInterface";
import { ISession } from "./SessionInterface";
import { ITag } from "./TagInterface";

export interface IProjectSession {
  number: number;
  duration: string;
}

export type ProjectStatus = "Draft" | "Active" | "Inactive" | "Closed" | "Archived";
export type ProjectService = "Concierge" | "Signature";

export interface IProject {
  _id: string;
  name: string;
  internalProjectName: string;
  description: string;
  startDate: Date;
  status: ProjectStatus;
  createdBy: string;       
  tags: ITag[];
  moderators: IModerator[];
  meetings: ISession[];
  projectPasscode?: string;
  cumulativeMinutes: number;
  service: ProjectService;
  respondentCountry: string;
  respondentLanguage: string;
  sessions: IProjectSession[];
  recordingAccess:boolean;
  createdAt?: Date;
  updatedAt?: Date;
}


export interface SessionRow {
  id: string;
  number: number;
  duration: string;
}

--- C:\work\amplify-new\shared\interface\SearchPropsInterface.ts ---

interface SearchProps {
  placeholder?: string;
  onSearch: (value: string) => void;
  inputClassName?: string;
  iconClassName?: string;
}


--- C:\work\amplify-new\shared\interface\SendEmailInterface.d.ts ---

export interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
}
//# sourceMappingURL=SendEmailInterface.d.ts.map

--- C:\work\amplify-new\shared\interface\SendEmailInterface.ts ---

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

--- C:\work\amplify-new\shared\interface\SessionDeliverableInterface.d.ts ---

export type DeliverableType = "AUDIO" | "VIDEO" | "TRANSCRIPT" | "BACKROOM_CHAT" | "SESSION_CHAT" | "WHITEBOARD" | "POLL_RESULT";
export interface ISessionDeliverable {
    _id: string;
    sessionId: string;
    projectId: string;
    type: DeliverableType;
    displayName: string;
    size: number;
    storageKey: string;
    uploadedBy: string;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=SessionDeliverableInterface.d.ts.map

--- C:\work\amplify-new\shared\interface\SessionDeliverableInterface.ts ---

export type DeliverableType =
  | "AUDIO"
  | "VIDEO"
  | "TRANSCRIPT"
  | "BACKROOM_CHAT"
  | "SESSION_CHAT"
  | "WHITEBOARD"
  | "POLL_RESULT";

export interface ISessionDeliverable {
  _id: string;  
  sessionId: string;  
  projectId: string;   
  type: DeliverableType;
  displayName: string;  
  size: number; 
  storageKey: string;
  uploadedBy: string; 
  createdAt: Date;
  updatedAt: Date;
}


--- C:\work\amplify-new\shared\interface\SessionInterface.d.ts ---

export interface ISession {
    _id: string;
    title: string;
    projectId: string;
    date: Date;
    startTime: string;
    duration: number;
    moderators: string[];
    timeZone: string;
    breakoutRoom: boolean;
}
//# sourceMappingURL=SessionInterface.d.ts.map

--- C:\work\amplify-new\shared\interface\SessionInterface.ts ---


export interface ISession {
  _id: string;
  title: string;
  projectId: string;
  date: Date;
  startTime: string; 
  duration: number; 
  moderators: string[];
  timeZone: string;  
  breakoutRoom: boolean;
}


--- C:\work\amplify-new\shared\interface\TagInterface.d.ts ---

/**
 * A plain-TS interface (no Mongoose stuff) that you can also reuse
 * on the frontend through your `shared/` folder if you like.
 */
export interface ITag {
    _id: string;
    title: string;
    color: string;
    createdBy: string;
    projectId: string;
}
//# sourceMappingURL=TagInterface.d.ts.map

--- C:\work\amplify-new\shared\interface\TagInterface.ts ---

/**
 * A plain-TS interface (no Mongoose stuff) that you can also reuse
 * on the frontend through your `shared/` folder if you like.
 */
export interface ITag {
  _id: string;
  title: string;
  color: string;             
  createdBy: string;
  projectId: string;
}


--- C:\work\amplify-new\shared\interface\UserActivityInterface.d.ts ---

export interface IUserActivity {
    _id: string;
    sessionId: string;
    userId?: string;
    role: \'Participant\' | \'Observer\' | \'Moderator\' | \'Admin\';
    joinTime: Date;
    leaveTime?: Date;
    deviceInfo?: {
        ip: string;
        deviceType: string;
        platform: string;
        browser: string;
        location: string;
    };
}
//# sourceMappingURL=UserActivityInterface.d.ts.map

--- C:\work\amplify-new\shared\interface\UserActivityInterface.ts ---

// shared/interfaces/UserActivityInterface.ts
export interface IUserActivity {
  _id: string;
  sessionId: string;     // ref to LiveSession._id
  userId?: string;
  role: \'Participant\' | \'Observer\' | \'Moderator\' | \'Admin\';
  joinTime: Date;
  leaveTime?: Date;
  deviceInfo?: {
    ip: string;
    deviceType: string;
    platform: string;
    browser: string;
    location: string;
  };
}


--- C:\work\amplify-new\shared\interface\UserInterface.d.ts ---

export interface IBillingInfo {
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
}
export interface ICreditCardInfo {
    last4: string;
    brand: string;
    expiryMonth: string;
    expiryYear: string;
}
export interface IUser {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    companyName: string;
    password: string;
    role: \'Admin\' | \'Moderator\' | \'Observer\' | \'Participant\' | \'AmplifyAdmin\' | \'AmplifyModerator\' | \'AmplifyObserver\' | \'AmplifyParticipant\' | \'AmplifyTechHost\';
    status: string;
    isEmailVerified: boolean;
    termsAccepted: boolean;
    termsAcceptedTime: Date;
    isDeleted: boolean;
    createdBy?: string;
    createdById?: string;
    credits: number;
    stripeCustomerId?: string;
    billingInfo?: IBillingInfo;
    creditCardInfo?: ICreditCardInfo;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface EditUser {
    firstName: string;
    lastName: string;
    email: string;
    role?: string;
    [key: string]: any;
}
//# sourceMappingURL=UserInterface.d.ts.map

--- C:\work\amplify-new\shared\interface\UserInterface.ts ---

export interface IBillingInfo {
  address: string
  city: string
  state: string
  country: string
  postalCode: string
}

export interface ICreditCardInfo {
  last4: string
  brand: string
  expiryMonth: string
  expiryYear: string
}

export interface IUser {

  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  companyName: string;
  password: string;
  role:
    | \'Admin\' 
    | \'Moderator\' 
    | \'Observer\' 
    | \'Participant\' 
    | \'AmplifyAdmin\' 
    | \'AmplifyModerator\' 
    | \'AmplifyObserver\' 
    | \'AmplifyParticipant\' 
    | \'AmplifyTechHost\'
  status: string
  isEmailVerified: boolean
  termsAccepted: boolean
  termsAcceptedTime: Date
  isDeleted: boolean
  createdBy?: string
  createdById?: string
  credits: number
  stripeCustomerId?: string
  billingInfo?: IBillingInfo
  creditCardInfo?: ICreditCardInfo
  createdAt?: Date
  updatedAt?: Date
}

export interface EditUser {
  firstName: string
  lastName: string
  phoneNumber: string
  companyName: string
  role?: string
  [key: string]: any
}


--- C:\work\amplify-new\shared\interface\WaitingRoomChatInterface.d.ts ---

export interface IWaitingRoomChat {
    _id: string;
    sessionId: string;
    email: string;
    senderName: string;
    role: \'Participant\' | \'Observer\' | \'Moderator\';
    content: string;
    timestamp: Date;
}
//# sourceMappingURL=WaitingRoomChatInterface.d.ts.map

--- C:\work\amplify-new\shared\interface\WaitingRoomChatInterface.ts ---

// shared/interfaces/WaitingRoomChatInterface.ts
export interface IWaitingRoomChat {
  _id: string;
  sessionId: string; 
  email: string;
  senderName: string;
  role: \'Participant\' | \'Observer\' | \'Moderator\';
  content: string;
  timestamp: Date;
}


--- C:\work\amplify-new\shared\utils\ErrorHandler.d.ts ---

declare class ErrorHandler extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number);
}
export default ErrorHandler;
//# sourceMappingURL=ErrorHandler.d.ts.map

--- C:\work\amplify-new\shared\utils\ErrorHandler.ts ---

class ErrorHandler extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    (Error as any).captureStackTrace(this, this.constructor);
  }
}

export default ErrorHandler;
