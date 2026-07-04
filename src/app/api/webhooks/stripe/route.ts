import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import type Stripe from "stripe"

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription)
        break
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }
    }
  } catch (err) {
    console.error(`Webhook handler error for ${event.type}:`, err)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (!session.subscription || !session.metadata?.userId) return

  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string,
    { expand: ["items.data.price.product"] }
  )

  const item = subscription.items.data[0]
  const priceId = item?.price.id
  if (!priceId) return

  const plan = await prisma.plan.findUnique({ where: { stripePriceId: priceId } })
  if (!plan) return

  // period dates are on SubscriptionItem in Stripe API 2026
  const periodStart = new Date((item.current_period_start ?? 0) * 1000)
  const periodEnd = new Date((item.current_period_end ?? 0) * 1000)

  // Idempotency guard for side effects. Stripe delivers events at least once and
  // retries on errors, so the same checkout.session.completed can arrive twice.
  // The upsert below is idempotent, but the confirmation email is not — so we
  // only send it when this is a genuinely new subscription, not a replay of an
  // event we've already applied. (For higher volume, a dedicated table keyed on
  // event.id is the more general webhook-idempotency pattern.)
  const existingSub = await prisma.subscription.findUnique({
    where: { userId: session.metadata.userId },
    select: { stripeSubscriptionId: true },
  })
  const isNewSubscription = existingSub?.stripeSubscriptionId !== subscription.id

  await prisma.subscription.upsert({
    where: { userId: session.metadata.userId },
    update: {
      planId: plan.id,
      stripeSubscriptionId: subscription.id,
      status: mapSubscriptionStatus(subscription.status),
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
    create: {
      userId: session.metadata.userId,
      planId: plan.id,
      stripeSubscriptionId: subscription.id,
      status: mapSubscriptionStatus(subscription.status),
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  })

  // Send subscription confirmation email (fire-and-forget)
  const user = await prisma.user.findUnique({
    where: { id: session.metadata.userId },
    select: { email: true, name: true },
  })
  if (isNewSubscription && user && process.env.RESEND_API_KEY) {
    const { sendSubscriptionConfirmation } = await import("@/lib/email")
    const renewalDate = periodEnd.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    sendSubscriptionConfirmation(
      user.email,
      user.name ?? "",
      plan.name,
      plan.price,
      "usd",
      renewalDate
    ).catch(console.error)
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const existing = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  })
  if (!existing) return

  const item = subscription.items.data[0]
  const priceId = item?.price.id
  const plan = priceId
    ? await prisma.plan.findUnique({ where: { stripePriceId: priceId } })
    : null

  const periodStart = new Date((item?.current_period_start ?? 0) * 1000)
  const periodEnd = new Date((item?.current_period_end ?? 0) * 1000)

  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      ...(plan && { planId: plan.id }),
      status: mapSubscriptionStatus(subscription.status),
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  })

  // Send cancellation email when subscription will cancel at period end
  if (subscription.cancel_at_period_end && !existing.cancelAtPeriodEnd) {
    const user = await prisma.user.findUnique({
      where: { id: existing.userId },
      select: { email: true, name: true },
    })
    if (user && process.env.RESEND_API_KEY) {
      const { sendSubscriptionCancelledEmail } = await import("@/lib/email")
      sendSubscriptionCancelledEmail(
        user.email,
        user.name ?? "",
        periodEnd.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
      ).catch(console.error)
    }
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: { status: "CANCELED" },
  })
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // In Stripe API 2026, subscription reference is in invoice.parent.subscription_details.subscription
  const subRef = invoice.parent?.subscription_details?.subscription
  if (!subRef) return
  const subscriptionId = typeof subRef === "string" ? subRef : subRef.id

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscriptionId },
    data: { status: "PAST_DUE" },
  })
}

function mapSubscriptionStatus(status: string) {
  const map: Record<string, "ACTIVE" | "PAST_DUE" | "CANCELED" | "UNPAID" | "TRIALING" | "INCOMPLETE"> = {
    active: "ACTIVE",
    past_due: "PAST_DUE",
    canceled: "CANCELED",
    unpaid: "UNPAID",
    trialing: "TRIALING",
    incomplete: "INCOMPLETE",
    incomplete_expired: "CANCELED",
  }
  return map[status] ?? "INCOMPLETE"
}
