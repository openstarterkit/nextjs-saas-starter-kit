"use client"

import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { LogoMark } from "@/components/logo"

/** Inline ring spinner for buttons and compact pending states. */
export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-4 w-4 animate-spin", className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z"
      />
    </svg>
  )
}

/**
 * Brand loader for route transitions: the logo tile with an orbiting ring.
 * Used by the route-group `loading.tsx` files; drop it anywhere a section
 * of the app is waiting on data.
 */
const ARC_MASK =
  "radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 3px))"

export function BrandLoader({
  label,
  className,
}: {
  label?: string
  className?: string
}) {
  const t = useTranslations("loading")
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex min-h-[50vh] flex-col items-center justify-center gap-5", className)}
    >
      <div className="relative h-[72px] w-[72px]">
        {/* faint full track */}
        <span aria-hidden="true" className="absolute inset-0 rounded-full border-[3px] border-primary/10" />
        {/* brand-gradient arc with a fading tail — the moving part */}
        <span
          aria-hidden="true"
          className="absolute inset-0 animate-spin rounded-full will-change-transform"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 50%, var(--primary-2) 82%, var(--primary) 100%)",
            mask: ARC_MASK,
            WebkitMask: ARC_MASK,
            animationDuration: "800ms",
          }}
        />
        <span className="absolute inset-0 flex items-center justify-center">
          <LogoMark className="h-11 w-11 rounded-2xl ring-1 ring-primary/15" iconClassName="h-5 w-5" />
        </span>
      </div>
      {/* One announcement, not two: with a visible label the sr-only copy
          repeated it to a screen reader. */}
      {label ? (
        <p className="animate-pulse text-sm font-medium text-muted-foreground">{label}</p>
      ) : (
        <span className="sr-only">{t("default")}</span>
      )}
    </div>
  )
}
