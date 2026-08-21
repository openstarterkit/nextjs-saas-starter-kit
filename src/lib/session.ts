import type { Role } from "@prisma/client"

/**
 * The rules a JWT session is re-checked by, kept out of the Auth.js callback
 * so they can be tested without a database or a request.
 *
 * Sessions are stateless: what a token says is what the app believes, until
 * something re-reads the user. That "something" is the throttled check in the
 * jwt callback (src/auth.ts), and these two functions are its decisions.
 */

/** How long a token is trusted before the user is read again. */
export const SESSION_RECHECK_MS = 60_000

/** The claims this module reads and writes back. */
export type SessionClaims = {
  /** Stamped at sign-in and refreshed here; never trusted for longer than the window. */
  role?: Role
  /** User.sessionVersion at issue time. */
  sv?: number
  /** When the claims were last checked against the database. */
  svAt?: number
}

/** What the database says about the user, or null when there is no such row. */
export type UserRecord = { role: Role; sessionVersion: number } | null

export type SessionVerdict =
  | { keep: false }
  | { keep: true; role: Role; checkedAt: number }

/**
 * Throttles the database read: the proxy runs auth() on nearly every request,
 * so without this the check would be a query per request per user.
 */
export function isSessionCheckDue(claims: SessionClaims, now: number): boolean {
  return now - (claims.svAt ?? 0) > SESSION_RECHECK_MS
}

/**
 * Decides what happens to a session once the user has been read.
 *
 * A session dies when the user is gone, or when `sessionVersion` has moved:
 * resetting a password bumps it, so every other session goes with it.
 *
 * A surviving session takes the role from the database rather than keeping the
 * one it was minted with. Without that step the role is frozen for the life of
 * the token, which defaults to 30 days: promoting someone would do nothing
 * visible until they signed out, and demoting them would leave their
 * privileges live for as long.
 */
export function verifySession(
  claims: SessionClaims,
  user: UserRecord,
  now: number
): SessionVerdict {
  if (!user || user.sessionVersion !== claims.sv) return { keep: false }
  return { keep: true, role: user.role, checkedAt: now }
}
