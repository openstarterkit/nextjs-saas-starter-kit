"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface AuthGuardProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/login")
      return
    }
    if (requireAdmin && session.user.role !== "ADMIN") {
      router.push("/dashboard")
    }
  }, [session, status, router, requireAdmin])

  if (status === "loading") return null
  if (!session) return null
  if (requireAdmin && session.user.role !== "ADMIN") return null

  return <>{children}</>
}
