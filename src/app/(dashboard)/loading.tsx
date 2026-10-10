import { getTranslations } from "next-intl/server"
import { RouteLoading } from "@/components/navigation-overlay"

export default async function DashboardLoading() {
  const t = await getTranslations("loading")
  return <RouteLoading label={t("workspace")} />
}
