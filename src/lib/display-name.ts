/**
 * A display name ends up in places other people read, starting with the
 * welcome email, which goes to an address nobody has verified yet. Escaping
 * keeps markup out of it, but mail clients turn any web address they find in
 * plain text into a link on their own. So a name may not carry one: nobody is
 * actually called "https://...", and a name that says so is a link someone
 * wants delivered from your domain.
 */

const WEB_ADDRESS = /(https?:\/\/|www\.)/i

export const DISPLAY_NAME_MAX = 100

export function hasWebAddress(name: string): boolean {
  return WEB_ADDRESS.test(name)
}

/**
 * For the paths with no form to show an error on (a request sent to the auth
 * API directly, an OAuth profile): a name with a web address is dropped rather
 * than refused, so a sign-in never fails over it, and any name is capped.
 * Returns "" when the name has to go; the caller picks the fallback.
 */
export function cleanDisplayName(name: string): string {
  if (hasWebAddress(name)) return ""
  return name.slice(0, DISPLAY_NAME_MAX)
}
