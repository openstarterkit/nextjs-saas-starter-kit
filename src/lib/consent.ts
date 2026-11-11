/**
 * Cookie consent, off unless `NEXT_PUBLIC_COOKIE_CONSENT="true"`.
 *
 * The kit sets technical cookies only (the session) and its analytics are
 * cookieless, so out of the box there is nothing to ask consent for and no
 * banner. The switch is for the day you add something that does need it: an
 * analytics tool with cookies, an ad pixel, a chat widget. Turn it on and wrap
 * those scripts in <ConsentScript>: they load only after a visitor accepts.
 *
 * The choice lives in a technical cookie for six months, the longest the
 * Italian Garante (2021 guidelines) lets you wait before asking again. It is
 * read in the browser only: the server never needs it, so pages stay static.
 */

export type Consent = "accepted" | "rejected"

export const CONSENT_COOKIE = "cookie_consent"
/** Six months, in seconds. */
export const CONSENT_MAX_AGE = 60 * 60 * 24 * 182

const CHANGE_EVENT = "cookie-consent-change"
const OPEN_EVENT = "cookie-consent-open"

/** Inlined at build time, so client components can read it too. */
export const consentEnabled = process.env.NEXT_PUBLIC_COOKIE_CONSENT === "true"

/** The stored choice in a `document.cookie` string, or null when there is none. */
export function parseConsent(cookieHeader: string): Consent | null {
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${CONSENT_COOKIE}=(accepted|rejected)(?:;|$)`))
  return match ? (match[1] as Consent) : null
}

export function readConsent(): Consent | null {
  return typeof document === "undefined" ? null : parseConsent(document.cookie)
}

export function writeConsent(value: Consent) {
  const secure = window.location.protocol === "https:" ? "; Secure" : ""
  document.cookie = `${CONSENT_COOKIE}=${value}; Max-Age=${CONSENT_MAX_AGE}; Path=/; SameSite=Lax${secure}`
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function subscribeConsent(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback)
  return () => window.removeEventListener(CHANGE_EVENT, callback)
}

/** Opens the banner again, so a visitor can change their mind (the footer's "Cookie settings"). */
export function openConsentSettings() {
  window.dispatchEvent(new Event(OPEN_EVENT))
}

export function subscribeConsentOpen(callback: () => void) {
  window.addEventListener(OPEN_EVENT, callback)
  return () => window.removeEventListener(OPEN_EVENT, callback)
}

/**
 * Whether a consent-gated script may load. With the switch off nothing is
 * gated: <ConsentScript> behaves like next/script, so wrapping a script costs
 * nothing until you turn consent on.
 */
export function mayLoad(enabled: boolean, consent: Consent | null) {
  return !enabled || consent === "accepted"
}
