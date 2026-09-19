import { prisma } from "@/lib/prisma"
import type { BillingInterval, Plan, Purchase, Subscription } from "@prisma/client"
import type Stripe from "stripe"

export type PurchaseWithPlan = Purchase & { plan: Plan }
export type SubscriptionWithPlan = Subscription & { plan: Plan }

// The user's current billing state, most privileged first. A lifetime purchase
// outranks a subscription; when both exist the subscription is still surfaced
// so the UI can point the user at the portal to cancel the now-redundant one.
// This is the single helper to copy when gating your own features.
export type Entitlement =
  | { kind: "lifetime"; purchase: PurchaseWithPlan; subscription: SubscriptionWithPlan | null }
  | { kind: "subscription"; subscription: SubscriptionWithPlan }
  | { kind: "free" }

export async function getEntitlement(userId: string): Promise<Entitlement> {
  const [purchase, subscription] = await Promise.all([
    prisma.purchase.findFirst({
      where: { userId, status: "COMPLETED" },
      orderBy: { createdAt: "desc" },
      include: { plan: true },
    }),
    prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    }),
  ])

  // A subscription only counts while Stripe still manages it (same statuses
  // that block a new checkout): a CANCELED or INCOMPLETE row is history, not
  // an entitlement — those users are free and can check out again.
  const liveSubscription =
    subscription &&
    (CHECKOUT_BLOCKING_STATUSES as readonly string[]).includes(subscription.status)
      ? subscription
      : null

  if (purchase) return { kind: "lifetime", purchase, subscription: liveSubscription }
  if (liveSubscription) return { kind: "subscription", subscription: liveSubscription }
  return { kind: "free" }
}

// Subscription statuses that mean "there is a live subscription in Stripe that
// the billing portal can manage" — in-app checkout must not create a second one.
// INCOMPLETE (initial payment never went through) and CANCELED are not blocking.
export const CHECKOUT_BLOCKING_STATUSES = ["ACTIVE", "TRIALING", "PAST_DUE", "UNPAID"] as const

// How many days of free trial a checkout for this plan should carry, or null
// for none. One trial per customer: a Subscription row outlives cancellation
// (userId is unique and the row stays behind as CANCELED), so "has had a
// subscription" is "has a row". Without that rule, cancelling and checking out
// again would restart the trial, for free, as often as anyone liked.
export function trialDaysFor(
  plan: { interval: BillingInterval; trialDays: number | null },
  hasHadSubscription: boolean
): number | null {
  if (plan.interval === "ONE_TIME" || hasHadSubscription) return null
  return plan.trialDays && plan.trialDays > 0 ? plan.trialDays : null
}

// The dates a Subscription row stores, read from a Stripe subscription. Since
// the 2026 API the billing period lives on the subscription item rather than
// on the subscription. The trial end stays on the subscription, and stays set
// once the trial is over.
export function subscriptionDates(subscription: Stripe.Subscription) {
  const item = subscription.items.data[0]
  return {
    currentPeriodStart: new Date((item?.current_period_start ?? 0) * 1000),
    currentPeriodEnd: new Date((item?.current_period_end ?? 0) * 1000),
    trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
  }
}

// Stripe types the duration as open-ended, so a comparison does not narrow it.
const isKnownDuration = (duration: string): duration is DiscountSummary["duration"] =>
  duration === "once" || duration === "repeating" || duration === "forever"

export type DiscountSummary = {
  percentOff: number | null
  // In the smallest currency unit, like every Stripe amount.
  amountOff: number | null
  currency: string | null
  duration: "once" | "repeating" | "forever"
  endsAt: Date | null
  code: string | null
}

// What the billing page says about a discount on a subscription. Only an
// expanded coupon can be described: a bare id says nothing, and a coupon with
// no percentage, no amount or a duration this code does not know is left out
// rather than guessed at. The coupon sits under `source` since the 2025 API.
export function describeDiscount(discount: string | Stripe.Discount): DiscountSummary | null {
  if (typeof discount === "string") return null
  const coupon = discount.source?.coupon
  if (!coupon || typeof coupon === "string") return null
  if (coupon.percent_off == null && coupon.amount_off == null) return null
  const { duration } = coupon
  if (!isKnownDuration(duration)) return null
  const promotion = discount.promotion_code
  return {
    percentOff: coupon.percent_off,
    amountOff: coupon.amount_off,
    currency: coupon.currency,
    duration,
    endsAt: discount.end ? new Date(discount.end * 1000) : null,
    code: promotion && typeof promotion !== "string" ? promotion.code : null,
  }
}
