/**
 * What Resend's answer about one contact means for a signup. Pure, so the one
 * rule that matters here, a missing contact is not an unknown one, has a test.
 * See `newsletterContactState` in email.ts for why the answer is asked at all.
 */
export type NewsletterContactState = "subscribed" | "unsubscribed" | "missing" | "unknown"

export function contactStateFrom(result: {
  data: { unsubscribed?: boolean } | null
  error: { name?: string } | null
}): NewsletterContactState {
  // Resend says the contact is not on the audience: removed by hand.
  if (result.error) return result.error.name === "not_found" ? "missing" : "unknown"
  if (!result.data) return "unknown"
  return result.data.unsubscribed ? "unsubscribed" : "subscribed"
}
