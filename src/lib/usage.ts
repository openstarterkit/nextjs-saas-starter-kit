import { z } from "zod"
import { prisma } from "@/lib/prisma"

const usageSchema = z.object({
  userId: z.string().min(1),
  eventName: z.string().min(1),
  value: z.number().int().positive(),
  identifier: z.string().min(1).optional(),
})

/**
 * Reports a usage event to a Stripe Billing Meter, for usage-based (metered)
 * plans. Call it from your server code wherever the billable thing happens,
 * e.g. inside a server action or API route:
 *
 *   await recordUsage(session.user.id, "api_request")
 *
 * `eventName` must match the meter's event name in Stripe and the plan's
 * `meterEventName` (see docs/billing.md for the full setup). Pass a unique
 * `identifier` when the caller might retry, it is Stripe's dedupe key for
 * meter events (roughly a 24h window).
 *
 * No-ops with a warning when Stripe isn't configured or the user has no
 * Stripe customer yet, so instrumented code stays safe in keyless installs
 * and demo mode.
 */
export async function recordUsage(
  userId: string,
  eventName: string,
  value = 1,
  opts?: { identifier?: string }
) {
  const parsed = usageSchema.parse({ userId, eventName, value, identifier: opts?.identifier })

  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn("recordUsage: STRIPE_SECRET_KEY is not set, usage event dropped")
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: parsed.userId },
    select: { stripeCustomerId: true },
  })
  if (!user?.stripeCustomerId) {
    console.warn(`recordUsage: user ${parsed.userId} has no Stripe customer, usage event dropped`)
    return null
  }

  const { stripe } = await import("@/lib/stripe")
  return stripe.billing.meterEvents.create({
    event_name: parsed.eventName,
    payload: {
      stripe_customer_id: user.stripeCustomerId,
      value: String(parsed.value),
    },
    ...(parsed.identifier && { identifier: parsed.identifier }),
  })
}
