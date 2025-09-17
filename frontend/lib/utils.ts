import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format a display name to "First L." style.
// Accepts inputs like:
// - "John Doe" → "John D."
// - "john     doe smith" → "john d."
// - "JOHN" → "JOHN"
// - "Doe, John" → "John D."
// - "John" → "John"
// If name is empty or falsy, returns empty string.
export function formatDisplayName(raw: string | null | undefined): string {
  const value = (raw || "").trim();
  if (!value) return "";

  // Handle comma format: "Last, First [Middle]"
  if (value.includes(",")) {
    const [last, rest] = value.split(",", 2);
    const firstToken = (rest || "").trim().split(/\s+/)[0] || "";
    const lastInitial = (last.trim()[0] || "").toUpperCase();
    return firstToken
      ? lastInitial
        ? `${firstToken} ${lastInitial}.`
        : firstToken
      : value;
  }

  const tokens = value.split(/\s+/).filter(Boolean);
  if (tokens.length === 1) return tokens[0];

  const first = tokens[0];
  const lastInitial = (tokens[tokens.length - 1][0] || "").toUpperCase();
  return lastInitial ? `${first} ${lastInitial}.` : first;
}
