import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ManageBillingButton } from "@/components/billing/manage-billing-button"
import { UpgradeButton } from "@/components/billing/upgrade-button"

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
    select: {
      stripeCustomerId: true,
      subscription: { include: { plan: true } },
    },
  })

  const subscription = user?.subscription
  const invoices = await getInvoices(user?.stripeCustomerId ?? null)

  const renewalDate = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="mt-1 text-muted-foreground">Manage your subscription and payment history.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            {subscription ? `Renews on ${renewalDate}` : "You are on the free plan"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-semibold text-lg">{subscription?.plan.name ?? "Free"}</p>
              {subscription && (
                <Badge variant={STATUS_VARIANTS[subscription.status] ?? "secondary"}>
                  {STATUS_LABELS[subscription.status] ?? subscription.status}
                </Badge>
              )}
              {subscription?.cancelAtPeriodEnd && (
                <p className="text-sm text-muted-foreground">Cancels at end of billing period</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">
                {subscription ? `$${(subscription.plan.price / 100).toFixed(2)}` : "$0"}
              </p>
              <p className="text-sm text-muted-foreground">
                {subscription ? `/ ${subscription.plan.interval.toLowerCase()}` : "/ month"}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            {subscription ? (
              <ManageBillingButton className="w-full sm:w-auto" />
            ) : (
              <UpgradeButton className="w-full sm:w-auto" />
            )}
          </div>
        </CardContent>
      </Card>

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
                        <span className="text-sm text-muted-foreground">—</span>
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
