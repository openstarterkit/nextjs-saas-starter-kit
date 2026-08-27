import * as React from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import type { Crumb } from "@/lib/breadcrumb"

/**
 * Breadcrumb trail.
 *
 * The last entry is the current page and is not a link: it is marked
 * `aria-current="page"` so a screen reader announces where the trail ends,
 * and the separators are hidden from the accessibility tree because they are
 * decoration, not content.
 */
const Breadcrumb = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<"nav"> & { separator?: React.ReactNode }
>(({ ...props }, ref) => <nav ref={ref} aria-label="Breadcrumb" {...props} />)
Breadcrumb.displayName = "Breadcrumb"

const BreadcrumbList = React.forwardRef<
  HTMLOListElement,
  React.ComponentPropsWithoutRef<"ol">
>(({ className, ...props }, ref) => (
  <ol
    ref={ref}
    className={cn(
      "flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground",
      className
    )}
    {...props}
  />
))
BreadcrumbList.displayName = "BreadcrumbList"

const BreadcrumbItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentPropsWithoutRef<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("inline-flex items-center gap-1.5", className)} {...props} />
))
BreadcrumbItem.displayName = "BreadcrumbItem"

const BreadcrumbLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<typeof Link>
>(({ className, ...props }, ref) => (
  <Link
    ref={ref}
    className={cn("transition-colors hover:text-foreground", className)}
    {...props}
  />
))
BreadcrumbLink.displayName = "BreadcrumbLink"

const BreadcrumbPage = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<"span">
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    role="link"
    aria-disabled="true"
    aria-current="page"
    className={cn("font-medium text-foreground", className)}
    {...props}
  />
))
BreadcrumbPage.displayName = "BreadcrumbPage"

const BreadcrumbSeparator = ({ className, ...props }: React.ComponentProps<"li">) => (
  <li role="presentation" aria-hidden="true" className={cn("[&>svg]:size-3.5", className)} {...props}>
    <ChevronRight />
  </li>
)
BreadcrumbSeparator.displayName = "BreadcrumbSeparator"

/**
 * Renders a whole trail from the same array that produces the structured data
 * (`breadcrumbJsonLd`). Pages pass the trail once, so the row on screen and the
 * BreadcrumbList in the markup cannot describe different paths.
 */
function BreadcrumbTrail({ trail, className }: { trail: Crumb[]; className?: string }) {
  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {trail.map((crumb, index) => {
          const last = index === trail.length - 1
          return (
            <React.Fragment key={crumb.href}>
              <BreadcrumbItem>
                {last ? (
                  <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={crumb.href}>{crumb.name}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!last && <BreadcrumbSeparator />}
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

export {
  Breadcrumb,
  BreadcrumbTrail,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
}
