import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { getEntitlement } from "@/lib/billing"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GetStartedChecklist } from "@/components/dashboard/get-started-checklist"
import { CheckoutStatusToast } from "@/components/billing/checkout-status-toast"

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const entitlement = await getEntitlement(session.user.id)
  const subscription = entitlement.kind === "subscription" ? entitlement.subscription : null
  const lifetime = entitlement.kind === "lifetime" ? entitlement.purchase : null

  const [projectCount, userRow] = await Promise.all([
    prisma.project.count({ where: { userId: session.user.id } }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, onboardingDismissedAt: true, stripeCustomerId: true },
    }),
  ])

  const renewalDate = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    : null

  return (
    <div className="space-y-6">
      <CheckoutStatusToast />
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back, {session.user.name?.split(" ")[0] ?? "there"} 👋
        </h1>
        <p className="mt-1 text-muted-foreground">Here&apos;s what&apos;s happening with your account.</p>
      </div>

      {!userRow?.onboardingDismissedAt && (
        <GetStartedChecklist
          hasName={Boolean(userRow?.name)}
          hasProject={projectCount > 0}
          hasBilling={entitlement.kind !== "free" || Boolean(userRow?.stripeCustomerId)}
        />
      )}

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base">Projects</CardTitle>
              <CardDescription>
                {projectCount === 0
                  ? "Create your first project to get started."
                  : `You have ${projectCount} project${projectCount === 1 ? "" : "s"}.`}
              </CardDescription>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/projects">
                {projectCount === 0 ? "Create one" : "View all"}
              </Link>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Current Plan</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {lifetime?.plan.name ?? subscription?.plan.name ?? "Free"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Status</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge
              variant={lifetime || subscription?.status === "ACTIVE" ? "success" : "secondary"}
            >
              {lifetime ? "Lifetime" : subscription?.status ?? "Free tier"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Next Billing</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{lifetime ? "None" : renewalDate ?? "None"}</p>
          </CardContent>
        </Card>
      </div>

      {entitlement.kind === "free" && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">Teams - coming soon</CardTitle>
            <CardDescription>
              Multi-tenancy, roles and team billing are on the way. Tell us what you&apos;d need.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/pricing">Learn more</Link>
            </Button>
          </CardContent>
        </Card>
      )}

    </div>
  )
}
