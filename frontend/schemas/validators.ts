// /utils/validators.ts
export type Validator = (value: string) => boolean

/** only digits 0–9 */
export const onlyDigits: Validator = v => /^[0-9]+$/.test(v)

/** no leading space */
export const noLeadingSpace: Validator = v => !/^\s/.test(v)

/** no trailing space */
export const noTrailingSpace: Validator = v => !/\s$/.test(v)

/** no multiple spaces in a row */
export const noMultipleSpaces: Validator = v => !/ {2,}/.test(v)

/** no special characters (only letters, numbers, spaces) */
export const noSpecialChars: Validator = v => /^[A-Za-z0-9 ]*$/.test(v)

/** only letters, single spaces allowed between words */
export const alphaSingleSpace: Validator = v =>
  /^[A-Za-z]+(?: [A-Za-z]+)*$/.test(v)

/** only letters & numbers, single spaces allowed between words */
export const alphanumericSingleSpace: Validator = v => /^[A-Za-z0-9 ]*$/.test(v)

// utils/validators.ts
/** only letters and spaces (allows trailing/leading spaces, but no special chars or digits) */
export const lettersAndSpaces: Validator = v => /^[A-Za-z ]*$/.test(v)

/** only email-safe characters (no spaces) */
export const emailChars: Validator = v =>
  /^[A-Za-z0-9@.\-_+]*$/.test(v)

/**
 * Runs `value` through every validator in `rules`.
 * Returns `true` if **all** pass.
 */
export function validate(value: string, rules: Validator[]): boolean {
  return rules.every((fn) => fn(value))
}
