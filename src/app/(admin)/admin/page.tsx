import { getCurrentUser } from "@/lib/auth"
import { getTranslations } from "next-intl/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { RevenueChart } from "@/components/admin/revenue-chart"
import { mrrHistory, monthlyEquivalent } from "@/lib/metrics"

async function getAdminData() {
  const [totalUsers, allSubscriptions, waitlistConfirmed] =
    await Promise.all([
      prisma.user.count(),
      // Every subscription, not just the active ones: the chart needs the rows
      // that have since churned to show the revenue they produced while they
      // were running. The active-only figures below are derived from the same
      // result, so the page still makes a single query for all of them.
      prisma.subscription.findMany({
        include: { plan: true },
      }),
      prisma.newsletterSubscriber.count({ where: { confirmedAt: { not: null }, unsubscribedAt: null } }),
    ])

  const activeSubscriptions = allSubscriptions.filter((sub) => sub.status === "ACTIVE")
  const mrr = activeSubscriptions.reduce((sum, sub) => sum + monthlyEquivalent(sub.plan), 0)
  const revenue = mrrHistory(allSubscriptions)

  return {
    totalUsers,
    activeUsers: activeSubscriptions.length,
    mrr,
    revenue,
    waitlistConfirmed,
  }
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>
}) {
  const t = await getTranslations("admin")
  const user = await getCurrentUser()
  if (!user || user.role !== "ADMIN") redirect("/dashboard")

  // The users list moved to /admin/users in 2.5.0: a bookmarked page or
  // search of the old table lands on the same results there.
  const params = await searchParams
  if (params.page || params.search) {
    const query = new URLSearchParams()
    if (params.page) query.set("page", params.page)
    if (params.search) query.set("search", params.search)
    redirect(`/admin/users?${query}`)
  }

  const { totalUsers, activeUsers, mrr, revenue, waitlistConfirmed } =
    await getAdminData()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("totalUsers")}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalUsers}</p>
            <Link href="/admin/users" className="mt-1 inline-block text-xs font-medium text-primary underline-offset-4 hover:underline">
              {t("viewUsers")}
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("activeSubscriptions")}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{activeUsers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("mrr")}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">${(mrr / 100).toFixed(0)}</p>
          </CardContent>
        </Card>
        {/* Confirmed only: a pending address has not said yes yet. */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("waitlistTitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{waitlistConfirmed}</p>
            <Link href="/admin/waitlist" className="mt-1 inline-block text-xs font-medium text-primary underline-offset-4 hover:underline">
              {t("viewWaitlist")}
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recurring revenue over time */}
      <Card>
        <CardHeader>
          <CardTitle>{t("revenueTitle")}</CardTitle>
          <CardDescription>{t("revenueSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <RevenueChart data={revenue} label={t("revenueTooltip")} />
        </CardContent>
      </Card>

    </div>
  )
}
