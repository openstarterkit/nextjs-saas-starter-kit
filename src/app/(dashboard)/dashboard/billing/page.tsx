import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getFormatter, getTranslations } from "next-intl/server"
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

// Subscription statuses come from Stripe as stable codes; their labels live
// in the message files under `dashboard.billing.status`.
const STATUS_CODES = ["ACTIVE", "TRIALING", "PAST_DUE", "CANCELED", "UNPAID", "INCOMPLETE"]

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
  const t = await getTranslations("dashboard.billing")
  const format = await getFormatter()
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
    ? t("checkoutDisabledDemo")
    : t("checkoutDisabledStripe")

  const renewalDate = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    : null
  const purchaseDate = purchase
    ? format.dateTime(new Date(purchase.createdAt), {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    : null

  return (
    <div className="space-y-6">
      <CheckoutStatusToast />
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("currentPlan")}</CardTitle>
          <CardDescription>
            {purchase
              ? t("purchasedOn", { date: purchaseDate ?? "" })
              : subscription
                ? t("renewsOn", { date: renewalDate ?? "" })
                : t("onFreePlan")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-semibold text-lg">
                {purchase?.plan.name ?? subscription?.plan.name ?? t("free")}
              </p>
              {purchase && <Badge variant="success">{t("lifetimeAccess")}</Badge>}
              {!purchase && subscription && (
                <Badge variant={STATUS_VARIANTS[subscription.status] ?? "secondary"}>
                  {STATUS_CODES.includes(subscription.status)
                    ? t(`status.${subscription.status}`)
                    : subscription.status}
                </Badge>
              )}
              {!purchase && subscription?.cancelAtPeriodEnd && (
                <p className="text-sm text-muted-foreground">{t("cancelsAtPeriodEnd")}</p>
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
                  ? t("oneTime")
                  : subscription
                    ? `/ ${subscription.plan.interval.toLowerCase()}`
                    : t("perMonth")}
              </p>
            </div>
          </div>
          {purchase && subscription && (
            <p className="text-sm text-muted-foreground">
              {t("alsoSubscribed", { plan: subscription.plan.name })}
            </p>
          )}
          {(subscription || (purchase && user?.stripeCustomerId)) && (
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
              <ManageBillingButton className="w-full sm:w-auto" />
              {subscription && !purchase && (
                <p className="text-sm text-muted-foreground">
                  {t("portalHint")}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {entitlement.kind === "free" && plans.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">{t("availablePlans")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("availablePlansHint")}
            </p>
          </div>
          <PlanCards
            plans={plans}
            checkoutDisabled={checkoutDisabled}
            disabledNote={disabledNote}
            contactCard={isDemo ? await exampleEnterpriseCard() : undefined}
          />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("invoiceHistory")}</CardTitle>
          <CardDescription>{t("invoiceHistoryHint")}</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {process.env.STRIPE_SECRET_KEY ? t("noInvoices") : t("noInvoicesStripe")}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("colDate")}</TableHead>
                  <TableHead>{t("colAmount")}</TableHead>
                  <TableHead>{t("colStatus")}</TableHead>
                  <TableHead>{t("colInvoice")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      {format.dateTime(new Date((invoice.created ?? 0) * 1000), {
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
                        {invoice.status ?? t("statusUnknown")}
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
                          {t("viewPdf")}
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
