import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import { CHECKOUT_BLOCKING_STATUSES, trialDaysFor } from "@/lib/billing"
import { AUTOMATIC_TAX_PARAMS, checkStripeTax } from "@/lib/stripe-tax"
import type Stripe from "stripe"

export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Billing is not configured" }, { status: 503 })
  }

  const { priceId } = await req.json()
  if (!priceId) {
    return NextResponse.json({ error: "Price ID required" }, { status: 400 })
  }

  // Never trust a client-supplied priceId — validate it against our own Plans.
  // Stripe computes the amount server-side, so this isn't about underpaying;
  // it's intent + defense in depth. The webhook only grants a plan when the
  // price maps to a Plan row, so an unknown price would mean "paid for nothing".
  const plan = await prisma.plan.findUnique({
    where: { stripePriceId: priceId },
    select: { id: true, interval: true, meterEventName: true, isActive: true, trialDays: true },
  })
  if (!plan || !plan.isActive) {
    return NextResponse.json({ error: "Invalid price" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: {
      stripeCustomerId: true,
      email: true,
      name: true,
      subscription: { select: { status: true } },
      purchases: { where: { status: "COMPLETED" }, select: { id: true }, take: 1 },
    },
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  if (user.purchases.length > 0) {
    return NextResponse.json({ error: "You already have lifetime access" }, { status: 400 })
  }

  // A user with a live subscription changes plans through the Customer Portal
  // (which handles proration); a second checkout would create a second
  // subscription in Stripe.
  if (
    user.subscription &&
    (CHECKOUT_BLOCKING_STATUSES as readonly string[]).includes(user.subscription.status)
  ) {
    return NextResponse.json(
      { error: "You already have a subscription. Use the billing portal to change plans." },
      { status: 400 }
    )
  }

  let customerId = user.stripeCustomerId

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name ?? undefined,
      metadata: { userId: currentUser.id },
    })
    customerId = customer.id
    await prisma.user.update({
      where: { id: currentUser.id },
      data: { stripeCustomerId: customerId },
    })
  }

  const isOneTime = plan.interval === "ONE_TIME"

  // planId in metadata saves the webhook a listLineItems call: the session
  // event doesn't include line items, and the plan was validated above.
  const metadata = { userId: currentUser.id, planId: plan.id }

  const params: Stripe.Checkout.SessionCreateParams = {
    customer: customerId,
    mode: isOneTime ? "payment" : "subscription",
    // Metered prices bill from reported usage, so Stripe rejects a quantity.
    line_items: [plan.meterEventName ? { price: priceId } : { price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true`,
    metadata,
  }

  if (isOneTime) {
    // An invoice makes the one-time payment show up in the billing page's
    // invoice history and in the Customer Portal, like subscriptions do.
    params.invoice_creation = { enabled: true }
    // Metadata on the PaymentIntent too, so refund events can be traced back.
    params.payment_intent_data = { metadata }
  }

  // One free trial per customer, and only on plans that set trialDays. Any
  // subscription row counts as having had one, a cancelled one included, which
  // is what stops the trial from restarting on every new checkout. The card is
  // still collected up front, as Checkout does by default: the first charge
  // then happens when the trial ends, with no second step for the customer.
  const trialDays = trialDaysFor(plan, user.subscription !== null)
  if (trialDays) {
    params.subscription_data = { trial_period_days: trialDays }
  }

  // Off unless you opt in: Checkout shows the promotion code field whether or
  // not any code exists. Works for subscriptions and one-time payments alike.
  if (process.env.STRIPE_ALLOW_PROMOTION_CODES === "true") {
    params.allow_promotion_codes = true
  }

  // Stripe Tax (src/lib/stripe-tax.ts). The settings check only writes to the
  // log: an unfinished Tax setup is the seller's to fix, and not a reason to
  // stop a customer from paying.
  if (process.env.STRIPE_AUTOMATIC_TAX === "true") {
    Object.assign(params, AUTOMATIC_TAX_PARAMS)
    await checkStripeTax()
  }

  const checkoutSession = await stripe.checkout.sessions.create(params)

  return NextResponse.json({ url: checkoutSession.url })
}
