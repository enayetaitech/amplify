import { Role } from "@shared/interface/ModeratorInterface";
import { FieldConfig } from "../components/projects/createProject/Step2Component";
import { EditUserFormValues } from "../schemas/editUserSchema";
import { LoginFormValues } from "../schemas/loginSchema";
import { RegisterFormValues } from "../schemas/registerSchema";

export const durations = [
  { label: "15 mins", minutes: 15 },
  { label: "20 mins", minutes: 20 },
  { label: "30 mins", minutes: 30 },
  { label: "40 mins", minutes: 40 },
  { label: "45 mins", minutes: 45 },
  { label: "1.00 hr", minutes: 60 },
  { label: "1.25 hrs", minutes: 75 },
  { label: "1.5 hrs", minutes: 90 },
  { label: "1.75 hrs", minutes: 105 },
  { label: "2.00 hrs", minutes: 120 },
  { label: "2.25 hrs", minutes: 135 },
  { label: "2.5 hrs", minutes: 150 },
  { label: "2.75 hrs", minutes: 165 },
  { label: "3.00 hrs", minutes: 180 },
  { label: "4.00 hrs", minutes: 240 },
  { label: "5.00 hrs", minutes: 300 },
  { label: "6.00 hrs", minutes: 360 },
  { label: "7.00 hrs", minutes: 420 },
  { label: "8.00 hrs", minutes: 480 },
];

export const durationStep3 = durations.map((d) => d.label);
// Map each duration option to its minute value for calculation purposes
export const durationMapping: Record<string, number> = durations.reduce(
  (acc, { label, minutes }) => {
    acc[label] = minutes;
    return acc;
  },
  {} as Record<string, number>
);

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
  { utc: "-10", name: "Hawaii Time" },
  { utc: "-09", name: "Alaska Time" },
  { utc: "-08", name: "Pacific Time" },
  { utc: "-07", name: "Mountain Time" },
  { utc: "-06", name: "Central Time" },
  { utc: "-05", name: "Eastern Time" },
  { utc: "-04", name: "Buenos Aires" },
  { utc: "-03", name: "Rio de Janeiro" },
  { utc: "-02", name: "Sandwich Islands" },
  { utc: "-01", name: "Cape Verde" },
  { utc: "+00", name: "London Time" },
  { utc: "+01", name: "Paris" },
  { utc: "+02", name: "Athens" },
  { utc: "+03", name: "Moscow" },
  { utc: "+04", name: "Dubai" },
  { utc: "+05", name: "Pakistan" },
  { utc: "+05.5", name: "Delhi" },
  { utc: "+06", name: "Bangladesh" },
  { utc: "+07", name: "Bangkok" },
  { utc: "+08", name: "Beijing" },
  { utc: "+09", name: "Tokyo" },
  { utc: "+10", name: "Sydney" },
  { utc: "+11", name: "Solomon Islands" },
  { utc: "+12", name: "Auckland" },
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

export const loginDefaults: LoginFormValues = {
  email: "",
  password: "Ab123456@",
  rememberMe: false,
};

export const ALPHA_REGEX = /^[A-Za-z\s]+$/;

export const PROJECT_NAME_REGEX = /^[A-Za-z0-9 _-]+$/;

export const textFields = [
  { name: "firstName" as const, label: "First Name", type: "text" },
  { name: "lastName" as const, label: "Last Name", type: "text" },
  { name: "email" as const, label: "Email", type: "email" },
  { name: "companyName" as const, label: "Company Name", type: "text" },
];

export const ALL_ROLES: Role[] = ["Admin", "Moderator", "Observer"];

export const personalFields: Array<{
  name: keyof EditUserFormValues;
  label: string;
}> = [
  { name: "firstName", label: "First Name*" },
  { name: "lastName", label: "Last Name*" },
  { name: "email", label: "Email*" },
  { name: "phoneNumber", label: "Phone Number*" },
  { name: "companyName", label: "Company Name*" },
];

export const addressFields: Array<{
  name: keyof EditUserFormValues;
  label: string;
}> = [
  { name: "address", label: "Address" },
  { name: "city", label: "City" },
  { name: "state", label: "State" },
  { name: "postalCode", label: "Postal Code" },
  { name: "country", label: "Country" },
];

export const numberFields: FieldConfig[] = [
  { name: "respondentsPerSession", label: "Number of Respondents per Session" },
  { name: "numberOfSessions", label: "Number of Sessions" },
  { name: "sessionLength", label: "Length(s) of Sessions (minutes)" },
];

export const recruitingFields: FieldConfig[] = [
  {
    name: "recruitmentSpecs",
    label:
      "What are the target recruitment specs? Please include as much information as possible.",
  },
  {
    name: "preWorkDetails",
    label: "Will there be any pre–work or additional assignments?",
  },
];
