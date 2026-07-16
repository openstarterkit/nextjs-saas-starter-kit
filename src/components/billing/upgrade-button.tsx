"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

export function UpgradeButton({
  priceId,
  className,
  children,
  disabled,
  variant = "primary",
}: {
  priceId: string
  className?: string
  children?: React.ReactNode
  disabled?: boolean
  variant?: "primary" | "outline" | "gradient"
}) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error ?? "Something went wrong. Please try again.")
        return
      }
      if (data.url) window.location.href = data.url
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleClick}
      loading={loading}
      disabled={disabled}
      variant={variant}
      className={className}
    >
      {children ?? "Upgrade"}
    </Button>
  )
}
