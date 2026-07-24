import { Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { siteConfig } from "@/config/site"
import { isKitSite } from "@/config/kit"

/**
 * Your app's logo, in one place. Together with `src/config/site.ts` this is
 * the only file to touch to rebrand the kit: swap the icon below for your own
 * and the wordmark follows `siteConfig.name` automatically.
 *
 * Optional: set `NEXT_PUBLIC_BRAND_WORDMARK_ACCENT` to a substring of the
 * name to gradient-highlight it (e.g. "Starter" in "OpenStarterKit"). Unset,
 * the name renders plainly — the neutral default.
 */

export function LogoMark({
  className,
  iconClassName,
}: {
  className?: string
  iconClassName?: string
}) {
  return (
    <span
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary",
        className
      )}
    >
      <Zap className={cn("h-5 w-5 fill-primary", iconClassName)} />
    </span>
  )
}

export function LogoWordmark({ className }: { className?: string }) {
  const name = siteConfig.name
  // The kit's own site highlights "Starter", as it did before this was
  // configurable. Your app renders the name plainly unless you set the var.
  const accent = process.env.NEXT_PUBLIC_BRAND_WORDMARK_ACCENT || (isKitSite ? "Starter" : undefined)

  if (accent && name.includes(accent)) {
    const [before, after] = name.split(accent)
    return (
      <span className={cn("tracking-tight", className)}>
        {before}
        <span className="text-gradient-brand">{accent}</span>
        {after}
      </span>
    )
  }

  return <span className={cn("tracking-tight", className)}>{name}</span>
}

export function Logo({
  className,
  markClassName,
  wordmarkClassName,
}: {
  className?: string
  markClassName?: string
  wordmarkClassName?: string
}) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <LogoMark className={markClassName} />
      <LogoWordmark className={wordmarkClassName} />
    </span>
  )
}
