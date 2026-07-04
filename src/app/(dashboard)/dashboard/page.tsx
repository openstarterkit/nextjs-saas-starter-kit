import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    include: { plan: true },
  })

  const projectCount = await prisma.project.count({
    where: { userId: session.user.id },
  })

  const renewalDate = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back, {session.user.name?.split(" ")[0] ?? "there"} 👋
        </h1>
        <p className="mt-1 text-muted-foreground">Here&apos;s what&apos;s happening with your account.</p>
      </div>

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
            <p className="text-2xl font-bold">{subscription?.plan.name ?? "Free"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Status</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant={subscription?.status === "ACTIVE" ? "success" : "secondary"}>
              {subscription?.status ?? "Free tier"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Next Billing</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{renewalDate ?? "—"}</p>
          </CardContent>
        </Card>
      </div>

      {!subscription && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">Teams — coming soon</CardTitle>
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
