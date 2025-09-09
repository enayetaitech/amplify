export interface FeatureFlags {
  breakoutsEnabled: boolean;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  breakoutsEnabled: false,
};

function hasDefaultBreakoutRoomFlag(
  obj: unknown
): obj is { defaultBreakoutRoom?: boolean } {
  return (
    typeof obj === "object" && obj !== null && "defaultBreakoutRoom" in obj
  );
}

export function flagsFromProject(project: unknown): FeatureFlags {
  return {
    breakoutsEnabled:
      hasDefaultBreakoutRoomFlag(project) &&
      project.defaultBreakoutRoom === true,
  };
}

export function flagsToQueryString(flags: FeatureFlags): string {
  const params = new URLSearchParams();
  if (flags.breakoutsEnabled) params.set("bo", "1");
  return params.toString();
}

interface SearchParamsLike {
  get(name: string): string | null;
}

export function flagsFromSearchParams(search: SearchParamsLike): FeatureFlags {
  return {
    breakoutsEnabled: search.get("bo") === "1",
  };
}
