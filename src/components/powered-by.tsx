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
 * Note: this badge intentionally does NOT read `siteConfig` or the theme
 * tokens — it credits the kit itself, not your app, so both the text and
 * the OpenStarterKit brand colors stay hard-coded.
 */

const HOMEPAGE_URL = "https://openstarterkit.dev"

/* OpenStarterKit brand gradient (Cobalt Deep), independent of the app theme.
   The flat brand blue #2563eb lives in the Tailwind classes below, where it
   can differ between light and dark. */
const OSK_GRADIENT = "linear-gradient(135deg, #1d4ed8 0%, #2563eb 45%, #38bdf8 100%)"

export function PoweredBy() {
  if (process.env.NEXT_PUBLIC_REMOVE_BRANDING === "true") return null

  return (
    <a
      href={HOMEPAGE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      {/* Tailwind classes rather than inline styles: an inline style cannot
          vary by theme, and this mark needs a solid tile in light and the
          tinted one in dark, like the main logo. No isKitSite gate here on
          purpose: the badge credits the kit inside someone else's app, so
          leaving it behind would make it the one place where the old mark
          survives, replicated in every clone. */}
      <span className="flex h-4 w-4 items-center justify-center rounded bg-[#2563eb] text-white dark:bg-[#2563eb]/10 dark:text-[#2563eb]">
        <Zap className="h-2.5 w-2.5 fill-current" />
      </span>
      <span className="tracking-tight">
        Built with <span className="font-bold text-foreground">Open</span>
        <span
          className="font-bold"
          style={{
            background: OSK_GRADIENT,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          Starter
        </span>
        <span className="font-bold text-foreground">Kit</span>
      </span>
    </a>
  )
}
