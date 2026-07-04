import Link from "next/link"
import { ArrowRight } from "lucide-react"

/**
 * Slim banner shown on the public pages of a demo deployment
 * (DEMO_MODE="true"): visitors landing on the demo's homepage should
 * jump into the app, not re-read the marketing copy.
 */
export function DemoBanner() {
  if (process.env.DEMO_MODE !== "true") return null

  return (
    <Link
      href="/login"
      className="group flex items-center justify-center gap-2 bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
    >
      <span aria-hidden="true">👋</span>
      <span>You&apos;re viewing the live demo — jump into the app</span>
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}
