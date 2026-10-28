"use client"

import { useTranslations } from "next-intl"

import * as React from "react"
import Link from "next/link"
import { Settings, CreditCard, LogOut, EllipsisVertical, CircleChevronUp } from "lucide-react"
import { SignOutDialog } from "@/components/dashboard/sign-out-dialog"
import { ThemeSwitch } from "@/components/theme-toggle"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

interface UserMenuProps {
  name?: string | null
  email?: string | null
  image?: string | null
  /** The plan the user is on, under the email in the menu; null on the free tier. */
  plan?: string | null
  /** Which side the dropdown opens on: up from the foot of the sidebar, down from a header. */
  side?: "top" | "bottom"
  /**
   * The avatar alone, for a header: the phone's, where there is no sidebar,
   * and the public site's for a signed-in visitor. Everywhere else the menu
   * sits at the foot of the sidebar with the name and email next to the
   * avatar, as in the Vercel dashboard.
   */
  hideDetails?: boolean
}

export function UserMenu({ name, email, image, plan = null, side = "top", hideDetails = false }: UserMenuProps) {
  const t = useTranslations("dashboard.userMenu")
  const initial = name?.[0]?.toUpperCase() ?? email?.[0]?.toUpperCase() ?? "U"
  const [signOutOpen, setSignOutOpen] = React.useState(false)

  return (
    <>
      <DropdownMenu>
        {hideDetails ? (
          <DropdownMenuTrigger className="flex items-center rounded-full transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar>
              {image ? <AvatarImage src={image} alt={name ?? t("avatarAlt")} /> : null}
              <AvatarFallback>{initial}</AvatarFallback>
            </Avatar>
            {/* Said after what is shown, not instead of it: an aria-label would
                replace the initial, and someone using voice control says what
                they see (WCAG 2.5.3, label in name). */}
            <span className="sr-only">{t("open")}</span>
          </DropdownMenuTrigger>
        ) : (
          // In the sidebar, as in the Vercel dashboard: one button, the whole
          // row, so the avatar, the name and the dots all open the menu. It
          // does not look like one big button: on hover only the circle of the
          // dots lights up. With the sidebar folded the avatar is what is left.
          <DropdownMenuTrigger className="group flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring sidebar-collapsed:justify-center sidebar-collapsed:px-0">
            <Avatar>
              {image ? <AvatarImage src={image} alt={name ?? t("avatarAlt")} /> : null}
              <AvatarFallback>{initial}</AvatarFallback>
            </Avatar>
            {/* The name alone: the email is inside the menu. */}
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground sidebar-collapsed:hidden">
              {name ?? "User"}
            </span>
            {/* The three vertical dots of a "more" menu, in a light circle, as Google draws it. */}
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition-colors group-hover:bg-muted group-hover:text-foreground group-data-[state=open]:bg-muted group-data-[state=open]:text-foreground sidebar-collapsed:hidden">
              <EllipsisVertical className="h-4 w-4" />
            </span>
            <span className="sr-only">{t("open")}</span>
          </DropdownMenuTrigger>
        )}
        {/* From the sidebar, centred on the row and wider than it, 4px short of
            each edge of the sidebar (the row has 12px each side); from a
            header, under the avatar at the right edge. Folded, the row is the
            avatar alone: 12rem at least. */}
        <DropdownMenuContent
          align={hideDetails ? "end" : "center"}
          side={side}
          className={hideDetails ? "w-56" : "w-[calc(var(--radix-dropdown-menu-trigger-width)+16px)] min-w-48"}
        >
          {/* The email and the plan at the top of the menu, not the name
              again: the sidebar already shows it next to the avatar. The email
              is the account, which a name is not. */}
          <DropdownMenuLabel className="font-normal">
            <span className="block truncate text-sm text-foreground">{email}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {plan ? t("plan", { name: plan }) : t("freePlan")}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {/* For whoever is on the free tier only, gone once they pay: the way
              to the plans on the Billing page, where Billing alone would not
              say there is something to choose. Your app's plans, never ours. */}
          {!plan && (
            <DropdownMenuItem asChild className="text-primary focus:text-primary [&>svg]:text-primary">
              <Link href="/dashboard/billing">
                <CircleChevronUp /> {t("upgrade")}
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <Link href="/dashboard/settings">
              <Settings /> Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/billing">
              <CreditCard /> Billing
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {/* The theme here too, as in the Vercel dashboard: the switch in the
              header stays, and the two move together. */}
          <ThemeSwitch />
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setSignOutOpen(true)}>
            <LogOut /> Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <SignOutDialog open={signOutOpen} onOpenChange={setSignOutOpen} />
    </>
  )
}
