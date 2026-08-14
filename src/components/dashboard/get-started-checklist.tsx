import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { ArrowRight, Check, X } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { dismissOnboarding } from "@/app/actions/onboarding"

type ChecklistItem = { label: string; done: boolean; href: string }

// Server component: the items are derived live from the DB by the dashboard
// page, only the dismissal is persisted (User.onboardingDismissedAt).
export async function GetStartedChecklist({
  hasName,
  hasProject,
  hasBilling,
}: {
  hasName: boolean
  hasProject: boolean
  hasBilling: boolean
}) {
  const t = await getTranslations("dashboard.home")
  const items: ChecklistItem[] = [
    { label: t("checklistName"), done: hasName, href: "/dashboard/settings" },
    { label: t("checklistProject"), done: hasProject, href: "/dashboard/projects" },
    { label: t("checklistBilling"), done: hasBilling, href: "/dashboard/billing" },
  ]
  const doneCount = items.filter((i) => i.done).length
  if (doneCount === items.length) return null

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">{t("checklistTitle")}</CardTitle>
            <CardDescription>
              {t("checklistProgress", { done: doneCount, total: items.length })}
            </CardDescription>
          </div>
          <form action={dismissOnboarding}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              aria-label={t("checklistDismiss")}
            >
              <X className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {items.map((item) =>
          item.done ? (
            <div
              key={item.label}
              className="flex items-center gap-3 rounded-md px-2 py-2 text-sm text-muted-foreground"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
              <span className="line-through">{item.label}</span>
            </div>
          ) : (
            <Link
              key={item.label}
              href={item.href}
              className="group flex items-center gap-3 rounded-md px-2 py-2 text-sm text-foreground transition-colors hover:bg-primary/10"
            >
              <span className="h-5 w-5 shrink-0 rounded-full border-2 border-border" />
              <span>{item.label}</span>
              <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          )
        )}
      </CardContent>
    </Card>
  )
}
