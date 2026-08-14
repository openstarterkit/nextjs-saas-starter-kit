"use server"

import { getTranslations } from "next-intl/server"
import { z } from "zod"
import { checkRateLimit, rateLimitKeyFromIp } from "@/lib/rate-limit"
import { sendContactMessage } from "@/lib/email"
import { siteConfig } from "@/config/site"

/**
 * Contact form submission: Zod validation + honeypot + per-IP rate limit,
 * then one email to the site owner via Resend. Built on the same bricks as
 * the newsletter signup.
 */

// Per call, not per import: every message below is rendered under the form,
// and a translation only resolves inside a request.
async function schema() {
  const t = await getTranslations("errors")
  return z.object({
    name: z.string().trim().max(100).optional(),
    email: z.string().trim().toLowerCase().email(t("invalidEmail")).max(254),
    message: z.string().trim().min(10, t("messageTooShort")).max(5000),
    website: z.string().optional(), // honeypot
  })
}

export type ContactState = { status: "idle" | "sent" | "error"; error?: string }

export async function sendContactRequest(_prev: ContactState, formData: FormData): Promise<ContactState> {
  if (process.env.DEMO_MODE === "true") return { status: "sent" }
  const t = await getTranslations("errors")

  const parsed = (await schema()).safeParse({
    name: (formData.get("name") as string) || undefined,
    email: formData.get("email"),
    message: formData.get("message"),
    website: (formData.get("website") as string) || undefined,
  })
  if (!parsed.success) {
    return { status: "error", error: parsed.error.issues[0]?.message ?? t("checkTheForm") }
  }
  // Bots that fill the hidden field get a quiet success and no email.
  if (parsed.data.website) return { status: "sent" }

  if (!checkRateLimit(await rateLimitKeyFromIp("contact"), 5)) {
    return { status: "error", error: t("tooManyMessages") }
  }

  try {
    await sendContactMessage(parsed.data.email, parsed.data.name, parsed.data.message)
    return { status: "sent" }
  } catch (error) {
    console.error("[contact] send failed:", error)
    return {
      status: "error",
      error: t("contactSendFailed", { email: siteConfig.contactEmail }),
    }
  }
}
