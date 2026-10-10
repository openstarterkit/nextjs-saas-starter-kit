import { getTranslations } from "next-intl/server"
import { RouteLoading } from "@/components/navigation-overlay"

export default async function AdminLoading() {
  const t = await getTranslations("loading")
  return <RouteLoading label={t("admin")} />
}
