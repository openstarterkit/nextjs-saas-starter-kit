import { siteConfig } from "@/config/site"
import { deliver } from "@/lib/email-delivery"
import type { Resend } from "resend"

/**
 * The one place the kit talks to an email provider.
 *
 * Every email the kit sends (sign-in links, receipts, the contact form, the
 * newsletter) goes through `sendEmail()`, and every place that asks "is email
 * set up?" asks `emailEnabled()`. Resend is the default. To use another
 * provider, SMTP through Nodemailer, Postmark, SES or anything with an API,
 * rewrite these two functions and nothing else: docs/email.md has worked
 * examples.
 *
 * Kept free of heavy imports on purpose: src/auth.ts reads `emailEnabled()`
 * when it starts, so the Resend SDK is loaded only when an email is sent.
 */

/** Whether outgoing email is configured. Sign-in by link, password reset and every notification depend on it. */
export function emailEnabled(): boolean {
  return !!process.env.RESEND_API_KEY
}

/** The sender of every email. Set EMAIL_FROM to an address on your verified domain. */
export const EMAIL_FROM = process.env.EMAIL_FROM ?? `${siteConfig.name} <${siteConfig.contactEmail}>`

export type OutgoingEmail = {
  /** Names the email in the logs, for example "magic-link". Never the recipient. */
  kind: string
  to: string
  subject: string
  html: string
  replyTo?: string
}

/**
 * Sends one email and says whether the provider accepted it.
 *
 * Returns false instead of throwing when the provider refuses the message, and
 * logs why (src/lib/email-delivery.ts explains the reason: several flows must
 * answer the same way whether or not an address exists). A missing key or a
 * network failure still throws, as before. Keep both behaviours if you replace
 * the provider.
 */
export async function sendEmail(email: OutgoingEmail): Promise<boolean> {
  const resend = await resendClient()
  return deliver(email.kind, () =>
    resend.emails.send({
      from: EMAIL_FROM,
      to: email.to,
      subject: email.subject,
      html: email.html,
      replyTo: email.replyTo,
    }),
  )
}

let _resend: Resend | null = null

/**
 * The Resend client, created on first use. Exported for the one feature that
 * is Resend's own and not email in general: mirroring newsletter subscribers
 * onto a Resend Audience (src/lib/email.ts). With another provider that
 * feature stays off, because RESEND_AUDIENCE_ID is unset.
 */
export async function resendClient(): Promise<Resend> {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY
    if (!key) throw new Error("RESEND_API_KEY is not set")
    const { Resend } = await import("resend")
    _resend = new Resend(key)
  }
  return _resend
}
