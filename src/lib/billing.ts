import { prisma } from "@/lib/prisma"
import type { Plan, Purchase, Subscription } from "@prisma/client"

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
