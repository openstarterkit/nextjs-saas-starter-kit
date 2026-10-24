/**
 * The sign-in providers this deployment can actually use.
 *
 * A provider counts only when both its keys are set. Without them the button
 * used to show anyway, and a click ended on Better Auth's
 * CLIENT_ID_AND_SECRET_REQUIRED: a stack trace in development, an error page
 * in production. Now the login page and Settings show only what works, and
 * src/auth.ts registers only these, the same way the magic link already hides
 * when email is not configured.
 *
 * Free of imports on purpose: src/auth.ts reads it when it starts.
 */
export const OAUTH_PROVIDERS = ["google", "github"] as const
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number]

const KEYS: Record<OAuthProvider, [string, string]> = {
  google: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
  github: ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"],
}

/** The providers whose client ID and secret are both set, in display order. */
export function enabledOAuthProviders(): OAuthProvider[] {
  return OAUTH_PROVIDERS.filter((p) => KEYS[p].every((key) => !!process.env[key]))
}

/** Client ID and secret for one provider, or undefined when either is missing. */
export function oauthCredentials(provider: OAuthProvider) {
  const [id, secret] = KEYS[provider]
  const clientId = process.env[id]
  const clientSecret = process.env[secret]
  return clientId && clientSecret ? { clientId, clientSecret } : undefined
}
