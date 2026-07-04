import { Zap } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Your app's logo, in one place. Together with `src/config/site.ts` this is
 * the only file to touch to rebrand the kit: swap the icon and the wordmark
 * markup below for your own.
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
  return (
    <span className={cn("tracking-tight", className)}>
      <span>Open</span>
      <span className="text-gradient-brand">Starter</span>
      <span>Kit</span>
    </span>
  )
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
