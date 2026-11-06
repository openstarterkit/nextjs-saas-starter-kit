/**
 * On a public demo everyone signs in to the same shared accounts, so the
 * server actions refuse what one visitor could do to the others: ending their
 * sessions, turning on 2FA (the nightly reset would strand the next visitor
 * with a factor nobody holds), deleting the account, changing its email or
 * password, signing up, resetting a password.
 *
 * Those actions are one way into Better Auth, not the only one: its endpoints
 * are served under /api/auth, and a request sent there directly never meets
 * an action. The plainest case is /list-sessions, which on a shared account
 * returns every visitor's session with the full IP address, exactly what the
 * Active sessions card masks. So with DEMO_MODE on, a request arriving over
 * HTTP for one of these paths is refused before it reaches the endpoint.
 *
 * Only requests that arrive over HTTP: the kit's own pages and actions call
 * the same endpoints from the server (the sessions card lists sessions that
 * way and masks them), and those calls carry no incoming request.
 */

const BLOCKED_PATHS = new Set([
  "/list-sessions",
  "/revoke-session",
  "/revoke-sessions",
  "/revoke-other-sessions",
  "/delete-user",
  "/change-email",
  "/change-password",
  "/sign-up/email",
  "/request-password-reset",
  "/reset-password",
])

const BLOCKED_PREFIXES = ["/two-factor/"]

export function blockedOnDemo(path: string): boolean {
  if (BLOCKED_PATHS.has(path)) return true
  return BLOCKED_PREFIXES.some((prefix) => path.startsWith(prefix))
}
