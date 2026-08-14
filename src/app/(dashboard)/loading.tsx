import { getTranslations } from "next-intl/server"
import { BrandLoader } from "@/components/ui/spinner"

export default async function DashboardLoading() {
  const t = await getTranslations("loading")
  return <BrandLoader label={t("workspace")} className="min-h-[60vh]" />
}
