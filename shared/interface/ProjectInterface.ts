// src/interfaces/project.interface.ts

import { IModerator } from "./ModeratorInterface";
import { ISession } from "./SessionInterface";
import { ITag } from "./TagInterface";

export interface IProjectSession {
  number: number;
  duration: string;
}

export type ProjectStatus =
  | "Draft"
  | "Active"
  | "Paused"
  | "Inactive"
  | "Closed"
  | "Archived";
export type ProjectService = "Concierge" | "Signature";

export interface IProject {
  _id: string;
  name: string;
  internalProjectName: string;
  description: string;
  startDate: Date;
  closedAt?: Date;
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
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SessionRow {
  id: string;
  number: number;
  duration: string;
}
