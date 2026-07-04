import { Zap } from "lucide-react"

/**
 * "Built with OpenStarterKit" attribution badge.
 *
 * Shown by default in the app shell footer. It costs you nothing and helps
 * other makers discover the kit.
 *
 * ── Want to remove it? ──────────────────────────────────────────────
 * You're completely free to. Just set the env var:
 *
 *     NEXT_PUBLIC_REMOVE_BRANDING="true"
 *
 * No license, no fee, no unlock. If OpenStarterKit saved you time, the
 * nicest way to say thanks is a coffee — totally optional:
 *
 *     ☕  https://buymeacoffee.com/openstarterkit
 * ────────────────────────────────────────────────────────────────────
 *
 * Note: this badge intentionally does NOT read `siteConfig` — it credits
 * the kit itself, not your app, so it stays hard-coded.
 */

const HOMEPAGE_URL = "https://openstarterkit.dev"

export function PoweredBy() {
  if (process.env.NEXT_PUBLIC_REMOVE_BRANDING === "true") return null

  return (
    <a
      href={HOMEPAGE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <span className="flex h-4 w-4 items-center justify-center rounded bg-primary/10 text-primary">
        <Zap className="h-2.5 w-2.5 fill-primary" />
      </span>
      <span className="tracking-tight">
        Built with <span className="font-bold text-foreground">Open</span>
        <span className="font-bold text-gradient-brand">Starter</span>
        <span className="font-bold text-foreground">Kit</span>
      </span>
    </a>
  )
}
