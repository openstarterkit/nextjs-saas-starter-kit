"use client"

import { useTranslations } from "next-intl"

import { useState } from "react"
import { setUserRole } from "@/app/actions/admin"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/sonner"

interface PromoteUserButtonProps {
  userId: string
  currentRole: "USER" | "ADMIN"
}

export function PromoteUserButton({ userId, currentRole }: PromoteUserButtonProps) {
  const t = useTranslations("admin")
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      // The role on screen travels with the request: if someone else promoted
      // this user meanwhile, the action refuses instead of demoting them.
      await setUserRole(userId, "ADMIN", currentRole)
      toast.success(t("rolePromoted"))
    } catch {
      toast.error(t("roleFailed"))
    } finally {
      setLoading(false)
    }
  }

  if (currentRole === "ADMIN") return null

  return (
    <Button variant="outline" size="sm" onClick={handleClick} loading={loading}>
      {t("makeAdmin")}
    </Button>
  )
}
