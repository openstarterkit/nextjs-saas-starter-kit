/**
 * Two doors open a session with nothing but a link from the inbox: the magic
 * link itself, and the auto sign-in after verifying an email. For an account
 * with two-factor authentication on, that is exactly the attacker the second
 * factor exists to stop, someone who can read the mailbox, so neither door may
 * open a session for it.
 *
 * The rule used to live only in the server action behind the sign-in form,
 * which is one way into the magic link plugin but not the only one: its
 * endpoints are served under /api/auth like every other, and a request sent
 * there directly never meets the action. Enforcing it where the session is
 * created covers every path, including a link issued before 2FA was turned on.
 *
 * Signing in with a password is not affected: that path creates the session
 * only after the code, and it does not go through either of these routes.
 */

/** Better Auth routes that create a session from an emailed link alone. */
export const EMAIL_ONLY_SESSION_PATHS = ["/magic-link/verify", "/verify-email"] as const

export type SessionAttempt = {
  /** The Better Auth route creating the session, or undefined outside a request. */
  path: string | undefined
  twoFactorEnabled: boolean
}

export function refusesEmailOnlySession({ path, twoFactorEnabled }: SessionAttempt): boolean {
  if (!twoFactorEnabled || !path) return false
  return (EMAIL_ONLY_SESSION_PATHS as readonly string[]).includes(path)
}
