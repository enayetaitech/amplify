/**
 * Formats a participant's name by combining firstName with the first letter of lastName.
 *
 * @param firstName - The participant's first name
 * @param lastName - The participant's last name
 * @returns Formatted string in the format "firstName L" (e.g., "John D")
 *
 * @example
 * formatParticipantName("John", "Doe") // Returns "John D"
 * formatParticipantName("Jane", "Smith") // Returns "Jane S"
 * formatParticipantName("John", "") // Returns "John"
 * formatParticipantName("", "Doe") // Returns ""
 */
export function formatParticipantName(
  firstName: string | null | undefined,
  lastName: string | null | undefined
): string {
  const first = (firstName || "").trim();
  const last = (lastName || "").trim();

  if (!first && !last) {
    return "";
  }

  if (!last) {
    return first;
  }

  const lastInitial = last.charAt(0).toUpperCase();
  return lastInitial ? `${first} ${lastInitial}` : first;
}
