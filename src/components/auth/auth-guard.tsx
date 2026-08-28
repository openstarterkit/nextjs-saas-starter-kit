"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { authClient } from "@/lib/auth-client"

interface AuthGuardProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

/**
 * Client-side guard, for a page that has to be a Client Component and cannot
 * call requireUser() on the server.
 *
 * Prefer requireUser() and requireAdmin() where you can: this one runs after
 * the page has already been sent to the browser, so it hides content rather
 * than protecting it. The server is where authorization belongs.
 */
export function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const { data: session, isPending } = authClient.useSession()
  const router = useRouter()

  useEffect(() => {
    if (isPending) return
    if (!session) {
      router.push("/login")
      return
    }
    if (requireAdmin && session.user.role !== "ADMIN") {
      router.push("/dashboard")
    }
  }, [session, isPending, router, requireAdmin])

  if (isPending || !session) return null
  if (requireAdmin && session.user.role !== "ADMIN") return null

  return <>{children}</>
}
