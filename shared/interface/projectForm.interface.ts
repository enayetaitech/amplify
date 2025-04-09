import { IProjectSession } from "./project.interface";

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
