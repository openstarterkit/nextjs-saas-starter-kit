"use client"

import { BreadcrumbTrail } from "@/components/ui/breadcrumb"
import { useBreadcrumbName } from "@/components/dashboard/breadcrumb-name"
import { activeMenuItem } from "@/components/dashboard/sidebar-nav"
import { useRenderedPathname } from "@/hooks/use-rendered-pathname"
import type { Crumb } from "@/lib/breadcrumb"

/**
 * Where you are, in the header of the dashboard and the admin, next to the
 * button that folds the sidebar: Dashboard › Projects › Website.
 *
 * In the header rather than at the top of each page because that is where the
 * eye looks for "where am I", and it stays put while the page scrolls. Every
 * crumb but the last is a link, one level up each.
 *
 * Built from the rendered path, so a new page gets its crumb without being
 * listed anywhere, as long as its segment has a label in `labels`. A segment
 * that is an id (a project) has no label: the page names itself with
 * <BreadcrumbName>, and until it does the crumb is simply left out, never
 * shown as an id. With Settings open as a modal the rendered path is still
 * the page underneath, and so is the trail.
 *
 * An icon comes first, so the place is recognised before the words are read:
 * with `menu`, the one of the section the sidebar highlights (the folder on
 * Projects, the card on Billing, the shield on the admin overview), otherwise
 * the area's own. Until 2.5.0 the dashboard always showed the grid of its home,
 * which next to "Projects" read as the icon of Projects.
 *
 * With `accent`, the first crumb is red: in the admin that is
 * the only sign of where you are, in place of a badge next to the logo, which
 * a wide logo or a long product name pushed out of the sidebar.
 *
 * Hidden on a phone, where the header holds the menu and the logo instead.
 */
export function HeaderBreadcrumbs({
  icon,
  menu,
  accent = false,
  base,
  labels,
}: {
  /** In front of the trail: the area's icon, when there is no `menu` to follow. */
  icon?: React.ReactNode
  /** The sidebar whose highlighted section gives the icon. */
  menu?: Parameters<typeof activeMenuItem>[0]
  /** The first crumb in red, for the admin. */
  accent?: boolean
  /** The first crumb: the area's home, `/dashboard` or `/admin`. */
  base: Crumb
  /** The label of each path segment after it, `{ projects: "Projects" }`. */
  labels: Record<string, string>
}) {
  const path = useRenderedPathname()
  const named = useBreadcrumbName(path)
  const SectionIcon = menu ? activeMenuItem(menu, path)?.icon : undefined
  const lead = SectionIcon ? <SectionIcon className="h-4 w-4" /> : icon

  const trail: Crumb[] = [base]
  const segments = path.startsWith(base.href) ? path.slice(base.href.length).split("/").filter(Boolean) : []
  let href = base.href
  segments.forEach((segment, index) => {
    href += `/${segment}`
    const name = labels[segment] ?? (index === segments.length - 1 ? named : undefined)
    if (name) trail.push({ name, href })
  })

  return (
    <div className="hidden min-w-0 items-center gap-2 md:flex">
      {/* A thin rule between the sidebar toggle and the trail: the command on
          one side, where you are on the other. The negative margin takes back
          the toggle button's own padding, so the rule sits as far from its
          icon as from the trail's (12px each side). */}
      <span className="-ml-[9px] mr-1 h-5 w-px shrink-0 bg-border" aria-hidden="true" />
      {lead && (
        <span className="flex shrink-0 items-center text-muted-foreground" aria-hidden="true">
          {lead}
        </span>
      )}
      <BreadcrumbTrail
        trail={trail}
        className="min-w-0"
        firstClassName={accent ? "text-destructive hover:text-destructive" : undefined}
      />
    </div>
  )
}
