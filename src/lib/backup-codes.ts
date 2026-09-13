import { randomInt } from "node:crypto"

/**
 * Backup codes, in an alphabet a person can copy off paper.
 *
 * Better Auth generates these from `a-z` + `0-9` + `A-Z` mixed together, and
 * compares them case-sensitively. That is fine for a string nobody reads, and
 * these are the opposite: the kit tells people to write them down somewhere
 * other than the phone, and they get typed back in on the worst day, when the
 * phone is gone. On paper, `q0iKd` has three characters that can be read two
 * ways each.
 *
 * So: uppercase only, and without the four characters that impersonate each
 * other — no `0`/`O`, no `1`/`I`. What is left is 31 characters, which over ten
 * of them is about 49 bits per code. With the plugin's lockout after ten
 * consecutive failures, guessing is not the threat that matters here; a
 * mistyped character is.
 *
 * The TOTP secret beside them needed none of this: base32 has no 0, 1, 8 or 9
 * to begin with.
 */
export const BACKUP_CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"

/** Characters per code, before the grouping dash. */
export const BACKUP_CODE_LENGTH = 10

/** How many are handed out at once. */
export const BACKUP_CODE_COUNT = 10

/**
 * `randomInt` rather than `Math.random`: these are credentials, and each one
 * opens the account on its own. It also draws without modulo bias, which a
 * hand-rolled `% alphabet.length` would not.
 */
function randomCode(): string {
  let code = ""
  for (let i = 0; i < BACKUP_CODE_LENGTH; i++) {
    code += BACKUP_CODE_ALPHABET[randomInt(BACKUP_CODE_ALPHABET.length)]
  }
  // Same shape Better Auth ships, because the dash is what makes ten
  // characters readable as two groups of five.
  return `${code.slice(0, 5)}-${code.slice(5)}`
}

export function generateBackupCodes(): string[] {
  return Array.from({ length: BACKUP_CODE_COUNT }, randomCode)
}

/**
 * What the user typed, turned into what we stored.
 *
 * Three forgivenesses, each for something people actually do when copying from
 * paper: lowercase, stray spaces, and the dash left out. Everything else is
 * left alone, so a genuinely wrong code stays wrong.
 *
 * This is tied to the generator above: uppercasing is only safe because the
 * codes are uppercase. Change one and you change both.
 */
export function normalizeBackupCode(input: string): string {
  const cleaned = input.trim().toUpperCase().replace(/[\s-]/g, "")
  if (cleaned.length !== BACKUP_CODE_LENGTH) return cleaned
  return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`
}
