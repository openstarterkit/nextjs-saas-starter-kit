import crypto from "node:crypto"
import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { checkRateLimit, rateLimitKeyFromIp } from "@/lib/rate-limit"
import { sendNewsletterConfirmEmail } from "@/lib/email"
import { siteConfig } from "@/config/site"

/**
 * Newsletter / waitlist signup (double opt-in, step 1 of 2).
 *
 * The response is always a neutral 200: whether the email is new, already
 * subscribed or invalid, the caller learns nothing about who is on the list
 * (same anti-enumeration principle as the login flow). Real feedback arrives
 * by email.
 */

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  source: z.string().max(40).optional(),
  // Honeypot: hidden field, humans leave it empty. Bots that fill it get the
  // same neutral 200 and nothing happens.
  website: z.string().optional(),
})

const ok = () => NextResponse.json({ ok: true })

export async function POST(req: Request) {
  // The live demo shows the form but never writes or emails.
  if (process.env.DEMO_MODE === "true") return ok()

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return ok()
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success || parsed.data.website) return ok()
  const { email, source } = parsed.data

  // Two buckets: per-IP against form abuse, per-email against confirm spam.
  if (!checkRateLimit(await rateLimitKeyFromIp("newsletter"), 5)) return ok()
  if (!checkRateLimit(`newsletter:${email}`, 3)) return ok()

  const token = () => crypto.randomBytes(24).toString("base64url")
  const confirmUrl = (t: string) => `${siteConfig.url}/newsletter/confirm?token=${t}`

  try {
    const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } })

    if (!existing) {
      const sub = await prisma.newsletterSubscriber.create({
        data: {
          email,
          source: source ?? "waitlist",
          confirmToken: token(),
          unsubscribeToken: token(),
        },
      })
      await sendNewsletterConfirmEmail(email, confirmUrl(sub.confirmToken))
    } else if (!existing.confirmedAt || existing.unsubscribedAt) {
      // Unconfirmed or previously unsubscribed and asking again: rotate the
      // token (old links die) and restart the 7-day confirmation window.
      const sub = await prisma.newsletterSubscriber.update({
        where: { email },
        data: { confirmToken: token(), createdAt: new Date() },
      })
      await sendNewsletterConfirmEmail(email, confirmUrl(sub.confirmToken))
    }
    // Confirmed and active: nothing to do, same neutral answer.
  } catch (error) {
    // Missing RESEND_API_KEY or a DB hiccup must not leak to the caller.
    console.error("[newsletter] signup failed:", error)
  }

  return ok()
}
