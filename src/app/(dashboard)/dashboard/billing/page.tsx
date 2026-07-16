import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getEntitlement } from "@/lib/billing"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ManageBillingButton } from "@/components/billing/manage-billing-button"
import { PlanCards, type PlanCardData } from "@/components/billing/plan-cards"
import { exampleEnterpriseCard } from "@/components/billing/enterprise-card"
import { CheckoutStatusToast } from "@/components/billing/checkout-status-toast"

const STATUS_VARIANTS: Record<string, "success" | "default" | "destructive" | "secondary"> = {
  ACTIVE: "success",
  TRIALING: "default",
  PAST_DUE: "destructive",
  CANCELED: "secondary",
  UNPAID: "destructive",
  INCOMPLETE: "secondary",
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  TRIALING: "Trial",
  PAST_DUE: "Past Due",
  CANCELED: "Canceled",
  UNPAID: "Unpaid",
  INCOMPLETE: "Incomplete",
}

async function getInvoices(customerId: string | null) {
  if (!customerId || !process.env.STRIPE_SECRET_KEY) return []
  try {
    const { stripe } = await import("@/lib/stripe")
    const invoices = await stripe.invoices.list({ customer: customerId, limit: 10 })
    return invoices.data
  } catch {
    return []
  }
}

export default async function BillingPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  })

  const entitlement = await getEntitlement(session.user.id)
  const purchase = entitlement.kind === "lifetime" ? entitlement.purchase : null
  const subscription =
    entitlement.kind === "subscription"
      ? entitlement.subscription
      : entitlement.kind === "lifetime"
        ? entitlement.subscription
        : null
  const invoices = await getInvoices(user?.stripeCustomerId ?? null)

  // Metered plans are excluded from the grid: they exist for the usage-based
  // example (docs/billing.md) and would be confusing as a self-serve card.
  // In demo mode the one-time plan is excluded too: the grid mirrors the
  // Starter / Pro / Enterprise triad of the demo landing.
  const isDemo = process.env.DEMO_MODE === "true"
  const planRows =
    entitlement.kind === "free"
      ? await prisma.plan.findMany({
        where: {
          isActive: true,
          meterEventName: null,
          ...(isDemo ? { interval: { not: "ONE_TIME" as const } } : {}),
        },
        orderBy: { price: "asc" },
      })
      : []
  const plans: PlanCardData[] = planRows.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    price: p.price,
    interval: p.interval,
    stripePriceId: p.stripePriceId,
    features: p.features,
  }))
  const checkoutDisabled = isDemo || !process.env.STRIPE_SECRET_KEY
  const disabledNote = isDemo
    ? "Checkout is disabled in the public demo."
    : "Connect Stripe to enable checkout: set STRIPE_SECRET_KEY and the price IDs, then reseed."

  const renewalDate = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    : null
  const purchaseDate = purchase
    ? new Date(purchase.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    : null

  return (
    <div className="space-y-6">
      <CheckoutStatusToast />
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="mt-1 text-muted-foreground">Manage your plan and payment history.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            {purchase
              ? `Purchased on ${purchaseDate}`
              : subscription
                ? `Renews on ${renewalDate}`
                : "You are on the free plan"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-semibold text-lg">
                {purchase?.plan.name ?? subscription?.plan.name ?? "Free"}
              </p>
              {purchase && <Badge variant="success">Lifetime access</Badge>}
              {!purchase && subscription && (
                <Badge variant={STATUS_VARIANTS[subscription.status] ?? "secondary"}>
                  {STATUS_LABELS[subscription.status] ?? subscription.status}
                </Badge>
              )}
              {!purchase && subscription?.cancelAtPeriodEnd && (
                <p className="text-sm text-muted-foreground">Cancels at end of billing period</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">
                {purchase
                  ? `$${(purchase.amount / 100).toFixed(2)}`
                  : subscription
                    ? `$${(subscription.plan.price / 100).toFixed(2)}`
                    : "$0"}
              </p>
              <p className="text-sm text-muted-foreground">
                {purchase
                  ? "one time"
                  : subscription
                    ? `/ ${subscription.plan.interval.toLowerCase()}`
                    : "/ month"}
              </p>
            </div>
          </div>
          {purchase && subscription && (
            <p className="text-sm text-muted-foreground">
              You also have a {subscription.plan.name} subscription. Since lifetime access covers
              everything, you can cancel it in the billing portal.
            </p>
          )}
          {(subscription || (purchase && user?.stripeCustomerId)) && (
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
              <ManageBillingButton className="w-full sm:w-auto" />
              {subscription && !purchase && (
                <p className="text-sm text-muted-foreground">
                  Switch plans or update your payment method in the billing portal.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {entitlement.kind === "free" && plans.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Available plans</h2>
            <p className="text-sm text-muted-foreground">
              These are the seeded example plans: replace them with your own pricing.
            </p>
          </div>
          <PlanCards
            plans={plans}
            checkoutDisabled={checkoutDisabled}
            disabledNote={disabledNote}
            contactCard={isDemo ? exampleEnterpriseCard : undefined}
          />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
          <CardDescription>Your past payments and invoices.</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {process.env.STRIPE_SECRET_KEY
                ? "No invoices yet."
                : "Connect Stripe to see your invoice history."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Invoice</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      {new Date((invoice.created ?? 0) * 1000).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      ${((invoice.amount_paid ?? 0) / 100).toFixed(2)}{" "}
                      {invoice.currency?.toUpperCase()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={invoice.status === "paid" ? "success" : "secondary"}>
                        {invoice.status ?? "unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {invoice.hosted_invoice_url ? (
                        <a
                          href={invoice.hosted_invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          View PDF
                        </a>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
