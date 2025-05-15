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