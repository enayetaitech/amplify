export type ProjectSection = {
  slug: string;
  label: string;
};

export const projectSections: ProjectSection[] = [
  { slug: "sessions", label: "Sessions" },
  { slug: "project-team", label: "Project Team" },
  { slug: "session-deliverables", label: "Session Deliverables" },
  { slug: "observer-documents", label: "Observer Documents" },
  { slug: "polls", label: "Polls" },
  { slug: "reports", label: "Reports" },
];
