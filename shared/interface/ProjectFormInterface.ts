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
  defaultTimeZone?:
    | "(UTC-05) Eastern Time"
    | "(UTC-06) Central Time"
    | "(UTC-07) Mountain Time"
    | "(UTC-08) Pacific Time"
    | "(UTC-09) Alaska Time"
    | "(UTC-10) Hawaii Time"
    | "(UTC-00) London Time"
    | "(UTC-01) Cape Verde"
    | "(UTC-02) Sandwich Islands"
    | "(UTC-03) Rio de Janeiro"
    | "(UTC-04) Buenos Aires"
    | "(UTC+01) Paris"
    | "(UTC+02) Athens"
    | "(UTC+03) Moscow"
    | "(UTC+04) Dubai"
    | "(UTC+05) Pakistan"
    | "(UTC+05.5) Delhi"
    | "(UTC+06) Bangladesh"
    | "(UTC+07) Bangkok"
    | "(UTC+08) Beijing"
    | "(UTC+09) Tokyo"
    | "(UTC+10) Sydney"
    | "(UTC+11) Solomon Islands"
    | "(UTC+12) Auckland";
  defaultBreakoutRoom?: boolean;
  emailSent: string;
  createdAt?: Date;
  updatedAt?: Date;
}
