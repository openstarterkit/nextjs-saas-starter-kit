"use client"

import { useState } from "react"
import { toggleUserRole } from "@/app/actions/admin"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/sonner"

interface PromoteUserButtonProps {
  userId: string
  currentRole: "USER" | "ADMIN"
}

export function PromoteUserButton({ userId, currentRole }: PromoteUserButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const result = await toggleUserRole(userId)
      toast.success(`User promoted to ${result.role}`)
    } catch {
      toast.error("Failed to update role")
    } finally {
      setLoading(false)
    }
  }

  if (currentRole === "ADMIN") return null

  return (
    <Button variant="outline" size="sm" onClick={handleClick} loading={loading}>
      Make Admin
    </Button>
  )
}
