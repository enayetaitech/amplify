import { FeatureFlags, flagsToQueryString } from "constant/featureFlags";

export function buildMeetingUrl(
  sessionId: string,
  flags?: FeatureFlags,
  extraQuery?: Record<string, string | undefined>
) {
  const base = `/meeting/${sessionId}`;
  const params = new URLSearchParams();

  if (flags) {
    const qs = flagsToQueryString(flags);
    if (qs) {
      const temp = new URLSearchParams(qs);
      temp.forEach((v, k) => params.set(k, v));
    }
  }

  if (extraQuery) {
    Object.entries(extraQuery).forEach(([k, v]) => {
      if (v !== undefined && v !== null) params.set(k, String(v));
    });
  }

  const s = params.toString();
  return s ? `${base}?${s}` : base;
}
