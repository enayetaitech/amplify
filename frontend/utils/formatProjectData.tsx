import { IProjectFormState } from "@shared/interface/CreateProjectInterface";
import { IProject } from "@shared/interface/ProjectInterface";

export const formatProjectData = (
  rawData: Partial<IProjectFormState>
): Partial<IProject> => {
  return {
    name: rawData.name,
    description: "",
    startDate: new Date(rawData.firstDateOfStreaming!),
    service: rawData.service as "Concierge" | "Signature",
    respondentCountry: rawData.respondentCountry,
    respondentLanguage: Array.isArray(rawData.respondentLanguage)
      ? rawData.respondentLanguage.join(", ")
      : rawData.respondentLanguage,
    sessions: rawData.sessions!.map((session) => ({
      number: session.number,
      duration: session.duration,
    })),
    defaultTimeZone: rawData.defaultTimeZone,
    defaultBreakoutRoom: Boolean(rawData.defaultBreakoutRoom),
    cumulativeMinutes: 0,
    status: "Draft",
    tags: [],
  };
};
