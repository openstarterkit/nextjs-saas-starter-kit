"use client"

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
  /** Which side the dropdown opens on. The sidebar opens up, mobile headers open down. */
  side?: "top" | "bottom"
  /** Avatar-only trigger for tight spots like the mobile header. */
  hideDetails?: boolean
}

export function UserMenu({ name, email, image, side = "top", hideDetails = false }: UserMenuProps) {
  const initial = name?.[0]?.toUpperCase() ?? email?.[0]?.toUpperCase() ?? "U"
  const [signOutOpen, setSignOutOpen] = React.useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={hideDetails ? "Open account menu" : undefined}
          className={
            hideDetails
              ? "flex items-center rounded-full transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              : "flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring sidebar-collapsed:justify-center"
          }
        >
          <Avatar>
            {image ? <AvatarImage src={image} alt={name ?? "Avatar"} /> : null}
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
          {!hideDetails && (
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
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
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
