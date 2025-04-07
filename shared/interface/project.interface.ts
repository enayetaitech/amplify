// src/interfaces/project.interface.ts

export interface IProjectSession {
  number: number;
  duration: string;
}

export type ProjectStatus = "Draft" | "Active" | "Inactive" | "Closed" | "Archived";
export type ProjectService = "Concierge" | "Signature";

export interface IProject {
  name: string;
  description: string;
  startDate: Date;
  status: ProjectStatus;
  createdBy: string;       
  tags: string[];  
  projectPasscode?: string;
  cumulativeMinutes: number;
  service: ProjectService;
  respondentCountry: string;
  respondentLanguage: string;
  sessions: IProjectSession[];
  createdAt?: Date;
  updatedAt?: Date;
}
