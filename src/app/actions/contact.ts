"use server"

import { z } from "zod"
import { checkRateLimit, rateLimitKeyFromIp } from "@/lib/rate-limit"
import { sendContactMessage } from "@/lib/email"
import { siteConfig } from "@/config/site"

/**
 * Contact form submission: Zod validation + honeypot + per-IP rate limit,
 * then one email to the site owner via Resend. Built on the same bricks as
 * the newsletter signup.
 */

const schema = z.object({
  name: z.string().trim().max(100).optional(),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(254),
  message: z.string().trim().min(10, "Tell us a bit more (at least 10 characters)").max(5000),
  website: z.string().optional(), // honeypot
})

export type ContactState = { status: "idle" | "sent" | "error"; error?: string }

export async function sendContactRequest(_prev: ContactState, formData: FormData): Promise<ContactState> {
  if (process.env.DEMO_MODE === "true") return { status: "sent" }

  const parsed = schema.safeParse({
    name: (formData.get("name") as string) || undefined,
    email: formData.get("email"),
    message: formData.get("message"),
    website: (formData.get("website") as string) || undefined,
  })
  if (!parsed.success) {
    return { status: "error", error: parsed.error.issues[0]?.message ?? "Check the form and try again" }
  }
  // Bots that fill the hidden field get a quiet success and no email.
  if (parsed.data.website) return { status: "sent" }

  if (!checkRateLimit(await rateLimitKeyFromIp("contact"), 5)) {
    return { status: "error", error: "Too many messages from this connection. Try again in a few minutes." }
  }

  try {
    await sendContactMessage(parsed.data.email, parsed.data.name, parsed.data.message)
    return { status: "sent" }
  } catch (error) {
    console.error("[contact] send failed:", error)
    return {
      status: "error",
      error: `Something went wrong on our side. Email us directly at ${siteConfig.contactEmail}.`,
    }
  }
}
