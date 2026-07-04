"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export function ManageBillingButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" })
      const { url } = await res.json()
      if (url) window.location.href = url
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleClick} loading={loading} className={className}>
      Manage Billing
    </Button>
  )
}
