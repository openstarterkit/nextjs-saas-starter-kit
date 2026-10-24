"use client"

import { useTranslations } from "next-intl"

import * as React from "react"
import Link from "next/link"
import { Settings, CreditCard, LogOut, ChevronsUpDown } from "lucide-react"
import { SignOutDialog } from "@/components/dashboard/sign-out-dialog"
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
  /** Which side the dropdown opens on. Both the sidebar and the mobile header open down. */
  side?: "top" | "bottom"
  /** Avatar-only trigger for tight spots like the mobile header. */
  hideDetails?: boolean
  /**
   * In the header, top right: avatar, name and email from `md` up, the avatar
   * alone on a phone. The sidebar layout of the trigger would stretch across
   * the header and follow the collapsed sidebar, which is not its business.
   */
  inHeader?: boolean
}

export function UserMenu({ name, email, image, side = "bottom", hideDetails = false, inHeader = false }: UserMenuProps) {
  const t = useTranslations("dashboard.userMenu")
  const initial = name?.[0]?.toUpperCase() ?? email?.[0]?.toUpperCase() ?? "U"
  const [signOutOpen, setSignOutOpen] = React.useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={hideDetails || inHeader ? t("open") : undefined}
          className={
            inHeader
              ? "flex items-center gap-3 rounded-xl text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring md:p-1.5 md:pr-2 md:hover:bg-muted"
              : hideDetails
                ? "flex items-center rounded-full transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                : "flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring sidebar-collapsed:justify-center"
          }
        >
          <Avatar>
            {image ? <AvatarImage src={image} alt={name ?? t("avatarAlt")} /> : null}
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
          {inHeader && (
            <>
              <div className="hidden min-w-0 max-w-48 md:block">
                <p className="truncate text-sm font-medium text-foreground">{name ?? "User"}</p>
                <p className="truncate text-xs text-muted-foreground">{email}</p>
              </div>
              <ChevronsUpDown className="hidden h-4 w-4 shrink-0 text-muted-foreground md:block" />
            </>
          )}
          {!hideDetails && !inHeader && (
            <>
              <div className="min-w-0 flex-1 sidebar-collapsed:hidden">
                <p className="truncate text-sm font-medium text-foreground">{name ?? "User"}</p>
                <p className="truncate text-xs text-muted-foreground">{email}</p>
              </div>
              <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground sidebar-collapsed:hidden" />
            </>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side={side} className="w-56">
          {/* Who is signed in, where the trigger is only the avatar (a phone):
              the name and email are not next to it there. */}
          <DropdownMenuLabel className="font-normal">
            {hideDetails || inHeader ? (
              <span className={inHeader ? "block md:hidden" : "block"}>
                <span className="block truncate text-sm font-medium text-foreground">{name ?? "User"}</span>
                <span className="block truncate text-xs text-muted-foreground">{email}</span>
              </span>
            ) : null}
            {!hideDetails && <span className={inHeader ? "hidden md:inline" : undefined}>{t("myAccount")}</span>}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
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
          <DropdownMenuItem onSelect={() => setSignOutOpen(true)}>
            <LogOut /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <SignOutDialog open={signOutOpen} onOpenChange={setSignOutOpen} />
    </>
  )
}
