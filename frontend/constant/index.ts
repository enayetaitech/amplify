export const durations = [
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


export const availableLanguages = ["English", "French", "German", "Spanish", "Other"];

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