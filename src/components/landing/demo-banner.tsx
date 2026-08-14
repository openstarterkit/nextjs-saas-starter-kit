import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { ArrowRight } from "lucide-react"

/**
 * Slim banner shown on the public pages of a demo deployment
 * (DEMO_MODE="true"): visitors landing on the demo's homepage should
 * jump into the app, not re-read the marketing copy.
 */
export async function DemoBanner() {
  if (process.env.DEMO_MODE !== "true") return null
  const t = await getTranslations("demo")

  return (
    <Link
      href="/login"
      className="group flex items-center justify-center gap-2 bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
    >
      <span aria-hidden="true">👋</span>
      <span>{t("banner")}</span>
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}
