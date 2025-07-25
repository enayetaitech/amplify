### shared/interface

```javascript

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}


export interface ErrorResponse {
  message: string;
}
```
```javascript
export interface CountryCode {
  country: string;
  code: string;
  iso: string;
}

```
```javascript
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
 sessionLength: string;
 preWorkDetails: string;
 selectedLanguage: string;
 languageSessionBreakdown: string;
 additionalInfo: string;
 inLanguageHosting?: "yes" | "no";
 recruitmentSpecs?: string;
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
  projectData: Partial<IProjectFormState>;
  uniqueId: string | null;
}

export interface BillingFormProps {
  onSuccess: () => void;
}

export interface CardSetupFormProps {
  onCardSaved: () => void;
}
```
```javascript
// error.interface.ts
export interface ICustomError extends Error {
  statusCode?: number;
  message: string;
  name: string;
  code?: number;
  keyValue?: any;
  path?: string;
}

```
```javascript
interface FilterValues {
  startDate: string;
  endDate: string;
  status: string;
  role: string;
  tag: string;
}

```
```javascript

export interface ModeratorAddedEmailParams {
  moderatorName: string;
  addedByName: string;
  projectName: string;
  loginUrl: string;
}
```
```javascript
export interface IModerator {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  adminAccess: boolean;
  projectId: string;
  isVerified: boolean;
  isActive: boolean;
}
```
```javascript
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

```
```javascript
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

```
```javascript
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

```
```javascript
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
```
```javascript
// src/interfaces/project.interface.ts

export interface IProjectSession {
  number: number;
  duration: string;
}

export type ProjectStatus = "Draft" | "Active" | "Inactive" | "Closed" | "Archived";
export type ProjectService = "Concierge" | "Signature";

export interface IProject {
  _id?: string;
  name: string;
  internalProjectName: string;
  description: string;
  startDate: Date;
  status: ProjectStatus;
  createdBy: string;       
  tags: string[];
  moderators: string[];
  meetings: string[];
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
```
```javascript
interface SearchProps {
  placeholder?: string;
  onSearch: (value: string) => void;
  inputClassName?: string;
  iconClassName?: string;
}

```
```javascript
export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}
```
```javascript
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

```
```javascript

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

```
```javascript
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

```
```javascript
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
    | 'Admin'
    | 'Moderator'
    | 'Observer'
    | 'Participant'
    | 'AmplifyAdmin'
    | 'AmplifyModerator'
    | 'AmplifyObserver'
    | 'AmplifyParticipant'
    | 'AmplifyTechHost'
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
  email: string
  role?: string
  [key: string]: any
}

```

### shared/utils

```javascript
class ErrorHandler extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    (Error as any).captureStackTrace(this, this.constructor);
  }
}

export default ErrorHandler;

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```