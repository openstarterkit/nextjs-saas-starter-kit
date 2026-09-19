import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"
import { HTMLAttributes } from "react"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary",
        secondary: "bg-secondary text-secondary-foreground",
        // green-700 is the lightest shade that clears 4.5:1 on its own 10% tint.
        success: "bg-green-500/10 text-green-700 dark:text-green-400",
        destructive: "bg-destructive/10 text-destructive",
        outline: "border border-border text-foreground bg-transparent",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
