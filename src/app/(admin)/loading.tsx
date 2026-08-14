import { getTranslations } from "next-intl/server"
import { BrandLoader } from "@/components/ui/spinner"

export default async function AdminLoading() {
  const t = await getTranslations("loading")
  return <BrandLoader label={t("admin")} className="min-h-[60vh]" />
}
