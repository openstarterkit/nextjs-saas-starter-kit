import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * A standing message about the page, not about something that just happened.
 *
 * Use it for a condition the reader needs to know while they are here: a demo
 * deployment, a plan that expired, a setting that is off. Something that
 * happened in response to a click is a toast instead, because it should leave
 * when it stops being news.
 *
 * `role="alert"` on the destructive variant only. It interrupts a screen reader
 * mid-sentence, which is right for a problem and rude for an aside.
 */
const alertVariants = cva(
  "relative w-full rounded-[var(--radius)] border px-4 py-3 text-sm [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-3.5 [&>svg]:h-4 [&>svg]:w-4 [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "border-border bg-card text-foreground",
        info: "border-primary/30 bg-primary/5 text-foreground [&>svg]:text-primary",
        warning:
          "border-amber-500/30 bg-amber-500/5 text-foreground [&>svg]:text-amber-600 dark:[&>svg]:text-amber-400",
        destructive: "border-destructive/30 bg-destructive/5 text-foreground [&>svg]:text-destructive",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role={variant === "destructive" ? "alert" : undefined}
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("font-medium text-foreground", className)} {...props} />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-muted-foreground", className)} {...props} />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
