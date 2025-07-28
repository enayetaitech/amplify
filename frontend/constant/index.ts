import { Role } from "@shared/interface/ModeratorInterface";
import { LoginFormValues } from "schemas/loginSchema";
import { RegisterFormValues } from "schemas/registerSchema";

export const durations = [
  { label: "30 minutes", minutes: 30 },
  { label: "45 minutes", minutes: 45 },
  { label: "1 hour (60 minutes)", minutes: 60 },
  { label: "1.25 hour (75 minutes)", minutes: 75 },
  { label: "1.5 hour (90 minutes)", minutes: 90 },
  { label: "2 hour (120 minutes)", minutes: 120 },
  { label: "2.5 hour (150 minutes)", minutes: 150 },
  { label: "3 hour (180+ minutes)", minutes: 180 },
];
export const durationStep3 = [
  "30 minutes",
  "45 minutes",
  "1 hour (60 minutes)",
  "1.25 hour (75 minutes)",
  "1.5 hour (90 minutes)",
  "2 hour (120 minutes)",
  "2.5 hour (150 minutes)",
  "3 hour (180+ minutes)",
];
// Map each duration option to its minute value for calculation purposes
export const durationMapping: Record<string, number> = {
  "30 minutes": 30,
  "45 minutes": 45,
  "1 hour (60 minutes)": 60,
  "1.25 hour (75 minutes)": 75,
  "1.5 hour (90 minutes)": 90,
  "2 hour (120 minutes)": 120,
  "2.5 hour (150 minutes)": 150,
  "3 hour (180+ minutes)": 180,
};

export const availableLanguages = [
  "English",
  "French",
  "German",
  "Spanish",
  "Other",
];

export const creditPackages = [
  { package: 500, cost: 750 },
  { package: 2500, cost: 3550 },
  { package: 15000, cost: 20000 },
  { package: 50000, cost: 60000 },
];

export const quantityOptions = [1, 2, 3, 4, 5, 6, 7, 8];

export const optionalAddOnServices = [
  "Top-Notch Recruiting",
  "Insight-Driven Moderation and Project Design",
  "Multi-Language Services",
  "Asynchronous Activities (Pretasks, Bulletin Boards, etc.)",
];

// constants/timezones.ts

export const timeZones = [
  { value: "Pacific/Midway", utc: "-11", name: "Midway Island" },
  { value: "Pacific/Honolulu", utc: "-10", name: "Hawaii" },
  { value: "America/Anchorage", utc: "-9", name: "Alaska" },
  { value: "America/Los_Angeles", utc: "-8", name: "Pacific Time" },
  { value: "America/Denver", utc: "-7", name: "Mountain Time" },
  { value: "America/Chicago", utc: "-6", name: "Central Time" },
  { value: "America/New_York", utc: "-5", name: "Eastern Time" },
  { value: "America/Halifax", utc: "-4", name: "Atlantic Time" },
  { value: "America/Sao_Paulo", utc: "-3", name: "Brasilia" },
  { value: "Atlantic/South_Georgia", utc: "-2", name: "Mid-Atlantic" },
  { value: "Atlantic/Azores", utc: "-1", name: "Azores" },
  { value: "UTC", utc: "+0", name: "UTC" },
  { value: "Europe/London", utc: "+0", name: "London" },
  { value: "Europe/Berlin", utc: "+1", name: "Berlin" },
  { value: "Europe/Moscow", utc: "+3", name: "Moscow" },
  { value: "Asia/Dubai", utc: "+4", name: "Dubai" },
  { value: "Asia/Karachi", utc: "+5", name: "Pakistan" },
  { value: "Asia/Dhaka", utc: "+6", name: "Bangladesh" },
  { value: "Asia/Bangkok", utc: "+7", name: "Bangkok" },
  { value: "Asia/Shanghai", utc: "+8", name: "China" },
  { value: "Asia/Tokyo", utc: "+9", name: "Japan" },
  { value: "Australia/Sydney", utc: "+10", name: "Sydney" },
  { value: "Pacific/Auckland", utc: "+12", name: "Auckland" },
];


export const registerDefaults: RegisterFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  companyName: "",
  password: "",
  confirmPassword: "",
  terms: false,
};

export const loginDefaults: LoginFormValues={
   email: "",
      password: "Ab123456@",
      rememberMe: false,
}

export const ALPHA_REGEX = /^[A-Za-z\s]+$/;

export const PROJECT_NAME_REGEX = /^[A-Za-z0-9 _-]+$/;

export const textFields = [
  { name: "firstName" as const, label: "First Name", type: "text" },
  { name: "lastName" as const, label: "Last Name", type: "text" },
  { name: "email" as const, label: "Email", type: "email" },
  { name: "companyName" as const, label: "Company Name", type: "text" },
];

export const ALL_ROLES: Role[] = ["Admin", "Moderator", "Observer"];