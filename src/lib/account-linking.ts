/**
 * Whether an OAuth provider may attach itself to an account that already
 * exists, on its own, at sign-in.
 *
 * Kept apart from `src/auth.ts` because it is the whole security decision in
 * four booleans, and because a rule this consequential should be readable and
 * testable without standing up an OAuth round trip.
 *
 * The situation it exists for: Better Auth asks for the second factor on
 * `/sign-in/email` and nowhere else, while account linking is automatic for a
 * provider that verified the address. An account protected by a password and a
 * TOTP can therefore be entered by whoever controls a Google account with the
 * same address — no password, no code, and no prior connection to Google.
 */
export type LinkAttempt = {
  /** How the identity arrived. Only `"oauth"` is at issue here. */
  method: string
  /** Better Auth's lifecycle step: creating, linking, or plain signing in. */
  action: string
  /** Whether the existing account has a second factor turned on. */
  twoFactorEnabled: boolean
  /**
   * Whether the request carries a live session belonging to that same account,
   * which is what separates "Connect from Settings" — made by someone already
   * signed in, already past the second factor — from "Continue with Google"
   * pressed by anybody on the sign-in page.
   */
  hasOwnSession: boolean
}

export function refusesAutomaticLink(attempt: LinkAttempt): boolean {
  // Email and password, magic link, and everything else already pass through
  // the checks that apply to them.
  if (attempt.method !== "oauth") return false
  // A new account has no second factor to go around, and a provider already
  // linked is the case T1 decided to leave alone: we do not ask for a TOTP on
  // top of Google, which does that better.
  if (attempt.action !== "link-account") return false
  // No second factor, nothing to protect: the convenience stays a convenience.
  if (!attempt.twoFactorEnabled) return false
  // Asked for from inside the app, by the account holder. Allowed.
  if (attempt.hasOwnSession) return false
  return true
}
