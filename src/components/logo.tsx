import { Hexagon, Zap } from "lucide-react"
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
  generic,
}: {
  className?: string
  iconClassName?: string
  /**
   * Renders a stand-in mark instead of this deployment's own: neutral grey,
   * and the hexagon even on the kit's site. For screenshots and mockups that
   * depict *someone else's* product, where our bolt would claim it as ours.
   */
  generic?: boolean
}) {
  const useOwnMark = isKitSite && !generic
  return (
    <span
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg",
        // Light: a solid tile with a white bolt, so the logo matches the
        // favicon this kit generates (src/app/icon.tsx), which has always been
        // a solid tile. Dark stays tinted: a solid block reads as a hole on a
        // dark surface.
        // The kit's own site needs the hex spelled out, because its light
        // `--primary` is #1d4ed8 and the brand blue is #2563eb.
        generic
          ? "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
          : cn(
              isKitSite ? "bg-[#2563eb]" : "bg-primary",
              "text-white dark:bg-primary/10 dark:text-primary"
            ),
        className
      )}
    >
      {/* The bolt is the OpenStarterKit mark and stays on the kit's own site
          and on the attribution badge. Everywhere else the placeholder is a
          plain hexagon: a clone should not ship wearing our symbol, and with
          the badge in the footer the same bolt would appear twice on one page
          meaning two different things.
          Both filled. The hexagon is drawn a size down from the bolt so the
          solid shape keeps some tile around it instead of filling the whole
          square. Swap this together with src/app/icon.tsx when you rebrand. */}
      {useOwnMark ? (
        <Zap className={cn("h-5 w-5 fill-current", iconClassName)} />
      ) : (
        <Hexagon className={cn("h-[18px] w-[18px] fill-current stroke-[1.5]", iconClassName)} />
      )}
    </span>
  )
}

/** Stand-in name for mockups, matching the alex@acme.io in the same screenshot. */
const GENERIC_NAME = "Acme"

export function LogoWordmark({ className, generic }: { className?: string; generic?: boolean }) {
  const name = generic ? GENERIC_NAME : siteConfig.name
  // The kit's own site highlights "Starter", as it did before this was
  // configurable. Your app renders the name plainly unless you set the var.
  const accent = generic
    ? undefined
    : process.env.NEXT_PUBLIC_BRAND_WORDMARK_ACCENT || (isKitSite ? "Starter" : undefined)

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
  generic,
}: {
  className?: string
  markClassName?: string
  wordmarkClassName?: string
  /** A stand-in brand, for depicting someone else's product. See LogoMark. */
  generic?: boolean
}) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <LogoMark className={markClassName} generic={generic} />
      <LogoWordmark className={wordmarkClassName} generic={generic} />
    </span>
  )
}
