import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getFormatter, getTranslations } from "next-intl/server"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { getEntitlement } from "@/lib/billing"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GetStartedChecklist } from "@/components/dashboard/get-started-checklist"
import { CheckoutStatusToast } from "@/components/billing/checkout-status-toast"
import { isKitSite } from "@/config/kit"

export default async function DashboardPage() {
  const t = await getTranslations("dashboard.home")
  const format = await getFormatter()
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

  // Formatted through next-intl rather than a hardcoded "en-US": a date is
  // part of the interface, and a locale that reads dates day-first would show
  // the wrong one otherwise.
  const renewalDate = subscription?.currentPeriodEnd
    ? format.dateTime(new Date(subscription.currentPeriodEnd), {
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
          {t("greeting", { name: session.user.name?.split(" ")[0] ?? t("greetingFallback") })}
        </h1>
        <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
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
              <CardTitle className="text-base">{t("projectsTitle")}</CardTitle>
              <CardDescription>{t("projectsCount", { count: projectCount })}</CardDescription>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/projects">
                {projectCount === 0 ? t("projectsCreate") : t("projectsViewAll")}
              </Link>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("currentPlan")}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {lifetime?.plan.name ?? subscription?.plan.name ?? t("planFree")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("status")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge
              variant={lifetime || subscription?.status === "ACTIVE" ? "success" : "secondary"}
            >
              {lifetime ? t("statusLifetime") : subscription?.status ?? t("statusFree")}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("nextBilling")}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{lifetime ? t("none") : renewalDate ?? t("none")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Upsell for users without a plan. On the kit's own site it teases the
          Pro tier; in your app it points at your paid plans. Delete it if you
          would rather not sell from inside the dashboard. */}
      {entitlement.kind === "free" && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">
              {t("upsellTitle")}
            </CardTitle>
            <CardDescription>
              {t("upsellBody")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href={isKitSite ? "/pricing" : "/dashboard/billing"}>
                {t("upsellCta")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

    </div>
  )
}
